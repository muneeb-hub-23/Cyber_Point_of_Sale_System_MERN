const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
        customerName: {type:String},
        customerMobileNumber: {type:Number,unique:false},
        leneHain:{type:Number,default:0},
        deneHain:{type:Number,default:0},
        balance:{type:Number,default:0},
        customerType:{type:String},
        customerCnic: {type:Number},
        customerEmail: {type:String},
        customerAddress: {type:String},
        linkedShop:{type: mongoose.Schema.Types.ObjectId,ref: 'shops',required: true},
        status:{type:Boolean,default:true}

},{timestamps:true})

const User = mongoose.model('customers',userSchema)

module.exports = User