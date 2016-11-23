var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var OrderSchema = new Schema({
	comment: String,
	items: Array,
	customer: String,
	price: Number,
	orderNumber: String,
	status: String
});

module.exports = mongoose.model('Order', OrderSchema);