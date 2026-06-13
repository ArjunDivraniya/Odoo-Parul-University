// backend/src/controllers/product.controller.js
const prisma = require('../lib/prisma');
const { z } = require('zod');

// Validation Schemas
const productSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    price: z.preprocess((val) => Number(val), z.number().positive()),
    unit: z.string().optional(),
    tax: z.preprocess((val) => Number(val), z.number().min(0)).optional(),
    categoryId: z.string(),
    isAvailable: z.boolean().optional(),
    sendToKitchen: z.boolean().optional(),
    imageUrl: z.string().optional(),
    variants: z.array(z.object({
        name: z.string(),
        extraPrice: z.preprocess((val) => Number(val), z.number().min(0))
    })).optional()
});

const categorySchema = z.object({
    name: z.string().min(1)
});

// Category Controllers
exports.createCategory = async (req, res) => {
    try {
        const { name } = categorySchema.parse(req.body);
        const category = await prisma.category.create({ data: { name } });
        res.status(201).json(category);
    } catch (error) {
        res.status(400).json({ error: error.errors || error.message });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            include: { _count: { select: { products: true } } }
        });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.category.delete({ where: { id } });
        res.json({ message: "Category deleted" });
    } catch (error) {
        if (error.code === 'P2003') {
            return res.status(400).json({ error: "Cannot delete category containing products." });
        }
        res.status(500).json({ error: error.message });
    }
};

// Product Controllers
exports.createProduct = async (req, res) => {
    try {
        const data = productSchema.parse(req.body);
        const { variants, ...productData } = data;

        const product = await prisma.product.create({
            data: {
                ...productData,
                variants: variants ? {
                    create: variants
                } : undefined
            },
            include: { variants: true, category: true }
        });

        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ error: error.errors || error.message });
    }
};

exports.getProducts = async (req, res) => {
    try {
        const { categoryId } = req.query;
        const filter = categoryId ? { categoryId } : {};

        const products = await prisma.product.findMany({
            where: filter,
            include: { variants: true, category: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const data = productSchema.partial().parse(req.body);
        const { variants, ...productData } = data;

        // Transaction to update product and handle variants (simple replacement strategy for variants for now)
        const product = await prisma.$transaction(async (tx) => {
            await tx.product.update({
                where: { id },
                data: productData
            });

            if (variants) {
                // Delete existing variants and create new ones (simplest approach for full update)
                // In a real app, you might want to diff them.
                await tx.variant.deleteMany({ where: { productId: id } });
                await tx.variant.createMany({
                    data: variants.map(v => ({ ...v, productId: id }))
                });
            }

            return tx.product.findUnique({
                where: { id },
                include: { variants: true, category: true }
            });
        });

        res.json(product);
    } catch (error) {
        res.status(400).json({ error: error.errors || error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Delete variants first to satisfy Foreign Key constraints
        // Using a transaction to ensure atomicity
        await prisma.$transaction([
            prisma.variant.deleteMany({ where: { productId: id } }),
            prisma.product.delete({ where: { id } })
        ]);

        res.json({ message: "Product and its variants deleted successfully" });
    } catch (error) {
        // Check for specific Prisma error codes if needed, but the generic message covers it
        if (error.code === 'P2003') { // Foreign key constraint failed
            return res.status(400).json({ error: "Cannot delete product because it is part of existing orders." });
        }
        res.status(500).json({ error: error.message });
    }
};
