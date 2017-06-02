var Product    = require('../../models/product');
var Lot        = require('../../models/lot');
var Auction    = require('../../models/auction');
var Attribute  = require('../../models/attribute');
var Category   = require('../../models/category');
var Settings   = require('../../models/settings');
var async      = require('async');



module.exports = function(express) {

	var apiRouter = express.Router();

    function sortByDate (a, b) {
        if (a.createdAt > b.createdAt) return -1;
        if (a.createdAt < b.createdAt) return 1;
    };

	apiRouter.get('/getNewProds', function(req, res) {
        Product.find(function(err, products) {
            Settings.findOne({}, function(err, settings) {
                var count = -(settings.noveltyCount)
                products = products.slice(count)

                res.json(products);
            })
        });
    });

    apiRouter.get('/products', function(req, res) {

        Product.find(function(err, products) {

            if (err) {
                return res.send(err);
            }

            products = products.sort(sortByDate);
            res.json(products);
        });
    });

    apiRouter.get('/product/:product_id', function(req, res) {
        Product.findById(req.params.product_id, function(err, product) {

            if (err) {
                return res.send(err);
            }

            Product.find({}, function(err, prods) {
                var index = prods.findIndex(function(l) {
                    return l._id == req.params.product_id;
                });
                var next = (prods[index - 1])? prods[index - 1]._id : prods.pop()._id;
                var prev = (prods[index + 1])? prods[index + 1]._id : prods.shift()._id;

                res.json({
                    prev_id: prev,
                    next_id: next,
                    current: product
                });
            })
        });
    });

    apiRouter.post('/filterProds', function(req, res) {

        var query = new RegExp(req.body.query, 'i');
        var propKeys;
        var filteredProds = [];

        if (req.body.filter) {
            propKeys = Object.keys(req.body.filter);
        } else {
            propKeys = [];
        }

        Product.find({name: query}, function(err, prods) {

            if(req.body.category != 'all') {
                prods = prods.filter(function(lot) {
                    return lot.category == req.body.category
                })
            }

            if(req.body.subcategory != 'all') {
                prods = prods.filter(function(lot) {
                    return lot.subcategory == req.body.subcategory
                })
            }

            filteredProds = prods
            filteredProds = filteredProds.map(function(prod) {
                prod.props.forEach(function(prop, i) {
                   prod[prop.meta] = prop.value;
                })
                return prod; 
            });

            if(req.body.filter) {
                filteredProds = filteredProds.filter(function(prod) {
                    return propKeys.every(function(prop) {
                        return prod[prop] === req.body.filter[prop];
                    });
                })
            }

            filteredProds = filteredProds.sort(sortByDate);
            res.json(filteredProds);
        })
    });

    apiRouter.get('/searchLots/:query', function(req, res) {
        var query = new RegExp(req.params.query, 'i')        
        Lot.find({"name": query}, function(err, lots) {
            res.json(lots)
        })
    });

    apiRouter.get('/getPublicAuction', function(req, res) {
        Auction.find({}).populate('lots').exec(function(err, auctions) {
            var public = auctions.filter(function(auc) {
                return auc.status == "published"
            })

            if (public.length > 0) {
                res.json({
                    success: true,
                    auction: public[0]
                })
            } else if (public.length == 0) {
                res.json({
                    success: false
                })
            }
        })
    });

    apiRouter.get('/getCurrentAuction', function(req, res) {
        Auction.find({}, function(err, auctions) {
            var current = auctions.filter(function(auc) {
                return auc.status == "published"
            })
            if (current.length > 0) {
                res.json({
                    success: true,
                    auction: current[0]
                })
            } else if (current.length == 0) {
                res.json({
                    success: false
                })
            }
        })
    });

    apiRouter.get('/lots/:auction_id', function(req, res) {
        Lot.find({auction: req.params.auction_id}, function(err, lots) {
            res.json({lots})
        })
    });

    apiRouter.get('/activeLot/:auction_id', function (req, res) {
        var currentTime = Date.now();
        Lot.findOne({
            auction: req.params.auction_id,
            startTrading: {$lt: currentTime},
            endTrading: {$gt: currentTime}
        })
        .then(function(lot) {
            res.json(lot);
        });
    })

    apiRouter.get('/lot/:lot_id', function(req, res) {
        Lot.findById(req.params.lot_id, function(err, lot) {
            
            var auction_id = lot.auction;
            var prevNumber = lot.number - 1;
            var nextNumber = lot.number + 1;

            async.parallel([
                function(callback) {
                    Lot.findOne({number: prevNumber, auction: auction_id}, function(err, prevLot) {
                        if (prevLot === null) {
                            Lot.find({auction: lot.auction}, function(err, lots) {
                                prevLot = lots.filter(function(el) {
                                    return el.number == lots.length
                                })
                                callback(null, prevLot[0])
                            })
                        } else
                            callback(null, prevLot)
                    })
                }, function(callback) {
                    Lot.findOne({number: nextNumber, auction: auction_id}, function(err, nextLot) {
                        if (nextLot === null) {
                            Lot.findOne({number: 1, auction: lot.auction}, function(err, llot) {
                                callback(null, llot)
                            })
                        } else 
                            callback(null, nextLot)
                    })
                }
            ], function(err, results) {
                res.json({
                    prev_id: results[0]._id,
                    next_id: results[1]._id,
                    current: lot
                });
            });
        });     
    }); 

    apiRouter.get('/searchProds/:query', function(req, res) {
        var query = new RegExp(req.params.query, 'i')        
        Product.find({"name": query}, function(err, prods) {
            res.json(prods)
        })
    });

    apiRouter.post('/filterLots', function(req, res) {
        var query = new RegExp(req.body.query, 'i');
        var propKeys;
        if (req.body.filter) {
            propKeys = Object.keys(req.body.filter);
        } else {
            propKeys = [];
        }
        var filteredLots = [];
        Lot.find({
            name: query,
            auction: req.body.auction
        }, function(err, lots) {
            if(req.body.category != 'all') {
                lots = lots.filter(function(lot) {
                    return lot.category == req.body.category
                })
            }
            if(req.body.subcategory != 'all') {
                lots = lots.filter(function(lot) {
                    return lot.subcategory == req.body.subcategory
                })
            }

            filteredLots = lots
            filteredLots = filteredLots.map(function(lot) {
                lot.props.forEach(function(prop, i) {
                   lot[prop.meta] = prop.value;
                })
                return lot; 
            })
            if (req.body.filter) {
                filteredLots = filteredLots.filter(function(lot) {
                    return propKeys.every(function(prop) {
                        return lot[prop] === req.body.filter[prop];
                    });
                })
            }
            res.json(filteredLots);
        })
    });

	apiRouter.get('/getAttributes', function(req, res) {
        Attribute.find(function(err, attrs) {
            if (err)
                res.send(err);

            res.json(attrs);
        });
    });

    apiRouter.get('/getCategories', function(req, res) {
        Category.find(function(err, cats) {
            if (err)
                res.send(err);

            res.json(cats);
        });
    });

    apiRouter.get('/getSettings', function(req, res) {
        Settings.findOne({}, function(err, settings) {
            res.json(settings)
        })
    });

	return apiRouter
}