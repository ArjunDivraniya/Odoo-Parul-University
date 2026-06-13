const prisma = require('../lib/prisma');

exports.getSettings = async (req, res) => {
  try {
    // Upsert to ensure one row always exists
    const settings = await prisma.settings.findFirst();
    if (!settings) {
      // Create default
      const newSettings = await prisma.settings.create({
        data: {}
      });
      return res.json(newSettings);
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { 
      cafeName, receiptFooter, currency, 
      cashEnabled, digitalEnabled, upiEnabled, upiId 
    } = req.body;

    const settings = await prisma.settings.findFirst();
    
    // Determine ID or create new if somehow missing (though getSettings handles creation usually)
    // But safely:
    const data = {
        cafeName, receiptFooter, currency,
        cashEnabled, digitalEnabled, upiEnabled, upiId
    };

    if (settings) {
        const updated = await prisma.settings.update({
            where: { id: settings.id },
            data
        });
        res.json(updated);
    } else {
        const newSettings = await prisma.settings.create({ data });
        res.json(newSettings);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
