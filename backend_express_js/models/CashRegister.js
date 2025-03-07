const mongoose = require('mongoose')

const cashRegisterSchema = new mongoose.Schema({
    user:{type: mongoose.Schema.Types.ObjectId,ref: 'users',required:true},
    customer:{type: mongoose.Schema.Types.ObjectId,ref: 'customers'},
    shop:{type: mongoose.Schema.Types.ObjectId,ref: 'shops'},
    document:{type: mongoose.Schema.Types.ObjectId,ref: 'documents'},
    date: {type:String,required:true},
    type: {type:String,required:true},
    method: {type:String,required:true},
    amount:{type:Number,default:0},
    category:{type:String,default:"calculate"},
    givento:{type:String,default:""},
    transactionCollectedFrom:{type:String,default:"counter"},

},{timestamps:true})

const Document = mongoose.model('cashRegister',cashRegisterSchema)

module.exports = Document