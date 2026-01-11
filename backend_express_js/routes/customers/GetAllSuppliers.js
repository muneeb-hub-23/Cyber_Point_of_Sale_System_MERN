const express = require('express');
const router = express.Router();
const Product = require('../../models/Product');
const Customer = require('../../models/Customer');

router.get('/', async (req, res) => {
    try {
        // Get unique supplier IDs from products
        const products = await Product.find().distinct('suplier');
        
        // Get customer details for these supplier IDs
        const suppliers = await Customer.find({ _id: { $in: products } })
            .populate('linkedShop')
            .sort({ customerName: 1 });
        
        res.json(suppliers);
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        res.status(500).json({ success: false, message: 'Error fetching suppliers' });
    }
});

module.exports = router;
