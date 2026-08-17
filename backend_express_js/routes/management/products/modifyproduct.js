const express = require('express')
const Product = require('../../../models/Product')
const History = require('../../../models/ProductHistory')
const Counter = require('../../../models/Counter')
const router = express.Router()

router.post('/',async (req,res)=>{
    let {
        id,
        productName,
        supliersGroup,
        suplier,
        shop,
        code,
        barcode,
        cost,
        kharcha,
        iskharchaincludedinsale,
        markup,
        tax,
        doesSaleIncludeTax,
        priceChangeAllowed,
        isService,
        sale,
        isEnabled,
        qtyPerPiece,
        reorder,
        description,
        modifiedby,
        createdby,
        category,
      } = req.body

    let savedproduct =await Product.findByIdAndUpdate(id,{
        name:productName,
        suplier,
        supliersGroup,
        shop,
        cost,
        kharcha,
        iskharchaincludedinsale,
        markup,
        tax,
        istaxincludedinsale:doesSaleIncludeTax,
        ispricechangeallowed:priceChangeAllowed,
        isservice:isService,
        sale:Math.round(sale * 100) / 100,
        isenabled:isEnabled,
        unit:qtyPerPiece,
        reorder,
        description,
        modifiedby,
        category
    })
    let savedhistory = await History.save({
        id:savedproduct._id,
        name:productName,
        itemCode:code,
        barCode:barcode,
        suplier,
        shop,
        cost,
        kharcha,
        iskharchaincludedinsale,
        markup,
        tax,
        istaxincludedinsale:doesSaleIncludeTax,
        ispricechangeallowed:priceChangeAllowed,
        isservice:isService,
        sale,
        isenabled:isEnabled,
        unit:qtyPerPiece,
        description,
        modifiedby,
        createdby,
        category
    })
    if(savedproduct && savedhistory){
        res.json({success:true})
    }else{
        res.json({success:false,message:"Unknown Error Occured"})
    }
})

module.exports = router