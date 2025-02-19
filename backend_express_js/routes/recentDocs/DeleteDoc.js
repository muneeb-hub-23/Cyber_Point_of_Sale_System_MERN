const express = require('express');
const router = express.Router();
const Document = require('../../models/Documents');
const DocumentItem = require('../../models/DocumentItem');
const CashRegister = require('../../models/CashRegister');
const Customer = require('../../models/Customer');
const Transaction = require('../../models/Transaction');
const Shop = require('../../models/Shop');
const Product = require('../../models/Product');

router.delete('/', async (req, res) => {
    const { docid } = req.headers;

    try {
        const thisdoc = await Document.findById(docid);
        const docEntries = await DocumentItem.find({ document: docid });

        await Document.findByIdAndDelete(docid);
        await DocumentItem.deleteMany({ document: docid });

        if (['sale', 'stockreturn', 'loss'].includes(thisdoc.doctype)) {
            for (const entry of docEntries) { // Fixed the loop to use 'for...of'
                await Product.findByIdAndUpdate(entry.product, { $inc: { onHand: Number(entry.qty) } });
            }
        } else if (['refund', 'purchase'].includes(thisdoc.doctype)) {
            for (const entry of docEntries) { // Fixed the loop to use 'for...of'
                await Product.findByIdAndUpdate(entry.product, { $inc: { onHand: -Number(entry.qty) } });
            }
        }

        let debit;
        for (let payment of thisdoc.payment) {
            if (payment.name === 'Debit') {
                debit = payment;
            }
            await CashRegister.findOneAndDelete({ date: thisdoc.date, amount: payment.amount, method: payment.name });
        }

        if (debit) {
            // Adjust customer's balance based on document type
            if (['sale', 'stockreturn', 'loss'].includes(thisdoc.doctype)) {
                await Customer.findByIdAndUpdate(thisdoc.customer, { $inc: { balance: parseFloat((-debit.amount).toFixed(2)) } });
            } else if (['refund', 'purchase'].includes(thisdoc.doctype)) {
                await Customer.findByIdAndUpdate(thisdoc.customer, { $inc: { balance: parseFloat((debit.amount).toFixed(2)) } });
            }

            // Delete associated transaction
            await Transaction.findByIdAndDelete(thisdoc.transaction);

            // Recalculate shop totals
            const customersArray = await Customer.find({ linkedShop: thisdoc.linkedShop });
            let totalLeneHain = 0;
            let totalDeneHain = 0;

            customersArray.forEach(customer => {
                if (customer.balance > 0) {
                    totalLeneHain += customer.balance;
                } else {
                    totalDeneHain += customer.balance;
                }
            });

            await Shop.findByIdAndUpdate(thisdoc.linkedShop, {
                lenehain: parseFloat(totalLeneHain.toFixed(2)),
                denehain: parseFloat(totalDeneHain.toFixed(2))
            });
        }

        res.json({ success: true, message: "Document deleted successfully." });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ success: false, message: 'An error occurred while deleting the document.' });
    }
});

module.exports = router;
