const Setting = require('../models/Setting');
const AuditService = require('../services/AuditService');

// @route   GET /api/v1/settings
const getSettings = async (req, res, next) => {
  try {
    const { category } = req.query;
    const query = {};
    if (category) query.category = category;

    const settings = await Setting.find(query);
    const settingsMap = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    res.status(200).json({ success: true, data: settingsMap, raw: settings });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/v1/settings
// @desc    Update or create multiple settings
const updateSettings = async (req, res, next) => {
  try {
    const { settings } = req.body; // Array of { key, value, category, description } or object { [key]: value }

    if (!settings) {
      return res.status(400).json({ success: false, message: 'Settings payload is required.' });
    }

    if (Array.isArray(settings)) {
      for (const item of settings) {
        await Setting.findOneAndUpdate(
          { key: item.key },
          {
            $set: {
              value: item.value,
              category: item.category || 'system',
              description: item.description || '',
            },
          },
          { upsert: true, new: true }
        );
      }
    } else {
      // Key-value object
      for (const [key, value] of Object.entries(settings)) {
        await Setting.findOneAndUpdate(
          { key },
          { $set: { value } },
          { upsert: true, new: true }
        );
      }
    }

    await AuditService.log({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'SETTINGS_UPDATED',
      module: 'Settings',
      recordId: 'all',
      newData: settings,
      req,
    });

    res.status(200).json({ success: true, message: 'Settings updated successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
