const express = require('express')
const router = express.Router()
const Counter = require('../../../models/Counter')

router.get('/',async(req,res)=>{
    let data = await Counter.find()
    if(data.length>0){
        res.json(data[0])
    }else{
        let newValue = await Counter.save({count:1})
        res.json(newValue)
    }
})

module.exports = router