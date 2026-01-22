const express = require('express');
const router = express.Router();
const Customer = require('../../models/Customer');
const Transaction = require('../../models/Transaction');
const moment = require('moment');

router.get('/', async (req, res) => {
    try {
        // Find customers with non-zero balance for the given shop
        const customers = await Customer.find({ 
            linkedShop: req.headers.shopid,
            balance: { $ne: 0 }  // Only include customers with non-zero balance
        });

        // Get the last transaction for each customer using createdAt timestamp
        const customerData = await Promise.all(customers.map(async (customer) => {
            const lastTransaction = await Transaction.findOne({ 
                'currentCustomer._id': customer._id.toString()
            }).sort({ createdAt: -1 });

            return {
                customer: {
                    ...customer._doc,
                    // Use the balance field directly
                    currentBalance: customer.balance
                },
                lastTransaction: lastTransaction || null,
                lastTransactionDate: lastTransaction ? new Date(lastTransaction.createdAt) : null
            };
        }));

        // Filter customers whose last transaction is more than 30 days old
        const thirtyDaysAgo = moment().subtract(30, 'days').startOf('day');
        const filteredCustomers = customerData.filter(data => {
            // If no transaction, include if they have balance
            if (!data.lastTransactionDate) return true;
            
            // Include if last transaction is older than 30 days
            return moment(data.lastTransactionDate).isBefore(thirtyDaysAgo);
        });

        // Sort by last transaction date (oldest first) and then by balance (highest first)
        filteredCustomers.sort((a, b) => {
            // Handle customers without transactions (put them at the end)
            if (!a.lastTransactionDate && !b.lastTransactionDate) {
                return Math.abs(b.customer.currentBalance) - Math.abs(a.customer.currentBalance);
            }
            if (!a.lastTransactionDate) return 1;
            if (!b.lastTransactionDate) return -1;
            
            // Sort by date first (oldest first)
            const dateDiff = a.lastTransactionDate - b.lastTransactionDate;
            if (dateDiff !== 0) return dateDiff;
            
            // If same date, sort by absolute balance (highest first)
            return Math.abs(b.customer.currentBalance) - Math.abs(a.customer.currentBalance);
        });

        res.json(filteredCustomers);

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
