const Sale = require('../models/Sale');
const Item = require('../models/Item');
const Expense = require('../models/Expense');

// GET /reports
exports.getInput = (req, res) => {
  res.render('reports/input');
};

// GET /reports/generate
exports.getReport = async (req, res) => {
  const { report_type, date_range } = req.query;
  
  // Define date filters
  let startDate = new Date(0); // All time default
  let endDate = new Date();
  
  const today = new Date();
  if (date_range === 'today') {
    startDate = new Date(today.setHours(0,0,0,0));
  } else if (date_range === 'yesterday') {
    startDate = new Date(today.setDate(today.getDate() - 1));
    startDate.setHours(0,0,0,0);
    endDate = new Date(startDate);
    endDate.setHours(23,59,59,999);
  } else if (date_range === 'last7') {
    startDate = new Date(today.setDate(today.getDate() - 7));
  } else if (date_range === 'this_month') {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  }

  try {
    let reportData = {
      title: '',
      headers: [],
      rows: [],
      summary: {}
    };

    if (report_type === 'sales_summary') {
      reportData.title = 'Sales Summary Report';
      reportData.headers = ['Date', 'Subtotal', 'Tax', 'Total', 'Cost', 'Profit'];
      
      const sales = await Sale.find({
        suspended: false,
        sale_time: { $gte: startDate, $lte: endDate }
      }).populate('items.item');

      let subtotalTotal = 0;
      let taxTotal = 0;
      let costTotal = 0;

      // Group sales by Date
      const dateGroups = {};
      sales.forEach(sale => {
        const dateStr = sale.sale_time.toLocaleDateString();
        if (!dateGroups[dateStr]) {
          dateGroups[dateStr] = { subtotal: 0, tax: 0, cost: 0 };
        }

        sale.items.forEach(line => {
          const itemSub = line.item_unit_price * line.quantity_purchased * (1 - line.discount_percent / 100);
          const itemCost = line.item_cost_price * line.quantity_purchased;
          
          dateGroups[dateStr].subtotal += itemSub;
          dateGroups[dateStr].cost += itemCost;
          
          // Item tax accumulation
          const itemTaxes = (line.item && line.item.taxes) || [];
          itemTaxes.forEach(t => {
            dateGroups[dateStr].tax += itemSub * (t.percent / 100);
          });
        });
      });

      for (const [date, val] of Object.entries(dateGroups)) {
        const rowTotal = val.subtotal + val.tax;
        const profit = rowTotal - val.cost;
        
        subtotalTotal += val.subtotal;
        taxTotal += val.tax;
        costTotal += val.cost;

        reportData.rows.push([
          date,
          `$${val.subtotal.toFixed(2)}`,
          `$${val.tax.toFixed(2)}`,
          `$${rowTotal.toFixed(2)}`,
          `$${val.cost.toFixed(2)}`,
          `$${profit.toFixed(2)}`
        ]);
      }

      const totalAmount = subtotalTotal + taxTotal;
      reportData.summary = {
        'Total Subtotal': `$${subtotalTotal.toFixed(2)}`,
        'Total Tax': `$${taxTotal.toFixed(2)}`,
        'Total Sales': `$${totalAmount.toFixed(2)}`,
        'Total Cost': `$${costTotal.toFixed(2)}`,
        'Total Profit': `$${(totalAmount - costTotal).toFixed(2)}`
      };

    } else if (report_type === 'low_inventory') {
      reportData.title = 'Low Inventory Warnings';
      reportData.headers = ['Item Name', 'UPC/SKU', 'Reorder Level', 'Current Qty'];
      
      const items = await Item.find({ deleted: false });
      items.forEach(item => {
        const currentQty = item.quantities.reduce((sum, q) => sum + q.quantity, 0);
        if (currentQty <= item.reorder_level) {
          reportData.rows.push([
            item.name,
            item.item_number || 'None',
            item.reorder_level,
            currentQty
          ]);
        }
      });
      
      reportData.summary = {
        'Low Stock Items Count': reportData.rows.length
      };

    } else if (report_type === 'expenses') {
      reportData.title = 'Business Expenses Report';
      reportData.headers = ['Date', 'Category', 'Description', 'Amount', 'Payment Type'];
      
      const expenses = await Expense.find({
        deleted: false,
        date: { $gte: startDate, $lte: endDate }
      }).populate('category');

      let totalExpenses = 0;
      expenses.forEach(e => {
        totalExpenses += e.amount;
        reportData.rows.push([
          e.date.toLocaleDateString(),
          e.category ? e.category.name : 'Uncategorized',
          e.description,
          `$${e.amount.toFixed(2)}`,
          e.payment_type
        ]);
      });

      reportData.summary = {
        'Total Expenses': `$${totalExpenses.toFixed(2)}`
      };
    }

    res.render('reports/tabular', { reportData });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
};
