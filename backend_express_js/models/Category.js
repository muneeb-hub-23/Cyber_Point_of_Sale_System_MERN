const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        unique: true 
    },
    description: { 
        type: String, 
        default: '' 
    },
    shop:{type: mongoose.Schema.Types.ObjectId,ref: 'shops',required: true},
    enabled: { 
        type: Boolean, 
        default: true 
    },
    products:{
        type:Number,
        default:0
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
}, { timestamps: true });

const Category = mongoose.model('categories', categorySchema);

module.exports = Category;
