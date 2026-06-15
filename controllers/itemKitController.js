const ItemKit = require('../models/ItemKit');
const Item = require('../models/Item');

// GET /item_kits
exports.getManage = async (req, res) => {
  res.render('item_kits/manage');
};

// GET /item_kits/search
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
        { item_kit_number: regex },
        { description: regex }
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortQuery = {};
    sortQuery[sort] = sortOrder;

    const total = await ItemKit.countDocuments(query);
    const kits = await ItemKit.find(query)
      .sort(sortQuery)
      .skip(offset)
      .limit(limit);

    const rows = kits.map(kit => ({
      _id: kit._id,
      item_kit_id: kit._id,
      name: kit.name,
      item_kit_number: kit.item_kit_number || '',
      description: kit.description,
      buttons: `<a href="/item_kits/view/${kit._id}" class="btn btn-xs btn-default modal-dlg" title="Update Item Kit"><i class="glyphicon glyphicon-edit"></i></a>`
    }));

    res.json({ total, rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// GET /item_kits/view/:id
exports.getView = async (req, res) => {
  try {
    const id = req.params.id;
    let kit = { items: [] };
    if (id !== '-1') {
      kit = await ItemKit.findById(id).populate('items.item');
    }
    res.render('item_kits/form', { kit, id });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};

// POST /item_kits/save/:id
exports.postSave = async (req, res) => {
  try {
    const id = req.params.id;

    // Parse items array
    const items = [];
    if (req.body.kit_item_ids && req.body.kit_item_qtys) {
      const ids = Array.isArray(req.body.kit_item_ids) ? req.body.kit_item_ids : [req.body.kit_item_ids];
      const qtys = Array.isArray(req.body.kit_item_qtys) ? req.body.kit_item_qtys : [req.body.kit_item_qtys];
      for (let i = 0; i < ids.length; i++) {
        if (ids[i] && qtys[i]) {
          items.push({ item: ids[i], quantity: parseFloat(qtys[i]) || 1 });
        }
      }
    }

    const kitData = {
      name: req.body.name,
      item_kit_number: req.body.item_kit_number || undefined,
      description: req.body.description,
      items
    };

    if (id === '-1') {
      await ItemKit.create(kitData);
      res.json({ success: true, message: 'Item Kit added successfully' });
    } else {
      await ItemKit.findByIdAndUpdate(id, kitData);
      res.json({ success: true, message: 'Item Kit updated successfully' });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
};

// POST /item_kits/delete
exports.postDelete = async (req, res) => {
  try {
    const ids = req.body.ids;
    if (ids && ids.length > 0) {
      await ItemKit.updateMany({ _id: { $in: ids } }, { deleted: true });
      res.json({ success: true, message: 'Selected item kits deleted successfully' });
    } else {
      res.json({ success: false, message: 'No item kits selected' });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
};

// GET /item_kits/suggest
exports.getSuggest = async (req, res) => {
  try {
    const search = req.query.term || '';
    const query = {
      deleted: false,
      $or: [
        { name: new RegExp(search, 'i') },
        { item_kit_number: new RegExp(search, 'i') }
      ]
    };
    const kits = await ItemKit.find(query).populate('items.item').limit(10);
    const suggestions = kits.map(kit => ({
      value: kit._id,
      label: `${kit.name} (${kit.item_kit_number || 'No SKU'}) [Kit]`,
      name: kit.name,
      is_kit: true,
      items: kit.items.map(ki => ({
        item: ki.item,
        quantity: ki.quantity
      }))
    }));
    res.json(suggestions);
  } catch (err) {
    console.error(err);
    res.json([]);
  }
};
