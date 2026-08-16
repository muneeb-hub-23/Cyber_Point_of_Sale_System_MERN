const express = require('express');
const router = express.Router();
const Document = require('../../models/Documents');
const DocumentItem = require('../../models/DocumentItem');

router.post('/', async (req, res) => {
  try {
    const { method, selecteddocument } = req.body;
  
    // Fetch the current document with customerGroup populated
    const currentDocument = await Document.find({ id: selecteddocument }).populate('customerGroup');
    const doc = currentDocument[0];
    if (!doc) return res.json({ success: false, message: 'Document not found' });

    const currentDocumentEntries = await DocumentItem.find({ document: selecteddocument });

    // customerGroup.ids contains { customerID: { _id, id, ... }, shopID: {...} }
    const customerIDS = doc.customerGroup ? doc.customerGroup.ids.map(g => g.customerID._id || g.customerID.id || g.customerID) : [];

    // Fetch past processed bills for the customer group members
    const db = require('../../db');
    const placeholders = customerIDS.map(() => '?').join(',');
    const customerPastBills = customerIDS.length > 0
        ? (await db.query(`SELECT id FROM documents WHERE customer IN (${placeholders}) AND status = 'processed'`, customerIDS))[0]
        : [];
    const idsarray = customerPastBills.map(bill => bill.id);

    // Fetch customer past entries in bulk
    const customerPastEntries = idsarray.length > 0
        ? await DocumentItem.find({ document: { $in: idsarray } })
        : [];

    // Create a map for fast lookup of past entries by product ID
    const pastEntriesMap = customerPastEntries.reduce((map, entry) => {
      map[entry.product.toString()] = entry;  // Use product ID as the key
      return map;
    }, {});

    // Prepare bulk operations for updates
    const bulkOps = [];

    for (let currentEntry of currentDocumentEntries) {
      const pastEntry = pastEntriesMap[currentEntry.product.toString()];  // Efficient lookup

      if (pastEntry) {
        let newValues = {};

        if (method === 'percentage') {
          newValues.discount = { percentage: pastEntry.discount.percentage, amount: (currentEntry.sale / 100) * pastEntry.discount.percentage };
          newValues.finalprice = currentEntry.sale - newValues.discount.amount;
          newValues.saleamount = currentEntry.qty * newValues.finalprice;

        } else if (method === 'amount') {
          newValues.discount = { amount: pastEntry.discount.amount, percentage: (pastEntry.discount.amount * 100) / currentEntry.sale };
          newValues.finalprice = currentEntry.sale - newValues.discount.amount;
          newValues.saleamount = currentEntry.qty * newValues.finalprice;
        }

        // Add the update operation to the bulkOps array
        bulkOps.push({
          updateOne: {
            filter: { _id: currentEntry._id },  // Use _id to uniquely identify the document
            update: { $set: newValues },
            upsert: false
          }
        });
      }
    }

    // Perform the bulk update operation if there are any operations to execute
    if (bulkOps.length > 0) {
      await DocumentItem.bulkWrite(bulkOps);
    }

    // If everything went successfully
    res.json({ success: true, updated: bulkOps.length });

  } catch (error) {
    // In case of any error
    console.error(error);  // Log the error for debugging
    res.json({ success: false, message: error.message });
  }
});

module.exports = router;
