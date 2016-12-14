
var User       = require('../../models/user');
var Auction    = require('../../models/auction');
var Lot        = require('../../models/lot');
var Settings   = require('../../models/settings');
var async      = require('async');

module.exports = function(express) {

	var apiRouter = express.Router();

    apiRouter.get('/auctionIsExist', function(req, res) {
        Auction.find({}).populate('lots').exec(function(err, auctions) {
            var current = auctions.filter(function(auc) {
                return auc.status != "archived"
            })

            if (current.length > 0) {
                res.json({
                    auction: current[0]
                })
            } else if (current.length == 0) {
                res.json({
                    success: true
                })
            }
        })
    })

    apiRouter.get('/isSuperAdmin/:id', function(req, res) {
        User.findById(req.params.id, function(err, user) {
            if(user.super) {
                res.json({
                    success: true
                })
            } else {
                res.json({
                    success: false
                })
            }
        })
    })

    apiRouter.post('/createAuction', function(req, res) {
        Auction.findOne({name: req.body.name}, function(err, auction) {
            if(auction) {
                if(auction.status != "archived") {
                    res.json({
                        success: false,
                        message: "This auction already exist!"
                    })
                } else if (auction.status == "archived") {
                    var auc = new Auction({
                        name: req.body.name,
                        timeToStart: req.body.timeToStart,
                        status: "new"
                    });
                    auc.save(function(err) {
                        res.json({
                            success: true,
                            message: "Auction was created!"
                        })
                    })
                }  
            } else if(!auction) {
                var auc = new Auction({
                    name: req.body.name,
                    timeToStart: req.body.timeToStart,
                    status: "new"
                })
                auc.save(function(err) {
                    res.json({
                        success: true,
                        message: "Auction was created!",
                    })
                })
            }
        })
    })

    apiRouter.put('/updateAuction', function(req, res) {
        var lotsToSave = [];
        req.body.lots.forEach(function(item) {
            lotsToSave.push(function(callback) {
                Lot.findById(item._id, function(err, lot) {
                    lot.startTrading = item.startTrading;
                    lot.endTrading = item.endTrading;
                    lot.save(function(err){
                        callback(null, lot)
                    })
                })
            })     
        })
        async.parallel(lotsToSave, function(err, results) {
            Auction.findById(req.body.id, function(err, auction) {
                auction.name = req.body.name;
                auction.timeToStart = req.body.timeToStart;
                auction.save(function(err) {
                    res.json(req.body)
                })
            }) 
        })      
    })

    apiRouter.put('/updateAuctionStatus', function(req, res) {
        Auction.findById(req.body.id, function(err, auction) {

            auction.status = req.body.status;

            auction.save(function(err) {
                res.json(req.body)
            })
        })
    })

    apiRouter.delete('/removeAuction/:auction_id', function(req, res) {
        Auction.findByIdAndRemove(req.params.auction_id, function(err) {
            res.json({success: true})
        })
    })
    
    apiRouter.post('/saveSettings', function(req, res) {
        Settings.findOne({}, function(err, settings) {
            if(!settings) {
                var sets = new Settings({
                    tradingLot: req.body.tradingLot,
                    prolongTime: req.body.prolongTime,
                    betSteps: {
                        fromNull: req.body.fromNull,
                        fromOneMile: req.body.fromOneMile,
                        fromTwoMile: req.body.fromTwoMile,
                        fromFiveMile: req.body.fromFiveMile,
                        fromTenMile: req.body.fromTenMile,
                        fromTwentyMile: req.body.fromTwentyMile,
                        fromFiftyMile: req.body.fromFiftyMile,
                        fromOneHundredMile: req.body.fromOneHundredMile,
                        fromTwoHundredMile: req.body.fromTwoHundredMile,
                        fromFiveHundredMile: req.body.fromFiveHundredMile
                    }
                })

                sets.save(function(err) {
                    res.json({success: true, message: "Settings saved!"})
                })
            } else if(settings) {
                settings.tradingLot = req.body.tradingLot;
                settings.prolongTime = req.body.prolongTime;
                settings.betSteps.fromNull = req.body.betSteps.fromNull;
                settings.betSteps.fromOneMile = req.body.betSteps.fromOneMile;
                settings.betSteps.fromTwoMile = req.body.betSteps.fromTwoMile;
                settings.betSteps.fromFiveMile = req.body.betSteps.fromFiveMile;
                settings.betSteps.fromTenMile = req.body.betSteps.fromTenMile;
                settings.betSteps.fromTwentyMile = req.body.betSteps.fromTwentyMile;
                settings.betSteps.fromFiftyMile = req.body.betSteps.fromFiftyMile;
                settings.betSteps.fromOneHundredMile = req.body.betSteps.fromOneHundredMile;
                settings.betSteps.fromTwoHundredMile = req.body.betSteps.fromTwoHundredMile;
                settings.betSteps.fromFiveHundredMile = req.body.betSteps.fromFiveHundredMile;

                settings.save(function(err) {
                    res.json({success: true, message: "Settings saved!"})
                })
            }
        })
    })

    apiRouter.get('/updateAuctionStatus/:auction_id', function(req, res) {
        Auction.findById(req.params.auction_id, function(err, auction) {
            auction.status = 'archived'
            auction.save(function(err) {
                res.json({success: true})
            })
        })
    })

    apiRouter.get('/archiveAuctions', function(req, res) {
        Auction.find({status: 'archived'}).populate('lots').exec(function( err, auctions) {
            res.json(auctions)
        })
    })

    return apiRouter
}