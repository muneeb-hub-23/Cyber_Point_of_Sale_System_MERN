const express = require('express');
const router = express.Router();
const DocumentItem = require('../../../models/DocumentItem');

router.post('/', async (req, res) => {
    try {
        const { id, qty } = req.body;
        const previousItem = await DocumentItem.findById(id);

        if (!previousItem) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        const discountAmount = previousItem.discount?.amount || 0;
        const updatedData = {
            qty,
            costamount: previousItem.cost * qty,
            saleamount: (previousItem.sale - discountAmount) * qty,
        };

        const updatedItem = await DocumentItem.findByIdAndUpdate(id, updatedData);
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
