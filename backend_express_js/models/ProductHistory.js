const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    id:{ type: mongoose.Schema.Types.ObjectId, ref: 'products', required: true },
    name: { type: String, required: true },
    itemCode: { type: Number, required: true },
    barCode: { type: Number, required: true },
    suplier: { type: mongoose.Schema.Types.ObjectId, ref: 'customers', required: true },
    supliersGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'shops'},
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'shops', required: true },
    onHand: { type: Number, default: 0 },
    cost: { type: Number, default: 0 },
    kharcha: { type: Number, default: 0 },
    iskharchaincludedinsale: { type: Boolean,default:true},
    markup: { type: Object },
    tax: { type: Object },
    istaxincludedinsale: { type: Boolean,default:true},
    ispricechangeallowed: { type: Boolean,default:true},
    isservice: { type: Boolean,default:false},
    sale: { type: Number,default:0 },
    isenabled: { type: Boolean, default: true },
    unit: { type: Number, default: 1 },
    description: { type: String, default: "" },
    createdby:{ type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'categories'},
    picture: { type: Array, default: ["/images/products/default.png"] },
    pictureby: { type: mongoose.Schema.Types.ObjectId, ref: 'users'},
    status:{type:String,default:"pending"},
    docType:{type:String},
    modifiedby: { type: mongoose.Schema.Types.ObjectId, ref: 'users'},
}, { timestamps: true });



const Product = mongoose.model('ProductHistory', productSchema);

module.exports = Product;
