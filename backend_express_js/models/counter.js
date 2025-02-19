const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const counterSchema = new Schema({
  name: String,
  count: { type: Number, default: 1 },
});

// Check if the model already exists before defining it
const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

module.exports = Counter;
