const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username:{type:String,required:true},
    email:{type:String,required:true},
    password:{type:String,required:true},
    shops:{type:[Object],default:[]},
    job:{type:String,default:"Normal User"},
    permissions:{type:[String],default:[]},
    profilepicture:{type:String,default:"/images/userprofilepicture/default.jpg"},
    rfid:{type:String, default:""},
    fingerprint:{type:String, default:""}

},{timestamps:true})

const User = mongoose.model('users',userSchema)

module.exports = User