const express = require('express');
const router = express.Router();
const db = require('../../../db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*,
              cat.id AS catId, cat.name AS catName,
              sup.id AS supId, sup.customerName AS supName,
              sh.id AS shId, sh.shopName AS shName
       FROM products p
       LEFT JOIN categories cat ON cat.id = p.category
       LEFT JOIN customers sup ON sup.id = p.suplier
       LEFT JOIN shops sh ON sh.id = p.shop`
    )
    const products = rows.map(r => {
      if (typeof r.markup === 'string') try { r.markup = JSON.parse(r.markup) } catch (_) {}
      if (typeof r.tax === 'string') try { r.tax = JSON.parse(r.tax) } catch (_) {}
      if (typeof r.picture === 'string') try { r.picture = JSON.parse(r.picture) } catch (_) {}
      r._id = r.id
      r.category = r.catId ? { _id: r.catId, id: r.catId, name: r.catName } : null
      r.suplier = r.supId ? { _id: r.supId, id: r.supId, customerName: r.supName } : null
      r.shop = r.shId ? { _id: r.shId, id: r.shId, shopName: r.shName } : null
      return r
    })
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

module.exports = router;
