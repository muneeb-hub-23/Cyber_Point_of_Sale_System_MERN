const express = require('express');
const router = express.Router();
const db = require('../../db');

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const shopid = req.headers.shopid;

    const [transactions] = await db.query(
      `SELECT * FROM transactions
       WHERE JSON_UNQUOTE(JSON_EXTRACT(currentCustomer, '$.linkedShop')) = ?
       ORDER BY date DESC
       LIMIT ? OFFSET ?`,
      [shopid, limit, skip]
    )

    const parsed = transactions.map(t => {
      if (typeof t.currentCustomer === 'string') try { t.currentCustomer = JSON.parse(t.currentCustomer) } catch (_) {}
      t._id = t.id
      return t
    })

    res.json(parsed.reverse());
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).send('Server error');
  }
});

module.exports = router;
