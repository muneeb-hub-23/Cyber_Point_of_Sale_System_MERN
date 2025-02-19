const express = require('express');
const router = express.Router();
const Transaction = require('../../models/Transaction');

// Define the route to fetch transactions with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;  // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 10;  // Default to 10 items per page if not provided
    const skip = (page - 1) * limit;  // Calculate the number of documents to skip

    // Fetch transactions with pagination, sorted by most recent first
    const transactions = await Transaction.find({ "currentCustomer.linkedShop": req.headers.shopid })
      .skip(skip)
      .limit(limit)
      .sort({ date: -1 });  // Sort by date in descending order (latest first)

    // Send the transactions as a JSON response
    res.json(transactions.reverse());
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).send('Server error');
  }
});

module.exports = router;
