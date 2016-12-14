var Product    = require('../../models/product');
var Lot        = require('../../models/lot');
var Auction    = require('../../models/auction');
var Attribute  = require('../../models/attribute');
var Category   = require('../../models/category');
var Settings   = require('../../models/settings');



module.exports = function(express) {

	var apiRouter = express.Router();

	apiRouter.get('/getNewProds', function(req, res) {
        Product.find(function(err, products) {
            Settings.findOne({}, function(err, settings) {
                var count = -(settings.noveltyCount)
                products = products.slice(count)

                res.json(products);
            })
        });
    })

    apiRouter.get('/products', function(req, res) {
        Product.find(function(err, products) {
            if (err)
                res.send(err);

            res.json(products);
        });
    });

    apiRouter.get('/product/:product_id', function(req, res) {
        Product.findById(req.params.product_id, function(err, product) {
            if (err)
                res.send(err);
            Product.find({}, function(err, prods) {
                var index = prods.findIndex(function(l) {
                    return l._id == req.params.product_id;
                });
                var prev = (prods[index - 1])? prods[index - 1]._id : prods.pop()._id;
                var next = (prods[index + 1])? prods[index + 1]._id : prods.shift()._id;

                res.json({
                    prev_id: prev,
                    next_id: next,
                    current: product
                });
            })
        });
    })

    apiRouter.post('/getFilteredProdsByCategory', function(req, res) {
        Product.find({category: req.body.category}, function(err, prods) {
            if(req.body.subcategory) {
                var subcatProds = prods.filter(function(item) {
                    return item.subcategory == req.body.subcategory
                })
                res.json(subcatProds)
            } else {
                res.json(prods)
            }
        })
    })

    apiRouter.get('/searchProds/:query', function(req, res) {
        var query = new RegExp(req.params.query, 'i')        
        Product.find({"name": query}, function(err, prods) {
            res.json(prods)
        })
    })

    apiRouter.post('/filterProds', function(req, res) {
        var propKeys = Object.keys(req.body)
        var filteredProds = [];
        Product.find({}, function(err, prods) {
            filteredProds = prods
            filteredProds = filteredProds.map(function(prod) {
                prod.props.forEach(function(prop, i) {
                   prod[prop.meta] = prop.value;
                })
                return prod; 
            })
            filteredProds = filteredProds.filter(function(prod) {
                return propKeys.every(function(prop) {
                    return prod[prop] === req.body[prop];
                });
            })
            res.json(filteredProds);
        })
    })

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
    })

    apiRouter.get('/lots', function(req, res) {
        Auction.find({}).populate('lots').exec(function(err, auctions) {
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
    })

    apiRouter.get('/lot/:lot_id', function(req, res) {
        Lot.findById(req.params.lot_id, function(err, lot) {
            if (err)
                res.send(err);

            console.log(lot.auction)

            Lot.find({auction: lot.auction}, function(err, lots) {
                var index = lots.findIndex(function(l) {
                    return l._id == req.params.lot_id;
                });
                var prev = (lots[index - 1])? lots[index - 1]._id : lots.pop()._id;
                var next = (lots[index + 1])? lots[index + 1]._id : lots.shift()._id;

                res.json({
                    prev_id: prev,
                    next_id: next,
                    current: lot
                });
            })
        });     
    })

    apiRouter.post('/getFilteredLotsByCategory', function(req, res) {
        Lot.find({category: req.body.category}, function(err, lots) {
            if(req.body.subcategory) {
                var subcatLots = lots.filter(function(item) {
                    return item.subcategory == req.body.subcategory
                })
                res.json(subcatLots)
            } else {
                res.json(lots)
            }
        })
    })

    apiRouter.get('/searchLots/:query', function(req, res) {
        var query = new RegExp(req.params.query, 'i')        
        Lot.find({"name": query}, function(err, lots) {
            res.json(lots)
        })
    })

    apiRouter.post('/filterLots', function(req, res) {
        var propKeys = Object.keys(req.body)
        var filteredLots = [];
        Lot.find({}, function(err, lots) {
            filteredLots = lots
            filteredLots = filteredLots.map(function(lot) {
                lot.props.forEach(function(prop, i) {
                   lot[prop.meta] = prop.value;
                })

                return lot; 
            })
            filteredLots = filteredLots.filter(function(lot) {
                return propKeys.every(function(prop) {
                    return lot[prop] === req.body[prop];
                });
            })
            res.json(filteredLots);
        })
    })

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
    })

    apiRouter.get('/getSettings', function(req, res) {
        Settings.findOne({}, function(err, settings) {
            res.json(settings)
        })
    })

	return apiRouter
}