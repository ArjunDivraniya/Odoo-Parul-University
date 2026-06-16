const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up existing data...');
  // Clean up in proper order to avoid foreign key constraints
  await prisma.payment.deleteMany();
  await prisma.kitchenTicket.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.session.deleteMany();
  await prisma.terminal.deleteMany();
  await prisma.table.deleteMany();
  await prisma.floor.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.user.deleteMany();

  console.log('Creating Settings...');
  await prisma.settings.create({
    data: {
      cafeName: 'Odoo Cafe Smart Point',
      receiptFooter: 'Thank you for your visit!',
      currency: '₹',
      cashEnabled: true,
      digitalEnabled: true,
      upiEnabled: true,
    }
  });

  console.log('Creating Admin User...');
  const hashedPassword = await bcrypt.hash('123456789', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'dhruveshshyara33@gmail.com',
      password: hashedPassword,
      name: 'Dhruvesh Shyara',
      role: 'ADMIN',
    }
  });

  // Create some staff
  const staff1 = await prisma.user.create({
    data: {
      email: 'barista1@odoocafe.com',
      password: hashedPassword,
      name: 'Alex Barista',
      role: 'EMPLOYEE',
    }
  });
  
  const staff2 = await prisma.user.create({
    data: {
      email: 'kitchen1@odoocafe.com',
      password: hashedPassword,
      name: 'Sam Chef',
      role: 'KITCHEN',
    }
  });

  console.log('Creating Terminals & Sessions...');
  const terminal1 = await prisma.terminal.create({
    data: { name: 'Main POS' }
  });

  const session = await prisma.session.create({
    data: {
      terminalId: terminal1.id,
      userId: admin.id,
      openingCash: 5000,
      status: 'OPEN',
    }
  });

  console.log('Creating Floors & Tables...');
  const mainFloor = await prisma.floor.create({
    data: { name: 'Main Hall' }
  });
  
  const tables = [];
  for(let i=1; i<=8; i++) {
    const table = await prisma.table.create({
      data: {
        name: `Table ${i}`,
        seats: i % 2 === 0 ? 4 : 2,
        floorId: mainFloor.id,
        status: i % 3 === 0 ? 'OCCUPIED' : 'AVAILABLE'
      }
    });
    tables.push(table);
  }

  console.log('Creating Categories & Products...');
  const catCoffee = await prisma.category.create({ data: { name: 'Coffee' } });
  const catPastry = await prisma.category.create({ data: { name: 'Pastries' } });
  const catCold = await prisma.category.create({ data: { name: 'Cold Beverages' } });

  const productsData = [
    { name: 'Espresso', price: 150, categoryId: catCoffee.id, unit: 'cup' },
    { name: 'Cappuccino', price: 220, categoryId: catCoffee.id, unit: 'cup' },
    { name: 'Latte', price: 250, categoryId: catCoffee.id, unit: 'cup' },
    { name: 'Mocha', price: 280, categoryId: catCoffee.id, unit: 'cup' },
    { name: 'Americano', price: 180, categoryId: catCoffee.id, unit: 'cup' },
    
    { name: 'Butter Croissant', price: 150, categoryId: catPastry.id, unit: 'pc' },
    { name: 'Chocolate Muffin', price: 120, categoryId: catPastry.id, unit: 'pc' },
    { name: 'Blueberry Cheesecake', price: 300, categoryId: catPastry.id, unit: 'slice' },
    { name: 'Cinnamon Roll', price: 180, categoryId: catPastry.id, unit: 'pc' },
    
    { name: 'Iced Latte', price: 280, categoryId: catCold.id, unit: 'glass' },
    { name: 'Cold Brew', price: 250, categoryId: catCold.id, unit: 'glass' },
    { name: 'Peach Iced Tea', price: 200, categoryId: catCold.id, unit: 'glass' }
  ];

  const products = [];
  for(const p of productsData) {
    const prod = await prisma.product.create({ data: p });
    products.push(prod);
  }

  console.log('Creating Coupons...');
  await prisma.coupon.create({
    data: {
      code: 'WELCOME10',
      discount: 10,
      type: 'PERCENTAGE',
      isActive: true,
    }
  });
  
  await prisma.coupon.create({
    data: {
      code: 'FLAT50',
      discount: 50,
      type: 'FLAT',
      isActive: true,
    }
  });

  console.log('Creating Orders & Customers (Historical Data)...');
  const customers = [
    { name: 'John Doe', email: 'john@example.com', mobile: '9876543210' },
    { name: 'Alice Smith', email: 'alice@example.com', mobile: '9876543211' },
    { name: 'Bob Wilson', email: 'bob@example.com', mobile: '9876543212' },
    { name: 'Emma Davis', email: 'emma@example.com', mobile: '9876543213' },
    { name: 'Michael Brown', email: 'michael@example.com', mobile: '9876543214' }
  ];

  const statusOptions = ['PAID', 'COMPLETED', 'PAID', 'PREPARING', 'CANCELLED'];
  const numOrders = 150; // A lot of orders to fill charts

  let orderCount = 0;
  for (let i = 0; i < numOrders; i++) {
    orderCount++;
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
    const paymentStatus = (status === 'PAID' || status === 'COMPLETED') ? 'CONFIRMED' : 'PENDING';
    const numItems = Math.floor(Math.random() * 4) + 1;
    
    let totalAmount = 0;
    const orderItemsData = [];
    
    for(let j=0; j<numItems; j++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const qty = Math.floor(Math.random() * 3) + 1;
      totalAmount += Number(product.price) * qty;
      
      orderItemsData.push({
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: qty,
        status: (status === 'PAID' || status === 'COMPLETED') ? 'READY' : 'PENDING'
      });
    }

    const date = new Date();
    // Randomize within last 30 days
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    date.setHours(Math.floor(Math.random() * 24));

    const order = await prisma.order.create({
      data: {
        orderNumber: `#ORD-${String(orderCount).padStart(5, '0')}`,
        status: status,
        paymentStatus: paymentStatus,
        totalAmount: totalAmount,
        userId: admin.id,
        sessionId: session.id,
        tableId: tables[Math.floor(Math.random() * tables.length)].id,
        customerName: customer.name,
        customerEmail: customer.email,
        customerMobile: customer.mobile,
        createdAt: date,
        items: {
          create: orderItemsData
        }
      }
    });

    if (paymentStatus === 'CONFIRMED') {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          method: ['CASH', 'DIGITAL', 'UPI'][Math.floor(Math.random() * 3)],
          amount: totalAmount,
          status: 'CONFIRMED',
          createdAt: date
        }
      });
    }
  }

  console.log('✅ Database successfully seeded with full sample data!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
