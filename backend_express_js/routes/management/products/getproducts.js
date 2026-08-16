const express = require('express');
const router = express.Router();
const db = require('../../../db');

router.get('/', async (req, res) => {
    try {
        const { shop, supliers } = req.headers;
        if (shop && shop.length > 3 && supliers && supliers.length > 3) {
            const [rows] = await db.query(
                `SELECT p.*,
                        cat.id AS catId, cat.name AS catName, cat.description AS catDesc,
                        sup.id AS supId, sup.customerName AS supName,
                        sg.id AS sgId, sg.shopName AS sgName
                 FROM products p
                 LEFT JOIN categories cat ON cat.id = p.category
                 LEFT JOIN customers sup ON sup.id = p.suplier
                 LEFT JOIN shops sg ON sg.id = p.supliersGroup
                 WHERE p.supliersGroup = ? AND p.shop = ?`,
                [supliers, shop]
            )
            const data = rows.map(r => {
                if (typeof r.markup === 'string') try { r.markup = JSON.parse(r.markup) } catch (_) {}
                if (typeof r.tax === 'string') try { r.tax = JSON.parse(r.tax) } catch (_) {}
                if (typeof r.picture === 'string') try { r.picture = JSON.parse(r.picture) } catch (_) {}
                r._id = r.id
                r.category = r.catId ? { _id: r.catId, id: r.catId, name: r.catName, description: r.catDesc } : null
                r.suplier = r.supId ? { _id: r.supId, id: r.supId, customerName: r.supName } : null
                r.supliersGroup = r.sgId ? { _id: r.sgId, id: r.sgId, shopName: r.sgName } : null
                return r
            })
            res.json({ data });
        } else {
            res.json({ data: [] });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
