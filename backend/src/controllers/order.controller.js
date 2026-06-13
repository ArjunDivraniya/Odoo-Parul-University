// backend/src/controllers/order.controller.js
const prisma = require('../lib/prisma');
const { z } = require('zod');
const emailService = require('../services/email.service');
const whatsappService = require('../services/whatsapp.service');
const { getIo } = require('../lib/socket');


// Validation Schemas
const orderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  variantId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable()
});

const createOrderSchema = z.object({
  id: z.string().uuid().optional(), // for editing
  tableId: z.string().uuid().optional().nullable(),
  sessionId: z.string().uuid().optional().nullable(),
  type: z.enum(['DINE_IN', 'TAKEAWAY']).default('DINE_IN'),
  items: z.array(orderItemSchema).min(1),
  customer: z.object({
    name: z.string().optional().nullable(),
    email: z.string().email().optional().or(z.literal('')).nullable(),
    mobile: z.string().optional().nullable()
  }).optional().nullable(),
  couponCode: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'SENT', 'PREPARING', 'COMPLETED', 'PAID', 'CANCELLED']).default('SENT')
});

const updateStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PREPARING', 'COMPLETED', 'PAID', 'CANCELLED'])
});

const payOrderSchema = z.object({
  method: z.enum(['CASH', 'DIGITAL', 'UPI']),
  amount: z.preprocess((val) => Number(val), z.number().positive()),
  reference: z.string().optional()
});

exports.createOrder = async (req, res) => {
  try {
    const validatedData = createOrderSchema.parse(req.body);
    const { id, tableId, sessionId, items, type, customer, couponCode, status } = validatedData;
    const userId = req.user?.id;

    let finalTableId = tableId;

    if (id) {
      // Check if order exists
      const existingOrder = await prisma.order.findUnique({ 
        where: { id },
        include: { items: true }
      });
      if (!existingOrder) {
        return res.status(404).json({ error: "Order to update not found" });
      }

      // Enforce status constraints
      if (existingOrder.paymentStatus === 'PAID' || existingOrder.status === 'PAID') {
        return res.status(400).json({ error: "ORDER_LOCKED", message: "Paid orders are permanently locked." });
      }
      const kt = await prisma.kitchenTicket.findUnique({ where: { orderId: id } });
      if (kt) {
        return res.status(400).json({ error: "ORDER_LOCKED", message: "Orders already sent to kitchen cannot be edited." });
      }
      finalTableId = existingOrder.tableId;
    } else {
      // Auto assign table for dine-in if not provided
      if (type === 'DINE_IN' && !finalTableId) {
        const availableTable = await prisma.table.findFirst({
          where: { status: 'AVAILABLE', active: true },
          orderBy: { name: 'asc' } // Grab first alphabetically
        });
        if (!availableTable) {
          return res.status(400).json({ error: "NO_TABLE_AVAILABLE", message: "No Table Available" });
        }
        finalTableId = availableTable.id;
      }
    }

    // Fetch products to calculate prices, taxes and variants
    const productIds = items.map(i => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { variants: true }
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    let subtotal = 0;
    let taxAmount = 0;

    const orderItemsData = items.map(item => {
      const product = productMap.get(item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found`);

      let price = Number(product.price);
      let variantName = null;
      let variantId = null;

      // Handle Variant Logic
      if (item.variantId) {
        const variant = product.variants.find(v => v.id === item.variantId);
        if (!variant) {
          throw new Error(`Variant ${item.variantId} not found for product ${product.name}`);
        }
        price += Number(variant.extraPrice);
        variantName = variant.name;
        variantId = variant.id;
      }

      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      const itemTax = itemTotal * (Number(product.tax) / 100);
      taxAmount += itemTax;

      return {
        productId: item.productId,
        productName: product.name,
        price: price,
        variantName: variantName,
        variantId: variantId,
        quantity: item.quantity,
        notes: item.notes || null,
        status: 'PENDING'
      };
    });

    // Handle Discount
    let discountAmount = 0;
    let discountCodeSaved = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase() }
      });

      if (coupon && coupon.isActive) {
        const hasExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
        if (!hasExpired) {
          discountCodeSaved = coupon.code;
          if (coupon.type === 'PERCENTAGE') {
            discountAmount = subtotal * (Number(coupon.discount) / 100);
          } else {
            discountAmount = Number(coupon.discount);
          }
          // Cap discount at subtotal
          if (discountAmount > subtotal) {
            discountAmount = subtotal;
          }
        }
      }
    }

    const totalAmount = subtotal + taxAmount - discountAmount;

    let order;

    if (id) {
      // Check if order exists
      const existingOrder = await prisma.order.findUnique({ where: { id } });
      if (!existingOrder) {
        return res.status(404).json({ error: "Order to update not found" });
      }

      // Update Order: Delete old items and insert new ones
      await prisma.orderItem.deleteMany({ where: { orderId: id } });

      order = await prisma.order.update({
        where: { id },
        data: {
          tableId: finalTableId,
          sessionId,
          type,
          taxAmount,
          discountAmount,
          discountCode: discountCodeSaved,
          totalAmount,
          status: 'DRAFT',
          paymentStatus: 'PENDING',
          customerName: customer?.name || null,
          customerEmail: customer?.email || null,
          customerMobile: customer?.mobile || null,
          items: {
            create: orderItemsData
          }
        },
        include: {
          items: true,
          table: true
        }
      });
    } else {
      // Generate Order Number: #ORD-YYYYMMDD-XXXX
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const count = await prisma.order.count();
      const orderNumber = `#ORD-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;

      order = await prisma.order.create({
        data: {
          orderNumber,
          tableId: finalTableId,
          sessionId,
          userId,
          type,
          taxAmount,
          discountAmount,
          discountCode: discountCodeSaved,
          totalAmount,
          status: 'DRAFT',
          paymentStatus: 'PENDING',
          customerName: customer?.name || null,
          customerEmail: customer?.email || null,
          customerMobile: customer?.mobile || null,
          items: {
            create: orderItemsData
          }
        },
        include: {
          items: true,
          table: true
        }
      });
    }

    // Table status is updated only on successful payment or checkout, not during creation/draft.

    // Emit Order Sockets
    const io = getIo();
    if (io) {
      if (!id) {
        // Only emit order_created on initial creation
        io.emit('order_created', order);
      } else {
        io.emit('order_updated', order);
      }
      io.emit('dashboard_updated');
    }

    res.status(201).json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create order error:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { sessionId, status } = req.query;
    const filter = {};
    if (sessionId) filter.sessionId = sessionId;
    if (status) filter.status = status;

    const orders = await prisma.order.findMany({
      where: filter,
      include: {
        items: {
          select: {
            id: true,
            productId: true,
            productName: true,
            price: true,
            variantName: true,
            quantity: true,
            notes: true,
            status: true
          }
        },
        table: {
          select: { id: true, name: true, status: true }
        },
        user: {
          select: { id: true, name: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, table: true, payments: true }
    });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = updateStatusSchema.parse(req.body);

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: { table: true, items: true }
    });

    // Update table status if paid or cancelled
    if (order.tableId && (status === 'PAID' || status === 'CANCELLED')) {
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'AVAILABLE' }
      });

      const io = getIo();
      if (io) {
        io.emit('table:status_updated', { tableId: order.tableId, status: 'AVAILABLE' });
      }
    }

    // Broadcast update
    const io = getIo();
    if (io) {
      io.emit('order:status_updated', order);
    }

    res.json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update order status error:', error);
    res.status(400).json({ error: error.message });
  }
};

exports.payOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { method, amount, reference } = payOrderSchema.parse(req.body);

    const order = await prisma.order.findUnique({
      where: { id },
      include: { payments: true }
    });
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (order.paymentStatus === 'PAID') {
      return res.status(400).json({ 
        error: "ALREADY_PAID", 
        message: "This order is already paid." 
      });
    }

    const payment = await prisma.payment.create({
      data: {
        orderId: id,
        method,
        amount,
        reference,
        status: 'CONFIRMED'
      }
    });

    const totalPaid = order.payments.reduce((sum, p) => sum + Number(p.amount), 0) + Number(amount);

    if (totalPaid >= Number(order.totalAmount)) {
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: { 
          status: 'PAID',
          paymentStatus: 'PAID'
        },
        include: { items: true, table: true }
      });

      // Create Kitchen Ticket
      const kitchenTicket = await prisma.kitchenTicket.create({
        data: {
          orderId: id,
          status: 'TO_COOK'
        }
      });

      // Update Table Status to OCCUPIED
      if (order.tableId) {
        await prisma.table.update({
          where: { id: order.tableId },
          data: { status: 'OCCUPIED' }
        });

        const io = getIo();
        if (io) {
          io.emit('table_status_changed', { tableId: order.tableId, status: 'OCCUPIED' });
        }
      }

      // Emit Sockets
      const io = getIo();
      if (io) {
        io.emit('payment_completed', { order: updatedOrder, payment });
        io.emit('order_sent_to_kitchen', { ...updatedOrder, kitchenTicket });
        io.emit('dashboard_updated');
      }

      // Send Email Receipt
      if (updatedOrder.customerEmail) {
        emailService.sendBill(updatedOrder).catch(err => console.error("Email failed:", err));
      }

      // Send WhatsApp Receipt
      if (updatedOrder.customerMobile) {
        const message = `Hello ${updatedOrder.customerName || 'Guest'},\n\nPayment successful for Order #${updatedOrder.orderNumber}.\n\nYour order has been sent to the kitchen.`;
        whatsappService.sendReceipt(updatedOrder.customerMobile, message).catch(err => {
          console.warn("Auto background WhatsApp failed:", err.message);
        });
      }
    }

    res.status(201).json(payment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Pay order error:', error);
    res.status(400).json({ error: error.message });
  }
};
