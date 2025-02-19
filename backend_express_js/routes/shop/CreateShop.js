const express = require('express')
const router = express.Router()
const Shop = require('../../models/Shop')

router.post('/',async (req,res)=>{
    let match = await Shop.find(req.body)
    if(match.length === 0){
        const newShop = new Shop(req.body)
        newShop.save()
        newShop.success = true
        let shop = await JSON.parse(JSON.stringify(newShop))
        shop.success = true
        res.send(JSON.stringify(shop))
    }else{
        res.send(JSON.stringify({success:false}))
    }

})


module.exports = router