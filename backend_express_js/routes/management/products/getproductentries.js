const express = require('express')
const router = express.Router()
const DocItems = require('../../../models/DocumentItem')

router.get('/',async (req,res)=>{
    let {id} = req.headers
    let data = await DocItems.find({product:id}).populate('document');
    await DocItems.populate(data, { path: 'document.customer' });
    if(data){
        res.json(data)
    }else{
        res.json([])
    }
})

module.exports = router