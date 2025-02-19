const express = require('express');
const router = express.Router();
const CustomerGroup = require('../../models/CustomerGroup');

// DELETE route to delete a customer group
router.delete('/:id', async (req, res) => {
  const { id } = req.params; // Get the group ID from the URL parameter

  try {
    // Find the customer group by ID and delete it
    const deletedGroup = await CustomerGroup.deleteOne({ _id: id });

    // If no group is found, return an error
    if (deletedGroup.deletedCount === 0) {
      return res.json({ success: false, error: 'Customer group not found' });
    }

    // Send a success response if the deletion was successful
    res.json({ success: true, message: 'Customer group deleted successfully' });
  } catch (error) {
    // Handle any errors that occur during the deletion process
    console.error('Error deleting customer group:', error);
    res.json({ success: false, error: 'Failed to delete customer group' });
  }
});

module.exports = router;
