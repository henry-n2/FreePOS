const mongoose = require('mongoose');
const Item = require('../models/Item');
const Supplier = require('../models/Supplier');
const Receiving = require('../models/Receiving');
const StockLocation = require('../models/StockLocation');

// GET /receivings
exports.getRegister = async (req, res) => {
  if (!req.session.recv_cart) {
    req.session.recv_cart = {
      items: [],     // { id, name, cost_price, unit_price, quantity, discount_percent, description, serialnumber }
      supplier_id: null,
      payment_type: 'Cash',
      comment: '',
      reference: ''
    };
  }

  try {
    const locations = await StockLocation.find({ deleted: false });
    const activeLocation = req.session.activeLocation || 'stock';

    let supplier = null;
    if (req.session.recv_cart.supplier_id) {
      supplier = await Supplier.findById(req.session.recv_cart.supplier_id);
    }

    const cart = req.session.recv_cart;
    const total = cart.items.reduce((sum, item) => {
      return sum + (item.cost_price * item.quantity * (1 - (item.discount_percent || 0) / 100));
    }, 0);

    res.render('receivings/register', {
      cart,
      supplier,
      total,
      locations,
      activeLocation,
      feedback: req.session.feedback || null
    });

    req.session.feedback = null;
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};

// POST /receivings/add
exports.postAddItem = async (req, res) => {
  const item_id = req.body.item_id;
  const quantity = parseFloat(req.body.quantity) || 1;
  const cart = req.session.recv_cart;

  try {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(item_id);
    let item = null;
    if (isValidObjectId) {
      item = await Item.findById(item_id);
    }
    if (!item) {
      item = await Item.findOne({ item_number: item_id, deleted: false });
    }

    if (item) {
      const existing = cart.items.find(i => i.id.toString() === item._id.toString());
      if (existing) {
        existing.quantity += quantity;
      } else {
        cart.items.push({
          id: item._id,
          name: item.name,
          cost_price: item.cost_price,
          unit_price: item.unit_price,
          quantity: quantity,
          discount_percent: 0,
          description: '',
          serialnumber: ''
        });
      }
      return res.redirect('/receivings');
    }

    req.session.feedback = { type: 'danger', message: 'Item not found' };
    res.redirect('/receivings');
  } catch (err) {
    console.error(err);
    res.redirect('/receivings');
  }
};

// POST /receivings/edit_item/:index
exports.postEditItem = (req, res) => {
  const index = parseInt(req.params.index);
  const cart = req.session.recv_cart;

  if (cart && cart.items[index]) {
    cart.items[index].quantity = parseFloat(req.body.quantity) || 1;
    cart.items[index].cost_price = parseFloat(req.body.cost_price) || 0;
    cart.items[index].unit_price = parseFloat(req.body.unit_price) || 0;
    cart.items[index].discount_percent = parseFloat(req.body.discount_percent) || 0;
  }
  res.redirect('/receivings');
};

// GET /receivings/delete_item/:index
exports.getDeleteItem = (req, res) => {
  const index = parseInt(req.params.index);
  const cart = req.session.recv_cart;

  if (cart && cart.items[index]) {
    cart.items.splice(index, 1);
  }
  res.redirect('/receivings');
};

// POST /receivings/select_supplier
exports.postSelectSupplier = async (req, res) => {
  const supplier_id = req.body.supplier_id;
  try {
    let supplier = null;
    if (supplier_id && mongoose.Types.ObjectId.isValid(supplier_id)) {
      supplier = await Supplier.findById(supplier_id);
    }
    if (!supplier && supplier_id) {
      supplier = await Supplier.findOne({ account_number: supplier_id, deleted: false });
    }

    if (supplier) {
      req.session.recv_cart.supplier_id = supplier._id;
    }
    res.redirect('/receivings');
  } catch (err) {
    console.error(err);
    res.redirect('/receivings');
  }
};

// GET /receivings/remove_supplier
exports.getRemoveSupplier = (req, res) => {
  if (req.session.recv_cart) {
    req.session.recv_cart.supplier_id = null;
  }
  res.redirect('/receivings');
};

// POST /receivings/complete
exports.postComplete = async (req, res) => {
  const cart = req.session.recv_cart;
  if (!cart || cart.items.length === 0) {
    req.session.feedback = { type: 'danger', message: 'Cart is empty' };
    return res.redirect('/receivings');
  }

  try {
    const location_id = req.session.activeLocation || 'stock';

    // Map items
    const recvItems = cart.items.map(item => ({
      item: item.id,
      quantity_purchased: item.quantity,
      item_cost_price: item.cost_price,
      item_unit_price: item.unit_price,
      discount_percent: item.discount_percent,
      description: item.description,
      serialnumber: item.serialnumber,
      location_id: location_id
    }));

    // 1. Save Receiving to database
    const receiving = await Receiving.create({
      supplier: cart.supplier_id || null,
      employee: req.session.employeeId,
      comment: req.body.comment || '',
      payment_type: req.body.payment_type || 'Cash',
      reference: req.body.reference || '',
      items: recvItems
    });

    // 2. Adjust item quantities in stock and update cost/unit prices
    for (const line of cart.items) {
      const item = await Item.findById(line.id);
      if (item) {
        // Update stock quantity (positive quantity received, increases stock)
        const qtyObj = item.quantities.find(q => q.location_id === location_id);
        if (qtyObj) {
          qtyObj.quantity += line.quantity;
        } else {
          item.quantities.push({ location_id, quantity: line.quantity });
        }

        // Update item catalog prices to match the receiving prices
        item.cost_price = line.cost_price;
        item.unit_price = line.unit_price;

        await item.save();
      }
    }

    // Clear session recv_cart
    req.session.recv_cart = null;
    res.redirect(`/receivings/receipt/${receiving._id}`);
  } catch (err) {
    console.error(err);
    req.session.feedback = { type: 'danger', message: err.message };
    res.redirect('/receivings');
  }
};

// GET /receivings/receipt/:id
exports.getReceipt = async (req, res) => {
  try {
    const receiving = await Receiving.findById(req.params.id)
      .populate('supplier')
      .populate('employee')
      .populate('items.item');

    if (!receiving) {
      return res.redirect('/receivings');
    }

    res.render('receivings/receipt', { receiving });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};

// POST /receivings/cancel
exports.postCancel = (req, res) => {
  req.session.recv_cart = null;
  res.redirect('/receivings');
};

// GET /suppliers/suggest (lookup suppliers for auto-completing in register)
exports.getSuggestSuppliers = async (req, res) => {
  try {
    const search = req.query.term || '';
    const suppliers = await Supplier.find({
      deleted: false,
      $or: [
        { company_name: new RegExp(search, 'i') },
        { agency_name: new RegExp(search, 'i') },
        { last_name: new RegExp(search, 'i') }
      ]
    }).limit(10);
    const suggestions = suppliers.map(s => ({
      value: s._id,
      label: `${s.company_name} (${s.first_name} ${s.last_name})`
    }));
    res.json(suggestions);
  } catch (err) {
    console.error(err);
    res.json([]);
  }
};
