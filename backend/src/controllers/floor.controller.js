// backend/src/controllers/floor.controller.js
const prisma = require('../lib/prisma');
const { z } = require('zod');

// Validation Schemas
const floorSchema = z.object({
    name: z.string().min(1)
});

const tableSchema = z.object({
    name: z.string().min(1),
    seats: z.preprocess((val) => Number(val), z.number().int().positive()),
    active: z.boolean().optional().default(true)
});

// Floor Controllers
exports.getFloors = async (req, res) => {
    try {
        const floors = await prisma.floor.findMany({
            include: {
                tables: {
                    include: {
                        orders: {
                            where: {
                                NOT: {
                                    status: {
                                        in: ['PAID', 'CANCELLED']
                                    }
                                }
                            },
                            select: {
                                id: true,
                                status: true,
                                totalAmount: true
                            }
                        }
                    },
                    orderBy: { name: 'asc' }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
        res.json(floors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createFloor = async (req, res) => {
    try {
        const { name } = floorSchema.parse(req.body);
        const floor = await prisma.floor.create({
            data: { name },
            include: { tables: true }
        });
        res.status(201).json(floor);
    } catch (error) {
        res.status(400).json({ error: error.errors || error.message });
    }
};

// Table Controllers
exports.addTable = async (req, res) => {
    try {
        const { id: floorId } = req.params;
        const { name, seats, active } = tableSchema.parse(req.body);

        const floor = await prisma.floor.findUnique({ where: { id: floorId } });
        if (!floor) return res.status(404).json({ error: "Floor not found" });

        const table = await prisma.table.create({
            data: {
                name,
                seats,
                active,
                floorId
            }
        });

        res.status(201).json(table);
    } catch (error) {
        res.status(400).json({ error: error.errors || error.message });
    }
};

exports.updateTable = async (req, res) => {
    try {
        const { id } = req.params;
        const data = tableSchema.partial().parse(req.body);

        const table = await prisma.table.update({
            where: { id },
            data
        });

        res.json(table);
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ error: "Table not found" });
        res.status(400).json({ error: error.errors || error.message });
    }
};

exports.deleteTable = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.table.delete({ where: { id } });
        res.json({ message: "Table deleted successfully" });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ error: "Table not found" });
        res.status(500).json({ error: error.message });
    }
};
