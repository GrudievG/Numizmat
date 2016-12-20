
var Category   = require('../../models/category');
var Lot        = require('../../models/lot');
var async      = require('async');

module.exports = function(express) {

	var apiRouter = express.Router();

    apiRouter.post('/appendCategory', function(req, res) {
        Category.findOne({name: req.body.name}, function(err, cat) {
            if(cat) {
                res.json({
                    success: false,
                    message: "Категория с таким названием уже существует"
                })
            } else if(!cat) {
                var cat = new Category ({
                    name: req.body.name,
                    subcats: req.body.subcats
                })

                cat.save(function(err) {
                    res.json({
                        success: true,
                        message: "Category was created!"
                    })
                })
            }
        })
    })

    apiRouter.put('/updateCategory', function(req, res) {
        Category.findOne({name: req.body.newcategory.name}, function(err, cat) {
            if (cat) {
                if(req.body.newcategory._id == cat._id) {
                    cat.name = req.body.newcategory.name;
                    cat.subcats = req.body.newcategory.subcats;

                    cat.save(function(err) {
                        req.body.oldcategory.subcats.forEach(function(item) {
                            Lot.find({
                                category: req.body.oldcategory.name,
                                subcategory: item
                            }, function(err, lots) {
                                lots.forEach(function(lot) {
                                    if (req.body.newcategory.subcats.indexOf(item) == -1) {
                                        lot.subcategory = undefined;
                                        lot.save(function(err) {})
                                    }
                                })
                            })
                        })
                        res.json({
                            success: true,
                            message: "Category was updated!"
                        })
                    })
                } else {
                    res.json({
                        success: false,
                        message: "Категория с таким названием уже существует"
                    })
                }
            } else if (!cat) {
                Category.findById(req.body.newcategory._id, function(err, cat) {
                    cat.name = req.body.newcategory.name;
                    cat.subcats = req.body.newcategory.subcats;

                    cat.save(function(err) {
                        Lot.find({category: req.body.oldcategory.name}, function(err, lots) {
                            var rewriteLots = [];
                            lots.forEach(function( el) {
                                rewriteLots.push(function(callback) {
                                    el.category = req.body.newcategory.name,
                                    el.save(function(err, elem) {
                                        callback(null, elem)
                                    })
                                })    
                            })
                            async.parallel(rewriteLots, function(err, results) {
                                req.body.oldcategory.subcats.forEach(function(item) {
                                    var filterLots = results.filter(function(el) {
                                        return el.subcategory == item
                                    });

                                    filterLots.forEach(function(lot) {
                                        if (req.body.newcategory.subcats.indexOf(item) == -1) {
                                            lot.subcategory = undefined;
                                        }
                                        lot.save(function(err) {})
                                    })
                                })
                            })
                        })

                        res.json({
                            success: true,
                            message: "Category was updated!"
                        })
                    })
                })
            }
        })
    })

    apiRouter.post('/removeCategory', function(req, res) {
        Lot.find({category: req.body.name}, function(err, lots) {
            lots.forEach(function(lot) {
                lot.category = undefined;
                lot.subcategory = undefined;
                lot.save(function(err) {})
            })
        })
        Category.remove({_id: req.body._id}, function(err) {
            if (err)
                res.send(err);

            res.json({ message: 'Successfully deleted' });
        });
    })

    return apiRouter
}