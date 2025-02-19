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
    let debit;
    try {
        // Find the document and its associated items
        const thisdoc = await Document.findById(docid);
        const docEntries = await DocumentItem.find({ document: docid });

        // Delete the original document and items
        await Document.findByIdAndDelete(docid);
        await DocumentItem.deleteMany({ document: docid });

        // Prepare arrays for bulk update
        const productUpdates = [];
        const cashRegisterDeletes = [];
        const customerBalanceUpdates = [];

        if (['sale', 'stockreturn', 'loss'].includes(thisdoc.doctype)) {
            // Prepare product quantity updates for sale/stockreturn/loss
            for (const entry of docEntries) {
                productUpdates.push({
                    updateOne: {
                        filter: { _id: entry.product },
                        update: { $inc: { onHand: Number(entry.qty) } }
                    }
                });
            }
        } else if (['refund', 'purchase'].includes(thisdoc.doctype)) {
            // Prepare product quantity updates for refund/purchase
            for (const entry of docEntries) {
                productUpdates.push({
                    updateOne: {
                        filter: { _id: entry.product },
                        update: { $inc: { onHand: -Number(entry.qty) } }
                    }
                });
            }
        }

        // Prepare CashRegister deletion operations
        for (let payment of thisdoc.payment) {
            if (payment.name === 'Debit') {
                // Store debit payment for later balance adjustment
                debit = payment;
            }
            cashRegisterDeletes.push({
                deleteOne: {
                    filter: { date: thisdoc.date, amount: payment.amount, method: payment.name }
                }
            });
        }

        // If debit exists, adjust customer balance and delete transaction
        if (debit) {
            const balanceAdjustment = ['sale', 'stockreturn', 'loss'].includes(thisdoc.doctype)
                ? -parseFloat(debit.amount.toFixed(2))
                : parseFloat(debit.amount.toFixed(2));

            customerBalanceUpdates.push({
                updateOne: {
                    filter: { _id: thisdoc.customer },
                    update: { $inc: { balance: balanceAdjustment } }
                }
            });

            // Delete associated transaction
            await Transaction.findByIdAndDelete(thisdoc.transaction);
        }

        // Perform bulk operations for Product, CashRegister, and Customer
        if (productUpdates.length) await Product.bulkWrite(productUpdates);
        if (cashRegisterDeletes.length) await CashRegister.bulkWrite(cashRegisterDeletes);
        if (customerBalanceUpdates.length) await Customer.bulkWrite(customerBalanceUpdates);

        // Recalculate shop totals (LeneHain and DeneHain)
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

        // Create the new document and document items
        let newDocument = new Document({
            doctype: thisdoc.doctype,
            user: thisdoc.user.toString(),
            status: "pending",
            date: thisdoc.date,
            time: thisdoc.time,
            customer: thisdoc.customer ? thisdoc.customer.toString() : undefined,
            customerGroup  : thisdoc.customerGroup ? thisdoc.customerGroup.toString() : undefined,
            linkedShop: thisdoc.linkedShop.toString(),
            subtotal: thisdoc.subtotal,
            discount: thisdoc.discount,
            totalamount: thisdoc.totalamount,
            payment: thisdoc.payment,
            amountpaid: thisdoc.amountpaid,
            count: thisdoc.count,
        });

        await newDocument.save();

        // Prepare bulk document items insertion
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

        // Insert all document items in one bulk operation
        await DocumentItem.insertMany(newDocumentItems);

        res.json({ success: true, message: "Document Reversed successfully." });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ success: false, message: 'An error occurred while deleting the document.' });
    }
});

module.exports = router;
