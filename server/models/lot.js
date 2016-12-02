var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var LotSchema = new Schema({
	name: String,
	main_description: String,
	imgIds: Array,
	price: Number,
	top: Boolean,
	category: String,
	subcategory: String,
	auction: String,
	bets: Number,
	startTrading: String,
	endTrading: String,
	customer: String,
    props:[{
    	name: {type:String},
    	meta: {type:String},
    	value: {type:String}
    }],
    history: [{
    	customer: String,
    	price: Number
    }]
});

module.exports = mongoose.model('Lot', LotSchema);