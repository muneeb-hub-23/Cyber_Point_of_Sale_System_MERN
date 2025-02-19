const express = require('express');
const router = express.Router();
const Product = require('../../../models/Product'); // Assuming you have a Product model

// GET /api/products/:shopId
router.get('/', async (req, res) => {
  try {
    // Find products by shopId
    const products = await Product.find().populate('category').populate('suplier').populate('shop')
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error });
  }
});

module.exports = router;
