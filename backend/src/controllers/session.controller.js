// backend/src/controllers/session.controller.js
const prisma = require('../lib/prisma');
const { z } = require('zod');

// Validation Schemas
const openSessionSchema = z.object({
    terminalId: z.string().uuid(),
    openingCash: z.preprocess((val) => Number(val), z.number().min(0))
});

const closeSessionSchema = z.object({
    closingCash: z.preprocess((val) => Number(val), z.number().min(0))
});

exports.openSession = async (req, res) => {
    try {
        const { terminalId, openingCash } = openSessionSchema.parse(req.body);
        // userId should come from auth middleware: req.user.id
        // For now, assuming it's passed or using a placeholder if auth not fully wired in frontend yet.
        // BUT requirements say "After login, user can open POS session". 
        // I'll assume req.user is set by auth middleware. 
        // If not, I'll fallback to a body param for testing, but mostly stick to req.user.id

        // For this hackathon scope, if req.user is missing, I might default to a lookup or error.
        // Let's assume the auth middleware is working as `auth.routes.js` exists.
        // However, I need to make sure `req.user` is populated. 
        // Looking at `auth.controller.me`, it uses `req.user.id`. 

        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        // Check if terminal has an active session
        const activeSession = await prisma.session.findFirst({
            where: { terminalId, status: 'OPEN' }
        });

        if (activeSession) {
            return res.status(400).json({ error: "Terminal already has an open session", session: activeSession });
        }

        const session = await prisma.session.create({
            data: {
                terminalId,
                userId,
                openingCash,
                status: 'OPEN',
                startAt: new Date()
            }
        });

        res.status(201).json(session);
    } catch (error) {
        res.status(400).json({ error: error.errors || error.message });
    }
};

exports.closeSession = async (req, res) => {
    try {
        const { id } = req.params;
        const { closingCash } = closeSessionSchema.parse(req.body);

        const session = await prisma.session.findUnique({ where: { id } });
        if (!session) return res.status(404).json({ error: "Session not found" });

        if (session.status === 'CLOSED') {
            return res.status(400).json({ error: "Session is already closed" });
        }

        const updatedSession = await prisma.session.update({
            where: { id },
            data: {
                status: 'CLOSED',
                closingCash,
                endAt: new Date()
            }
        });

        res.json(updatedSession);
    } catch (error) {
        res.status(400).json({ error: error.errors || error.message });
    }
};

exports.getActiveSession = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const session = await prisma.session.findFirst({
            where: { userId, status: 'OPEN' },
            include: { terminal: true }
        });

        if (!session) return res.status(200).json(null); // No active session
        res.json(session);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getSession = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await prisma.session.findUnique({
            where: { id },
            include: {
                orders: true,
                user: {
                    select: { id: true, name: true, email: true, role: true }
                },
                terminal: true
            }
        });

        if (!session) return res.status(404).json({ error: "Session not found" });
        res.json(session);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
