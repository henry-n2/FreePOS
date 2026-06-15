const AppConfig = require('../models/AppConfig');
const StockLocation = require('../models/StockLocation');
const Employee = require('../models/Employee');

const seedDB = async () => {
  try {
    // 1. Seed default app configurations
    const defaultConfig = {
      address: '123 Nowhere street',
      company: 'FreePOS',
      default_tax_rate: '8',
      email: 'changeme@example.com',
      phone: '555-555-5555',
      return_policy: 'Test Return Policy',
      timezone: 'America/New_York',
      currency_symbol: '₹',
      dateformat: 'MM/DD/YYYY',
      timeformat: 'HH:mm:ss',
      theme: 'flatly',
      language: 'english',
      language_code: 'en'
    };

    for (const [key, value] of Object.entries(defaultConfig)) {
      const exists = await AppConfig.findOne({ key });
      if (!exists) {
        await AppConfig.create({ key, value });
        console.log(`Config seeded: ${key} = ${value}`);
      }
    }

    // Force override currency symbol to Rupees
    await AppConfig.findOneAndUpdate(
      { key: 'currency_symbol' },
      { value: '₹' },
      { upsert: true }
    );

    // 2. Seed default stock location
    const defaultLocation = await StockLocation.findOne({ location_id: 'stock' });
    if (!defaultLocation) {
      await StockLocation.create({
        location_id: 'stock',
        location_name: 'stock',
        deleted: false
      });
      console.log('Stock location seeded: stock');
    }

    // 3. Seed default admin employee
    const adminExists = await Employee.findOne({ username: 'admin' });
    if (!adminExists) {
      // Grants matching FreePOS defaults
      const grants = [
        { permission_id: 'config', menu_group: 'office' },
        { permission_id: 'customers', menu_group: 'home' },
        { permission_id: 'employees', menu_group: 'office' },
        { permission_id: 'giftcards', menu_group: 'home' },
        { permission_id: 'items', menu_group: 'home' },
        { permission_id: 'item_kits', menu_group: 'home' },
        { permission_id: 'messages', menu_group: 'home' },
        { permission_id: 'receivings', menu_group: 'home' },
        { permission_id: 'reports', menu_group: 'office' },
        { permission_id: 'sales', menu_group: 'home' },
        { permission_id: 'suppliers', menu_group: 'home' },
        { permission_id: 'expenses', menu_group: 'home' },
        { permission_id: 'expenses_categories', menu_group: 'office' }
      ];

      // Note: pre-save hook will hash 'pointofsale'
      await Employee.create({
        first_name: 'John',
        last_name: 'Doe',
        username: 'admin',
        password: 'pointofsale',
        email: 'changeme@example.com',
        phone_number: '555-555-5555',
        grants: grants
      });
      console.log('Admin user seeded: admin / pointofsale');
    }
  } catch (err) {
    console.error('Seeding error:', err.message);
  }
};

module.exports = seedDB;
