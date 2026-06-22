const prisma = require('../lib/prisma');
const { z } = require('zod');

// Schema Validation
const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().optional().nullable().transform(val => (val === "" || !val) ? null : val),
  birthday: z.string().optional().nullable().transform(val => (val === "" || !val) ? null : new Date(val)),
  points: z.preprocess((val) => val === undefined ? undefined : Number(val), z.number().optional()),
  membershipLevel: z.string().optional()
});

// Create Customer
exports.createCustomer = async (req, res) => {
  try {
    const data = customerSchema.parse(req.body);

    const existing = await prisma.customer.findUnique({
      where: { phone: data.phone }
    });

    if (existing) {
      return res.status(400).json({ error: "A customer with this phone number already exists." });
    }

    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        birthday: data.birthday,
        points: data.points ?? 0,
        membershipLevel: data.membershipLevel ?? "BRONZE"
      }
    });

    res.status(201).json(customer);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0]?.message || "Validation failed" });
    }
    console.error("Create customer error:", error);
    res.status(500).json({ error: "Failed to create customer" });
  }
};

// Search Customers (Instant search for POS)
exports.searchCustomers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length === 0) {
      return res.json([]);
    }

    const query = q.trim();

    // Query by indexed phone or name
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { phone: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 10
    });

    res.json(customers);
  } catch (error) {
    console.error("Search customers error:", error);
    res.status(500).json({ error: "Search failed" });
  }
};

// Get Recent Customers (last 10 based on lastVisit or creation)
exports.getRecentCustomers = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: [
        { lastVisit: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 10
    });
    res.json(customers);
  } catch (error) {
    console.error("Get recent customers error:", error);
    res.status(500).json({ error: "Failed to fetch recent customers" });
  }
};

// Get All Customers (Paginated, for Admin)
exports.getCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const whereClause = search.trim() ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    } : {};

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.customer.count({
        where: whereClause
      })
    ]);

    res.json({
      data: customers,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error("Get customers error:", error);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
};

// Get Customer Profile (with orders list, favorite products, and coupons)
exports.getCustomerProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id }
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Get order history
    const orders = await prisma.order.findMany({
      where: { customerId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true
      }
    });

    // Compute Favorite Products
    const orderItems = await prisma.orderItem.findMany({
      where: { order: { customerId: id } },
      select: { productId: true, productName: true, quantity: true }
    });

    const productCounts = {};
    orderItems.forEach(item => {
      if (!productCounts[item.productId]) {
        productCounts[item.productId] = { name: item.productName, count: 0 };
      }
      productCounts[item.productId].count += item.quantity;
    });

    const favoriteProducts = Object.values(productCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(p => p.name);

    // Compute Coupons Used (discount codes)
    const discountCodes = orders
      .map(o => o.discountCode)
      .filter(Boolean);
    const couponsUsed = Array.from(new Set(discountCodes));

    res.json({
      ...customer,
      orders,
      favoriteProducts,
      couponsUsed
    });
  } catch (error) {
    console.error("Get customer profile error:", error);
    res.status(500).json({ error: "Failed to fetch customer profile" });
  }
};

// Update Customer
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const data = customerSchema.parse(req.body);

    const existing = await prisma.customer.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Check unique phone if phone is being changed
    if (data.phone !== existing.phone) {
      const phoneConflict = await prisma.customer.findUnique({
        where: { phone: data.phone }
      });
      if (phoneConflict) {
        return res.status(400).json({ error: "A customer with this phone number already exists." });
      }
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        birthday: data.birthday,
        points: data.points !== undefined ? data.points : undefined,
        membershipLevel: data.membershipLevel
      }
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0]?.message || "Validation failed" });
    }
    console.error("Update customer error:", error);
    res.status(500).json({ error: "Failed to update customer" });
  }
};

// Get Customer Analytics Stats for Admin Dashboard
exports.getCustomerStats = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalCustomers, newCustomers, returningCustomers, topCustomers] = await Promise.all([
      // Total customers count
      prisma.customer.count(),
      // New customers in last 30 days
      prisma.customer.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      // Returning customers (placed > 1 orders)
      prisma.customer.count({
        where: { totalOrders: { gt: 1 } }
      }),
      // Top 5 customers by spending
      prisma.customer.findMany({
        orderBy: { totalSpent: 'desc' },
        take: 5
      })
    ]);

    // Customers who have placed at least 1 order
    const activeCustomers = await prisma.customer.count({
      where: { totalOrders: { gt: 0 } }
    });

    const retentionRate = activeCustomers > 0 
      ? Math.round((returningCustomers / activeCustomers) * 100) 
      : 0;

    res.json({
      totalCustomers,
      newCustomers,
      returningCustomers,
      topCustomers: topCustomers.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        totalOrders: c.totalOrders,
        totalSpent: Number(c.totalSpent)
      })),
      retentionRate
    });
  } catch (error) {
    console.error("Get customer stats error:", error);
    res.status(500).json({ error: "Failed to fetch customer stats" });
  }
};

// Helper to update customer stats when an order is paid
exports.processCustomerOrderPayment = async (orderId) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order || !order.customerId) return;

    const customerId = order.customerId;
    const totalAmount = Number(order.totalAmount) || 0;

    // Retrieve current customer
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) return;

    // Calculate new stats
    const newTotalOrders = customer.totalOrders + 1;
    const newTotalSpent = Number(customer.totalSpent) + totalAmount;
    
    // Loyalty points: 1 point per ₹100 spent
    const pointsEarned = Math.floor(totalAmount / 100);
    const newPoints = customer.points + pointsEarned;

    // Determine membership level
    // Bronze: < ₹5,000, Silver: ₹5,000 - ₹10,000, Gold: ₹10,000 - ₹25,000, Platinum: >= ₹25,000
    let membershipLevel = "BRONZE";
    if (newTotalSpent >= 25000) {
      membershipLevel = "PLATINUM";
    } else if (newTotalSpent >= 10000) {
      membershipLevel = "GOLD";
    } else if (newTotalSpent >= 5000) {
      membershipLevel = "SILVER";
    }

    // Update customer in database
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        totalOrders: newTotalOrders,
        totalSpent: newTotalSpent,
        lastVisit: new Date(),
        points: newPoints,
        membershipLevel
      }
    });

    console.log(`Updated customer stats for ${customer.name} (ID: ${customerId}): Orders=${newTotalOrders}, Spent=₹${newTotalSpent}, Points=${newPoints}, Tier=${membershipLevel}`);
  } catch (err) {
    console.error("Failed to update customer stats on payment:", err);
  }
};
