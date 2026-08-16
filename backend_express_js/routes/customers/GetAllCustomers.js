const express = require('express');
const router = express.Router();
const Customer = require('../../models/Customer');
const db = require('../../db');

router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT c.*, s.shopName, s.id AS shopId
             FROM customers c
             LEFT JOIN shops s ON s.id = c.linkedShop
             ORDER BY c.customerName ASC`
        )
        const customers = rows.map(r => {
            r._id = r.id
            r.linkedShop = { _id: r.shopId, id: r.shopId, shopName: r.shopName }
            return r
        })
        res.json(customers);
    } catch (error) {
        console.error('Error fetching all customers:', error);
        res.status(500).json({ success: false, message: 'Error fetching customers' });
    }
});

module.exports = router;
