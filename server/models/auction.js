
var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var Lot    = require('./lot')

var AuctionSchema = new Schema({
	name: String,
	timeToStart: String,
	status: String,
    lots: [{type: Schema.Types.ObjectId, ref: 'Lot'}]
});


// define our user model
module.exports = mongoose.model('Auction', AuctionSchema);