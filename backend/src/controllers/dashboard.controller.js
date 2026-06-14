const prisma = require('../lib/prisma');

exports.getStats = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { range = 'day' } = req.query;
    const now = new Date();
    let startDate = new Date();
    
    // Determine start date based on range
    if (range === 'day') {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === 'week') {
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === 'month') {
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === 'year') {
      startDate.setFullYear(now.getFullYear() - 1);
      startDate.setHours(0, 0, 0, 0);
    }

    // Multi-tenant filtering: Get all user IDs belonging to this shop
    let orderWhere = {};
    if (shopId) {
      const shopUsers = await prisma.user.findMany({
        where: { shopId },
        select: { id: true }
      });
      const userIds = shopUsers.map(u => u.id);
      orderWhere = { userId: { in: userIds } };
    }

    const periodStatusWhere = {
      status: { in: ['PAID', 'COMPLETED'] },
      createdAt: { gte: startDate },
      ...orderWhere
    };

    const [
      totalRevenue,
      periodRevenue,
      periodOrders,
      pendingOrders,
      preparingOrders,
      completedOrdersInPeriod,
      occupiedTables,
      availableTables,
      totalUsers
    ] = await Promise.all([
      // Total Revenue (all time PAID/COMPLETED orders)
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { 
          status: { in: ['PAID', 'COMPLETED'] },
          ...orderWhere
        }
      }),
      // Period Revenue (PAID/COMPLETED in range)
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: periodStatusWhere
      }),
      // Period Orders (Total orders in range except CANCELLED)
      prisma.order.count({
        where: { 
          createdAt: { gte: startDate },
          status: { not: 'CANCELLED' },
          ...orderWhere
        }
      }),
      // Pending Orders (SENT status) - Real-time workload
      prisma.order.count({
        where: { 
          status: 'SENT',
          ...orderWhere
        }
      }),
      // Preparing Orders (PREPARING status) - Real-time workload
      prisma.order.count({
        where: { 
          status: 'PREPARING',
          ...orderWhere
        }
      }),
      // Completed Orders in this period
      prisma.order.count({
        where: periodStatusWhere
      }),
      // Occupied Tables - Global for now as tables lack shopId
      prisma.table.count({
        where: { status: 'OCCUPIED' }
      }),
      // Available Tables - Global for now
      prisma.table.count({
        where: { status: 'AVAILABLE' }
      }),
      // Total Users in this shop
      prisma.user.count({
        where: shopId ? { shopId } : {}
      })
    ]);

    res.json({
      totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
      periodRevenue: Number(periodRevenue._sum.totalAmount || 0),
      periodOrders: Number(periodOrders || 0),
      pendingOrders: Number(pendingOrders || 0),
      preparingOrders: Number(preparingOrders || 0),
      completedOrders: Number(completedOrdersInPeriod || 0),
      occupiedTables: Number(occupiedTables || 0),
      availableTables: Number(availableTables || 0),
      totalOrders: Number(periodOrders || 0), // Fallback for hero section
      totalUsers: Number(totalUsers || 0)      // Fallback for hero section
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

exports.getRecentOrders = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const recentOrders = await prisma.order.findMany({
      where: {
        user: shopId ? { shopId } : undefined
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        table: true,
        user: { select: { name: true } }
      }
    });

    res.json(recentOrders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch recent orders" });
  }
};

exports.getSalesChart = async (req, res) => {
    // Return last 7 days sales
    try {
        const shopId = req.user.shopId;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        // For raw queries, multi-tenancy is trickier if we don't have shopId on Order.
        // Let's use Prisma findMany and aggregate in JS for safety or complex join.
        // Given shopId is on User, we need to join.
        
        const orders = await prisma.order.findMany({
            where: {
                createdAt: { gte: sevenDaysAgo },
                status: { in: ['PAID', 'COMPLETED'] },
                user: shopId ? { shopId } : undefined
            },
            select: {
                createdAt: true,
                totalAmount: true
            }
        });

        // Group by date in JS
        const grouped = orders.reduce((acc, order) => {
            const date = order.createdAt.toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + Number(order.totalAmount);
            return acc;
        }, {});

        const result = Object.entries(grouped).map(([date, total]) => ({
            date,
            total
        })).sort((a, b) => a.date.localeCompare(b.date));

        res.json(result);
    } catch(err) {
        console.error("Chart Error:", err);
        res.status(500).json({ error: "Failed to fetch chart data" });
    }
}

// Get sales trends for line chart (by category and time range)
exports.getSalesTrends = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { range = 'day' } = req.query;
    const now = new Date();
    let startDate = new Date();
    let groupBy = 'hour';
    
    // Determine date range and grouping
    if (range === 'day') {
      startDate.setHours(0, 0, 0, 0);
      groupBy = 'hour';
    } else if (range === 'week') {
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      groupBy = 'day';
    } else if (range === 'month') {
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      groupBy = 'week';
    } else if (range === 'year') {
      startDate.setMonth(now.getMonth() - 12);
      startDate.setHours(0, 0, 0, 0);
      groupBy = 'month';
    }

    // Get orders with items and products for the given range and shop
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { in: ['PAID', 'COMPLETED'] },
        user: shopId ? { shopId } : undefined
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // 1. Identify all categories present in the data
    const categorySet = new Set();
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.product?.category?.name) {
          categorySet.add(item.product.category.name);
        } else {
          categorySet.add('Other');
        }
      });
    });

    const allCategories = Array.from(categorySet);
    // If no categories found, default to some sensible ones to avoid empty state issues
    const displayCategories = allCategories.length > 0 ? allCategories : ['Beverages', 'Food', 'Desserts'];

    // 2. Process data into time slots
    const dataMap = {};
    
    // Helper to get sortable slot key
    const getSlotKey = (date, mode) => {
      if (mode === 'hour') return date.getHours(); // 0-23
      if (mode === 'day') return date.getDay(); // 0-6
      if (mode === 'week') return Math.floor((date - startDate) / (7 * 24 * 60 * 60 * 1000));
      return date.getMonth(); // 0-11
    };

    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const slotKey = getSlotKey(orderDate, groupBy);
      
      let timeLabel;
      if (groupBy === 'hour') {
        const hour = orderDate.getHours();
        timeLabel = `${hour % 12 || 12} ${hour >= 12 ? 'PM' : 'AM'}`;
      } else if (groupBy === 'day') {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        timeLabel = days[orderDate.getDay()];
      } else if (groupBy === 'week') {
        timeLabel = `Week ${slotKey + 1}`;
      } else {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        timeLabel = months[orderDate.getMonth()];
      }

      if (!dataMap[slotKey]) {
        const categoryData = {};
        displayCategories.forEach(cat => {
          categoryData[cat.toLowerCase().replace(/\s+/g, '')] = 0;
        });
        dataMap[slotKey] = { slot: timeLabel, sortKey: slotKey, ...categoryData };
      }

      order.items.forEach(item => {
        const catName = item.product?.category?.name || 'Other';
        const key = catName.toLowerCase().replace(/\s+/g, '');
        const revenue = Number(item.price) * item.quantity;
        if (dataMap[slotKey].hasOwnProperty(key)) {
          dataMap[slotKey][key] += revenue;
        } else {
          // In case a category was missed in categorySet (shouldn't happen)
          dataMap[slotKey][key] = revenue;
        }
      });
    });

    // Sort result by time
    const result = Object.values(dataMap)
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ sortKey, ...rest }) => rest);
    
    res.json({
      data: result,
      categories: displayCategories
    });
  } catch (error) {
    console.error('Sales trends error:', error);
    res.status(500).json({ error: 'Failed to fetch sales trends' });
  }
};

// Get top products for radar chart
exports.getTopProducts = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          status: { in: ['PAID', 'COMPLETED'] },
          user: shopId ? { shopId } : undefined
        }
      },
      _sum: {
        quantity: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 6
    });

    // Get product details
    const productIds = topProducts.map(p => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true }
    });

    const productMap = {};
    products.forEach(p => {
      productMap[p.id] = p.name;
    });

    const result = topProducts.map(p => ({
      item: productMap[p.productId] || 'Unknown',
      orders: p._sum.quantity || 0
    }));

    res.json(result);
  } catch (error) {
    console.error('Top products error:', error);
    res.status(500).json({ error: 'Failed to fetch top products' });
  }
};

// Get heatmap data (orders by day and time slot)
exports.getHeatmapData = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        status: { in: ['PAID', 'COMPLETED'] },
        user: shopId ? { shopId } : undefined
      },
      select: {
        createdAt: true
      }
    });

    // Initialize data structure: Day of Week vs Hour
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

    const heatmap = days.map(day => ({
      id: day,
      data: hours.map(hour => ({
        x: hour,
        y: 0
      }))
    }));

    // Process orders
    orders.forEach(order => {
      const date = new Date(order.createdAt);
      const hourIndex = date.getHours();
      const dayIndex = (date.getDay() + 6) % 7; // Convert to Mon=0, Sun=6
      
      if (heatmap[dayIndex] && heatmap[dayIndex].data[hourIndex]) {
        heatmap[dayIndex].data[hourIndex].y++;
      }
    });

    res.json(heatmap);
  } catch (error) {
    console.error('Heatmap error:', error);
    res.status(500).json({ error: 'Failed to fetch heatmap data' });
  }
};

// Get employee sales performance
exports.getEmployeePerformance = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { range = 'week' } = req.query;
    const now = new Date();
    let startDate = new Date();
    
    if (range === 'day') {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === 'week') {
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === 'month') {
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
    }

    const performance = await prisma.order.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: startDate },
        status: { in: ['PAID', 'COMPLETED'] },
        userId: { not: null },
        user: shopId ? { shopId } : undefined
      },
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      }
    });

    // Get user details
    const userIds = performance.map(p => p.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true }
    });

    const userMap = {};
    users.forEach(u => {
      userMap[u.id] = u.name;
    });

    const result = performance.map(p => ({
      name: userMap[p.userId] || 'Unknown',
      sales: Number(p._sum.totalAmount) || 0,
      orders: p._count.id || 0
    })).sort((a, b) => b.sales - a.sales);

    res.json(result);
  } catch (error) {
    console.error('Employee performance error:', error);
    res.status(500).json({ error: 'Failed to fetch employee performance' });
  }
};
