const express = require('express')
const router = express.Router()
const Transaction = require('../../models/Transaction')
const Customer = require('../../models/Customer')
const Shop = require('../../models/Shop')

router.delete('/', async (req, res) => {
    try {
        const { tid } = req.headers
        if (!tid) {
            return res.status(400).json({ success: false, message: "Transaction ID is required" })
        }

        // Fetch the transaction
        const thisTransaction = await Transaction.findById(tid)
        if (!thisTransaction) {
            return res.status(404).json({ success: false, message: "Transaction not found" })
        }

        // Fetch related customer and shop
        const thisCustomer = await Customer.findById(thisTransaction.currentCustomer._id)
        const thisShop = await Shop.findById(thisCustomer.linkedShop)

        if (!thisCustomer || !thisShop) {
            return res.status(404).json({ success: false, message: "Customer or shop not found" })
        }

        const { amount, trnsType } = thisTransaction

        // Revert transaction based on type
        if (trnsType === "plus") {
            await Customer.findByIdAndUpdate(thisCustomer._id, { balance: thisCustomer.balance - amount })
        } else if (trnsType === "minus") {
            await Customer.findByIdAndUpdate(thisCustomer._id, { balance: thisCustomer.balance + amount })
        }

        // Update the shop's leneHain and deneHain after reversion
        const updatedCustomers = await Customer.find({ linkedShop: thisShop._id })
        let totalLeneHain = 0
        let totalDeneHain = 0
        updatedCustomers.forEach(customer => {
            if (customer.balance > 0) {
                totalLeneHain += customer.balance
            } else {
                totalDeneHain += Math.abs(customer.balance)  // Convert to positive
            }
        })

        await Shop.findByIdAndUpdate(thisShop._id, {
            lenehain: totalLeneHain,
            denehain: totalDeneHain
        })

        // Delete the transaction
        await Transaction.deleteOne({ _id: tid })

        res.json({ success: true, message: "Transaction reversed and deleted" })
    } catch (err) {
        console.error("Error during transaction reversal:", err)
        res.status(500).json({ success: false, message: "An error occurred during transaction reversal" })
    }
})

module.exports = router
