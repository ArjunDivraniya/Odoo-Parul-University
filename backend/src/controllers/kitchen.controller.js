const prisma = require('../lib/prisma');

// Get active orders for Kitchen Display System (KDS)
exports.getActiveKitchenOrders = async (req, res) => {
  try {
    // Kitchen needs orders that are SENT, PREPARING, or COMPLETED
    const activeOrders = await prisma.order.findMany({
      where: {
        status: { in: ['SENT', 'PREPARING', 'COMPLETED'] } // Include COMPLETED
      },
      include: {
        items: true,
        table: true
      },
      orderBy: {
        createdAt: 'asc' // Oldest orders first
      }
    });

    res.json(activeOrders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch kitchen orders" });
  }
};

// Update Order Status (e.g. PREPARING -> COMPLETED)
exports.updateKitchenStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'PREPARING' or 'COMPLETED' (Ready to Serve)

        // Validate status
        if (!['PREPARING', 'COMPLETED', 'PAID'].includes(status)) {
            return res.status(400).json({ error: "Invalid kitchen status" });
        }

        const order = await prisma.order.update({
            where: { id },
            data: { status }
        });

        // If Completed, maybe notify server/waiter (omitted for MVP)

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: "Failed to update order status" });
    }
}
