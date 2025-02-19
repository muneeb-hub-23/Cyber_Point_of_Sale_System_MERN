// routes/saleTypes.js
const express = require('express');
const SaleType = require('../../../models/SaleTypes'); // Adjust the path as necessary
const router = express.Router();

// Add Sale Type
router.post('/', async (req, res) => {
  try {
    const { name, shop, description } = req.body;

    // Validate input
    if (!name || !shop) {
      return res.status(400).json({ success: false, message: 'Name and shop are required' });
    }

    // Create new Sale Type
    const newSaleType = new SaleType({ name, shop, description });
    await newSaleType.save();

    res.status(201).json({ success: true, saleType: newSaleType });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

module.exports = router;
