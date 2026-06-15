const Supplier = require('../models/Supplier');

// GET /suppliers
exports.getManage = async (req, res) => {
  res.render('suppliers/manage');
};

// GET /suppliers/search
exports.getSearch = async (req, res) => {
  try {
    const search = req.query.search || '';
    const limit = parseInt(req.query.limit) || 25;
    const offset = parseInt(req.query.offset) || 0;
    const sort = req.query.sort || 'company_name';
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
        { agency_name: regex }
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortQuery = {};
    sortQuery[sort] = sortOrder;

    const total = await Supplier.countDocuments(query);
    const suppliers = await Supplier.find(query)
      .sort(sortQuery)
      .skip(offset)
      .limit(limit);

    const rows = suppliers.map(s => ({
      _id: s._id,
      person_id: s._id,
      company_name: s.company_name,
      agency_name: s.agency_name,
      last_name: s.last_name,
      first_name: s.first_name,
      email: s.email,
      phone_number: s.phone_number,
      account_number: s.account_number || '',
      buttons: `<a href="/suppliers/view/${s._id}" class="btn btn-xs btn-default modal-dlg" title="Update Supplier"><i class="glyphicon glyphicon-edit"></i></a>`
    }));

    res.json({ total, rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// GET /suppliers/view/:id
exports.getView = async (req, res) => {
  try {
    const id = req.params.id;
    let supplier = {};
    if (id !== '-1') {
      supplier = await Supplier.findById(id);
    }
    res.render('suppliers/form', { supplier, id });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};

// POST /suppliers/save/:id
exports.postSave = async (req, res) => {
  try {
    const id = req.params.id;
    const supplierData = {
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
      agency_name: req.body.agency_name,
      account_number: req.body.account_number || undefined
    };

    if (id === '-1') {
      await Supplier.create(supplierData);
      res.json({ success: true, message: 'Supplier added successfully' });
    } else {
      await Supplier.findByIdAndUpdate(id, supplierData);
      res.json({ success: true, message: 'Supplier updated successfully' });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
};

// POST /suppliers/delete
exports.postDelete = async (req, res) => {
  try {
    const ids = req.body.ids;
    if (ids && ids.length > 0) {
      await Supplier.updateMany({ _id: { $in: ids } }, { deleted: true });
      res.json({ success: true, message: 'Selected suppliers deleted successfully' });
    } else {
      res.json({ success: false, message: 'No suppliers selected' });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
};
