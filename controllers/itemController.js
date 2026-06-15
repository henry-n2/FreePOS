const Item = require('../models/Item');
const Supplier = require('../models/Supplier');
const StockLocation = require('../models/StockLocation');

// GET /items
exports.getManage = async (req, res) => {
  res.render('items/manage');
};

// GET /items/search
exports.getSearch = async (req, res) => {
  try {
    const search = req.query.search || '';
    const limit = parseInt(req.query.limit) || 25;
    const offset = parseInt(req.query.offset) || 0;
    const sort = req.query.sort || 'name';
    const order = req.query.order || 'asc';

    let query = { deleted: false };
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { name: regex },
        { category: regex },
        { item_number: regex },
        { description: regex }
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortQuery = {};
    sortQuery[sort] = sortOrder;

    const total = await Item.countDocuments(query);
    const items = await Item.find(query)
      .populate('supplier')
      .sort(sortQuery)
      .skip(offset)
      .limit(limit);

    const rows = items.map(item => {
      // Calculate total quantity across all locations
      const totalQty = item.quantities.reduce((sum, q) => sum + (q.quantity || 0), 0);
      const imgTag = item.pic_filename 
        ? `<img src="/uploads/${item.pic_filename}" style="width: 32px; height: 32px; object-fit: cover; border-radius: 4px; margin-right: 8px; vertical-align: middle;">` 
        : `<div style="width: 32px; height: 32px; background: #eee; border-radius: 4px; display: inline-block; margin-right: 8px; vertical-align: middle; text-align: center; line-height: 32px; color: #aaa;"><i class="glyphicon glyphicon-picture"></i></div>`;
      return {
        _id: item._id,
        item_id: item._id,
        name: `<div style="display: inline-block; vertical-align: middle;">${imgTag} <span style="vertical-align: middle; margin-left: 5px;">${item.name}</span></div>`,
        category: item.category,
        item_number: item.item_number || '',
        cost_price: item.cost_price,
        unit_price: item.unit_price,
        reorder_level: item.reorder_level,
        quantity: totalQty,
        supplier_name: item.supplier ? item.supplier.company_name : 'None',
        buttons: `
          <a href="/items/view/${item._id}" class="btn btn-xs btn-default modal-dlg" title="Update Item"><i class="glyphicon glyphicon-edit"></i></a>
          <a href="/items/inventory/${item._id}" class="btn btn-xs btn-default modal-dlg" title="Adjust Stock"><i class="glyphicon glyphicon-tasks"></i></a>
        `
      };
    });

    res.json({ total, rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// GET /items/view/:id
exports.getView = async (req, res) => {
  try {
    const id = req.params.id;
    let item = { taxes: [], quantities: [] };
    if (id !== '-1') {
      item = await Item.findById(id);
    }

    const suppliers = await Supplier.find({ deleted: false });
    const locations = await StockLocation.find({ deleted: false });

    res.render('items/form', { item, id, suppliers, locations });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};

// POST /items/save/:id
exports.postSave = async (req, res) => {
  try {
    const id = req.params.id;
    const locations = await StockLocation.find({ deleted: false });

    // Parse quantities per location from post data
    const quantities = locations.map(loc => ({
      location_id: loc.location_id,
      quantity: parseFloat(req.body[`qty_${loc.location_id}`]) || 0
    }));

    // Parse taxes
    const taxes = [];
    if (req.body.tax_names && req.body.tax_percents) {
      const names = Array.isArray(req.body.tax_names) ? req.body.tax_names : [req.body.tax_names];
      const percents = Array.isArray(req.body.tax_percents) ? req.body.tax_percents : [req.body.tax_percents];
      for (let i = 0; i < names.length; i++) {
        if (names[i] && percents[i]) {
          taxes.push({ name: names[i], percent: parseFloat(percents[i]) || 0 });
        }
      }
    }

    const itemData = {
      name: req.body.name,
      category: req.body.category,
      supplier: req.body.supplier || null,
      item_number: req.body.item_number || undefined,
      description: req.body.description,
      cost_price: parseFloat(req.body.cost_price) || 0,
      unit_price: parseFloat(req.body.unit_price) || 0,
      reorder_level: parseFloat(req.body.reorder_level) || 0,
      receiving_quantity: parseFloat(req.body.receiving_quantity) || 1,
      allow_alt_description: req.body.allow_alt_description === '1',
      is_serialized: req.body.is_serialized === '1',
      custom: {
        custom1: req.body.custom1 || '',
        custom2: req.body.custom2 || '',
        custom3: req.body.custom3 || '',
        custom4: req.body.custom4 || '',
        custom5: req.body.custom5 || '',
        custom6: req.body.custom6 || '',
        custom7: req.body.custom7 || '',
        custom8: req.body.custom8 || '',
        custom9: req.body.custom9 || '',
        custom10: req.body.custom10 || ''
      },
      taxes,
      quantities
    };

    if (req.file) {
      itemData.pic_filename = req.file.filename;
    }

    if (id === '-1') {
      await Item.create(itemData);
      res.json({ success: true, message: 'Item added successfully' });
    } else {
      await Item.findByIdAndUpdate(id, itemData);
      res.json({ success: true, message: 'Item updated successfully' });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
};

// POST /items/delete
exports.postDelete = async (req, res) => {
  try {
    const ids = req.body.ids;
    if (ids && ids.length > 0) {
      await Item.updateMany({ _id: { $in: ids } }, { deleted: true });
      res.json({ success: true, message: 'Selected items deleted successfully' });
    } else {
      res.json({ success: false, message: 'No items selected' });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
};

// GET /items/inventory/:id (Adjust Stock dialog)
exports.getInventory = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    const locations = await StockLocation.find({ deleted: false });
    res.render('items/inventory', { item, locations });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};

// POST /items/inventory/:id (Save Stock adjustment)
exports.postInventory = async (req, res) => {
  try {
    const id = req.params.id;
    const location_id = req.body.location_id;
    const quantity = parseFloat(req.body.quantity) || 0; // delta or absolute

    const item = await Item.findById(id);
    if (!item) {
      return res.json({ success: false, message: 'Item not found' });
    }

    // Update quantity for location
    const qtyObj = item.quantities.find(q => q.location_id === location_id);
    if (qtyObj) {
      if (req.body.mode === 'add') {
        qtyObj.quantity += quantity;
      } else {
        qtyObj.quantity = quantity;
      }
    } else {
      item.quantities.push({ location_id, quantity });
    }

    await item.save();
    res.json({ success: true, message: 'Inventory adjusted successfully' });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
};

// GET /items/suggest (autocomplete for sales register)
exports.getSuggest = async (req, res) => {
  try {
    const search = req.query.term || '';
    const query = {
      deleted: false,
      $or: [
        { name: new RegExp(search, 'i') },
        { item_number: new RegExp(search, 'i') },
        { category: new RegExp(search, 'i') }
      ]
    };
    const items = await Item.find(query).limit(10);
    const suggestions = items.map(item => ({
      value: item._id,
      label: `${item.name} (${item.item_number || 'No SKU'}) - Price: ₹${item.unit_price}`,
      name: item.name,
      unit_price: item.unit_price,
      cost_price: item.cost_price,
      taxes: item.taxes,
      is_serialized: item.is_serialized
    }));
    res.json(suggestions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// GET /items/export
exports.getExport = async (req, res) => {
  try {
    const items = await Item.find({ deleted: false });
    
    // Build CSV content
    let csv = 'Item Name,Category,UPC/EAN/SKU,Description,Cost Price,Unit Price,Reorder Level\n';
    items.forEach(item => {
      const name = `"${(item.name || '').replace(/"/g, '""')}"`;
      const category = `"${(item.category || '').replace(/"/g, '""')}"`;
      const item_number = `"${(item.item_number || '').replace(/"/g, '""')}"`;
      const description = `"${(item.description || '').replace(/"/g, '""')}"`;
      csv += `${name},${category},${item_number},${description},${item.cost_price},${item.unit_price},${item.reorder_level}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=items_export.csv');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};

// POST /items/import
exports.postImport = async (req, res) => {
  if (!req.file) {
    return res.json({ success: false, message: 'No file uploaded' });
  }

  const fs = require('fs');
  const filePath = req.file.path;

  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.split(/\r?\n/);
    if (lines.length <= 1) {
      return res.json({ success: false, message: 'CSV file is empty' });
    }

    let importCount = 0;
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple comma split for CSV
      const cols = line.split(',');
      if (cols.length < 2) continue;

      const clean = (val) => {
        if (!val) return '';
        val = val.trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        }
        return val.replace(/""/g, '"');
      };

      const name = clean(cols[0]);
      const category = clean(cols[1]);
      const item_number = clean(cols[2]) || undefined;
      const description = clean(cols[3]);
      const cost_price = parseFloat(clean(cols[4])) || 0;
      const unit_price = parseFloat(clean(cols[5])) || 0;
      const reorder_level = parseFloat(clean(cols[6])) || 0;

      if (!name || !category) continue;

      let item = null;
      if (item_number) {
        item = await Item.findOne({ item_number, deleted: false });
      }

      const itemData = {
        name,
        category,
        item_number,
        description,
        cost_price,
        unit_price,
        reorder_level
      };

      if (item) {
        await Item.findByIdAndUpdate(item._id, itemData);
      } else {
        await Item.create(itemData);
      }
      importCount++;
    }

    fs.unlinkSync(filePath);
    res.json({ success: true, message: `${importCount} products imported successfully` });
  } catch (err) {
    console.error(err);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.json({ success: false, message: err.message });
  }
};

// GET /items/bulk_barcodes
exports.getBulkBarcodes = async (req, res) => {
  try {
    let ids = req.query.ids;
    if (!ids) {
      return res.redirect('/items');
    }
    if (typeof ids === 'string') {
      ids = ids.split(',');
    }
    
    const items = await Item.find({ _id: { $in: ids }, deleted: false });
    res.render('items/barcode_sheet', { items });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};
