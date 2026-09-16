const prisma = require('../src/lib/prisma');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Prisma } = require('@prisma/client');
const { slugify } = require('../src/utils/slugify');

const products = require('./data/seed-products');

async function clearDatabase() {
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.session.deleteMany();
  await prisma.terminal.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.table.deleteMany();
  await prisma.floor.deleteMany();
  await prisma.shop.deleteMany();
  await prisma.user.deleteMany();
}

async function createTenant() {
  const password = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@odoo-cafe.com',
      password,
      role: 'ADMIN',
      isActive: true,
      shopId: null,
    },
  });

  const shop = await prisma.shop.create({
    data: {
      name: 'Odoo Cafe',
      slug: `${slugify('The Coffe Concept')}-${crypto.randomBytes(3).toString('hex')}`,
      adminId: admin.id,
    },
  });

  await prisma.user.update({
    where: { id: admin.id },
    data: { shopId: shop.id },
  });

  const staff = [
    { name: 'Jagjeet Singh', email: 'jagjeet@odoo-cafe.com', role: 'EMPLOYEE' },
    { name: 'Gordon Ramsay', email: 'gordon@odoo-cafe.com', role: 'KITCHEN' },
  ];

  for (const member of staff) {
    await prisma.user.create({
      data: {
        name: member.name,
        email: member.email,
        password,
        role: member.role,
        shopId: shop.id,
        isActive: true,
      },
    });
  }

  return { admin, shop };
}

async function createCategories() {
  const categoryNames = [
    'Beverages',
    'Snacks',
    'Breakfast',
    'Main Course',
    'Desserts',
    'Salads',
    'Specials',
  ];

  const categories = {};

  for (const name of categoryNames) {
    const category = await prisma.category.create({
      data: { name },
    });
    categories[name] = category.id;
    console.log(`  📁 Created category: ${name}`);
  }

  return categories;
}

async function createProducts(categories) {
  let count = 0;

  for (const product of products) {
    await prisma.product.create({
      data: {
        name: product.name,
        description: product.description,
        price: new Prisma.Decimal(product.price),
        unit: product.unit,
        tax: new Prisma.Decimal('0'),
        isAvailable: true,
        sendToKitchen:
          product.category === 'Main Course' ||
          product.category === 'Specials',
        imageUrl: product.imageUrl,
        categoryId: categories[product.category],
      },
    });
    count++;
  }

  return count;
}

async function main() {
  console.log('🌱 Starting seed...\n');

  console.log('🗑️  Clearing database...');
  await clearDatabase();

  console.log('👤 Creating tenant (admin + shop + staff)...');
  await createTenant();

  console.log('📁 Creating categories...');
  const categories = await createCategories();

  console.log(`\n🍔 Creating ${products.length} products...`);
  const count = await createProducts(categories);

  console.log(`\n✅ Seeding completed! Added ${count} products across ${Object.keys(categories).length} categories.`);
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
