const express = require('express');
const router = express.Router();
const Document = require('../../models/Documents');
const DocumentItem = require('../../models/DocumentItem');
const CashRegister = require('../../models/CashRegister');
const Customer = require('../../models/Customer');
const Transaction = require('../../models/Transaction');
const Shop = require('../../models/Shop');
const Product = require('../../models/Product');

router.post('/', async (req, res) => {
    const { docid } = req.headers;

    try {
        // Atomically claim the document for reversal — prevents double-reversal on retry
        const thisdoc = await Document.findOneAndUpdate(
            { _id: docid, status: { $in: ['processed', 'pending', 'open', 'draw'] } },
            { status: 'reversing' },
            { new: false }
        );
        if (!thisdoc) {
            const still = await Document.findById(docid);
            if (still && still.status === 'reversing') {
                return res.status(409).json({ success: false, message: 'Document is already being reversed' });
            }
            return res.status(404).json({ success: false, message: 'Document not found or already reversed' });
        }

        const docEntries = await DocumentItem.find({ document: docid });

        // Reverse stock
        const productUpdates = [];
        if (['sale', 'stockreturn', 'loss'].includes(thisdoc.doctype)) {
            for (const entry of docEntries) {
                productUpdates.push({ updateOne: { filter: { _id: entry.product }, update: { $inc: { onHand: Number(entry.qty) } } } });
            }
        } else if (['refund', 'purchase'].includes(thisdoc.doctype)) {
            for (const entry of docEntries) {
                productUpdates.push({ updateOne: { filter: { _id: entry.product }, update: { $inc: { onHand: -Number(entry.qty) } } } });
            }
        }
        if (productUpdates.length) await Product.bulkWrite(productUpdates);

        // Reverse cash register entries
        await CashRegister.deleteMany({ document: docid });

        // Reverse customer balance and transaction
        const debit = thisdoc.payment.find(p => p.name === 'Debit');
        if (debit && thisdoc.customer) {
            const balanceAdjustment = ['sale', 'stockreturn', 'loss'].includes(thisdoc.doctype)
                ? -parseFloat(debit.amount.toFixed(2))
                : parseFloat(debit.amount.toFixed(2));
            await Customer.findByIdAndUpdate(thisdoc.customer, { $inc: { balance: balanceAdjustment } });
            if (thisdoc.transaction) await Transaction.findByIdAndDelete(thisdoc.transaction);
        }

        // Recalculate shop totals
        const customersArray = await Customer.find({ linkedShop: thisdoc.linkedShop });
        let totalLeneHain = 0, totalDeneHain = 0;
        customersArray.forEach(c => {
            if (c.balance > 0) totalLeneHain += c.balance;
            else totalDeneHain += c.balance;
        });
        await Shop.findByIdAndUpdate(thisdoc.linkedShop, {
            lenehain: parseFloat(totalLeneHain.toFixed(2)),
            denehain: parseFloat(totalDeneHain.toFixed(2))
        });

        // All reversals done — delete original and recreate as pending
        await DocumentItem.deleteMany({ document: docid });
        await Document.findByIdAndDelete(docid);

        const newDocument = new Document({
            doctype: thisdoc.doctype,
            user: thisdoc.user.toString(),
            status: 'pending',
            date: thisdoc.date,
            time: thisdoc.time,
            customer: thisdoc.customer ? thisdoc.customer.toString() : undefined,
            customerGroup: thisdoc.customerGroup ? thisdoc.customerGroup.toString() : undefined,
            linkedShop: thisdoc.linkedShop.toString(),
            subtotal: thisdoc.subtotal,
            discount: thisdoc.discount,
            totalamount: thisdoc.totalamount,
            payment: thisdoc.payment,
            amountpaid: thisdoc.amountpaid,
            count: thisdoc.count,
        });
        await newDocument.save();

        const newDocumentItems = docEntries.map(entry => ({
            document: newDocument._id,
            productData: entry.productData,
            product: entry.product,
            cost: entry.cost,
            expense: entry.expense,
            costExpense: entry.costExpense,
            tax: entry.tax,
            discount: entry.discount,
            sale: entry.sale,
            qty: entry.qty,
            costamount: entry.costamount,
            finalprice: entry.finalprice,
            saleamount: entry.saleamount,
            user: entry.user,
        }));
        await DocumentItem.insertMany(newDocumentItems);

        res.json({ success: true, message: 'Document reversed successfully.' });
    } catch (error) {
        console.error('Error reversing document:', error);
        // Rollback status so it can be retried
        try {
            await Document.findOneAndUpdate(
                { _id: docid, status: 'reversing' },
                { status: 'processed' }
            );
        } catch (rb) { console.error('Rollback failed:', rb); }
        res.status(500).json({ success: false, message: error.message || 'An error occurred while reversing the document.' });
    }
});

module.exports = router;
