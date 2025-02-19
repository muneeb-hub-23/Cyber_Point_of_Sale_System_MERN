const express = require('express');
const router = express.Router();
const CustomerGroup = require('../../models/CustomerGroup');

// GET route to fetch a customer group by its ID
router.get('/:id', async (req, res) => {
  const { id } = req.params; // Get the group ID from the URL parameter

  try {
    // Find the customer group by ID and populate related fields
    const customerGroup = await CustomerGroup.findById(id)
      .populate('ids.customerID')   // Populate the customerID field
      .populate('ids.shopID');      // Populate the shopID field

    // If no group is found, return an error message
    if (!customerGroup) {
      return res.json({ success: false, error: 'Customer group not found' });
    }

    // Send the found customer group as the response
    res.json({ success: true, data: customerGroup });
  } catch (error) {
    // Handle any errors that occur during the process
    console.error('Error fetching customer group:', error);
    res.json({ success: false, error: 'Failed to fetch customer group' });
  }
});

module.exports = router;
