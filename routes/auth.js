const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');

// GET /login
router.get('/login', (req, res) => {
  if (req.session && req.session.employeeId) {
    return res.redirect('/');
  }
  res.render('login', { error: null });
});

// POST /login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const employee = await Employee.findOne({ username, deleted: false });
    if (!employee) {
      return res.render('login', { error: 'Invalid username or password' });
    }

    const isMatch = await employee.comparePassword(password);
    if (!isMatch) {
      return res.render('login', { error: 'Invalid username or password' });
    }

    // Set session
    req.session.employeeId = employee._id;
    if (employee.role === 'cashier') {
      res.redirect('/sales');
    } else {
      res.redirect('/');
    }
  } catch (err) {
    console.error(err);
    res.render('login', { error: 'An error occurred during login' });
  }
});

// GET /logout
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
    }
    res.redirect('/login');
  });
});

module.exports = router;
