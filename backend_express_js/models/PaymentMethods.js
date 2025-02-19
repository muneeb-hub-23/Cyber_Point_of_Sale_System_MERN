const mongoose = require('mongoose');

const paymentMethodsSchema = new mongoose.Schema({
    name: {type: String,required: true,unique: true},
    description: {type: String,default: ''},
    shop:{type: mongoose.Schema.Types.ObjectId,ref: 'shops',required: true},
    iscustomerrequired:{type:Boolean,required:true},
    enabled: {type: Boolean,default: true},
    bills:{type:Number,default:0},
    createdAt: {type: Date,default: Date.now}
}, { timestamps: true });

const paymentMethods = mongoose.model('PaymentMethods', paymentMethodsSchema);

module.exports = paymentMethods;
