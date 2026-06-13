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

exports.transferTable = async (req, res) => {
    try {
        const { sourceTableId, destTableId } = req.body;
        
        // Find the active order at the source table
        const order = await prisma.order.findFirst({
            where: {
                tableId: sourceTableId,
                status: {
                    notIn: ['PAID', 'CANCELLED']
                }
            }
        });

        if (!order) {
            return res.status(404).json({ error: "No active order found on source table" });
        }

        // Update the order's tableId to destination table
        const updatedOrder = await prisma.order.update({
            where: { id: order.id },
            data: { tableId: destTableId },
            include: { table: true, items: true }
        });

        // Set source table status to AVAILABLE
        await prisma.table.update({
            where: { id: sourceTableId },
            data: { status: 'AVAILABLE' }
        });

        // Set dest table status to OCCUPIED
        await prisma.table.update({
            where: { id: destTableId },
            data: { status: 'OCCUPIED' }
        });

        // Emit socket events
        const { getIo } = require('../lib/socket');
        const io = getIo();
        if (io) {
            io.emit('table_status_changed', { tableId: sourceTableId, status: 'AVAILABLE' });
            io.emit('table_status_changed', { tableId: destTableId, status: 'OCCUPIED' });
            io.emit('order_updated', updatedOrder);
            io.emit('dashboard_updated');
        }

        res.json({ message: "Table transfer completed successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteFloor = async (req, res) => {
    try {
        const { id } = req.params;
        // Cascade delete tables inside floor
        await prisma.table.deleteMany({ where: { floorId: id } });
        await prisma.floor.delete({ where: { id } });
        res.json({ message: "Floor deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

exports.freeTable = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const userName = req.user?.name;

        const table = await prisma.table.findUnique({
            where: { id }
        });

        if (!table) {
            return res.status(404).json({ error: "Table not found" });
        }

        // Check for active unpaid orders
        const activeUnpaidOrder = await prisma.order.findFirst({
            where: {
                tableId: id,
                paymentStatus: { not: 'PAID' },
                status: { not: 'CANCELLED' }
            }
        });

        if (activeUnpaidOrder) {
            return res.status(400).json({
                error: "UNPAID_ACTIVE_ORDER",
                message: "Please complete or cancel the active order before freeing the table."
            });
        }

        // Update Table status to AVAILABLE
        await prisma.table.update({
            where: { id },
            data: { status: 'AVAILABLE' }
        });

        // Audit Logging
        console.log(`[AUDIT] Table ${table.name} (ID: ${id}) was manually freed by user ${userName} (ID: ${userId}) at ${new Date().toISOString()}`);

        // Emit Socket.IO Events
        const { getIo } = require('../lib/socket');
        const io = getIo();
        if (io) {
            io.emit('table_status_changed', { tableId: id, status: 'AVAILABLE' });
            io.emit('dashboard_updated');
        }

        res.json({ message: "Table has been freed successfully." });
    } catch (error) {
        console.error("Failed to free table:", error);
        res.status(500).json({ error: error.message });
    }
};
