const express = require('express')
const router = express.Router()
const db = require('../../../db')

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
             WHERE di.product = ?`,
            [id]
        )
        const data = rows.map(r => {
            if (typeof r.productData === 'string') try { r.productData = JSON.parse(r.productData) } catch (_) {}
            if (typeof r.discount === 'string') try { r.discount = JSON.parse(r.discount) } catch (_) {}
            r._id = r.id
            r.document = {
                _id: r.docId, id: r.docId,
                doctype: r.doctype, status: r.docStatus, date: r.docDate,
                customer: r.custId ? { _id: r.custId, id: r.custId, customerName: r.customerName } : null
            }
            return r
        })
        res.json(data)
    } catch(err) {
        console.error(err)
        res.json([])
    }
})

module.exports = router
