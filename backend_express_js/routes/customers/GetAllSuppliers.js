const express = require('express');
const router = express.Router();
const db = require('../../db');

router.get('/', async (req, res) => {
    try {
        // Get unique supplier IDs from products then join with customers
        const [rows] = await db.query(
            `SELECT DISTINCT c.*, s.shopName, s.id AS shopId
             FROM customers c
             INNER JOIN products p ON p.suplier = c.id
             LEFT JOIN shops s ON s.id = c.linkedShop
             ORDER BY c.customerName ASC`
        )
        const suppliers = rows.map(r => {
            r._id = r.id
            r.linkedShop = { _id: r.shopId, id: r.shopId, shopName: r.shopName }
            return r
        })
        res.json(suppliers);
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        res.status(500).json({ success: false, message: 'Error fetching suppliers' });
    }
});

module.exports = router;
