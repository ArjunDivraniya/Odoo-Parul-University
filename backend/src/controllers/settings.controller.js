const prisma = require('../lib/prisma');
const { getIo } = require('../lib/socket');

let cachedSettings = null;

exports.getSettings = async (req, res) => {
  try {
    if (cachedSettings) {
      return res.json(cachedSettings);
    }

    const settings = await prisma.settings.findFirst();
    if (!settings) {
      const newSettings = await prisma.settings.create({
        data: {}
      });
      cachedSettings = newSettings;
      return res.json(newSettings);
    }
    cachedSettings = settings;
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

    cachedSettings = result;

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
