const express = require('express')
const router = express.Router()
const db = require('../../../db')

router.get('/',async (req,res)=>{
    let {id} = req.headers
    try {
        // Fetch regular doc item entries
        const [rows] = await db.query(
            `SELECT di.*,
                    doc.id AS docId, doc.doctype, doc.status AS docStatus, doc.date AS docDate,
                    doc.customer AS docCustomer,
                    c.id AS custId, c.customerName
             FROM docitems di
             LEFT JOIN documents doc ON doc.id = di.document
             LEFT JOIN customers c ON c.id = doc.customer
             WHERE di.product = ?`,
            [id]
        )
        const docEntries = rows.map(r => {
            if (typeof r.productData === 'string') try { r.productData = JSON.parse(r.productData) } catch (_) {}
            if (typeof r.discount === 'string') try { r.discount = JSON.parse(r.discount) } catch (_) {}
            r._id = r.id
            r.document = {
                _id: r.docId, id: r.docId,
                doctype: r.doctype, status: r.docStatus, date: r.docDate,
                customer: r.custId ? { _id: r.custId, id: r.custId, customerName: r.customerName } : null
            }
            r.entryType = 'docitem'
            return r
        })

        // Fetch approved stock adjustment entries
        const [adjRows] = await db.query(
            `SELECT sar.*,
                    u.username AS requestedByUsername,
                    rv.username AS reviewedByUsername
             FROM stockadjustrequests sar
             LEFT JOIN users u ON u.id = sar.requestedBy
             LEFT JOIN users rv ON rv.id = sar.reviewedBy
             WHERE sar.product = ? AND sar.status = 'approved'
             ORDER BY sar.createdAt ASC`,
            [id]
        )
        const adjEntries = adjRows.map(r => ({
            _id: r.id,
            id: r.id,
            entryType: 'adjustment',
            adjustType: r.adjustType,
            qty: parseFloat(r.qty),
            onHandBefore: parseFloat(r.onHandBefore),
            onHandAfter: parseFloat(r.onHandAfter),
            reason: r.reason,
            status: r.status,
            requestedBy: r.requestedByUsername || r.requestedBy,
            reviewedBy: r.reviewedByUsername || r.reviewedBy,
            reviewNote: r.reviewNote,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
            // Shape document-like fields so the frontend can display uniformly
            document: {
                doctype: 'adjuststock',
                date: r.createdAt ? r.createdAt.toISOString().slice(0, 10).replace(/-/g, '') : null,
                customer: null,
            },
            // productData stub so frontend doesn't crash on p.productData.onHand
            productData: { onHand: parseFloat(r.onHandBefore) },
            costExpense: 0, costamount: 0, sale: 0, saleamount: 0,
        }))

        // Merge and sort by createdAt ascending
        const all = [...docEntries, ...adjEntries].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        res.json(all)
    } catch(err) {
        console.error(err)
        res.json([])
    }
})

module.exports = router
