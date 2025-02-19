const mongoose = require('mongoose')

const documentSchema = new mongoose.Schema({
        doctype: {type:String,required:true},
        user:{type: mongoose.Schema.Types.ObjectId,ref: 'users',required: true},
        verifier:{type: mongoose.Schema.Types.ObjectId,ref: 'users'},
        status:{type:String,required:true},
        date:{type:String,required:true},
        time:{type:String,default:''},
        customer:{type: mongoose.Schema.Types.ObjectId,ref: 'customers'},
        customerGroup:{type: mongoose.Schema.Types.ObjectId,ref: 'customergroup'},
        linkedShop:{type: mongoose.Schema.Types.ObjectId,ref: 'shops',required: true},
        subtotal:{type:Number,default:0},
        discount:{type:Number,default:0},
        totalamount:{type:Number,default:0},
        payment:{type:Array},
        amountpaid:{type:Number,default:0},
        transaction:{type: mongoose.Schema.Types.ObjectId,ref: 'transactions'},
        count:{type:Number}

},{timestamps:true})

const Document = mongoose.model('documents',documentSchema)

module.exports = Document