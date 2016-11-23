var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var AttrSchema = new Schema({
	name: {
		type: String,
		required: true,
		index: {
			unique:true
		}
	},
	meta: {
		type: String,
		required: true,
		index: {
			unique:true
		}
	},
	type: String,
	values: Array
});

module.exports = mongoose.model('Attribute', AttrSchema);