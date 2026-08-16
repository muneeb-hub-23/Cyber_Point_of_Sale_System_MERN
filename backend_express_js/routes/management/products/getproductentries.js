const express = require('express')
const router = express.Router()
const db = require('../../../db')

function toDocDate(value) {
    const date = value ? new Date(value) : new Date()
    if (isNaN(date.getTime())) return null
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${date.getFullYear()}${month}${day}`
}

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
             WHERE di.product = ?
             ORDER BY di.createdAt ASC`,
            [id]
        )
        const docEntries = rows.map(r => {
            if (typeof r.productData === 'string') try { r.productData = JSON.parse(r.productData) } catch (_) {}
            if (typeof r.discount === 'string') try { r.discount = JSON.parse(r.discount) } catch (_) {}
            r._id = r.id
            r.entryType = 'docitem'
            r.document = {
                _id: r.docId, id: r.docId,
                doctype: r.doctype, status: r.docStatus, date: r.docDate,
                customer: r.custId ? { _id: r.custId, id: r.custId, customerName: r.customerName } : null
            }
            return r
        })

        // Fetch approved stock adjustment entries
        const [adjRows] = await db.query(
            `SELECT sar.*,
                    u.username AS requestedByUsername,
                    rv.username AS reviewedByUsername,
                    p.cost AS productCost, p.sale AS productSale
             FROM stockadjustrequests sar
             LEFT JOIN users u ON u.id = sar.requestedBy
             LEFT JOIN users rv ON rv.id = sar.reviewedBy
             LEFT JOIN products p ON p.id = sar.product
             WHERE sar.product = ? AND sar.status = 'approved'
             ORDER BY sar.updatedAt ASC`,
            [id]
        )
        const adjEntries = adjRows.map(r => {
            const qty = parseFloat(r.qty)
            const cost = Number(r.productCost || 0)
            const sale = Number(r.productSale || 0)
            const at = r.updatedAt || r.createdAt
            return {
                _id: r.id,
                id: r.id,
                entryType: 'adjustment',
                adjustType: r.adjustType,
                qty,
                onHandBefore: parseFloat(r.onHandBefore),
                onHandAfter: parseFloat(r.onHandAfter),
                reason: r.reason,
                status: r.status,
                requestedBy: r.requestedByUsername || r.requestedBy,
                reviewedBy: r.reviewedByUsername || r.reviewedBy,
                reviewNote: r.reviewNote,
                createdAt: at,
                updatedAt: r.updatedAt,
                // Shape document-like fields so the frontend can display uniformly
                document: {
                    _id: null,
                    id: null,
                    doctype: 'adjuststock',
                    status: r.status,
                    date: toDocDate(at),
                    customer: null,
                },
                // productData stub so frontend doesn't crash on p.productData.onHand
                productData: { onHand: parseFloat(r.onHandBefore) },
                cost,
                costExpense: cost,
                costamount: cost * qty,
                sale,
                saleamount: sale * qty,
            }
        })

        // Merge and sort by createdAt ascending
        const all = [...docEntries, ...adjEntries].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        res.json(all)
    } catch(err) {
        console.error(err)
        res.json([])
    }
})

module.exports = router
