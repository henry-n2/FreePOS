const mongoose = require('mongoose');
const Item = require('../models/Item');
const ItemKit = require('../models/ItemKit');
const Customer = require('../models/Customer');
const Giftcard = require('../models/Giftcard');
const Sale = require('../models/Sale');
const StockLocation = require('../models/StockLocation');

// GET /sales (Register UI)
exports.getRegister = async (req, res) => {
  // Initialize session cart if not exists
  if (!req.session.cart) {
    req.session.cart = {
      items: [],     // { id, name, unit_price, cost_price, quantity, discount_percent, description, serialnumber, is_serialized, taxes, is_kit, is_giftcard }
      customer_id: null,
      payments: [],  // { payment_type, payment_amount }
      comment: '',
      invoice_number: ''
    };
  }

  try {
    const locations = await StockLocation.find({ deleted: false });
    const activeLocation = req.session.activeLocation || 'stock';

    // Fetch customer details if set
    let customer = null;
    if (req.session.cart.customer_id) {
      customer = await Customer.findById(req.session.cart.customer_id);
    }

    // Calculations
    const cart = req.session.cart;
    let subtotal = 0;
    let taxTotal = 0;
    
    cart.items.forEach(item => {
      const price = item.unit_price;
      const qty = item.quantity;
      const disc = item.discount_percent || 0;
      const itemSub = price * qty * (1 - disc / 100);
      subtotal += itemSub;

      // Item taxes
      const itemTaxes = item.taxes || [];
      itemTaxes.forEach(t => {
        taxTotal += itemSub * (t.percent / 100);
      });
    });

    const total = subtotal + taxTotal;
    const totalPayments = cart.payments.reduce((sum, p) => sum + p.payment_amount, 0);
    const amountDue = total - totalPayments;

    const items = await Item.find({ deleted: false });

    res.render('sales/register', {
      cart,
      customer,
      subtotal,
      taxTotal,
      total,
      totalPayments,
      amountDue,
      locations,
      activeLocation,
      items,
      feedback: req.session.feedback || null
    });
    
    // Clear feedback
    req.session.feedback = null;
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};

// POST /sales/add (Add item/kit/giftcard to cart)
exports.postAddItem = async (req, res) => {
  const item_id = req.body.item_id;
  const quantity = parseFloat(req.body.quantity) || 1;
  const cart = req.session.cart;

  try {
    const isValidObjectId = mongoose.Types.ObjectId.isValid(item_id);

    // 1. Check if it is a Giftcard
    let giftcard = null;
    if (isValidObjectId) {
      giftcard = await Giftcard.findById(item_id).populate('customer');
    }
    if (!giftcard) {
      giftcard = await Giftcard.findOne({ giftcard_number: item_id, deleted: false }).populate('customer');
    }

    if (giftcard) {
      cart.items.push({
        id: giftcard._id,
        name: `Giftcard #${giftcard.giftcard_number}`,
        unit_price: giftcard.value,
        cost_price: 0,
        quantity: 1,
        discount_percent: 0,
        description: '',
        serialnumber: '',
        is_serialized: false,
        taxes: [],
        is_giftcard: true
      });
      return res.redirect('/sales');
    }

    // 2. Check if Item Kit
    let kit = null;
    if (isValidObjectId) {
      kit = await ItemKit.findById(item_id).populate('items.item');
    }
    if (!kit) {
      kit = await ItemKit.findOne({ item_kit_number: item_id, deleted: false }).populate('items.item');
    }

    if (kit) {
      // Add kit items to cart or add kit as a single item
      // In FreePOS, item kits are added as individual components or custom item kit line
      // For this port, we will add the item kit as a single line item, calculating components total
      let kitCost = 0;
      let kitPrice = 0;
      kit.items.forEach(ki => {
        if (ki.item) {
          kitCost += ki.item.cost_price * ki.quantity;
          kitPrice += ki.item.unit_price * ki.quantity;
        }
      });

      cart.items.push({
        id: kit._id,
        name: kit.name,
        unit_price: kitPrice,
        cost_price: kitCost,
        quantity: 1,
        discount_percent: 0,
        description: kit.description,
        serialnumber: '',
        is_serialized: false,
        taxes: [],
        is_kit: true
      });
      return res.redirect('/sales');
    }

    // 3. Check if Item
    let item = null;
    if (isValidObjectId) {
      item = await Item.findById(item_id);
    }
    if (!item) {
      item = await Item.findOne({ item_number: item_id, deleted: false });
    }

    if (item) {
      // Check if already in cart
      const existing = cart.items.find(i => i.id.toString() === item._id.toString() && !i.is_kit && !i.is_giftcard);
      if (existing && !item.is_serialized) {
        existing.quantity += quantity;
      } else {
        cart.items.push({
          id: item._id,
          name: item.name,
          unit_price: item.unit_price,
          cost_price: item.cost_price,
          quantity: quantity,
          discount_percent: 0,
          description: item.description,
          serialnumber: '',
          is_serialized: item.is_serialized,
          taxes: item.taxes || [],
          is_kit: false,
          is_giftcard: false
        });
      }
      return res.redirect('/sales');
    }

    req.session.feedback = { type: 'danger', message: 'Item, Kit, or Gift Card not found' };
    res.redirect('/sales');
  } catch (err) {
    console.error(err);
    res.redirect('/sales');
  }
};

// POST /sales/edit_item/:index (Edit line details)
exports.postEditItem = (req, res) => {
  const index = parseInt(req.params.index);
  const cart = req.session.cart;

  if (cart && cart.items[index]) {
    cart.items[index].quantity = parseFloat(req.body.quantity) || 1;
    cart.items[index].unit_price = parseFloat(req.body.unit_price) || 0;
    cart.items[index].discount_percent = parseFloat(req.body.discount_percent) || 0;
    cart.items[index].serialnumber = req.body.serialnumber || '';
    cart.items[index].description = req.body.description || '';
  }
  res.redirect('/sales');
};

// GET /sales/delete_item/:index (Delete line)
exports.getDeleteItem = (req, res) => {
  const index = parseInt(req.params.index);
  const cart = req.session.cart;

  if (cart && cart.items[index]) {
    cart.items.splice(index, 1);
  }
  res.redirect('/sales');
};

// POST /sales/select_customer
exports.postSelectCustomer = async (req, res) => {
  const customer_id = req.body.customer_id;
  try {
    let customer = null;
    if (customer_id && mongoose.Types.ObjectId.isValid(customer_id)) {
      customer = await Customer.findById(customer_id);
    }
    if (!customer && customer_id) {
      customer = await Customer.findOne({ account_number: customer_id, deleted: false });
    }

    if (customer) {
      req.session.cart.customer_id = customer._id;
      // Auto apply customer discount if any
      if (customer.discount_percent) {
        req.session.cart.items.forEach(item => {
          item.discount_percent = customer.discount_percent;
        });
      }
    }
    res.redirect('/sales');
  } catch (err) {
    console.error(err);
    res.redirect('/sales');
  }
};

// GET /sales/remove_customer
exports.getRemoveCustomer = (req, res) => {
  if (req.session.cart) {
    req.session.cart.customer_id = null;
  }
  res.redirect('/sales');
};

// POST /sales/add_payment
exports.postAddPayment = (req, res) => {
  const cart = req.session.cart;
  const payment_type = req.body.payment_type;
  const payment_amount = parseFloat(req.body.payment_amount) || 0;

  if (cart && payment_amount > 0) {
    cart.payments.push({ payment_type, payment_amount });
  }
  res.redirect('/sales');
};

// GET /sales/delete_payment/:index
exports.getDeletePayment = (req, res) => {
  const index = parseInt(req.params.index);
  const cart = req.session.cart;

  if (cart && cart.payments[index]) {
    cart.payments.splice(index, 1);
  }
  res.redirect('/sales');
};

// POST /sales/location (change stock register location)
exports.postLocation = (req, res) => {
  req.session.activeLocation = req.body.location_id;
  res.redirect('/sales');
};

// POST /sales/cancel (Clear register)
exports.postCancel = (req, res) => {
  req.session.cart = null;
  res.redirect('/sales');
};

// POST /sales/suspend (Save suspended sale)
exports.postSuspend = async (req, res) => {
  const cart = req.session.cart;
  if (!cart || cart.items.length === 0) {
    req.session.feedback = { type: 'danger', message: 'Cart is empty' };
    return res.redirect('/sales');
  }

  try {
    // Generate simple invoice number if empty
    const invoice_number = cart.invoice_number || `SUSP-${Date.now()}`;
    const location_id = req.session.activeLocation || 'stock';

    // Map items
    const saleItems = cart.items.map(item => ({
      item: item.id,
      quantity_purchased: item.quantity,
      item_cost_price: item.cost_price,
      item_unit_price: item.unit_price,
      discount_percent: item.discount_percent,
      description: item.description,
      serialnumber: item.serialnumber,
      location_id: location_id
    }));

    await Sale.create({
      customer: cart.customer_id || null,
      employee: req.session.employeeId,
      comment: req.body.comment || '',
      invoice_number,
      payments: cart.payments,
      items: saleItems,
      suspended: true
    });

    req.session.cart = null;
    req.session.feedback = { type: 'success', message: 'Sale suspended successfully' };
    res.redirect('/sales');
  } catch (err) {
    console.error(err);
    req.session.feedback = { type: 'danger', message: err.message };
    res.redirect('/sales');
  }
};

// GET /sales/suspended (Suspended list page)
exports.getSuspendedList = async (req, res) => {
  try {
    const sales = await Sale.find({ suspended: true }).populate('customer').populate('employee');
    res.render('sales/suspended', { sales });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};

// GET /sales/unsuspend/:id (Load back into cart)
exports.getUnsuspend = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('items.item');
    if (!sale) {
      return res.redirect('/sales');
    }

    // Populate session cart from database sale
    req.session.cart = {
      items: sale.items.map(item => ({
        id: item.item._id,
        name: item.item.name,
        unit_price: item.item_unit_price,
        cost_price: item.item_cost_price,
        quantity: item.quantity_purchased,
        discount_percent: item.discount_percent,
        description: item.description,
        serialnumber: item.serialnumber,
        is_serialized: item.item.is_serialized,
        taxes: item.item.taxes || [],
        is_kit: false,
        is_giftcard: false
      })),
      customer_id: sale.customer,
      payments: sale.payments,
      comment: sale.comment,
      invoice_number: sale.invoice_number
    };

    // Remove from suspended DB sale
    await Sale.findByIdAndDelete(req.params.id);
    res.redirect('/sales');
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};

// POST /sales/complete (Finalize transaction)
exports.postComplete = async (req, res) => {
  const cart = req.session.cart;
  if (!cart || cart.items.length === 0) {
    req.session.feedback = { type: 'danger', message: 'Cart is empty' };
    return res.redirect('/sales');
  }

  try {
    const location_id = req.session.activeLocation || 'stock';
    const invoice_number = cart.invoice_number || `INV-${Date.now()}`;

    // Map items
    const saleItems = cart.items.map(item => ({
      item: item.id,
      quantity_purchased: item.quantity,
      item_cost_price: item.cost_price,
      item_unit_price: item.unit_price,
      discount_percent: item.discount_percent,
      description: item.description,
      serialnumber: item.serialnumber,
      location_id: location_id
    }));

    // Re-calculate global taxes
    const saleTaxes = [];
    cart.items.forEach(item => {
      item.taxes.forEach(t => {
        const existingTax = saleTaxes.find(st => st.name === t.name);
        if (existingTax) {
          existingTax.percent += t.percent; // simple aggregation for simplicity
        } else {
          saleTaxes.push({ name: t.name, percent: t.percent });
        }
      });
    });

    // 1. Save Sale to database
    const sale = await Sale.create({
      customer: cart.customer_id || null,
      employee: req.session.employeeId,
      comment: req.body.comment || '',
      invoice_number,
      payments: cart.payments,
      items: saleItems,
      taxes: saleTaxes,
      suspended: false
    });

    // 2. Adjust item quantities & update reward points
    for (const line of cart.items) {
      if (line.is_giftcard) {
        // Reduce value of giftcard
        await Giftcard.findByIdAndUpdate(line.id, { $inc: { value: -line.quantity } });
      } else if (line.is_kit) {
        // Kit stock adjustment
        const kit = await ItemKit.findById(line.id).populate('items.item');
        if (kit) {
          for (const ki of kit.items) {
            const item = await Item.findById(ki.item._id);
            if (item) {
              const qtyObj = item.quantities.find(q => q.location_id === location_id);
              if (qtyObj) {
                qtyObj.quantity -= ki.quantity * line.quantity;
              }
              await item.save();
            }
          }
        }
      } else {
        // Standard item stock adjustment
        const item = await Item.findById(line.id);
        if (item) {
          const qtyObj = item.quantities.find(q => q.location_id === location_id);
          if (qtyObj) {
            qtyObj.quantity -= line.quantity;
          }
          await item.save();
        }
      }
    }

    // 3. Award customer points (e.g. 1 point per ₹10 spent)
    if (cart.customer_id) {
      const totalCost = cart.items.reduce((sum, item) => sum + (item.unit_price * item.quantity * (1 - item.discount_percent / 100)), 0);
      const pointsEarned = Math.floor(totalCost / 10);
      await Customer.findByIdAndUpdate(cart.customer_id, { $inc: { points: pointsEarned } });
    }

    // Clear session cart
    req.session.cart = null;
    res.redirect(`/sales/receipt/${sale._id}`);
  } catch (err) {
    console.error(err);
    req.session.feedback = { type: 'danger', message: err.message };
    res.redirect('/sales');
  }
};

// GET /sales/receipt/:id
exports.getReceipt = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('customer')
      .populate('employee')
      .populate('items.item');

    if (!sale) {
      return res.redirect('/sales');
    }

    res.render('sales/receipt', { sale });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};

// GET /sales/invoice/:id
exports.getInvoice = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('customer')
      .populate('employee')
      .populate('items.item');

    if (!sale) {
      return res.redirect('/sales');
    }

    res.render('sales/invoice', { sale });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};

// POST /sales/quick_add_customer
exports.postQuickAddCustomer = async (req, res) => {
  try {
    const { first_name, last_name, phone_number, email, company_name } = req.body;
    if (!first_name || !last_name) {
      req.session.feedback = { type: 'danger', message: 'First Name and Last Name are required' };
      return res.redirect('/sales');
    }
    const newCust = await Customer.create({
      first_name,
      last_name,
      phone_number: phone_number || '',
      email: email || '',
      company_name: company_name || '',
      account_number: 'CUST-' + Date.now()
    });
    
    // Auto-select customer for session cart
    if (!req.session.cart) {
      req.session.cart = {
        items: [],
        customer_id: null,
        payments: [],
        comment: '',
        invoice_number: ''
      };
    }
    req.session.cart.customer_id = newCust._id;
    
    req.session.feedback = { type: 'success', message: `Customer ${first_name} ${last_name} added successfully` };
    res.redirect('/sales');
  } catch (err) {
    console.error(err);
    req.session.feedback = { type: 'danger', message: err.message };
    res.redirect('/sales');
  }
};
