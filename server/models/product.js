var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var ProductSchema = new Schema({
	name: String,
	main_description: String,
	imgIds: Array,
	availability: Boolean,
	price: Number,
	category: String,
	subcategory: String,
    props:[{
    	name: {type:String},
    	meta: {type:String},
    	value: {type:String}
    }],
    year: {
        value: Number,
        era: String
    },
    createdAt: Number
});

module.exports = mongoose.model('Product', ProductSchema);