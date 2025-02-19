const express = require('express');
const router = express.Router();
const CustomerGroup = require('../../models/CustomerGroup');

router.post('/', async (req, res) => {
  const { users } = req.body;

  try {
    // Create a new customer group using the users data
    let newGroup = new CustomerGroup({
      customerName: users[0].customerName,
      customerMobileNumber: users[0].customerMobileNumber,
      customerType: users[0].customerType ? users[0].customerType : "customer",
      customerCnic: users[0].customerCnic,
      customerEmail: users[0].customerEmail,
      customerAddress: users[0].customerAddress,
      ids: users.map(u => ({ customerID: u._id.toString(), shopID: u.linkedShop.toString() })),
    });

    // Save the new group to the database
    await newGroup.save();

    // Send a success response if the group is created successfully
    res.json({ success: true });
  } catch (error) {
    // Handle any errors that occur during the process
    console.error('Error creating customer group:', error);
    res.json({ success: false, error: 'Failed to create customer group' });
  }
});

module.exports = router;
