const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
    currentCustomer: {
        _id:{type:String},
        customerName: {type:String},
        customerMobileNumber: {type:Number},
        leneHain:{type:Number,default:0},
        deneHain:{type:Number,default:0},
        customerCnic: {type:Number},
        customerEmail: {type:String},
        customerAddress: {type:String},
        linkedShop:{type: mongoose.Schema.Types.ObjectId,ref: 'shops',required: true},
        createdAt:{type:String},
        updatedAt:{type:String},
        __v:{type:String}
      },
      user:{type:mongoose.Schema.Types.ObjectId,ref:'users'},
      date:{type:String},
      transactionType:{type:String},
      method:{type:String},
      amount:{type:Number},
      trnsType:{type:String},
      oldBalance:{type:Number},
      newBalance:{type:Number},
      transactionCollectedFrom:{type:String,default:"counter"},
      daysToClear:{type:Number,default:0},
      remarks:{type:String,default:""},
      warning:{
        date:{type:Number,default:0},
        resolved:{type:Boolean,default:true},
        relation:{type:String,default:""}
      }
},{timestamps:true})

const Transaction = mongoose.model('transactions',transactionSchema)

module.exports = Transaction
