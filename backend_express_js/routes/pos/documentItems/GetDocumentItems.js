const express = require('express')
const router = express.Router()
const DocumentItem = require('../../../models/DocumentItem')

router.get('/',async (req,res)=>{
    const {document} = req.headers
    let data = await DocumentItem.find({document})
    .populate('product')
    .populate('document')
    if(data.length>0){
        res.json(data)
    }else{
        res.json([])
    }
})

module.exports = router