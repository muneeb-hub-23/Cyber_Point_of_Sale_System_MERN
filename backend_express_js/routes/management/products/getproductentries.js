const express = require('express')
const router = express.Router()
const db = require('../../../db')

function toDocDate(value) {
    const date = value ? new Date(value) : new Date()
    if (isNaN(date.getTime())) return ''
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${date.getFullYear()}${month}${day}`
}

router.get('/',async (req,res)=>{
    let {id} = req.headers
    try {
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
        const data = rows.map(r => {
            if (typeof r.productData === 'string') try { r.productData = JSON.parse(r.productData) } catch (_) {}
            if (typeof r.discount === 'string') try { r.discount = JSON.parse(r.discount) } catch (_) {}
            r._id = r.id
            r.entryType = 'document'
            r.document = {
                _id: r.docId, id: r.docId,
                doctype: r.doctype, status: r.docStatus, date: r.docDate,
                customer: r.custId ? { _id: r.custId, id: r.custId, customerName: r.customerName } : null
            }
            return r
        })

        const [adjustRows] = await db.query(
            `SELECT sar.*,
                    ru.username AS requestedByName,
                    rv.username AS reviewedByName,
                    p.cost AS productCost, p.sale AS productSale
             FROM stockadjustrequests sar
             LEFT JOIN users ru ON ru.id = sar.requestedBy
             LEFT JOIN users rv ON rv.id = sar.reviewedBy
             LEFT JOIN products p ON p.id = sar.product
             WHERE sar.product = ? AND sar.status = 'approved'
             ORDER BY sar.updatedAt ASC`,
            [id]
        )
        const adjustments = adjustRows.map(a => {
            const qty = Number(a.qty)
            const cost = Number(a.productCost || 0)
            const sale = Number(a.productSale || 0)
            return {
                _id: a.id,
                id: a.id,
                entryType: 'adjust',
                adjustType: a.adjustType,
                reason: a.reason,
                reviewNote: a.reviewNote,
                requestedByName: a.requestedByName || null,
                reviewedByName: a.reviewedByName || null,
                product: a.product,
                productData: { onHand: Number(a.onHandBefore) },
                qty,
                cost,
                costExpense: cost,
                costamount: cost * qty,
                sale,
                saleamount: sale * qty,
                createdAt: a.updatedAt || a.createdAt,
                document: {
                    _id: null,
                    id: null,
                    doctype: 'adjust',
                    status: a.status,
                    date: toDocDate(a.updatedAt || a.createdAt),
                    customer: null
                }
            }
        })

        const merged = [...data, ...adjustments].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        res.json(merged)
    } catch(err) {
        console.error(err)
        res.json([])
    }
})

module.exports = router
