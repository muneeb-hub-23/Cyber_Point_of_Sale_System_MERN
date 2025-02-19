const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const docNum = new Schema({
  name: String,
  count: { type: Number, default: 1 },
});

// Check if the model already exists before defining it
const Counter = mongoose.models.doccounter || mongoose.model('doccounter', docNum);

module.exports = Counter;
