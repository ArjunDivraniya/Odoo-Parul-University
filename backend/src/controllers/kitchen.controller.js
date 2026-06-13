const prisma = require('../lib/prisma');
const { getIo } = require('../lib/socket');
const whatsappService = require('../services/whatsapp.service');

// Get active kitchen tickets for Kitchen Display System (KDS)
exports.getActiveKitchenOrders = async (req, res) => {
  try {
    const activeTickets = await prisma.kitchenTicket.findMany({
      where: {
        status: { in: ['TO_COOK', 'PREPARING', 'COMPLETED'] }
      },
      include: {
        order: {
          include: {
            items: true,
            table: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc' // Oldest first
      }
    });

    // Map to structure expected by KDS frontend
    const formatted = activeTickets.map(ticket => ({
      id: ticket.order.id, // mapped to order id for updates
      ticketId: ticket.id,
      orderNumber: ticket.order.orderNumber,
      status: ticket.status, // TO_COOK, PREPARING, COMPLETED
      createdAt: ticket.createdAt,
      items: ticket.order.items,
      table: ticket.order.table
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Failed to fetch active kitchen tickets:", error);
    res.status(500).json({ error: "Failed to fetch kitchen orders" });
  }
};

// Update Kitchen Status (TO_COOK -> PREPARING -> COMPLETED -> SERVED)
exports.updateKitchenStatus = async (req, res) => {
  try {
    const { id } = req.params; // Order ID
    const { status } = req.body; // 'PREPARING', 'COMPLETED', or 'SERVED'

    // Validate status
    if (!['TO_COOK', 'PREPARING', 'COMPLETED', 'SERVED'].includes(status)) {
      return res.status(400).json({ error: "Invalid kitchen status" });
    }

    const ticket = await prisma.kitchenTicket.findUnique({
      where: { orderId: id },
      include: {
        order: {
          include: {
            table: true,
            items: true
          }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: "Kitchen ticket not found for this order" });
    }

    // Update ticket status
    const updatedTicket = await prisma.kitchenTicket.update({
      where: { id: ticket.id },
      data: { status },
      include: {
        order: {
          include: {
            table: true,
            items: true
          }
        }
      }
    });

    const io = getIo();
    const orderForFrontend = {
      id: updatedTicket.order.id,
      ticketId: updatedTicket.id,
      orderNumber: updatedTicket.order.orderNumber,
      status: updatedTicket.status,
      createdAt: updatedTicket.createdAt,
      items: updatedTicket.order.items,
      table: updatedTicket.order.table
    };

    if (status === 'PREPARING') {
      if (io) {
        io.emit('kitchen_preparing', orderForFrontend);
        io.emit('dashboard_updated');
      }
      // Send WhatsApp progress notification
      if (updatedTicket.order.customerMobile) {
        const message = `Hello ${updatedTicket.order.customerName || 'Guest'},\n\nYour order #${updatedTicket.order.orderNumber} is now being prepared.`;
        whatsappService.sendReceipt(updatedTicket.order.customerMobile, message).catch(err => {
          console.warn("WhatsApp alert failed:", err.message);
        });
      }
    } else if (status === 'COMPLETED') {
      if (io) {
        io.emit('kitchen_completed', orderForFrontend);
        io.emit('dashboard_updated');
      }
      // Send WhatsApp ready notification
      if (updatedTicket.order.customerMobile) {
        const message = `Hello ${updatedTicket.order.customerName || 'Guest'},\n\nYour order #${updatedTicket.order.orderNumber} is ready and will be served shortly.`;
        whatsappService.sendReceipt(updatedTicket.order.customerMobile, message).catch(err => {
          console.warn("WhatsApp alert failed:", err.message);
        });
      }
    } else if (status === 'SERVED') {
      // Release table (DINE_IN)
      if (updatedTicket.order.tableId) {
        await prisma.table.update({
          where: { id: updatedTicket.order.tableId },
          data: { status: 'AVAILABLE' }
        });

        if (io) {
          io.emit('table_status_changed', { tableId: updatedTicket.order.tableId, status: 'AVAILABLE' });
        }
      }

      if (io) {
        io.emit('table_released', { orderId: id, tableId: updatedTicket.order.tableId });
        io.emit('dashboard_updated');
      }
    }

    res.json(orderForFrontend);
  } catch (error) {
    console.error("Failed to update kitchen status:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
};
