const express = require('express')
const router = express.Router()
const Product = require('../../../models/Product')

router.get('/',async (req,res)=>{
    let {id} = req.headers
    let data = await Product.findById(id)
    if(data){
        res.json(data)
    }else{
        res.json([])
    }
})

module.exports = router