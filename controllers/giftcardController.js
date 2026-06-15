const Giftcard = require('../models/Giftcard');
const Customer = require('../models/Customer');

// GET /giftcards
exports.getManage = async (req, res) => {
  res.render('giftcards/manage');
};

// GET /giftcards/search
exports.getSearch = async (req, res) => {
  try {
    const search = req.query.search || '';
    const limit = parseInt(req.query.limit) || 25;
    const offset = parseInt(req.query.offset) || 0;
    const sort = req.query.sort || 'giftcard_number';
    const order = req.query.order || 'asc';

    let query = { deleted: false };
    if (search) {
      const regex = new RegExp(search, 'i');
      query.giftcard_number = regex;
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortQuery = {};
    sortQuery[sort] = sortOrder;

    const total = await Giftcard.countDocuments(query);
    const giftcards = await Giftcard.find(query)
      .populate('customer')
      .sort(sortQuery)
      .skip(offset)
      .limit(limit);

    const rows = giftcards.map(g => ({
      _id: g._id,
      giftcard_id: g._id,
      giftcard_number: g.giftcard_number,
      value: g.value,
      customer_name: g.customer ? `${g.customer.first_name} ${g.customer.last_name}` : 'None',
      buttons: `<a href="/giftcards/view/${g._id}" class="btn btn-xs btn-default modal-dlg" title="Update Gift Card"><i class="glyphicon glyphicon-edit"></i></a>`
    }));

    res.json({ total, rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// GET /giftcards/view/:id
exports.getView = async (req, res) => {
  try {
    const id = req.params.id;
    let giftcard = {};
    if (id !== '-1') {
      giftcard = await Giftcard.findById(id);
    }
    const customers = await Customer.find({ deleted: false });
    res.render('giftcards/form', { giftcard, id, customers });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};

// POST /giftcards/save/:id
exports.postSave = async (req, res) => {
  try {
    const id = req.params.id;
    const giftcardData = {
      giftcard_number: req.body.giftcard_number,
      value: parseFloat(req.body.value) || 0,
      customer: req.body.customer || null
    };

    if (id === '-1') {
      // Check duplicate
      const exists = await Giftcard.findOne({ giftcard_number: req.body.giftcard_number, deleted: false });
      if (exists) {
        return res.json({ success: false, message: 'Gift Card number already exists' });
      }
      await Giftcard.create(giftcardData);
      res.json({ success: true, message: 'Gift Card added successfully' });
    } else {
      const exists = await Giftcard.findOne({ giftcard_number: req.body.giftcard_number, _id: { $ne: id }, deleted: false });
      if (exists) {
        return res.json({ success: false, message: 'Gift Card number already exists' });
      }
      await Giftcard.findByIdAndUpdate(id, giftcardData);
      res.json({ success: true, message: 'Gift Card updated successfully' });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
};

// POST /giftcards/delete
exports.postDelete = async (req, res) => {
  try {
    const ids = req.body.ids;
    if (ids && ids.length > 0) {
      await Giftcard.updateMany({ _id: { $in: ids } }, { deleted: true });
      res.json({ success: true, message: 'Selected gift cards deleted successfully' });
    } else {
      res.json({ success: false, message: 'No gift cards selected' });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
};

// GET /giftcards/suggest
exports.getSuggest = async (req, res) => {
  try {
    const search = req.query.term || '';
    const query = {
      deleted: false,
      giftcard_number: new RegExp(search, 'i')
    };
    const giftcards = await Giftcard.find(query).limit(10);
    const suggestions = giftcards.map(g => ({
      value: g._id,
      label: `Giftcard #${g.giftcard_number} (₹${g.value})`,
      giftcard_number: g.giftcard_number,
      value_amount: g.value,
      is_giftcard: true
    }));
    res.json(suggestions);
  } catch (err) {
    console.error(err);
    res.json([]);
  }
};
