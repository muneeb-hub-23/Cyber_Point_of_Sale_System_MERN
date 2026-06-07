const express = require('express');
const router = express.Router();
const CashRegister = require('../../../models/CashRegister');
const Document = require('../../../models/Documents');
const Customer = require('../../../models/Customer');
const Product = require('../../../models/Product');
const ProductHistory = require('../../../models/ProductHistory');
const Transaction = require('../../../models/Transaction');
const Shop = require('../../../models/Shop');
const DocItem = require('../../../models/DocumentItem')
const DocCounter = require('../../../models/DocumentNumber')
const CustomerGroup = require('../../../models/CustomerGroup')
function formatDateToYYYYMMDD(dateString) {
  const date = new Date(dateString); // Parse the date string
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`; // Combine year, month, and day
}
router.post('/', async (req, res) => {

  try {

    let {
      user,
      currentTime,
      date,
      selectedBill,
      customerGroup,
      finalTotals,
      balanceTotal,

    } = req.body

    console.log('[FinalizeSale] Request received, selectedBill._id:', selectedBill._id)

    // --- Idempotency guard ---
    const existingDoc = await Document.findById(selectedBill._id)
    console.log('[FinalizeSale] existingDoc status:', existingDoc ? existingDoc.status : 'NOT FOUND')
    if (!existingDoc) return res.status(404).json({ success: false, message: 'Document not found' })
    if (existingDoc.status === 'processed') {
      console.log('[FinalizeSale] Already processed, returning success')
      return res.json({ success: true, alreadyProcessed: true })
    }

    // Atomically claim the document for processing
    const claimed = await Document.findOneAndUpdate(
      { _id: selectedBill._id, status: { $in: ['open', 'draw', 'pending'] } },
      { status: 'processing' },
      { new: false }
    )
    console.log('[FinalizeSale] Claim result:', claimed ? `claimed (was: ${claimed.status})` : 'FAILED - already processing/processed')
    if (!claimed) {
      return res.status(409).json({ success: false, message: 'Document is already being processed or was already finalized' })
    }

    if(customerGroup){
      customerGroup = await CustomerGroup.findById(customerGroup._id).populate("ids.shopID").populate("ids.customerID")
    }
    let allItems = await DocItem.find({document:selectedBill._id}).populate('product')
    console.log('[FinalizeSale] allItems count:', allItems.length)
    let documentsToProcess = [];

    for (let shop of balanceTotal) {
      shop = shop.shop
      console.log('[FinalizeSale] Processing shop:', shop._id, shop.name)
      let count = 1
      let xip = await DocCounter.find()
      if (xip.length > 0) {
        await DocCounter.updateMany({}, { $inc: { count: 1 } })
        count = xip[0].count
      } else {
        count = 1
        dba = new DocCounter({ count: 1 })
        await dba.save()
      }
      let newDocument = new Document({
        doctype: "sale",
        status: "processed",
        date: selectedBill.date,
        customerGroup : customerGroup ? customerGroup._id : null,
        user: user,
        linkedShop: shop._id,
        count
      });
      await newDocument.save()
      documentsToProcess.push(newDocument)
    }
    for(item of allItems){
      let documentForThisItem = documentsToProcess.find(d=>d.linkedShop.toString()===item.product.shop.toString())
      await DocItem.findByIdAndUpdate(item._id,{document:documentForThisItem._id})
    }

    for(document of documentsToProcess){
      console.log('[FinalizeSale] Processing document:', document._id, 'for shop:', document.linkedShop)
      let thisShopData = balanceTotal.find(b=>b.shop._id.toString()===document.linkedShop.toString())
      let customer = customerGroup ? customerGroup.ids.find(c=>c.shopID._id.toString()===document.linkedShop.toString()) : undefined
      if(customer){
        customer = customer.customerID;
      }
      let itemsList = await DocItem.find({document:document._id})
      let totalSum = thisShopData.shopPayments.reduce((total, l) => total + (l.name==="Debit" && l.amount), 0)
      let debitPayment = thisShopData.shopPayments.find(p => p.name === "Debit")
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
                  $inc: { onHand: -match.qty },
                },
              };
  
  
              updateOperations.push(update);
            }
          }
  
          await ProductHistory.insertMany(productHistories);
          await Product.bulkWrite(updateOperations.map(op => ({ updateOne: op })));
          } catch (error) {
          console.error('Error updating product history:', error);
          throw new Error('Failed to update product history');
        }
      }
      await updateProductHistory();
      console.log('[FinalizeSale] Product history updated for document:', document._id)
      let NewTransaction;
      // Insert new transaction if customer exists
      if (customer) {
        NewTransaction = new Transaction({
          currentCustomer: customer,
          date:formatDateToYYYYMMDD(date),
          transactionType: 'malldia',
          amount: totalSum,
          trnsType: 'plus',
          oldBalance: customer.balance,
          newBalance: customer.balance + totalSum,
          daysToClear: debitPayment ? debitPayment.daysToClear || 0 : 0,
          remarks: debitPayment ? debitPayment.remarks || "" : ""
        });
        await NewTransaction.save();
        let data = await Customer.findByIdAndUpdate(customer._id, { $inc: { balance: totalSum.toFixed(2) } });
      }

      await Document.findByIdAndUpdate(
        document._id,
        {
            customer: customer ? customer._id : null,
            time: currentTime,
            subtotal: thisShopData.shopTotalAfterDiscount,
            discount: thisShopData.cartDiscount,
            totalamount: thisShopData.shopPayments.reduce((total, l) => total + l.amount, 0),
            payment: thisShopData.shopPayments,
            amountpaid: thisShopData.shopPayments.reduce((total, l) => total + l.amount, 0),
            ...(NewTransaction ? { transaction: NewTransaction._id } : {})
        },
        { new: true }
    );

      const entriesArray = thisShopData.shopPayments.map(match => ({
        user,
        customer: customer ? customer._id : null,
        date,
        type: 'Sale',
        method: match.name,
        amount: match.amount,
        shop: thisShopData.shop._id,
        document:document._id
      }));
      let reply = await CashRegister.insertMany(entriesArray);


      const customers = await Customer.find({linkedShop:thisShopData.shop._id});
      let lenehain = 0;
      let denehain = 0;
  
      customers.forEach(match => {
        if (match.balance >= 0) {
          lenehain += match.balance;
        } else {
          denehain += Math.abs(match.balance);
        }
      });
  
      await Shop.findByIdAndUpdate(thisShopData.shop._id, { lenehain:parseFloat(lenehain).toFixed(2) , denehain:parseFloat(denehain).toFixed(2) });
  


    }


    console.log('[FinalizeSale] All done, sending success')
    res.json({ success: true });
  } catch (error) {
    console.error('[FinalizeSale] ERROR:', error.message)
    console.error('[FinalizeSale] Stack:', error.stack)
    // Reset document back to open so it can be retried cleanly
    try {
      if (req.body && req.body.selectedBill && req.body.selectedBill._id) {
        const rollbackResult = await Document.findOneAndUpdate(
          { _id: req.body.selectedBill._id, status: 'processing' },
          { status: 'pending' }
        )
        console.log('[FinalizeSale] Rollback result:', rollbackResult ? 'reset to pending' : 'doc was not in processing state')
      }
    } catch (rollbackErr) {
      console.error('[FinalizeSale] Rollback failed:', rollbackErr)
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
