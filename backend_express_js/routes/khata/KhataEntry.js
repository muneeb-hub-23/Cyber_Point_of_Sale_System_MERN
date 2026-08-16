const express = require('express')
const router = express.Router()
const db = require('../../db')
const Customer = require('../../models/Customer')
const Shop = require('../../models/Shop')
const Transaction = require('../../models/Transaction')
const History = require('../../models/History')
const CashRegister = require('../../models/CashRegister')

router.post('/', async (req, res) => {
    try {
        let { currentCustomer, amount, trnsType, user, transactionType, method, date, transactionCollectedFrom } = req.body
        amount = Number(amount)

        if (!currentCustomer || !(currentCustomer._id || currentCustomer.id) || !trnsType || !amount || !method) {
            return res.status(400).json({ success: false, error: 'Missing required fields' })
        }

        const customerId = currentCustomer._id || currentCustomer.id

        // Read-only checks before opening transaction
        const check = await Customer.findById(customerId)
        if (!check) return res.status(404).json({ success: false, error: 'Customer not found' })
        const shop = await Shop.findById(currentCustomer.linkedShop)
        if (!shop) return res.status(404).json({ success: false, error: 'Shop not found' })

        const oldBalance = check.balance
        const newBalance = trnsType === 'plus' ? oldBalance + amount : oldBalance - amount

        const transaction = await db.withTransaction(async (conn) => {
            await History.save({ shopName: shop.shopName, lenehain: shop.lenehain, denehain: shop.denehain }, conn)
            await Customer.findByIdAndUpdate(customerId, { balance: newBalance }, conn)

            const savedTrn = await Transaction.save({
                ...req.body,
                currentCustomer: { ...currentCustomer, _id: customerId },
                amount, oldBalance, newBalance,
            }, conn)

            await CashRegister.save({
                user, customer: customerId, date,
                type: transactionType, amount,
                shop: currentCustomer.linkedShop, method, transactionCollectedFrom,
            }, conn)

            const customersArray = await Customer.find({ linkedShop: shop.id }, conn)
            let totalLeneHain = 0, totalDeneHain = 0
            customersArray.forEach(c => { if (c.balance > 0) totalLeneHain += c.balance; else totalDeneHain += c.balance })
            await Shop.findByIdAndUpdate(currentCustomer.linkedShop, {
                lenehain: totalLeneHain,
                denehain: totalDeneHain,
                customers: customersArray.length,
            }, conn)

            return savedTrn
        })

        res.json({ success: true, transaction })
    } catch (err) {
        console.error('Transaction error:', err)
        res.status(500).json({ success: false, error: err.message })
    }
})

module.exports = router
