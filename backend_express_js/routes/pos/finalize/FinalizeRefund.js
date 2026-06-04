const express = require('express');
const router = express.Router();
const CashRegister = require('../../../models/CashRegister');
const Document = require('../../../models/Documents');
const Customer = require('../../../models/Customer');
const Products = require('../../../models/Product');
const ProductHistory = require('../../../models/ProductHistory');
const Transaction = require('../../../models/Transaction');
const Shop = require('../../../models/Shop');
const DocCounter = require('../../../models/DocumentNumber')

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
      itemsList,
      selectedShop,
      selectedBill,
      total,
      date
    } = req.body;
    // Ensure valid paidamount and itemsList
    if (!paidamount || !Array.isArray(itemsList) || itemsList.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid data provided.' });
    }

    const fdate = formatDate3(date);

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

    // Convert values to numbers
    paidamount = Number(paidamount);
    totalSum = Number(totalSum);

    // Update product history and adjust product quantities
    await updateProductHistory(itemsList, user);

    let NewTransaction; // Define NewTransaction here
    
    // Insert transaction if customer exists
    if (customer) {
      await updateCustomerBalance(customer, totalSum, splitedPayments);
      NewTransaction = await createTransaction(customer, totalSum, fdate); // Store the transaction in NewTransaction
    }

    // Prepare totals
    const costexpense = Number(total?.costexpense || 0);
    const billDiscount = Number(total?.billDiscount || 0);
    const totalamount = costexpense - billDiscount;

    // Update document
    await Document.findByIdAndUpdate(selectedBill._id, {
      status: "processed",
      date: fdate,
      time:currentTime,
      customer: customer ? customer._id : null,
      subtotal: costexpense,
      discount: billDiscount,
      totalamount,
      payment: splitedPayments,
      amountpaid: paidamount,
      ...(NewTransaction ? { transaction: NewTransaction._id } : {}) // Only add transaction if NewTransaction is defined
    });

    // Insert cash register entries
    await insertCashRegisterEntries(splitedPayments, selectedShop, customer, fdate, user);

    // Update shop balances
    await updateShopBalance(selectedShop);

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

async function updateProductHistory(itemsList, user) {
  try {
    const productIds = itemsList.map(item => item.product);
    const products = await Products.find({ _id: { $in: productIds } });

    const productHistories = itemsList.map(match => {
      const product = products.find(p => p._id.toString() === match.product.toString());
      if (product) {
        product.modifiedby = user;
        const productData = product.toObject();
        productData.id = productData._id;
        delete productData._id;

        return new ProductHistory({ ...productData, id: match.product });
      }
    }).filter(Boolean);

    await ProductHistory.insertMany(productHistories);

    const updateOperations = itemsList.map(match => ({
      updateOne: {
        filter: { _id: match.product },
        update: { $inc: { onHand: Number(match.qty) } }
      }
    }));

    await Products.bulkWrite(updateOperations);
    console.log('Product history updated and quantities adjusted successfully.');
  } catch (error) {
    console.error('Error updating product history:', error);
    throw new Error('Failed to update product history');
  }
}

async function updateCustomerBalance(customer, totalSum, splitedPayments) {
  try {
    const debitPayment = splitedPayments.find(payment => payment.name === 'Debit');
    if (debitPayment) {
      // Subtract debit payment amount from customer's balance
      await Customer.findByIdAndUpdate(customer._id, { $inc: { balance: -Number(debitPayment.amount) } });
    }

    await Customer.findByIdAndUpdate(customer._id, { $inc: { balance: totalSum } });
  } catch (error) {
    console.error('Error updating customer balance:', error);
    throw new Error('Failed to update customer balance');
  }
}

async function createTransaction(customer, totalSum, fdate) {
  try {
    const newBalance = Number(customer.balance) - totalSum;
    const newTransaction = new Transaction({
      currentCustomer: customer,
      date: fdate,
      transactionType: 'mallwapis',
      amount: totalSum,
      trnsType: 'minus',
      oldBalance: Number(customer.balance),
      newBalance
    });
      await Customer.findByIdAndUpdate(customer._id, { $inc: { balance: -(parseFloat(Number(newBalance).toFixed(2))) } });
    await newTransaction.save();
    return newTransaction;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw new Error('Failed to create transaction');
  }
}

async function insertCashRegisterEntries(splitedPayments, selectedShop, customer, fdate, user) {
  try {
    const entriesArray = splitedPayments.map(match => ({
      user,
      customer: customer ? customer._id : null,
      date: fdate,
      type: 'Refund',
      method: match.name,
      amount: Number(match.amount),
      shop: selectedShop
    }));
    await CashRegister.insertMany(entriesArray);
  } catch (error) {
    console.error('Error inserting cash register entries:', error);
    throw new Error('Failed to insert cash register entries');
  }
}

async function updateShopBalance(selectedShop) {
  try {
    const customers = await Customer.find({linkedShop:selectedShop});
    let lenehain = 0;
    let denehain = 0;

    customers.forEach(match => {
      const balance = Number(match.balance);
      if (balance >= 0) {
        lenehain += balance;
      } else {
        denehain += Math.abs(balance);
      }
    });

    await Shop.findByIdAndUpdate(selectedShop, { lenehain:parseFloat(lenehain).toFixed(2) , denehain:parseFloat(denehain).toFixed(2) });
  } catch (error) {
    console.error('Error updating shop balance:', error);
    throw new Error('Failed to update shop balance');
  }
}

function formatDate(dateString) {
  const day = dateString.slice(0, 2);
  const month = dateString.slice(2, 4);
  const year = dateString.slice(4);
  return `${year}${month}${day}`;
}

module.exports = router;
