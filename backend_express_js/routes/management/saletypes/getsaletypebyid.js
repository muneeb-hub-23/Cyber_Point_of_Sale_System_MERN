// routes/saleTypes.js
const express = require('express');
const SaleType = require('../../../models/SaleTypes'); // Adjust the path as necessary
const router = express.Router();

// Get Sale Type by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params; // Extract saleTypeId from route parameters

  try {
    // Fetch the sale type with the given ID
    const saleType = await SaleType.findById(id);

    // Check if the sale type exists
    if (!saleType) {
      return res.status(404).json({ success: false, message: 'Sale type not found' });
    }

    // Send success response with the sale type
    res.status(200).json({ success: true, saleType });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

module.exports = router;
