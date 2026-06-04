const express = require('express');
const router = express.Router();
const CashRegister = require('../../../models/CashRegister');
const Document = require('../../../models/Documents');
const Customer = require('../../../models/Customer');
const Product = require('../../../models/Product');
const ProductHistory = require('../../../models/ProductHistory');
const Transaction = require('../../../models/Transaction');
const Shop = require('../../../models/Shop');
const DocItems = require('../../../models/DocumentItem')

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
    // Validate required fields
    if (!selectedBill || !total || !date || typeof paidamount === 'undefined' || !splitedPayments) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    let amountpaid = paidamount;
    let fdate = formatDate3(date);

    // --- Idempotency guard ---
    const existingDoc = await Document.findById(selectedBill._id)
    if (!existingDoc) return res.status(404).json({ success: false, message: 'Document not found' })
    if (existingDoc.status === 'processed') {
      return res.json({ success: true, alreadyProcessed: true })
    }
    const claimed = await Document.findOneAndUpdate(
      { _id: selectedBill._id, status: { $in: ['open', 'draw'] } },
      { status: 'processing' },
      { new: false }
    )
    if (!claimed) {
      return res.status(409).json({ success: false, message: 'Document is already being processed or was already finalized' })
    }

    let itemsList = await DocItems.find({document:selectedBill._id})
    if (!itemsList || itemsList.length === 0) {
      await Document.findOneAndUpdate({ _id: selectedBill._id, status: 'processing' }, { status: 'open' })
      return res.status(400).json({ success: false, message: 'No items found for this document' });
    }

    // Update product history
    async function updateProductHistory() {
      try {
        const productIds = itemsList.map(item => item.product);
        const products = await Product.find({ _id: { $in: productIds } });

        if (!products || products.length === 0) {
          throw new Error('Products not found');
        }

        const productHistories = [];
        const updateOperations = [];

        for (const match of itemsList) {
          const product = products.find(p => p._id.toString() === match.product.toString());
          console.log(product.onHand,match.qty)
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
                $inc: { onHand: -match.qty }, // Increase stock back since it's a stock return
              },
            };
            updateOperations.push(update);
          }
        }

        if (productHistories.length > 0) {
          await ProductHistory.insertMany(productHistories);
        }
        if (updateOperations.length > 0) {
          await Product.bulkWrite(updateOperations.map(op => ({ updateOne: op })));
        }

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
      // Validate customer balance before performing operations
      const currentCustomer = await Customer.findById(customer._id);
      if (!currentCustomer) {
        return res.status(400).json({ success: false, message: 'Customer not found' });
      }

      // Create transaction
      NewTransaction = new Transaction({
        currentCustomer: customer,
        date: fdate,
        transactionType: 'stockreturn',
        amount: totalSum,
        trnsType: 'plus',
        oldBalance: currentCustomer.balance,
        newBalance: currentCustomer.balance + totalSum
      });

      await NewTransaction.save();

      // Update customer balance
      await Customer.findByIdAndUpdate(customer._id, { $inc: { balance: parseFloat(Number(totalSum).toFixed(2)) } });
    }

    // Update document status
    await Document.findByIdAndUpdate(selectedBill._id, {
      status: "processed",
      date: fdate,
      time: currentTime,
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
      type: 'StockReturn',
      method: match.name,
      amount: match.amount,
      shop: selectedShop
    }));

    if (entriesArray.length > 0) {
      await CashRegister.insertMany(entriesArray);
    }

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

    // Respond with success
    res.json({ success: true });
  } catch (error) {
    console.error('Error in transaction processing:', error);
    try {
      if (req.body && req.body.selectedBill && req.body.selectedBill._id) {
        await Document.findOneAndUpdate(
          { _id: req.body.selectedBill._id, status: 'processing' },
          { status: 'open' }
        )
      }
    } catch (rollbackErr) {
      console.error('Rollback failed:', rollbackErr)
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
