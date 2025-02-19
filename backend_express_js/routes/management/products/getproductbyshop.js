const express = require('express');
const router = express.Router();
const Product = require('../../../models/Product'); // Assuming you have a Product model
const mongoose = require('mongoose')
const {ObjectId} = mongoose.Types

// GET /api/products/:shopId
router.get('/', async (req, res) => {
  const { shop } = req.headers;
  try {
    // Find products by shopId
    const products = await Product.find({ shop: new ObjectId(shop) }).populate('category').populate('suplier')
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error });
  }
});

module.exports = router;
