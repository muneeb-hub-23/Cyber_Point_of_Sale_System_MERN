const mongoose = require('mongoose')

const stockAdjustRequestSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Products', required: true },
    productName: { type: String, required: true },
    adjustType: { type: String, enum: ['increase', 'decrease'], required: true },
    qty: { type: Number, required: true },
    onHandBefore: { type: Number, required: true },
    onHandAfter: { type: Number, required: true },
    reason: { type: String, default: '' },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    reviewNote: { type: String, default: '' },
}, { timestamps: true })

const StockAdjustRequest = mongoose.model('stockadjustrequests', stockAdjustRequestSchema)

module.exports = StockAdjustRequest
