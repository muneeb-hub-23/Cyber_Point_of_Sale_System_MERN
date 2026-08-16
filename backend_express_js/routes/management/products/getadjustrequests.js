const express = require('express')
const router = express.Router()
const db = require('../../../db')

router.get('/', async (req, res) => {
    try {
        const [requests] = await db.query(
            `SELECT sar.*,
                    p.id AS pId, p.name AS pName, p.itemCode AS pItemCode,
                    p.picture AS pPicture, p.onHand AS pOnHand,
                    ru.id AS ruId, ru.username AS ruUsername,
                    rv.id AS rvId, rv.username AS rvUsername
             FROM stockadjustrequests sar
             LEFT JOIN products p ON p.id = sar.product
             LEFT JOIN users ru ON ru.id = sar.requestedBy
             LEFT JOIN users rv ON rv.id = sar.reviewedBy
             ORDER BY sar.createdAt DESC`
        )
        const result = requests.map(r => {
            let picture = r.pPicture
            try { picture = JSON.parse(picture) } catch (_) {}
            return {
                ...r,
                _id: r.id,
                product: r.pId ? { _id: r.pId, id: r.pId, name: r.pName, itemCode: r.pItemCode, picture, onHand: r.pOnHand } : null,
                requestedBy: r.ruId ? { _id: r.ruId, id: r.ruId, username: r.ruUsername } : null,
                reviewedBy: r.rvId ? { _id: r.rvId, id: r.rvId, username: r.rvUsername } : null,
            }
        })
        res.json(result)
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Internal server error' })
    }
})

module.exports = router
