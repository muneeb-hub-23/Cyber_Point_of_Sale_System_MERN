const express = require('express')
const router = express.Router()
const db = require('../../../db')
const Document = require('../../../models/Documents')
const Customer = require('../../../models/Customer')
const Transaction = require('../../../models/Transaction')
const DocItems = require('../../../models/DocumentItem')
const { updateProductHistory, updateShopBalance, insertCashRegisterEntries } = require('./_helpers')

function formatDate3(timestamp) {
    const d = new Date(timestamp)
    return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`
}

router.post('/', async (req, res) => {
    let { paidamount, splitedPayments, totalSum, currentTime, user, customer, itemsList, selectedShop, selectedBill, total, date } = req.body

    if (!paidamount || !Array.isArray(itemsList) || itemsList.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid data provided.' })
    }

    const docId = selectedBill._id || selectedBill.id
    const fdate = formatDate3(date)

    const existingDoc = await Document.findById(docId)
    if (!existingDoc) return res.status(404).json({ success: false, message: 'Document not found' })
    if (existingDoc.status === 'processed') return res.json({ success: true, alreadyProcessed: true })

    const claimed = await Document.findOneAndUpdate(
        { id: docId, status: { $in: ['open', 'draw', 'pending'] } },
        { status: 'processing' }
    )
    if (!claimed) return res.status(409).json({ success: false, message: 'Document is already being processed or was already finalized' })

    try {
        paidamount = Number(paidamount)
        totalSum   = Number(totalSum)

        await db.withTransaction(async (conn) => {
            await updateProductHistory(itemsList, user, 1, 'refund', conn)

            let NewTransaction = null
            if (customer) {
                const customerId = customer._id || customer.id
                const debitPayment = splitedPayments.find(p => p.name === 'Debit')
                if (debitPayment) {
                    await Customer.findByIdAndUpdate(customerId, { $inc: { balance: -Number(debitPayment.amount) } }, conn)
                }
                const updatedCustomer = await Customer.findById(customerId, conn)
                const newBalance = Number(updatedCustomer.balance) - totalSum
                NewTransaction = await Transaction.save({
                    currentCustomer: customer,
                    date: fdate, transactionType: 'mallwapis', amount: totalSum,
                    trnsType: 'minus', oldBalance: Number(updatedCustomer.balance), newBalance,
                }, conn)
                await Customer.findByIdAndUpdate(customerId, { $inc: { balance: totalSum } }, conn)
            }

            const costexpense  = Number(total?.costexpense  || 0)
            const billDiscount = Number(total?.billDiscount || 0)
            await Document.findByIdAndUpdate(docId, {
                status: 'processed', date: fdate, time: currentTime,
                customer: customer ? (customer._id || customer.id) : null,
                subtotal: costexpense, discount: billDiscount,
                totalamount: costexpense - billDiscount,
                payment: splitedPayments, amountpaid: paidamount,
                ...(NewTransaction ? { transaction: NewTransaction.id } : {}),
            }, conn)

            await insertCashRegisterEntries(splitedPayments, selectedShop, customer ? (customer._id || customer.id) : null, fdate, user, 'Refund', docId, conn)
            await updateShopBalance(selectedShop, conn)
        })

        res.json({ success: true })
    } catch (error) {
        console.error('Error in FinalizeRefund:', error)
        try {
            await Document.findOneAndUpdate({ id: docId, status: 'processing' }, { status: 'pending' })
        } catch (rb) { console.error('Rollback failed:', rb) }
        res.status(500).json({ success: false, message: error.message })
    }
})

module.exports = router
