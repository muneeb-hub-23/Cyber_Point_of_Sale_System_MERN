const express = require('express')
const router= express.Router()
const Document = require('../../../models/Documents')

router.post('/',async (req,res)=>{
    const {id} = req.body
    let data = await Document.findByIdAndUpdate(id, { $unset: { ['customer']: "" } })
    if (data){
        res.json({success:true})
    }else{
        res.json({success:false})
    }
})



module.exports = router