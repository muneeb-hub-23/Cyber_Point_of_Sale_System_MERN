const express = require('express');
const router = express.Router();
const DocumentItem = require('../../../models/DocumentItem');

router.post('/', async (req, res) => {
    try {
        const { id, qty } = req.body;
        // Find the existing document item by ID
        const previousItem = await DocumentItem.findById(id);
        
        if (!previousItem) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        // Calculate updated fields based on the quantity
        const updatedData = {
            qty,
            costamount: previousItem.cost * qty,  // Assuming 'cost' is the correct field name
            saleamount: (previousItem.sale - (previousItem.discount?.amount || 0)) * qty  // Assuming 'discount' is an object with 'amount' field
        };

        // Update the document item with new qty, costamount, and saleamount
        const updatedItem = await DocumentItem.findByIdAndUpdate(id, updatedData, { new: true });
        if (updatedItem) {
            res.json({ success: true, data: updatedItem });
        } else {
            res.json({ success: false, message: 'Failed to update item' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
