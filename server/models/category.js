var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var CategorySchema = new Schema({
	name: String,
	subcats: Array
});

module.exports = mongoose.model('Category', CategorySchema);