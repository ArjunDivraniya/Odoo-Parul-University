// backend/src/controllers/order.controller.js
const prisma = require('../lib/prisma');
const { z } = require('zod');
const emailService = require('../services/email.service');

// Validation
const orderItemSchema = z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    variantId: z.string().uuid().optional()
});

const createOrderSchema = z.object({
    tableId: z.string().uuid().optional(),
    sessionId: z.string().uuid().optional(),
    type: z.enum(['DINE_IN', 'TAKEAWAY']).default('DINE_IN'),
    items: z.array(orderItemSchema).min(1),
    customer: z.object({
        name: z.string().optional(),
        email: z.string().email().optional().or(z.literal('')),
        mobile: z.string().optional()
    }).optional()
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
        const { tableId, sessionId, items, type, customer } = createOrderSchema.parse(req.body);
        const userId = req.user?.id;

        // Fetch products to calculate prices and snapshots
        const productIds = items.map(i => i.productId);
        const products = await prisma.product.findMany({
            where: { id: { in: productIds } },
            include: { variants: true }
        });

        const productMap = new Map(products.map(p => [p.id, p]));

        let totalAmount = 0;
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
            totalAmount += itemTotal;

            return {
                productId: item.productId,
                productName: product.name,
                price: price,
                variantName: variantName,
                variantId: variantId,
                quantity: item.quantity,
                status: 'PENDING'
            };
        });

        // Generate Order Number: #ORD-YYYYMMDD-XXXX
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const count = await prisma.order.count();
        const orderNumber = `#ORD-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;

        const order = await prisma.order.create({
            data: {
                orderNumber,
                tableId,
                sessionId,
                userId,
                type,
                totalAmount,
                status,
                customerName: customer?.name || null,
                customerEmail: customer?.email || null,
                customerMobile: customer?.mobile || null,
                items: {
                    create: orderItemsData
                }
            },
            include: { items: true }
        });

        // Email Bill (fire-and-forget)
        if (customer?.email) {
            emailService.sendBill(order).catch(err => console.error("Email failed:", err));
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
                        status: true
                    }
                },
                table: {
                    select: { id: true, name: true }
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
            data: { status }
        });

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

        const payment = await prisma.payment.create({
            data: {
                orderId: id,
                method,
                amount,
                reference,
                status: 'CONFIRMED'
            }
        });

        // Check if fully paid
        const totalPaid = order.payments.reduce((sum, p) => sum + Number(p.amount), 0) + Number(amount);

        if (totalPaid >= Number(order.totalAmount)) {
            await prisma.order.update({
                where: { id },
                data: { status: 'PAID' }
            });
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
onsole.error('Pay order error:', error);
        res.status(400).json({ error: error.message });
    }
};
