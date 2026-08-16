const express = require('express');
const router = express.Router();
const CustomerGroup = require('../../models/CustomerGroup');

router.get('/', async (req, res) => {
//   const { users } = req.body;

  try {
    // Create a new customer group using the users data
    let data = await CustomerGroup.find()   // ids (with customerID + shopID) are auto-populated by the model

    // Send a success response if the group is created successfully
    res.json({ success: true, data });
  } catch (error) {
    // Handle any errors that occur during the process
    console.error('Error creating customer group:', error);
    res.json({ success: false, error: 'Failed to create customer group' });
  }
});

module.exports = router;
