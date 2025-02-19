const express = require('express');
const router = express.Router();
const Document = require('../../models/Documents');
const DocumentItem = require('../../models/DocumentItem');

router.post('/', async (req, res) => {
  try {
    const { method, selecteddocument } = req.body;
  
    // Fetch the current document and its entries in parallel
    const currentDocument = await Document.findById(selecteddocument).populate("customerGroup");
    const currentDocumentEntries = await DocumentItem.find({ document: currentDocument });
    let customerIDS = currentDocument.customerGroup.ids.map(g=> g.customerID)
    console.log(customerIDS)
    // Fetch past processed bills for the customer
    const customerPastBills = await Document.find({ customer: { $in: customerIDS }, status: 'processed' }, { _id: 1 });
    const idsarray = customerPastBills.map(bill => bill._id.toString());  // Using map for cleaner array construction

    // Fetch customer past entries in bulk
    const customerPastEntries = await DocumentItem.find({ document: { $in: idsarray } });

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

    // Update all documents with status 'pending' to 'completed' (if applicable)
    await DocumentItem.updateMany(
      { status: "pending" },
      { $set: { status: "completed" } }
    );

    // If everything went successfully
    res.json({ success: true });

  } catch (error) {
    // In case of any error
    console.error(error);  // Log the error for debugging
    res.json({ success: false, message: error.message });
  }
});

module.exports = router;
