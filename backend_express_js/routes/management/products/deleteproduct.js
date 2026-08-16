const express = require('express')
const Product = require('../../../models/Product')
const router = express.Router()

router.delete('/',async(req,res)=>{
    let {id} = req.body
    let data = await Product.deleteOne({id:id})
    if(data){
        res.json({success:true})
    }else{
        res.json({success:false})
    }
})

module.exports = router
