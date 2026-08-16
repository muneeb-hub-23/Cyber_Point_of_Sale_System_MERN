const express = require('express');
const router = express.Router();
const db = require('../../db');

router.post('/', async (req, res) => {
    try {
        let { sdate, ldate, status, userid, shopid, allusers, docType } = req.body;

        if (!sdate || !ldate || !shopid) {
            return res.status(400).json({ error: "Start date (sdate), end date (ldate), and shop ID (shopid) are required." });
        }

        let sql = `SELECT d.*,
                          c.id AS custId, c.customerName, c.balance AS custBalance,
                          u.id AS userId, u.username
                   FROM documents d
                   LEFT JOIN customers c ON c.id = d.customer
                   LEFT JOIN users u ON u.id = d.user
                   WHERE d.linkedShop = ?
                     AND d.doctype = ?
                     AND d.status = ?
                     AND CAST(d.date AS UNSIGNED) >= ?
                     AND CAST(d.date AS UNSIGNED) <= ?`
        const vals = [shopid, docType, status, Number(sdate), Number(ldate)]

        if (!allusers && userid) {
            sql += ' AND d.user = ?'
            vals.push(userid)
        }

        sql += ' ORDER BY d.count ASC'

        const [rows] = await db.query(sql, vals)
        const documents = rows.map(r => {
            if (typeof r.payment === 'string') try { r.payment = JSON.parse(r.payment) } catch (_) {}
            r._id = r.id
            r.customer = r.custId ? { _id: r.custId, id: r.custId, customerName: r.customerName, balance: r.custBalance } : null
            r.user = r.userId ? { _id: r.userId, id: r.userId, username: r.username } : null
            return r
        })

        res.json(documents);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error. Please try again later." });
    }
});

module.exports = router;
