// routes/saleTypes.js
const express = require('express');
const SaleType = require('../../../models/SaleTypes'); // Adjust the path as necessary
const router = express.Router();

// Delete Sale Type
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params; // Get the sale type ID from the URL parameters

    // Find and delete the Sale Type
    const deletedSaleType = await SaleType.findByIdAndDelete(id);

    if (!deletedSaleType) {
      return res.status(404).json({ success: false, message: 'Sale type not found' });
    }

    res.status(200).json({ success: true, message: 'Sale type deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error', error });
  }
});

module.exports = router;
