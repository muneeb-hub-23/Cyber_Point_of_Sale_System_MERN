const express = require('express');
const router = express.Router();
const DocumentItem = require('../../../models/DocumentItem');

router.post('/', async (req, res) => {
    const updatedItems = req.body;
    try {
        for (let item of updatedItems) {
            const { document, product, qty, cost, expense, tax, saleamount, costamount, discount, finalprice, sale, user } = item;
            let existingItem = await DocumentItem.findOne({ document, product });

            if (existingItem) {
                await DocumentItem.findByIdAndUpdate(existingItem.id, {
                    qty, cost, expense, tax, sale, costamount, saleamount,
                    discount: JSON.stringify(discount),
                    finalprice, user,
                });
            } else {
                await DocumentItem.save({
                    ...item,
                    discount: discount,
                });
            }
        }
        res.json({ success: true, message: 'Items updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
