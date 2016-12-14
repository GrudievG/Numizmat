

var Auction    = require('../../models/auction');
var Category   = require('../../models/category');
var Lot        = require('../../models/lot');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var config     = require('../../../config');
var cloudinary = require('cloudinary');
var async      = require('async');
var fs         = require('fs');

cloudinary.config(config.cloudinaryConf);


module.exports = function(express) {

	var apiRouter = express.Router();


	apiRouter.post('/addLot', multipartMiddleware, function(req, res) {
        var ImgsToUpload = [];
        req.files.photos.forEach(function (el) { 
            var path = el.path;
            ImgsToUpload.push(function(callback){ 
                cloudinary.uploader.upload(path, function(result){
                    callback(null, result.public_id);
                }, {quality: "auto"})
            })
        });
        async.parallel(ImgsToUpload, function(err, results) {
            var currentAuc = undefined;
            Auction.find({}, function(err, auctions) {
                var aucs = auctions.filter(function(auc) {
                    return auc.status != "archived"
                })
                currentAuc = aucs[0];
                var lot = new Lot();
                req.body.props.forEach(function(el){
                    lot.props.push({
                        name: el.name,
                        meta: el.meta,
                        value: el.currentValue
                    });
                });
                lot.auction = currentAuc._id;
                lot.name = req.body.name;
                lot.main_description = req.body.main_description;
                lot.imgIds = results;
                lot.top = req.body.top;
                lot.price = req.body.price;
                lot.category = req.body.category;
                lot.subcategory = req.body.subcategory;
                lot.bets = 0;
                lot.startTrading = req.body.startTrading;
                lot.endTrading = req.body.endTrading;

                Lot.find({auction: currentAuc._id}, function(err, lots) {
                    Category.find({}, function(err, cats) {
                        var currentCategoryIndex = undefined;
                        var currentSubcategoryIndex = undefined;
                        var lotsCounter = 0;
                        cats.forEach(function(item, index) {
                            // console.log('lotsCounter as start dorEach: ', lotsCounter)
                            // console.log('forEach indexes: ', index, item.subcats.indexOf(req.body.subcategory))
                            if(item.name == req.body.category) {
                                currentCategoryIndex = index;
                                currentSubcategoryIndex = item.subcats.indexOf(req.body.subcategory);
                            }
                            // console.log(currentCategoryIndex, currentSubcategoryIndex)
                            if(currentCategoryIndex === undefined && currentSubcategoryIndex === undefined) {
                                // console.log('!currentCategoryIndex && !currentSubcategoryIndex')
                                var categoryLength = lots.filter(function(el) {
                                    return el.category == item.name
                                })
                                lotsCounter = lotsCounter + categoryLength.length;
                            } else if(currentCategoryIndex == index && currentSubcategoryIndex == item.subcats.indexOf(req.body.subcategory)) {
                                // console.log('current indexes equals')
                                for (var i = 0; i <= currentSubcategoryIndex; i++) {
                                    // console.log('i=' + i + ' cicle for')
                                    var subcategoryLength = lots.filter(function(el) {
                                        return el.subcategory == item.subcats[i]
                                    })
                                    lotsCounter = lotsCounter + subcategoryLength.length
                                    // console.log('lotsCounter: ', lotsCounter)
                                } 
                            }
                        });
                        // console.log('lotsCounter pered lot number: ', lotsCounter)
                        lotsCounter = lotsCounter + 1; 
                        lot.number = lotsCounter; 
                        // console.log('lotsCounter posle lot number: ', lot.number)
                        var recountLots = []
                        var willBeRecount = lots.filter(function(el) {
                            return el.number >= lotsCounter
                        })
                        willBeRecount.forEach(function(elem) {
                            recountLots.push(function(callback) {
                                Lot.findOne({number: lotsCounter}, function(err, recountLot) {
                                    lotsCounter++; 
                                    recountLot.number = lotsCounter;
                                    callback(null, 'success')
                                    recountLot.save(function(err) {})
                                });
                            })
                        })
                        async.series(recountLots, function(err, results) {
                            lot.save(function(err) {  
                                Lot.findOne({
                                    name: req.body.name,
                                    auction: currentAuc._id
                                }, function(err, currentLot) {
                                    currentAuc.lots.push(currentLot);
                                    currentAuc.save(function(err) {
                                        res.json({ 
                                            success: true,
                                            message: 'Lot created!',
                                            auction: currentAuc
                                        });
                                    });
                                });
                                req.files.photos.forEach(function (el) { 
                                    var path = el.path;
                                    fs.unlink(path);
                                });   
                            });
                        }); 
                    });
                })
            })     
        })          
    });

    apiRouter.post('/removeLot', function(req, res) {
        Lot.findByIdAndRemove(req.body.lot._id, function(err) {
            req.body.lot.imgIds.forEach(function(id) {
                cloudinary.uploader.destroy(id, function(result) {})
            })
        })
        req.body.lots.forEach(function(item) {
            Lot.findById(item._id, function(err, lot) {
                lot.startTrading = item.startTrading;
                lot.endTrading = item.endTrading;
                lot.save(function(err){})
            })
        })
        Auction.findById(req.body.lot.auction, function(err, auction) {
            auction.lots.splice(auction.lots.indexOf(req.body.lot._id), 1)
            auction.save(function(err) {
                res.json({
                    success: true,
                    lots: auction.lots
                });
            });
        });
    });

    apiRouter.post('/updateLot', multipartMiddleware, function(req, res) {
        if (Object.keys(req.files).length == 0) {

            Lot.findById(req.body.id, function(err, lot) {
                var arrToRemove = lot.imgIds.filter(function(value) {
                    return (req.body.imgIds.indexOf(value) == -1)
                })
                arrToRemove.forEach(function(el) {
                    cloudinary.uploader.destroy(el, function(result) {})
                })
                var props = [];
                lot.top = req.body.top;
                lot.category = req.body.category;
                lot.subcategory = req.body.subcategory;
                lot.name = req.body.name;
                lot.main_description = req.body.main_description;
                lot.availability = req.body.availability;
                lot.price = req.body.price;
                lot.imgIds = req.body.imgIds;
                req.body.props.forEach(function(el){
                    props.push({
                        name: el.name,
                        meta: el.meta,
                        value: el.currentValue
                    });
                });
                lot.props = props;
                lot.save(function(err) {
                    if (err) {
                        res.send(err);
                    }

                    res.json({ 
                        success:true,
                        message: 'Lot updated!' 
                    });
                });     
            })

        } else {

            Lot.findById(req.body.id, function(err, lot) {
                var newIds = [];
                var imgToUpload = [];
                var arrToRemove = [];
                if(req.body.imgIds == 0) {
                    arrToRemove = lot.imgIds
                } else {
                    newIds = req.body.imgIds
                    arrToRemove = lot.imgIds.filter(function(value) {
                        return (req.body.imgIds.indexOf(value) == -1)
                    })
                }
                arrToRemove.forEach(function(el) {
                    cloudinary.uploader.destroy(el, function(result) {})
                })
                req.files.photos.forEach(function(el) {
                    var index = el.fieldName.slice(7,8);
                    imgToUpload.push(function(callback) { 
                        cloudinary.uploader.upload(el.path, function(result){
                            callback(null, {
                                id: result.public_id,
                                index: index
                            });
                        }, {quality: "auto"})
                    })
                })
                async.parallel(imgToUpload, function(err, results) {
                    var props = [];
                    results.forEach(function(el) {
                        if(newIds[el.index]) {
                            cloudinary.uploader.destroy(newIds[el.index], function(result) {})
                            newIds[el.index] = el.id;
                        } else if (!newIds[el.index]) {
                            newIds.push(el.id)
                        }
                    })
                    lot.top = req.body.top;
                    lot.category = req.body.category;
                    lot.subcategory = req.body.subcategory;
                    lot.name = req.body.name;
                    lot.main_description = req.body.main_description;
                    lot.availability = req.body.availability;
                    lot.price = req.body.price;
                    lot.imgIds = newIds;
                    req.body.props.forEach(function(el){
                        props.push({
                            name: el.name,
                            meta: el.meta,
                            value: el.currentValue
                        });
                    });
                    lot.props = props;
                    lot.save(function(err) {
                        if (err) {
                            res.send(err);
                        }
                        req.files.photos.forEach(function (el) { 
                            var path = el.path;
                            fs.unlink(path)
                        });
                        res.json({ 
                            success:true,
                            message: 'Lot updated!' 
                        });
                    });
                })
            })  
        }
    });

    return apiRouter
}