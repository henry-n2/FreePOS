const Employee = require('../models/Employee');

// GET /employees
exports.getManage = async (req, res) => {
  res.render('employees/manage');
};

// GET /employees/search
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
        { username: regex }
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortQuery = {};
    sortQuery[sort] = sortOrder;

    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
      .sort(sortQuery)
      .skip(offset)
      .limit(limit);

    const rows = employees.map(e => ({
      _id: e._id,
      person_id: e._id,
      first_name: e.first_name,
      last_name: e.last_name,
      email: e.email,
      phone_number: e.phone_number,
      username: e.username,
      role: e.role || 'cashier',
      buttons: `<a href="/employees/view/${e._id}" class="btn btn-xs btn-default modal-dlg" title="Update Employee"><i class="glyphicon glyphicon-edit"></i></a>`
    }));

    res.json({ total, rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// GET /employees/view/:id
exports.getView = async (req, res) => {
  try {
    const id = req.params.id;
    let employee = {};
    if (id !== '-1') {
      employee = await Employee.findById(id);
    }
    
    // List of all possible modules
    const allModules = [
      { id: 'customers', label: 'Customers' },
      { id: 'items', label: 'Items' },
      { id: 'item_kits', label: 'Item Kits' },
      { id: 'suppliers', label: 'Suppliers' },
      { id: 'reports', label: 'Reports' },
      { id: 'receivings', label: 'Receivings' },
      { id: 'sales', label: 'Sales' },
      { id: 'employees', label: 'Employees' },
      { id: 'giftcards', label: 'Gift Cards' },
      { id: 'expenses', label: 'Expenses' },
      { id: 'config', label: 'Settings' }
    ];

    res.render('employees/form', { employee, id, allModules });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};

// POST /employees/save/:id
exports.postSave = async (req, res) => {
  try {
    const id = req.params.id;
    
    // Parse grants from request checkboxes
    // Expecting req.body.permissions as an array of permission IDs, or single string
    let permissions = req.body.permissions || [];
    if (!Array.isArray(permissions)) {
      permissions = [permissions];
    }
    
    const grants = permissions.map(p => ({
      permission_id: p,
      menu_group: req.body[`menu_group_${p}`] || 'home'
    }));

    const employeeData = {
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
      username: req.body.username,
      role: req.body.role || 'cashier',
      grants: grants
    };

    // Password only updated if provided or if it's a new entry
    if (req.body.password) {
      employeeData.password = req.body.password;
    }

    if (id === '-1') {
      if (!req.body.password) {
        return res.json({ success: false, message: 'Password is required for new employees' });
      }
      
      // Check if username unique
      const exists = await Employee.findOne({ username: req.body.username, deleted: false });
      if (exists) {
        return res.json({ success: false, message: 'Username already exists' });
      }

      await Employee.create(employeeData);
      res.json({ success: true, message: 'Employee added successfully' });
    } else {
      // Find and update
      // Find employee to check if username matches
      const existing = await Employee.findOne({ username: req.body.username, _id: { $ne: id }, deleted: false });
      if (existing) {
        return res.json({ success: false, message: 'Username already exists' });
      }

      const emp = await Employee.findById(id);
      emp.first_name = employeeData.first_name;
      emp.last_name = employeeData.last_name;
      emp.gender = employeeData.gender;
      emp.email = employeeData.email;
      emp.phone_number = employeeData.phone_number;
      emp.address_1 = employeeData.address_1;
      emp.address_2 = employeeData.address_2;
      emp.city = employeeData.city;
      emp.state = employeeData.state;
      emp.zip = employeeData.zip;
      emp.country = employeeData.country;
      emp.comments = employeeData.comments;
      emp.username = employeeData.username;
      emp.role = employeeData.role;
      emp.grants = employeeData.grants;

      if (employeeData.password) {
        emp.password = employeeData.password; // pre-save will hash it
      }

      await emp.save();
      res.json({ success: true, message: 'Employee updated successfully' });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
};

// POST /employees/delete
exports.postDelete = async (req, res) => {
  try {
    const ids = req.body.ids;
    if (ids && ids.length > 0) {
      // Don't let employee delete themselves
      const currentEmployeeId = req.session.employeeId;
      if (ids.includes(currentEmployeeId)) {
        return res.json({ success: false, message: 'You cannot delete yourself!' });
      }

      await Employee.updateMany({ _id: { $in: ids } }, { deleted: true });
      res.json({ success: true, message: 'Selected employees deleted successfully' });
    } else {
      res.json({ success: false, message: 'No employees selected' });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
};
