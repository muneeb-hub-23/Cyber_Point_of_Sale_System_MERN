const express = require('express');
const router = express.Router();
const Customer = require('../../models/Customer');

router.get('/', async (req, res) => {
    try {
        const customers = await Customer.find()
            .populate('linkedShop')
            .sort({ customerName: 1 });
        
        res.json(customers);
    } catch (error) {
        console.error('Error fetching all customers:', error);
        res.status(500).json({ success: false, message: 'Error fetching customers' });
    }
});

module.exports = router;
