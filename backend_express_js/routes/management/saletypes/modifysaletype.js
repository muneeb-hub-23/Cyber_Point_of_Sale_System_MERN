// routes/saleTypes.js
const express = require('express');
const SaleType = require('../../../models/SaleTypes'); // Adjust the path as necessary
const router = express.Router();

// Modify Sale Type
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params; // Get the sale type ID from the URL parameters
    const { name, shop, description } = req.body; // Destructure the body

    // Validate input
    if (!name && !shop && !description) {
      return res.status(400).json({ success: false, message: 'At least one field is required to update' });
    }

    // Find and update the Sale Type
    const updatedSaleType = await SaleType.findByIdAndUpdate(
      id,
      { name, shop, description },
      { new: true, runValidators: true } // Return the updated document and run validators
    );

    if (!updatedSaleType) {
      return res.status(404).json({ success: false, message: 'Sale type not found' });
    }

    res.status(200).json({ success: true, saleType: updatedSaleType });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

module.exports = router;
