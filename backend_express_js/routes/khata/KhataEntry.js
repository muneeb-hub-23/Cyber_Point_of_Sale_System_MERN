const express = require('express');
const router = express.Router();
const Customer = require('../../models/Customer');
const Shop = require('../../models/Shop');
const Transaction = require('../../models/Transaction');
const History = require('../../models/History');
const CashRegister = require('../../models/CashRegister')

router.post('/', async (req, res) => {
    try {
        let { currentCustomer, amount, trnsType,user, transactionType,method,date,transactionCollectedFrom } = req.body;
        amount = Number(amount); // Ensure amount is treated as a number

        const check = await Customer.findById(currentCustomer._id);
        const shop = await Shop.findById(currentCustomer.linkedShop);

        // Save history before the transaction
        const { shopName, lenehain, denehain } = shop;
        const newHistory = new History({ shopName, lenehain, denehain });
        await newHistory.save();
        let newEntry = new CashRegister({
            user,
            customer:currentCustomer._id,
            date,
            type:transactionType,
            amount,
            shop:currentCustomer.linkedShop,
            method,
            transactionCollectedFrom
        })
        await newEntry.save()
        if (trnsType === 'plus') {

            await Customer.findByIdAndUpdate(currentCustomer._id, { balance: check.balance+amount });
            req.body.oldBalance = check.balance;
            req.body.newBalance = check.balance+amount;

        } else if (trnsType === 'minus') {

            await Customer.findByIdAndUpdate(currentCustomer._id, { balance: check.balance-amount });
            req.body.oldBalance = check.balance;
            req.body.newBalance = check.balance-amount;

        }

        const transaction = new Transaction(req.body);
        await transaction.save();

        // Update shop's leneHain and deneHain
        const customersArray = await Customer.find({ linkedShop: shop._id });
        let totalLeneHain = 0;
        let totalDeneHain = 0;
        customersArray.forEach(customer => {
           if(customer.balance>0){
            totalLeneHain+= customer.balance
           }else{
            totalDeneHain+= customer.balance
           }
        });
        await Shop.findByIdAndUpdate(currentCustomer.linkedShop, {
            lenehain: totalLeneHain,
            denehain: totalDeneHain,
            customers: customersArray.length
        });

        // Respond with success
        res.send({ success: true, transaction });
    } catch (err) {
        console.error('Transaction error:', err);
        res.send({ success: false, error: err.message });
    }
});

module.exports = router;
