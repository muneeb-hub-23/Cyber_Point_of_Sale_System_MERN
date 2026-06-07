const express = require('express');
const router = express.Router();
const CashRegister = require('../../../models/CashRegister');
const Document = require('../../../models/Documents');
const Customer = require('../../../models/Customer');
const Product = require('../../../models/Product');
const ProductHistory = require('../../../models/ProductHistory');
const Transaction = require('../../../models/Transaction');
const Shop = require('../../../models/Shop');
const DocItem= require('../../../models/DocumentItem')

router.post('/', async (req, res) => {
  function formatDate3(timestamp) {
    const date = new Date(timestamp);
  
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are zero-indexed
    const day = String(date.getUTCDate()).padStart(2, '0');
  
    return `${year}${month}${day}`;
  }
  try {
    let {
      paidamount,
      splitedPayments,
      totalSum,
      currentTime,
      user,
      customer,
      selectedShop,
      selectedBill,
      total,
      date
    } = req.body;
    let amountpaid = paidamount;
    let fdate = formatDate3(date);

    // --- Idempotency guard ---
    const existingDoc = await Document.findById(selectedBill._id)
    if (!existingDoc) return res.status(404).json({ success: false, message: 'Document not found' })
    if (existingDoc.status === 'processed') {
      return res.json({ success: true, alreadyProcessed: true })
    }
    const claimed = await Document.findOneAndUpdate(
      { _id: selectedBill._id, status: { $in: ['open', 'draw', 'pending'] } },
      { status: 'processing' },
      { new: false }
    )
    if (!claimed) {
      return res.status(409).json({ success: false, message: 'Document is already being processed or was already finalized' })
    }

    let itemsList = await DocItem.find({document:selectedBill._id})
    // Update product history
    async function updateProductHistory() {
      try {
        const productIds = itemsList.map(item => item.product._id);
        const products = await Product.find({ _id: { $in: productIds } });
        const productHistories = [];
        const updateOperations = [];

        for (const match of itemsList) {
          const product = products.find(p => p._id.toString() === match.product._id.toString());

          if (product) {
            product.modifiedby = user;

            const productData = product.toObject();
            productData.id = productData._id;
            delete productData._id;

            const historyEntry = new ProductHistory({
              ...productData,
              id: match.product,
            });
            productHistories.push(historyEntry);

            const update = {
              filter: { _id: match.product },
              update: {
                $inc: { onHand: match.qty },
                ...(customer && { suplier: customer._id }),  // Add supplier only if customer exists
              },
            };


            updateOperations.push(update);
          }
        }

        await ProductHistory.insertMany(productHistories);
        await Product.bulkWrite(updateOperations.map(op => ({ updateOne: op })));

        console.log('Product history updated and products adjusted successfully.');
      } catch (error) {
        console.error('Error updating product history:', error);
        throw new Error('Failed to update product history');
      }
    }

    await updateProductHistory();

    let NewTransaction;
    // Insert new transaction if customer exists
    if (customer) {
      console.log(customer)
      NewTransaction = new Transaction({
        currentCustomer: customer,
        date: fdate,
        transactionType: 'malllia',
        amount: totalSum,
        trnsType: 'minus',
        oldBalance: customer.balance,
        newBalance: customer.balance - totalSum
      });
      await NewTransaction.save();

      // Update customer balance
      await Customer.findByIdAndUpdate(customer._id, { $inc: { balance: -(parseFloat(Number(totalSum).toFixed(2))) } });
    }

    // Update document status
    await Document.findByIdAndUpdate(selectedBill._id, {
      status: "processed",
      date: fdate,
      time:currentTime,
      customer: customer ? customer._id : null,  // Set customer only if exists
      subtotal: total.costexpense,
      discount: total.discount,
      totalamount: total.costexpense - total.discount,
      payment: splitedPayments,
      amountpaid,
      ...(NewTransaction ? { transaction: NewTransaction._id } : {})
    });

    // Insert cash register entries
    const entriesArray = splitedPayments.map(match => ({
      user,
      customer: customer ? customer._id : null,
      date: fdate,
      type: 'Purchase',
      method: match.name,
      amount: match.amount,
      shop: selectedShop
    }));
    await CashRegister.insertMany(entriesArray);

    // Calculate lenehain and denehain for shop
    const customers = await Customer.find({linkedShop:selectedShop});
    let lenehain = 0;
    let denehain = 0;

    customers.forEach(match => {
      if (match.balance >= 0) {
        lenehain += match.balance;
      } else {
        denehain += Math.abs(match.balance);
      }
    });

    await Shop.findByIdAndUpdate(selectedShop, { lenehain:parseFloat(lenehain).toFixed(2) , denehain:parseFloat(denehain).toFixed(2) });

    res.json({ success: true });
  } catch (error) {
    console.error('Error in transaction processing:', error);
    try {
      if (req.body && req.body.selectedBill && req.body.selectedBill._id) {
        await Document.findOneAndUpdate(
          { _id: req.body.selectedBill._id, status: 'processing' },
          { status: 'pending' }
        )
      }
    } catch (rollbackErr) {
      console.error('Rollback failed:', rollbackErr)
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
