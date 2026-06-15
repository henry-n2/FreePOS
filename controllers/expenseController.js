const Expense = require('../models/Expense');
const ExpenseCategory = require('../models/ExpenseCategory');

// GET /expenses
exports.getManage = async (req, res) => {
  res.render('expenses/manage');
};

// GET /expenses/search
exports.getSearch = async (req, res) => {
  try {
    const search = req.query.search || '';
    const limit = parseInt(req.query.limit) || 25;
    const offset = parseInt(req.query.offset) || 0;
    const sort = req.query.sort || 'date';
    const order = req.query.order || 'desc';

    let query = { deleted: false };
    if (search) {
      const regex = new RegExp(search, 'i');
      query.description = regex;
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortQuery = {};
    sortQuery[sort] = sortOrder;

    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .populate('category')
      .populate('employee')
      .sort(sortQuery)
      .skip(offset)
      .limit(limit);

    const rows = expenses.map(e => ({
      _id: e._id,
      expense_id: e._id,
      date: e.date.toLocaleDateString(),
      amount: e.amount,
      payment_type: e.payment_type,
      category_name: e.category ? e.category.name : 'Uncategorized',
      description: e.description,
      employee_name: e.employee ? `${e.employee.first_name} ${e.employee.last_name}` : 'Unknown',
      buttons: `<a href="/expenses/view/${e._id}" class="btn btn-xs btn-default modal-dlg" title="Update Expense"><i class="glyphicon glyphicon-edit"></i></a>`
    }));

    res.json({ total, rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// GET /expenses/view/:id
exports.getView = async (req, res) => {
  try {
    const id = req.params.id;
    let expense = {};
    if (id !== '-1') {
      expense = await Expense.findById(id);
    }
    const categories = await ExpenseCategory.find({ deleted: false });
    res.render('expenses/form', { expense, id, categories });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};

// POST /expenses/save/:id
exports.postSave = async (req, res) => {
  try {
    const id = req.params.id;
    const expenseData = {
      date: req.body.date ? new Date(req.body.date) : new Date(),
      amount: parseFloat(req.body.amount) || 0,
      payment_type: req.body.payment_type || 'Cash',
      category: req.body.category,
      description: req.body.description,
      employee: req.session.employeeId
    };

    if (id === '-1') {
      await Expense.create(expenseData);
      res.json({ success: true, message: 'Expense added successfully' });
    } else {
      await Expense.findByIdAndUpdate(id, expenseData);
      res.json({ success: true, message: 'Expense updated successfully' });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
};

// POST /expenses/delete
exports.postDelete = async (req, res) => {
  try {
    const ids = req.body.ids;
    if (ids && ids.length > 0) {
      await Expense.updateMany({ _id: { $in: ids } }, { deleted: true });
      res.json({ success: true, message: 'Selected expenses deleted successfully' });
    } else {
      res.json({ success: false, message: 'No expenses selected' });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
};

// GET /expenses/categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await ExpenseCategory.find({ deleted: false });
    res.render('expenses/categories', { categories });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};

// POST /expenses/categories/save/:id
exports.postSaveCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const catData = {
      name: req.body.name,
      description: req.body.description
    };

    if (id === '-1') {
      const exists = await ExpenseCategory.findOne({ name: req.body.name, deleted: false });
      if (exists) {
        return res.json({ success: false, message: 'Category name already exists' });
      }
      await ExpenseCategory.create(catData);
      res.json({ success: true, message: 'Category added successfully' });
    } else {
      await ExpenseCategory.findByIdAndUpdate(id, catData);
      res.json({ success: true, message: 'Category updated successfully' });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
};

// POST /expenses/categories/delete
exports.postDeleteCategory = async (req, res) => {
  try {
    const id = req.body.id;
    await ExpenseCategory.findByIdAndUpdate(id, { deleted: true });
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
};
