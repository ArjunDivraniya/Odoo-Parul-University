const prisma = require('../lib/prisma');

exports.getTerminals = async (req, res) => {
  try {
    const terminals = await prisma.terminal.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(terminals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createTerminal = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    const terminal = await prisma.terminal.create({
      data: { name }
    });
    res.status(201).json(terminal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteTerminal = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.terminal.delete({ where: { id } });
    res.json({ message: "Terminal deleted" });
  } catch (error) {
    if (error.code === 'P2003') {
        return res.status(400).json({ error: "Cannot delete terminal with associated sessions." });
    }
    res.status(500).json({ error: error.message });
  }
};
