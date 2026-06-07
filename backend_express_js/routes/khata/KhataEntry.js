const express = require('express');
const router = express.Router();
const Customer = require('../../models/Customer');
const Shop = require('../../models/Shop');
const Transaction = require('../../models/Transaction');
const History = require('../../models/History');
const CashRegister = require('../../models/CashRegister')

router.post('/', async (req, res) => {
    try {
        let { currentCustomer, amount, trnsType, user, transactionType, method, date, transactionCollectedFrom } = req.body;
        amount = Number(amount);

        if (!currentCustomer || !currentCustomer._id || !trnsType || !amount || !method) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        // Read customer and shop first — no writes yet
        const check = await Customer.findById(currentCustomer._id);
        if (!check) return res.status(404).json({ success: false, error: 'Customer not found' });
        const shop = await Shop.findById(currentCustomer.linkedShop);
        if (!shop) return res.status(404).json({ success: false, error: 'Shop not found' });

        // Compute new balance before any writes
        const oldBalance = check.balance;
        const newBalance = trnsType === 'plus' ? oldBalance + amount : oldBalance - amount;

        // Save history snapshot
        const { shopName, lenehain, denehain } = shop;
        const newHistory = new History({ shopName, lenehain, denehain });
        await newHistory.save();

        // Update customer balance atomically
        await Customer.findByIdAndUpdate(currentCustomer._id, { balance: newBalance });

        // Save transaction record
        const transaction = new Transaction({
            ...req.body,
            amount,
            oldBalance,
            newBalance
        });
        await transaction.save();

        // Save cash register entry
        const newEntry = new CashRegister({
            user,
            customer: currentCustomer._id,
            date,
            type: transactionType,
            amount,
            shop: currentCustomer.linkedShop,
            method,
            transactionCollectedFrom
        });
        await newEntry.save();

        // Recalculate shop totals from live customer data
        const customersArray = await Customer.find({ linkedShop: shop._id });
        let totalLeneHain = 0, totalDeneHain = 0;
        customersArray.forEach(c => {
            if (c.balance > 0) totalLeneHain += c.balance;
            else totalDeneHain += c.balance;
        });
        await Shop.findByIdAndUpdate(currentCustomer.linkedShop, {
            lenehain: totalLeneHain,
            denehain: totalDeneHain,
            customers: customersArray.length
        });

        res.json({ success: true, transaction });
    } catch (err) {
        console.error('Transaction error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
