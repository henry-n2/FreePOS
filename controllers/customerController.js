const Customer = require('../models/Customer');

// GET /customers
exports.getManage = async (req, res) => {
  res.render('customers/manage');
};

// GET /customers/search
exports.getSearch = async (req, res) => {
  try {
    const search = req.query.search || '';
    const limit = parseInt(req.query.limit) || 25;
    const offset = parseInt(req.query.offset) || 0;
    const sort = req.query.sort || 'last_name';
    const order = req.query.order || 'asc';

    let query = { deleted: false };
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { first_name: regex },
        { last_name: regex },
        { email: regex },
        { phone_number: regex },
        { company_name: regex },
        { account_number: regex }
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortQuery = {};
    sortQuery[sort] = sortOrder;

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort(sortQuery)
      .skip(offset)
      .limit(limit);

    // Format rows for bootstrap-table
    const rows = customers.map(c => ({
      _id: c._id,
      person_id: c._id, // match original label
      first_name: c.first_name,
      last_name: c.last_name,
      email: c.email,
      phone_number: c.phone_number,
      company_name: c.company_name,
      account_number: c.account_number,
      taxable: c.taxable ? 'Yes' : 'No',
      discount_percent: c.discount_percent,
      points: c.points,
      buttons: `<a href="/customers/view/${c._id}" class="btn btn-xs btn-default modal-dlg" title="Update Customer"><i class="glyphicon glyphicon-edit"></i></a>`
    }));

    res.json({ total, rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// GET /customers/view/:id
exports.getView = async (req, res) => {
  try {
    const id = req.params.id;
    let customer = {};
    if (id !== '-1') {
      customer = await Customer.findById(id);
    }
    // Render form inside partial or raw for modals
    res.render('customers/form', { customer, id });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};

// POST /customers/save/:id
exports.postSave = async (req, res) => {
  try {
    const id = req.params.id;
    const customerData = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      gender: parseInt(req.body.gender) || 0,
      email: req.body.email,
      phone_number: req.body.phone_number,
      address_1: req.body.address_1,
      address_2: req.body.address_2,
      city: req.body.city,
      state: req.body.state,
      zip: req.body.zip,
      country: req.body.country,
      comments: req.body.comments,
      company_name: req.body.company_name,
      account_number: req.body.account_number || undefined,
      taxable: req.body.taxable === '1',
      discount_percent: parseFloat(req.body.discount_percent) || 0,
      points: parseFloat(req.body.points) || 0
    };

    if (id === '-1') {
      // Create new
      await Customer.create(customerData);
      res.json({ success: true, message: 'Customer added successfully' });
    } else {
      // Update existing
      await Customer.findByIdAndUpdate(id, customerData);
      res.json({ success: true, message: 'Customer updated successfully' });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
};

// POST /customers/delete
exports.postDelete = async (req, res) => {
  try {
    const ids = req.body.ids; // Array of IDs
    if (ids && ids.length > 0) {
      await Customer.updateMany({ _id: { $in: ids } }, { deleted: true });
      res.json({ success: true, message: 'Selected customers deleted successfully' });
    } else {
      res.json({ success: false, message: 'No customers selected' });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
};

// GET /customers/suggest
exports.getSuggest = async (req, res) => {
  try {
    const search = req.query.term || '';
    const query = {
      deleted: false,
      $or: [
        { first_name: new RegExp(search, 'i') },
        { last_name: new RegExp(search, 'i') },
        { company_name: new RegExp(search, 'i') },
        { phone_number: new RegExp(search, 'i') }
      ]
    };
    const customers = await Customer.find(query).limit(10);
    const suggestions = customers.map(c => ({
      value: c._id,
      label: `${c.first_name} ${c.last_name} (${c.company_name || 'Individual'}) - ${c.phone_number || 'No Phone'}`
    }));
    res.json(suggestions);
  } catch (err) {
    console.error(err);
    res.json([]);
  }
};
