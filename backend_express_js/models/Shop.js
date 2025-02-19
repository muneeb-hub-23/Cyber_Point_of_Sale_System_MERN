const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
        shopName: {type:String,unique:true},
        customers:{type:Number,default:0},
        lenehain:{type:Number,default:0},
        denehain:{type:Number,default:0}
},{timestamps:true})

const User = mongoose.model('shops',userSchema)

module.exports = User