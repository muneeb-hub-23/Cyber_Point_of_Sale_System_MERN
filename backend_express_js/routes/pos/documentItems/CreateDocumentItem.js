const express = require('express')
const router = express.Router()
const DocumentItem = require('../../../models/DocumentItem')

router.post('/', async (req, res) => {
    const { document, product, qty, cost, expense, tax,saleamount,costamount,finalprice, sale, user } = req.body;
    
    try {
        // Find if an item with the same document and product already exists
        let existingItem = await DocumentItem.findOne({ document, product });

        if (existingItem) {
            // If the item exists, update it with the new qty and other fields
            existingItem.qty += qty;  // Add the new qty to the existing qty
            existingItem.cost = parseFloat(cost.toFixed(2));
            existingItem.expense = expense;
            existingItem.tax = tax;
            existingItem.sale = parseFloat(sale.toFixed(2));
            existingItem.costamount = parseFloat(existingItem.cost*existingItem.qty.toFixed(2));
            existingItem.saleamount = parseFloat(existingItem.finalprice*existingItem.qty.toFixed(2));
            existingItem.discount = {amount:0,percentage:0}
            existingItem.user = user;
            existingItem.finalprice = parseFloat(finalprice.toFixed(2));

            // Save the updated item
            await existingItem.save();

            res.json({ success: true, message: 'Item updated successfully' });
        } else {
            req.body.cost = parseFloat(req.body.cost.toFixed(2))
            req.body.expense = parseFloat(req.body.expense.toFixed(2))
            req.body.sale = parseFloat(req.body.sale.toFixed(2))
            req.body.finalprice = parseFloat(req.body.finalprice.toFixed(2))
            req.body.costamount = parseFloat(req.body.costamount.toFixed(2))
            req.body.saleamount = parseFloat(req.body.saleamount.toFixed(2))
            // If the item does not exist, create a new one
            let data = new DocumentItem(req.body);
            await data.save();
            res.json({ success: true, message: 'New item created successfully' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
