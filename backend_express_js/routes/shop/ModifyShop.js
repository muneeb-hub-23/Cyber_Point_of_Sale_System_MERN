const express = require('express')
const router = express.Router()
const Shop = require('../../models/Shop')

router.post('/',async (req,res)=>{
    let updated = await Shop.findByIdAndUpdate(req.body.shopid,{shopName:req.body.shopName},{new:true})
    if(updated){
        res.json({success:true,message:"Shop Name Modified"})
    }else{
        res.json({success:false,message:"an error occured"})
    }

})


module.exports = router