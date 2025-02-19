const mongoose = require('mongoose')

const historySchema = new mongoose.Schema({

        shopName: {type:String},
        lenehain: {type:Number},
        denehain: {type:Number}

},{timestamps:true})

const History = mongoose.model('history',historySchema)

module.exports = History