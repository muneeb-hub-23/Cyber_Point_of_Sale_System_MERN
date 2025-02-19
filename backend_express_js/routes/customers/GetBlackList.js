const express = require('express');
const router = express.Router();
const Customer = require('../../models/Customer');
const Transaction = require('../../models/Transaction');
const moment = require('moment'); // Import moment for date manipulation

router.get('/', async (req, res) => {
    console.log(req.headers)
    try {
        // Fetch all customers for the given shop
        let customers = await Customer.find({ linkedShop: req.headers.shopid });

        // Fetch the last transaction for each customer
        let customerData = await Promise.all(customers.map(async (customer) => {
            let lastTransaction = await Transaction.findOne({ "currentCustomer._id": customer._id })
                .sort({ date: -1 }); // Sort by date descending to get the latest transaction

            return {
                customer,
                lastTransaction: lastTransaction || {}, // If no transaction found, return an empty object
            };
        }));

        // Filter customers whose last transaction is more than 30 days old
        const thirtyDaysAgo = moment().subtract(30, 'days');
        customerData = customerData.filter(data => {
            const lastTransactionDate = data.lastTransaction.date 
                ? moment(data.lastTransaction.date, 'YYYYMMDD') 
                : null;
            
            // Only include customers if their last transaction is older than 30 days
            return !lastTransactionDate || lastTransactionDate.isBefore(thirtyDaysAgo);
        });

        // Sort customers based on the most recent transaction date
        customerData.sort((a, b) => {
            const aLastTransactionDate = a.lastTransaction.date ? moment(a.lastTransaction.date, 'YYYYMMDD') : moment().subtract(100, 'years'); // Set old default if no transaction
            const bLastTransactionDate = b.lastTransaction.date ? moment(b.lastTransaction.date, 'YYYYMMDD') : moment().subtract(100, 'years'); // Set old default if no transaction

            // Sort by most recent transaction (later date comes first)
            return bLastTransactionDate.diff(aLastTransactionDate);
        });

        // Send the sorted customer data
        res.json(customerData.reverse());

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
