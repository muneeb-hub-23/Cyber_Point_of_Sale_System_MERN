const express = require('express');
const router = express.Router();
const Customer = require('../../models/Customer');

// Define the route for retrieving customers
router.get('/', async (req, res) => {
  try {
    // Ensure headers are present before accessing
    const shopId = req.headers.shopid;
    const customerType = req.headers.customertype;

    if (!shopId) {
      return res.status(400).json({ error: 'shopid is required' });
    }

    // Create query object to filter customers based on shop
    let query = { linkedShop: shopId };

    // Adjust query based on customerType
    if (customerType === "both") {
      // No additional filters needed, query already has linkedShop
    } else if (customerType === "customersOnly") {
      // Ensure we exclude suppliers (undefined or no value for customerType)
      query.customerType = { $ne: 'supplier' }; // Exclude 'supplier' type
    } else if (customerType === "suppliersOnly") {
      query.customerType = 'supplier'; // Only fetch suppliers
    } else {
      return res.status(400).json({ error: 'Invalid customertype value' });
    }

    // Fetch customers from the database
    const customers = await Customer.find(query);

    // Return the customers as JSON
    res.json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
