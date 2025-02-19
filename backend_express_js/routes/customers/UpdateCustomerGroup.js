const express = require('express');
const router = express.Router();
const CustomerGroup = require('../../models/CustomerGroup');

// PUT route to update a customer group by its ID
router.put('/:id', async (req, res) => {
  const { id } = req.params; // Get the group ID from the URL parameter
  const { customerName, customerMobileNumber, ids } = req.body; // Extract updated data from request body
  try {
    // Find the customer group by ID and update it
    const updatedGroup = await CustomerGroup.findByIdAndUpdate(
      id,
      {
        customerName,
        customerMobileNumber,
        ids
      },
      { new: true } // Return the updated document after the update
    ).populate('ids.customerID').populate('ids.shopID'); // Populate related fields

    // If no group is found, return an error message
    if (!updatedGroup) {
      return res.json({ success: false, error: 'Customer group not found' });
    }

    // Return the updated customer group
    res.json({ success: true, data: updatedGroup });
  } catch (error) {
    // Handle any errors that occur during the update process
    console.error('Error updating customer group:', error);
    res.json({ success: false, error: 'Failed to update customer group' });
  }
});

module.exports = router;
