const express = require('express')
const router = express.Router()
const db = require('../../db')
const Transaction = require('../../models/Transaction')
const Customer = require('../../models/Customer')
const Shop = require('../../models/Shop')
const CashRegister = require('../../models/CashRegister')

router.delete('/', async (req, res) => {
    const { tid } = req.headers
    if (!tid) return res.status(400).json({ success: false, message: 'Transaction ID is required' })

    // Atomically claim the transaction to prevent double-delete
    const thisTransaction = await Transaction.findOneAndUpdate(
        { id: tid, deleting: { $ne: 1 } },
        { deleting: 1 }
    )
    if (!thisTransaction) {
        const still = await Transaction.findById(tid)
        if (!still) return res.json({ success: true, message: 'Already deleted' })
        return res.status(409).json({ success: false, message: 'Transaction is already being deleted' })
    }

    // Read-only lookups before opening transaction
    const currentCustomer = thisTransaction.currentCustomer
    const customerId = currentCustomer?._id || currentCustomer?.id || (typeof currentCustomer === 'string' ? currentCustomer : null)
    const thisCustomer = customerId ? await Customer.findById(customerId) : null
    const thisShop     = thisCustomer ? await Shop.findById(thisCustomer.linkedShop) : null

    if (!thisCustomer || !thisShop) {
        await Transaction.findByIdAndUpdate(tid, { deleting: 0 })
        return res.status(404).json({ success: false, message: 'Customer or shop not found' })
    }

    try {
        await db.withTransaction(async (conn) => {
            const { amount, trnsType } = thisTransaction
            const balanceAdj = trnsType === 'plus' ? -amount : amount
            await Customer.findByIdAndUpdate(thisCustomer.id, { $inc: { balance: balanceAdj } }, conn)
            await CashRegister.findOneAndDelete({ customer: thisCustomer.id, amount, date: thisTransaction.date }, conn)

            const updatedCustomers = await Customer.find({ linkedShop: thisShop.id }, conn)
            let totalLeneHain = 0, totalDeneHain = 0
            updatedCustomers.forEach(c => { if (c.balance > 0) totalLeneHain += c.balance; else totalDeneHain += c.balance })
            await Shop.findByIdAndUpdate(thisShop.id, { lenehain: totalLeneHain, denehain: totalDeneHain }, conn)

            await Transaction.deleteOne({ id: tid }, conn)
        })

        res.json({ success: true, message: 'Transaction reversed and deleted' })
    } catch (err) {
        console.error('Error during transaction reversal:', err)
        try { await Transaction.findByIdAndUpdate(tid, { deleting: 0 }) } catch (_) {}
        res.status(500).json({ success: false, message: 'An error occurred during transaction reversal' })
    }
})

module.exports = router
