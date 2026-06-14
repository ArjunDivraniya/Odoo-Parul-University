const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedData() {
  console.log('Seeding massive amount of real-looking data for all shops...');
  
  const shops = await prisma.shop.findMany({
    include: { users: true }
  });

  const products = await prisma.product.findMany();
  
  if (products.length === 0) {
    console.log('No products found. Please seed products first.');
    return;
  }

  for (const shop of shops) {
    const employees = shop.users.filter(u => u.role === 'EMPLOYEE' || u.role === 'ADMIN');
    if (employees.length === 0) continue;

    console.log(`Seeding data for shop: ${shop.name}`);

    // Create 30-50 orders for each shop across the last 30 days
    const numOrders = Math.floor(Math.random() * 20) + 30;
    
    for (let i = 0; i < numOrders; i++) {
      const employee = employees[Math.floor(Math.random() * employees.length)];
      const product = products[Math.floor(Math.random() * products.length)];
      const qty = Math.floor(Math.random() * 3) + 1;
      const amount = Number(product.price) * qty;
      
      const date = new Date();
      // Randomize within last 30 days
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      date.setHours(Math.floor(Math.random() * 24));

      const statusOptions = ['SENT', 'PREPARING', 'COMPLETED', 'PAID', 'CANCELLED'];
      const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      // Cancelled orders have no payment
      const paymentStatus = (status === 'PAID' || (status !== 'CANCELLED' && Math.random() > 0.3)) ? 'PAID' : 'PENDING';

      await prisma.order.create({
        data: {
          orderNumber: `#ORD-HIST-${shop.id.slice(0,4)}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
          status: status,
          paymentStatus: paymentStatus,
          totalAmount: amount,
          userId: employee.id,
          createdAt: date,
          items: {
            create: {
              productId: product.id,
              productName: product.name,
              price: product.price,
              quantity: qty,
              status: (status === 'PAID' || status === 'COMPLETED') ? 'READY' : 'PENDING'
            }
          }
        }
      });
    }
  }

  console.log('Massive seeding completed successfully.');
}

seedData()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
