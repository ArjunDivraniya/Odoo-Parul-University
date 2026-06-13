const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedData() {
  console.log('Seeding real-looking data for all shops...');
  
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

    // Create 5-10 orders for each shop from the last 2 days
    const numOrders = Math.floor(Math.random() * 6) + 5;
    
    for (let i = 0; i < numOrders; i++) {
      const employee = employees[Math.floor(Math.random() * employees.length)];
      const product = products[Math.floor(Math.random() * products.length)];
      const qty = Math.floor(Math.random() * 3) + 1;
      const amount = Number(product.price) * qty;
      
      const date = new Date();
      // Randomize within last 48 hours
      date.setHours(date.getHours() - Math.floor(Math.random() * 48));

      await prisma.order.create({
        data: {
          orderNumber: `#ORD-SEED-${shop.id.slice(0,4)}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
          status: 'PAID',
          totalAmount: amount,
          userId: employee.id,
          createdAt: date,
          items: {
            create: {
              productId: product.id,
              productName: product.name,
              price: product.price,
              quantity: qty,
              status: 'READY'
            }
          }
        }
      });
    }
  }

  console.log('Seeding completed successfully.');
}

seedData()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
