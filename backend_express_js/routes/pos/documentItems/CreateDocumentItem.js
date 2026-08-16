const express = require('express')
const router = express.Router()
const DocumentItem = require('../../../models/DocumentItem')

router.post('/', async (req, res) => {
    const { document, product, qty, cost, expense, tax, saleamount, costamount, finalprice, sale, user } = req.body;

    try {
        let existingItem = await DocumentItem.findOne({ document, product });

        if (existingItem) {
            const newQty = existingItem.qty + qty;
            await DocumentItem.findByIdAndUpdate(existingItem.id, {
                qty: newQty,
                cost: parseFloat(cost.toFixed(2)),
                expense,
                tax,
                sale: parseFloat(sale.toFixed(2)),
                costamount: parseFloat((cost * newQty).toFixed(2)),
                saleamount: parseFloat((finalprice * newQty).toFixed(2)),
                discount: JSON.stringify({ amount: 0, percentage: 0 }),
                finalprice: parseFloat(finalprice.toFixed(2)),
                user,
            });
            res.json({ success: true, message: 'Item updated successfully' });
        } else {
            await DocumentItem.save({
                ...req.body,
                cost: parseFloat(req.body.cost.toFixed(2)),
                expense: parseFloat(req.body.expense.toFixed(2)),
                sale: parseFloat(req.body.sale.toFixed(2)),
                finalprice: parseFloat(req.body.finalprice.toFixed(2)),
                costamount: parseFloat(req.body.costamount.toFixed(2)),
                saleamount: parseFloat(req.body.saleamount.toFixed(2)),
                discount: { amount: 0, percentage: 0 },
            });
            res.json({ success: true, message: 'New item created successfully' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
