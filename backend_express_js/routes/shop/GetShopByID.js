const express = require('express')
const router = express.Router()
const Shop = require('../../models/Shop')

router.get('/',async (req,res)=>{

        let shop = await Shop.findById(req.headers.shopid)
        res.send(JSON.stringify(shop))

})


module.exports = router