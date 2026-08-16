const express = require('express')
const router = express.Router()
const Shop = require('../../models/Shop')

router.post('/',async (req,res)=>{
    let match = await Shop.find(req.body)
    if(match.length === 0){
        let shop = await Shop.save(req.body)
        res.send(JSON.stringify({...shop, success: true}))
    }else{
        res.send(JSON.stringify({success:false}))
    }
})

module.exports = router
