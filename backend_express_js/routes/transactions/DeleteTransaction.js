const express = require('express')
const router = express.Router()
const Transaction = require('../../models/Transaction')
const Customer = require('../../models/Customer')
const Shop = require('../../models/Shop')
const CashRegister = require('../../models/CashRegister')

router.delete('/', async (req, res) => {
    try {
        const { tid } = req.headers
        if (!tid) {
            return res.status(400).json({ success: false, message: "Transaction ID is required" })
        }

        // Atomically claim the transaction — prevents double-delete on retry/double-click
        const thisTransaction = await Transaction.findOneAndUpdate(
            { _id: tid, deleting: { $ne: true } },
            { deleting: true },
            { new: false }
        )
        if (!thisTransaction) {
            const still = await Transaction.findById(tid)
            if (!still) return res.json({ success: true, message: "Already deleted" })
            return res.status(409).json({ success: false, message: "Transaction is already being deleted" })
        }

        // Fetch related customer and shop
        const thisCustomer = await Customer.findById(thisTransaction.currentCustomer._id)
        const thisShop = thisCustomer ? await Shop.findById(thisCustomer.linkedShop) : null

        if (!thisCustomer || !thisShop) {
            await Transaction.findByIdAndUpdate(tid, { deleting: false })
            return res.status(404).json({ success: false, message: "Customer or shop not found" })
        }

        const { amount, trnsType } = thisTransaction

        // Revert customer balance
        const balanceAdj = trnsType === 'plus' ? -amount : amount
        await Customer.findByIdAndUpdate(thisCustomer._id, { $inc: { balance: balanceAdj } })

        // Remove matching cash register entry created by khata entry
        await CashRegister.findOneAndDelete({ customer: thisCustomer._id, amount, date: thisTransaction.date })

        // Recalculate shop totals from live customer data
        const updatedCustomers = await Customer.find({ linkedShop: thisShop._id })
        let totalLeneHain = 0, totalDeneHain = 0
        updatedCustomers.forEach(c => {
            if (c.balance > 0) totalLeneHain += c.balance
            else totalDeneHain += c.balance
        })
        await Shop.findByIdAndUpdate(thisShop._id, {
            lenehain: totalLeneHain,
            denehain: totalDeneHain
        })

        // All reversals done — safe to delete
        await Transaction.deleteOne({ _id: tid })

        res.json({ success: true, message: "Transaction reversed and deleted" })
    } catch (err) {
        console.error("Error during transaction reversal:", err)
        // Rollback claim flag so it can be retried
        try { await Transaction.findByIdAndUpdate(req.headers.tid, { deleting: false }) } catch (_) {}
        res.status(500).json({ success: false, message: "An error occurred during transaction reversal" })
    }
})

module.exports = router
