const express = require('express');
const router = express.Router();

// GET /
router.get('/', (req, res) => {
  if (res.locals.user && res.locals.user.role === 'cashier') {
    return res.redirect('/sales');
  }
  res.render('home');
});

// GET /no-access
router.get('/no-access', (req, res) => {
  res.render('no_access', { message: 'You do not have permission to access this module.' });
});

module.exports = router;
