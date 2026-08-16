const express = require('express');
const router = express.Router();
const Customer = require('../../models/Customer');
const Transaction = require('../../models/Transaction');
const moment = require('moment');

router.get('/', async (req, res) => {
    try {
        const customers = await Customer.find({ 
            linkedShop: req.headers.shopid,
            balance: { $ne: 0 }
        });

        const customerData = await Promise.all(customers.map(async (customer) => {
            const lastTransaction = await Transaction.findOne({ 
                'currentCustomer._id': customer.id.toString()
            });

            const balance = typeof customer.balance === 'number' ? customer.balance : 0;
            
            return {
                customer: {
                    ...customer,
                    _id: customer.id,
                    currentBalance: balance
                },
                lastTransaction: lastTransaction || null,
                lastTransactionDate: lastTransaction ? new Date(lastTransaction.createdAt) : null
            };
        }));

        const thirtyDaysAgo = moment().subtract(30, 'days').startOf('day');
        const filteredCustomers = customerData.filter(data => {
            if (!data.lastTransactionDate) return true;
            return moment(data.lastTransactionDate).isBefore(thirtyDaysAgo);
        });

        filteredCustomers.sort((a, b) => {
            if (!a.lastTransactionDate && !b.lastTransactionDate) {
                return Math.abs(b.customer.currentBalance) - Math.abs(a.customer.currentBalance);
            }
            if (!a.lastTransactionDate) return 1;
            if (!b.lastTransactionDate) return -1;
            const dateDiff = a.lastTransactionDate - b.lastTransactionDate;
            if (dateDiff !== 0) return dateDiff;
            return Math.abs(b.customer.currentBalance) - Math.abs(a.customer.currentBalance);
        });

        res.json(filteredCustomers);

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
