const mongoose = require('mongoose');

const saleTypesSchema = new mongoose.Schema({
    name: {type: String,required: true,unique: true},
    description: {type: String,},
    shop:{type: mongoose.Schema.Types.ObjectId,ref: 'shops',required: true},
    createdAt: {type: Date,default: Date.now}
}, { timestamps: true });

const saleTypes = mongoose.model('SaleTypes', saleTypesSchema);

module.exports = saleTypes;
