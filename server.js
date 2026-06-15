require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const connectDB = require('./config/db');
const seedDB = require('./config/seeder');
const AppConfig = require('./models/AppConfig');
const Employee = require('./models/Employee');

const app = express();

// Connect to Database
connectDB().then(() => {
  // Seed Database
  seedDB();
});

// Configure EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express Session Middleware with MongoDB Store
app.use(session({
  secret: process.env.SESSION_SECRET || 'freepos_secret_key_123456',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/freepos',
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Static Folders
app.use(express.static(path.join(__dirname, 'public')));
// Re-use original assets from upper directory if needed, or define local ones
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Helper middleware to make config and user details available in views
app.use(async (req, res, next) => {
  try {
    // 1. Fetch all configurations
    const configs = await AppConfig.find({});
    const configMap = {};
    configs.forEach(c => {
      configMap[c.key] = c.value;
    });
    res.locals.config = configMap;

    // 2. Fetch logged in user info
    if (req.session && req.session.employeeId) {
      const employee = await Employee.findById(req.session.employeeId);
      if (employee && !employee.deleted) {
        res.locals.user = employee;
        // Make list of allowed modules
        res.locals.allowed_modules = employee.grants || [];
      } else {
        req.session.employeeId = null;
        res.locals.user = null;
        res.locals.allowed_modules = [];
      }
    } else {
      res.locals.user = null;
      res.locals.allowed_modules = [];
    }

    // 3. Helper function for translation keys or fallback to humanized key
    res.locals.lang = (key, defaultText = '') => {
      // For this port, we will translate common ones, else return the key formatted
      const translations = {
        'Common.powered_by': 'Powered by',
        'Login.logout': 'Logout',
        'Employees.change_password': 'Change Password',
        'Common.submit': 'Submit',
        'Module.config': 'Configuration',
        'Module.customers': 'Customers',
        'Module.employees': 'Employees',
        'Module.giftcards': 'Gift Cards',
        'Module.items': 'Items',
        'Module.item_kits': 'Item Kits',
        'Module.messages': 'Messages',
        'Module.receivings': 'Receivings',
        'Module.reports': 'Reports',
        'Module.sales': 'Sales',
        'Module.suppliers': 'Suppliers',
        'Module.expenses': 'Expenses',
        'Module.expenses_categories': 'Expense Categories',
        // Menu item titles
        'module_config': 'Configuration',
        'module_customers': 'Customers',
        'module_employees': 'Employees',
        'module_giftcards': 'Gift Cards',
        'module_items': 'Items',
        'module_item_kits': 'Item Kits',
        'module_messages': 'Messages',
        'module_receivings': 'Receivings',
        'module_reports': 'Reports',
        'module_sales': 'Sales',
        'module_suppliers': 'Suppliers',
        'module_expenses': 'Expenses',
        'module_expenses_categories': 'Expenses Categories'
      };
      return translations[key] || defaultText || key.split('.').pop().replace(/_/g, ' ');
    };

    next();
  } catch (err) {
    next(err);
  }
});

// Authentication Guard Middleware
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.employeeId) {
    return res.redirect('/login');
  }
  next();
};

// Authorization Guard Middleware for specific permissions
const requirePermission = (permissionId) => {
  return (req, res, next) => {
    if (!res.locals.user) {
      return res.redirect('/login');
    }
    // Admin (first created employee or checking permissions array)
    const grants = res.locals.user.grants || [];
    const hasGrant = grants.some(g => g.permission_id === permissionId);
    
    // Grant admin total access, check permission, or check role-based defaults (cashier and manager have access to sales)
    if (res.locals.user.username === 'admin' || res.locals.user.role === 'admin' || hasGrant) {
      return next();
    }
    if (permissionId === 'sales' && (res.locals.user.role === 'cashier' || res.locals.user.role === 'manager')) {
      return next();
    }
    res.redirect('/no-access');
  };
};

// Import Routes
const authRoutes = require('./routes/auth');
const indexRoutes = require('./routes/index');
const customerRoutes = require('./routes/customers');
const employeeRoutes = require('./routes/employees');
const itemRoutes = require('./routes/items');
const itemKitRoutes = require('./routes/itemKits');
const supplierRoutes = require('./routes/suppliers');
const giftcardRoutes = require('./routes/giftcards');
const expenseRoutes = require('./routes/expenses');
const saleRoutes = require('./routes/sales');
const receivingRoutes = require('./routes/receivings');
const reportRoutes = require('./routes/reports');
const configRoutes = require('./routes/config');

// Use Routes
app.use('/', authRoutes);
app.use('/', requireAuth, indexRoutes);
app.use('/customers', requireAuth, requirePermission('customers'), customerRoutes);
app.use('/employees', requireAuth, requirePermission('employees'), employeeRoutes);
app.use('/items', requireAuth, requirePermission('items'), itemRoutes);
app.use('/item_kits', requireAuth, requirePermission('item_kits'), itemKitRoutes);
app.use('/suppliers', requireAuth, requirePermission('suppliers'), supplierRoutes);
app.use('/giftcards', requireAuth, requirePermission('giftcards'), giftcardRoutes);
app.use('/expenses', requireAuth, requirePermission('expenses'), expenseRoutes);
app.use('/sales', requireAuth, requirePermission('sales'), saleRoutes);
app.use('/receivings', requireAuth, requirePermission('receivings'), receivingRoutes);
app.use('/reports', requireAuth, requirePermission('reports'), reportRoutes);
app.use('/config', requireAuth, requirePermission('config'), configRoutes);

// Page Not Found / Error Handling
app.use((req, res) => {
  res.status(404).render('no_access', { message: 'Page Not Found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('no_access', { message: err.message || 'Internal Server Error' });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
