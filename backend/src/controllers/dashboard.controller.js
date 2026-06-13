const prisma = require('../lib/prisma');

exports.getStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // parallelize queries for performance
    const [totalRevenue, totalOrders, totalCustomers, todayRevenue] = await Promise.all([
        prisma.order.aggregate({
            _sum: { totalAmount: true },
            where: { status: { in: ['PAID', 'COMPLETED'] } }
        }),
        prisma.order.count(),
        prisma.user.count({ where: { role: 'EMPLOYEE' } }), // Count staff users for the current tenant-aware model.
        // Actually, schema doesn't have a Customer model, only User.
        // Let's count "Orders Today" instead of customers for now or maybe distinct sessions?
        // Let's stick to total Users for now.
        prisma.order.aggregate({
            _sum: { totalAmount: true },
            where: { 
                status: { in: ['PAID', 'COMPLETED'] },
                createdAt: { gte: today }
            }
        })
    ]);

    res.json({
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      todayRevenue: todayRevenue._sum.totalAmount || 0,
      totalOrders,
      totalUsers: totalCustomers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

exports.getRecentOrders = async (req, res) => {
  try {
    const recentOrders = await prisma.order.findMany({
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
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        // Optimized: Group by DAY using raw query to reduce bandwidth
        // Instead of returning entry per second/millisecond
        const sales = await prisma.$queryRaw`
            SELECT 
                DATE(createdAt) as date, 
                SUM(totalAmount) as total 
            FROM "Order" 
            WHERE 
                createdAt >= ${sevenDaysAgo} 
                AND status IN ('PAID', 'COMPLETED')
            GROUP BY DATE(createdAt)
            ORDER BY date ASC
        `;
        
        // Transform for frontend if needed (BigInt handling)
        // Prisma raw query returns BigInd for sums sometimes in Postgres, check it.
        // Assuming totalAmount is Decimal, it returns number or string. Or Date object.
        // Serialization of BigInt might fail in express.json().
        
        const serializedSales = sales.map(s => ({
            date: s.date, // Date object
            total: Number(s.total) // Ensure number
        }));

        res.json(serializedSales);
    } catch(err) {
        console.error("Chart Error:", err);
        res.status(500).json({ error: "Failed to fetch chart data" });
    }
}

// Get sales trends for line chart (by category and time range)
exports.getSalesTrends = async (req, res) => {
  try {
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

    // First, get top 3 categories by revenue to focus the chart
    const topCategories = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          createdAt: { gte: startDate },
          status: { in: ['PAID', 'COMPLETED'] }
        }
      },
      _sum: {
        quantity: true
      }
    });

    const productIds = topCategories.map(t => t.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { category: true }
    });

    // Map product IDs to category names
    const productCategoryMap = {};
    products.forEach(p => {
      productCategoryMap[p.id] = p.category?.name || 'Other';
    });

    // Get unique categories and use top 3 by total sales
    const categoryRevenue = {};
    topCategories.forEach(item => {
      const category = productCategoryMap[item.productId] || 'Other';
      categoryRevenue[category] = (categoryRevenue[category] || 0) + (item._sum.quantity || 0);
    });

    const topThreeCategories = Object.entries(categoryRevenue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    // Default categories if database is empty
    const categories = topThreeCategories.length > 0 
      ? topThreeCategories 
      : ['Beverages', 'Food', 'Desserts'];

    // Get orders with items and products
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { in: ['PAID', 'COMPLETED'] }
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
      }
    });

    // Process data based on grouping
    const dataMap = {};
    
    orders.forEach(order => {
      let timeSlot;
      const orderDate = new Date(order.createdAt);
      
      if (groupBy === 'hour') {
        const hour = orderDate.getHours();
        timeSlot = `${hour % 12 || 12} ${hour >= 12 ? 'PM' : 'AM'}`;
      } else if (groupBy === 'day') {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        timeSlot = days[orderDate.getDay()];
      } else if (groupBy === 'week') {
        const weekNum = Math.floor((orderDate - startDate) / (7 * 24 * 60 * 60 * 1000)) + 1;
        timeSlot = `Week ${weekNum}`;
      } else {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        timeSlot = months[orderDate.getMonth()];
      }

      if (!dataMap[timeSlot]) {
        const categoryData = {};
        categories.forEach(cat => {
          categoryData[cat.toLowerCase().replace(/\s+/g, '')] = 0;
        });
        dataMap[timeSlot] = { slot: timeSlot, ...categoryData, _categories: categories };
      }

      order.items.forEach(item => {
        const categoryName = item.product?.category?.name || 'Other';
        if (categories.includes(categoryName)) {
          const key = categoryName.toLowerCase().replace(/\s+/g, '');
          const revenue = Number(item.price) * item.quantity;
          dataMap[timeSlot][key] += revenue;
        }
      });
    });

    const result = Object.values(dataMap).map(({ _categories, ...rest }) => rest);
    
    // Return both data and category info for frontend
    res.json({
      data: result,
      categories: categories
    });
  } catch (error) {
    console.error('Sales trends error:', error);
    res.status(500).json({ error: 'Failed to fetch sales trends' });
  }
};

// Get top products for radar chart
exports.getTopProducts = async (req, res) => {
  try {
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
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
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        status: { in: ['PAID', 'COMPLETED'] }
      },
      select: {
        createdAt: true
      }
    });

    // Initialize data structure
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const slots = {
      'Breakfast': {},
      'Lunch': {},
      'Evening': {}
    };

    days.forEach(day => {
      slots['Breakfast'][day] = 0;
      slots['Lunch'][day] = 0;
      slots['Evening'][day] = 0;
    });

    // Process orders
    orders.forEach(order => {
      const date = new Date(order.createdAt);
      const hour = date.getHours();
      const dayIndex = (date.getDay() + 6) % 7; // Convert to Mon=0, Sun=6
      const dayName = days[dayIndex];

      let timeSlot;
      if (hour >= 6 && hour < 11) {
        timeSlot = 'Breakfast';
      } else if (hour >= 11 && hour < 16) {
        timeSlot = 'Lunch';
      } else if (hour >= 16 && hour < 22) {
        timeSlot = 'Evening';
      } else {
        return; // Skip orders outside these hours
      }

      slots[timeSlot][dayName]++;
    });

    // Convert to format expected by Nivo heatmap
    const result = Object.keys(slots).map(slot => ({
      id: slot,
      data: days.map(day => ({
        x: day,
        y: slots[slot][day]
      }))
    }));

    res.json(result);
  } catch (error) {
    console.error('Heatmap error:', error);
    res.status(500).json({ error: 'Failed to fetch heatmap data' });
  }
};
