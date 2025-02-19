const mongoose = require('mongoose')

const documentItemSchema = new mongoose.Schema({

        document: {type: mongoose.Schema.Types.ObjectId,ref: 'documents',required: true},
        productData:{type:Object},
        product:{type: mongoose.Schema.Types.ObjectId,ref: 'Products',required: true},
        cost:{type: Number, required: true},
        expense:{type: Number, required: true},
        costExpense:{type: Number, required: true},
        tax:{type: Number, required: true},
        discount:{type: Object},
        sale:{type: Number, required: true},
        finalprice:{type:Number},
        qty:{type: Number, required: true},
        costamount:{type: Number, required: true},
        saleamount:{type: Number, required: true},
        user:{type: mongoose.Schema.Types.ObjectId,ref: 'users',required: true},

},{timestamps:true})

const DocItem = mongoose.model('docItems',documentItemSchema)

module.exports = DocItem