// routes/saleTypes.js
const express = require('express');
const SaleType = require('../../../models/SaleTypes'); // Adjust the path as necessary
const router = express.Router();

// Get Sale Types by Shop ID
router.get('/', async (req, res) => {
  const { shop } = req.query; // Extract shopId from query parameters
  try {
    // Fetch sale types associated with the given shopId
    const saleTypes = await SaleType.find({ shop: shop }); // Assuming `shopId` is a field in your SaleType model

    // Send success response with the sale types
    res.status(200).json({ success: true, saleTypes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

module.exports = router;
