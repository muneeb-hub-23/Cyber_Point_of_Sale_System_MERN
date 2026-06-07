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
        // Atomically claim the document for deletion — prevents double-delete on retry
        const claimed = await Document.findOneAndUpdate(
            { _id: docid, status: { $in: ['processed', 'pending', 'open', 'draw'] } },
            { status: 'deleting' },
            { new: false }
        );
        if (!claimed) {
            // Already being deleted or doesn't exist
            const still = await Document.findById(docid);
            if (!still) return res.json({ success: true, message: 'Already deleted' });
            return res.status(409).json({ success: false, message: 'Document is already being deleted' });
        }

        const docEntries = await DocumentItem.find({ document: docid });

        // Reverse stock
        const productUpdates = [];
        if (['sale', 'stockreturn', 'loss'].includes(claimed.doctype)) {
            for (const entry of docEntries) {
                productUpdates.push({ updateOne: { filter: { _id: entry.product }, update: { $inc: { onHand: Number(entry.qty) } } } });
            }
        } else if (['refund', 'purchase'].includes(claimed.doctype)) {
            for (const entry of docEntries) {
                productUpdates.push({ updateOne: { filter: { _id: entry.product }, update: { $inc: { onHand: -Number(entry.qty) } } } });
            }
        }
        if (productUpdates.length) await Product.bulkWrite(productUpdates);

        // Reverse cash register entries
        const cashDeletes = claimed.payment.map(payment => ({
            deleteOne: { filter: { document: docid } }
        }));
        if (cashDeletes.length) await CashRegister.deleteMany({ document: docid });

        // Reverse customer balance and transaction
        const debit = claimed.payment.find(p => p.name === 'Debit');
        if (debit && claimed.customer) {
            const balanceAdj = ['sale', 'stockreturn', 'loss'].includes(claimed.doctype)
                ? parseFloat((-debit.amount).toFixed(2))
                : parseFloat((debit.amount).toFixed(2));
            await Customer.findByIdAndUpdate(claimed.customer, { $inc: { balance: balanceAdj } });
            if (claimed.transaction) await Transaction.findByIdAndDelete(claimed.transaction);

            // Recalculate shop totals
            const customersArray = await Customer.find({ linkedShop: claimed.linkedShop });
            let totalLeneHain = 0, totalDeneHain = 0;
            customersArray.forEach(c => {
                if (c.balance > 0) totalLeneHain += c.balance;
                else totalDeneHain += c.balance;
            });
            await Shop.findByIdAndUpdate(claimed.linkedShop, {
                lenehain: parseFloat(totalLeneHain.toFixed(2)),
                denehain: parseFloat(totalDeneHain.toFixed(2))
            });
        }

        // All reversals done — now safe to delete
        await DocumentItem.deleteMany({ document: docid });
        await Document.findByIdAndDelete(docid);

        res.json({ success: true, message: 'Document deleted successfully.' });
    } catch (error) {
        console.error('Error deleting document:', error);
        // Rollback status so it can be retried
        try {
            await Document.findOneAndUpdate(
                { _id: docid, status: 'deleting' },
                { status: 'processed' }
            );
        } catch (rb) { console.error('Rollback failed:', rb); }
        res.status(500).json({ success: false, message: error.message || 'An error occurred while deleting the document.' });
    }
});

module.exports = router;
