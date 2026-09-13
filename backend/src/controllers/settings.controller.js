const prisma = require('../lib/prisma');
const { getIo } = require('../lib/socket');

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
    
    const data = {
        cafeName, receiptFooter, currency,
        cashEnabled, digitalEnabled, upiEnabled, upiId
    };

    let result;
    if (settings) {
        result = await prisma.settings.update({
            where: { id: settings.id },
            data
        });
    } else {
        result = await prisma.settings.create({ data });
    }

    const io = getIo();
    if (io) {
      io.emit('settings_updated', result);
      io.emit('dashboard_updated');
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
