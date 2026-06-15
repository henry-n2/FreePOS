const AppConfig = require('../models/AppConfig');

// GET /config
exports.getManage = async (req, res) => {
  try {
    const configs = await AppConfig.find({});
    const configMap = {};
    configs.forEach(c => {
      configMap[c.key] = c.value;
    });

    res.render('configs/manage', { configValues: configMap, feedback: req.session.feedback || null });
    req.session.feedback = null;
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};

// POST /config/save
exports.postSave = async (req, res) => {
  try {
    // Keys we allow updating
    const keys = [
      'company',
      'address',
      'phone',
      'email',
      'return_policy',
      'timezone',
      'currency_symbol',
      'theme',
      'dateformat',
      'barcode_line_color',
      'barcode_background',
      'barcode_width',
      'barcode_height',
      'barcode_display_value',
      'barcode_text_size',
      'invoice_title',
      'receipt_header_msg',
      'receipt_footer_msg',
      'invoice_primary_color',
      'invoice_text_color',
      'invoice_show_logo',
      'invoice_show_barcode'
    ];

    for (const key of keys) {
      if (req.body[key] !== undefined) {
        await AppConfig.findOneAndUpdate(
          { key },
          { value: req.body[key] },
          { upsert: true, new: true }
        );
      }
    }

    req.session.feedback = { type: 'success', message: 'Settings saved successfully' };
    res.redirect('/config');
  } catch (err) {
    console.error(err);
    req.session.feedback = { type: 'danger', message: err.message };
    res.redirect('/config');
  }
};
