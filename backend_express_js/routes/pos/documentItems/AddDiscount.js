const express = require('express');
const router = express.Router();
const DocumentItem = require('../../../models/DocumentItem');

router.post('/', async (req, res) => {
    const updatedItems = req.body;
    try {
        // Process each item in the array
        for (let item of updatedItems) {
            const {
                document,
                product,
                qty,
                cost,
                expense,
                tax,
                saleamount,
                costamount,
                discount,
                finalprice,
                sale,
                user
            } = item;

            // Find if an item with the same document and product already exists
            let existingItem = await DocumentItem.findOne({ document, product });

            if (existingItem) {
                // Update the existing item with the new values
                existingItem.qty = qty;
                existingItem.cost = cost;
                existingItem.expense = expense;
                existingItem.tax = tax;
                existingItem.sale = sale;
                existingItem.costamount = costamount;
                existingItem.saleamount = saleamount;
                existingItem.discount = discount;
                existingItem.finalprice = finalprice;
                existingItem.user = user;

                // Save the updated item
                await existingItem.save();
            } else {
                // If the item does not exist, create a new one
                const newItem = new DocumentItem(item);
                await newItem.save();
            }
        }

        res.json({ success: true, message: 'Items updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
