const express = require('express')
const router = express.Router()
const Counter = require('../../../models/Counter')

router.get('/',async(req,res)=>{
    let data = await Counter.find()
    if(data.length>0){
        res.json(data[0])
    }else{
        let newValue = new Counter({count:1})
        let data = await newValue.save()
        res.json(data)
    }
})

module.exports = router