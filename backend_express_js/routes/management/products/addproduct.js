const express = require('express')
const Product = require('../../../models/Product')
const History = require('../../../models/ProductHistory')
const Counter = require('../../../models/Counter')
const router = express.Router()

router.post('/',async (req,res)=>{
    let {
        productName, supliersGroup, code, barcode, suplier, shop,
        cost, kharcha, iskharchaincludedinsale, markup, tax,
        doesSaleIncludeTax, priceChangeAllowed, isService, sale,
        isEnabled, qtyPerPiece, reorder, description, createdby, category,
    } = req.body

    const productData = {
        name: productName,
        itemCode: code,
        barCode: barcode,
        suplier,
        supliersGroup,
        shop,
        cost,
        kharcha,
        iskharchaincludedinsale,
        markup,
        tax,
        istaxincludedinsale: doesSaleIncludeTax,
        ispricechangeallowed: priceChangeAllowed,
        isservice: isService,
        sale: Math.round(sale * 100) / 100,
        isenabled: isEnabled,
        unit: qtyPerPiece,
        reorder,
        description,
        createdby,
        category,
    }

    let savedproduct = await Product.save(productData)
    let savedhistory = await History.save({ ...productData, productId: savedproduct.id, docType: 'add' })

    if (savedproduct && savedhistory) {
        let x = await Counter.find()
        if (x.length > 0) {
            await Counter.findByIdAndUpdate(x[0].id, { $inc: { count: 1 } })
        }
        res.json({ success: true })
    } else {
        res.json({ success: false, message: "Unknown Error Occured" })
    }
})

module.exports = router
