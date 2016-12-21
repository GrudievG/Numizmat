
var User       = require('../models/user');
var Auction    = require('../models/auction');
var Lot        = require('../models/lot');
var Settings   = require('../models/settings');
var async      = require('async');

module.exports = function(app, express, io) {

var apiRouter   = express.Router();

var authRoutes             = require('./unprotected.routes/auth.routes')(express);
var mainRoutes             = require('./unprotected.routes/main.routes')(express);
var verificationMiddleware = require('./verification.middleware')(express);
var adminRoutes            = require('./admin.routes/admin.routes')(express);
var userRoutes             = require('./protected.routes/user.routes')(express);
var productsRoutes         = require('./protected.routes/products.routes')(express);


// UNPROTECTED ROUTES =======================================

    apiRouter.use(authRoutes);
    apiRouter.use(mainRoutes);

// MIDDLEWARE TO VERIFY A TOKEN =============================

    apiRouter.use(verificationMiddleware);

// PROTECTED ROUTES ========================================

    apiRouter.use(userRoutes);
    apiRouter.use('/admin', adminRoutes);
    apiRouter.use(productsRoutes);

// SOCKETS =====================================================

    io.on('connection', function(socket) {

        socket.on('bet up', function (data) {
            User.findById(data.user_id).populate('bets.lot').exec(function(err, user) {
                if(!user) {
                    socket.emit('error msg', {message: "Error!"})
                } else if(user) {
                    if(data.user_email != user.email) {
                        socket.emit('error msg', {message: "Error!"})
                    } else {
                        var betExist = false;
                        user.bets.forEach(function(item) {
                            if (item.lot == null) {
                                user.bets.splice(user.bets.indexOf(item), 1)
                                return
                            }
                            if(item.lot._id == data.lot._id) {
                                betExist = true;
                                item.price = data.price;
                            }
                        })
                        if(!betExist) {
                            user.bets.push({
                                lot: data.lot,
                                price:data.price
                            }) 
                        }
                        user.save(function(err, savedUser) {})

                        var userToEmail = undefined;
                        async.parallel([function(callback) {
                            Lot.findById(data.lot._id, function(err, lot) {
                                Settings.findOne({}, function(err, settings) {
                                    var split = data.user_email.split('@');
                                    var betStep = undefined;
                                    userToEmail = lot.customer;
                                    function checkBetStep () {
                                        if (lot.price < 1000)
                                            betStep = settings.betSteps.fromNull;
                                        else if (lot.price >= 1000 && lot.price < 2000)
                                            betStep = settings.betSteps.fromOneMile;
                                        else if (lot.price >= 2000 && lot.price < 5000)
                                            betStep = settings.betSteps.fromTwoMile;
                                        else if (lot.price >= 5000 && lot.price < 10000)
                                            betStep = settings.betSteps.fromFiveMile;
                                        else if (lot.price >= 10000 && lot.price < 20000)
                                            betStep = settings.betSteps.fromTenMile;
                                        else if (lot.price >= 20000 && lot.price < 50000)
                                            betStep = settings.betSteps.fromTwentyMile;
                                        else if (lot.price >= 50000 && lot.price < 100000)
                                            betStep = settings.betSteps.fromFiftyMile;
                                        else if (lot.price >= 100000 && lot.price < 200000)
                                            betStep = settings.betSteps.fromOneHundredMile;
                                        else if (lot.price >= 200000 && lot.price < 500000)
                                            betStep = settings.betSteps.fromTwoHundredMile;
                                        else if (lot.price >= 500000)
                                            betStep = settings.betSteps.fromFiveHundredMile;
                                    }

                                    lot.bets++
                                    lot.customer = data.user_id;
                                    lot.price = data.price;
                                    lot.history.push({
                                        customer: split[0],
                                        price: data.price,
                                        time: data.time,
                                    });

                                    if(lot.autobet && !data.autobet) {
                                        if(data.price < lot.autobet.price) {
                                            checkBetStep();
                                            lot.bets++
                                            lot.customer = lot.autobet.customer_id;
                                            lot.price = data.price + betStep;
                                            lot.history.push({
                                                customer: lot.autobet.customer_email,
                                                price: lot.price,
                                                time: data.time,
                                            });
                                        }
                                    }

                                    if(data.autobet && !(lot.autobet && lot.autobet.price)) {
                                        lot.autobet = {
                                            customer_id: data.user_id,
                                            customer_email: split[0],
                                            price: data.autobet
                                        }
                                    }

                                    if(data.autobet && data.autobet < lot.autobet.price) {
                                        lot.bets++
                                        lot.customer = lot.autobet.customer_id;
                                        lot.price = data.autobet;
                                        checkBetStep();
                                        lot.price = lot.price + betStep;
                                        lot.history.push({
                                            customer: lot.autobet.customer_email,
                                            price: lot.price,
                                            time: data.time,
                                        });
                                    }

                                    if(data.autobet && data.autobet > lot.autobet.price) {
                                        lot.bets++
                                        lot.history.push({
                                            customer: lot.autobet.customer_id,
                                            price: lot.autobet.price,
                                            time: data.time,
                                        });
                                        lot.customer = data.user_id;
                                        lot.price = lot.autobet.price;
                                        checkBetStep();
                                        lot.price = lot.price + betStep;
                                        lot.autobet = {
                                            customer_id: data.user_id,
                                            customer_email: split[0],
                                            price: data.autobet
                                        }
                                        lot.bets++
                                        lot.history.push({
                                            customer: lot.autobet.customer_email,
                                            price: lot.autobet.price,
                                            time: data.time,
                                        });
                                    }

                                    lot.save(function(err, savedLot) {
                                        if(userToEmail != savedLot.customer && Date.now() < savedLot.startTrading) {
                                            socket.emit('send email', {
                                                receiver: userToEmail,
                                                lot: savedLot._id
                                            });
                                        }
                                        callback(null, lot)
                                    })
                                })     
                            })
                        }], function(err, result) {
                            if(data.currentDelta < data.deltaTime) {
                                Auction.findById(data.lot.auction).populate('lots').exec(function(err, auction) {
                                    var lotsToUpdate = [];
                                    auction.lots.forEach(function(item, index) {
                                        if(Number(item.endTrading) < Date.now()) {
                                            lotsToUpdate.push(function(callback) {
                                                Lot.findById(item._id, function(err, lot) {
                                                    callback(null, lot)
                                                })
                                            })  
                                        } else if (Number(item.startTrading) < Date.now() && Number(item.endTrading) > Date.now()) {
                                            lotsToUpdate.push(function(callback) {
                                                Lot.findById(item._id, function(err, lot) {
                                                    item.endTrading = String(Date.now() + data.deltaTime)
                                                    lot.endTrading = String(Date.now() + data.deltaTime)
                                                    lot.save(function(err) {
                                                        callback(null, lot)
                                                    })
                                                })
                                            })       
                                        } else if(Number(item.startTrading) > Date.now()) {
                                            lotsToUpdate.push(function(callback) {
                                                Lot.findById(item._id, function(err, lot) {
                                                    item.startTrading = auction.lots[index-1].endTrading;
                                                    item.endTrading = String(Number(item.startTrading) + data.tradingLot)
                                                    lot.startTrading = item.startTrading;
                                                    lot.endTrading = item.endTrading
                                                    lot.save(function(err) {
                                                        callback(null, lot)
                                                    })
                                                })
                                            })
                                        }
                                    })
                                    async.parallel(lotsToUpdate, function(err, results) {
                                        io.emit('trading time changed', results)
                                        io.emit('update statistic', auction.lots)
                                    })
                                })
                            } else {       
                                Auction.find({}).populate('lots').exec(function(err, auctions) {
                                    var current = auctions.filter(function(auc) {
                                        return auc.status == "published"
                                    })
                                    io.emit('lot update', result)
                                    io.emit('update statistic', current[0].lots)
                                })
                            }
                        })        
                    } 
                }
            })
        }); 

        socket.on('recount trading time', function(data) {
            var settings = undefined;
            Settings.findOne({}, function(err, sets) {
                settings = sets
                Auction.find({}, function(err, auctions) {
                    var current = auctions.filter(function(auc) {
                        return auc.status != "archived"
                    })
                    if (current.length == 0) {
                        return
                    } else if (current.length > 0) {
                        current = current[0];
                        var lotsToSave = [];
                        current.lots.forEach(function(item, i) {
                            lotsToSave.push(function(callback) {
                                Lot.findById(item, function(err, lot) {
                                    lot.startTrading = Number(current.timeToStart) + (i * settings.tradingLot);
                                    lot.endTrading = Number(lot.startTrading) + settings.tradingLot
                                    lot.save(function(err) {
                                        callback(null, lot)
                                    })
                                })
                            })   
                        })
                        async.parallel(lotsToSave, function(err, results) {
                            io.emit('recounting lots', results) 
                        })
                    }
                })
            })       
        });

        socket.on('change settings', function(data) {
            Settings.findOne({}, function(err, sets) {
                io.emit('settings changed', sets)
            })
        })

        socket.on('buy monets', function(monets) {
            io.emit('change availability', monets)
        })
    })

    return apiRouter;
};