const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
        customerName: {type:String},
        customerMobileNumber: {type:Number,unique:false},
        customerType:{type:String},
        customerCnic: {type:Number},
        customerEmail: {type:String},
        customerAddress: {type:String},
        ids:[{
                customerID: { type: mongoose.Schema.Types.ObjectId, ref: 'customers' },
                shopID: { type: mongoose.Schema.Types.ObjectId, ref: 'shops' }
        }],

},{timestamps:true})

const User = mongoose.model('customergroup',userSchema)

module.exports = User