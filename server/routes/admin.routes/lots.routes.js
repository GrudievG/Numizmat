

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
                            if(item.name == req.body.category) {
                                currentCategoryIndex = index;
                                currentSubcategoryIndex = item.subcats.indexOf(req.body.subcategory);
                            }
                            if(currentCategoryIndex === undefined && currentSubcategoryIndex === undefined) {
                                var categoryLength = lots.filter(function(el) {
                                    return el.category == item.name
                                })
                                lotsCounter = lotsCounter + categoryLength.length;
                            } else if(currentCategoryIndex == index && currentSubcategoryIndex == item.subcats.indexOf(req.body.subcategory)) {
                                for (var i = 0; i <= currentSubcategoryIndex; i++) {
                                    var subcategoryLength = lots.filter(function(el) {
                                        return el.subcategory == item.subcats[i]
                                    })
                                    lotsCounter = lotsCounter + subcategoryLength.length
                                } 
                            }
                        });
                        lotsCounter = lotsCounter + 1; 
                        lot.number = lotsCounter; 
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
                            lot.save(function(err, currentLot) {  
                                currentAuc.lots.push(currentLot);
                                currentAuc.save(function(err) {
                                    res.json({ 
                                        success: true,
                                        message: 'Lot created!',
                                        auction: currentAuc
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
        Auction.findById(req.body.lot.auction, function(err, auction) {
            auction.lots.splice(auction.lots.indexOf(req.body.lot._id), 1)
            auction.save(function(err) {});
        });
        var recountTradeTime = []
        req.body.lots.forEach(function(item) {
            recountTradeTime.push(function(callback) {
                Lot.findById(item._id, function(err, lot) {
                    lot.startTrading = item.startTrading;
                    lot.endTrading = item.endTrading;
                    lot.save(function(err){
                        callback(null, 'success')
                    })
                })
            })    
        })
        async.parallel(recountTradeTime, function(err, results) {
            Lot.find({auction: req.body.lot.auction}, function(err, lots) {
                var lotsCounter = req.body.lot.number+1;
                var recountLots = [];
                var lotsToRecount = lots.filter(function(el) {
                    return el.number >= lotsCounter
                })
                lotsToRecount.forEach(function(elem) {
                    recountLots.push(function(callback) {
                        Lot.findOne({number: lotsCounter}, function(err, recountLot) {
                            recountLot.number = lotsCounter-1;
                            lotsCounter++;
                            recountLot.save(function(err) {
                                callback(null, 'success');
                            })
                        });
                    })
                })
                async.series(recountLots, function(err, results) {
                    Auction.findById(req.body.lot.auction).populate('lots').exec(function(err, curAuction) {
                        res.json({
                            success: true,
                            lots: curAuction.lots
                        });
                    });       
                }); 
            })
        })  
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
                lot.name = req.body.name;
                lot.main_description = req.body.main_description;
                lot.availability = req.body.availability;
                lot.price = req.body.price;
                lot.imgIds = req.body.imgIds;
                req.body.props.forEach(function(el) {
                    props.push({
                        name: el.name,
                        meta: el.meta,
                        value: el.currentValue
                    });
                });
                lot.props = props;
                if(lot.category != req.body.category || lot.subcategory != req.body.subcategory) {
                    lot.category = req.body.category;
                    lot.subcategory = req.body.subcategory;
                    Lot.find({auction: req.body.auction}, function(err, lots) {
                        var recountLots = [];
                        lots.forEach(function(elem) {
                            recountLots.push(function(callback) {
                                Lot.findById(elem._id, function(err, recountLot) {
                                    if(recountLot.number > lot.number) {
                                        recountLot.number = recountLot.number-1;
                                        recountLot.save(function(err, newLot) {
                                            callback(null, newLot);
                                        });
                                    } else {
                                        callback(null, recountLot);
                                    } 
                                        
                                });
                            });
                        });

                        async.series(recountLots, function(err, newlots) {
                            Category.find({}, function(err, cats) {
                                var currentCategoryIndex = undefined;
                                var currentSubcategoryIndex = undefined;
                                var lotsCounter = 0;
                                cats.forEach(function(item, index) {
                                    if(item.name == req.body.category) {
                                        currentCategoryIndex = index;
                                        currentSubcategoryIndex = item.subcats.indexOf(req.body.subcategory);
                                    }
                                    if(currentCategoryIndex === undefined && currentSubcategoryIndex === undefined) {
                                        var categoryLength = newlots.filter(function(el) {
                                            return el.category == item.name && el._id != req.body.id
                                        })
                                        lotsCounter = lotsCounter + categoryLength.length;
                                    } else if(currentCategoryIndex === index && currentSubcategoryIndex === item.subcats.indexOf(req.body.subcategory)) {
                                        for (var i = 0; i <= currentSubcategoryIndex; i++) {
                                            var subcategoryLength = newlots.filter(function(el) {
                                                return el.subcategory == item.subcats[i] && el._id != req.body.id
                                            })
                                            lotsCounter = lotsCounter + subcategoryLength.length;
                                        } 
                                    }
                                });
                                lotsCounter = lotsCounter + 1; 
                                lot.number = lotsCounter; 
                                recountLots = [];
                                var willBeRecount = newlots.filter(function(el) {
                                    return el.number >= lotsCounter && el._id != req.body.id
                                })
                                willBeRecount.forEach(function(elem) {
                                    recountLots.push(function(callback) {
                                        Lot.findById(elem._id, function(err, recountLot) {
                                            recountLot.number = recountLot.number + 1;
                                            recountLot.save(function(err) {
                                                callback(null, 'success')
                                            })
                                        });
                                    })
                                })
                                async.series(recountLots, function(err, results) {
                                    lot.save(function(err, currentLot) {  
                                        res.json({ 
                                            success: true,
                                            message: 'Lot updated!'
                                        });  
                                    });
                                }); 
                            });
                        });
                    }); 
                }  
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
                    if(lot.category != req.body.category || lot.subcategory != req.body.subcategory) {
                        lot.category = req.body.category;
                        lot.subcategory = req.body.subcategory;
                        Lot.find({auction: req.body.auction}, function(err, lots) {
                            var recountLots = [];
                            lots.forEach(function(elem) {
                                recountLots.push(function(callback) {
                                    Lot.findById(elem._id, function(err, recountLot) {
                                        if(recountLot.number > lot.number) {
                                            recountLot.number = recountLot.number-1;
                                            recountLot.save(function(err, newLot) {
                                                callback(null, newLot);
                                            });
                                        } else {
                                            callback(null, recountLot);
                                        } 
                                            
                                    });
                                });
                            });

                            async.series(recountLots, function(err, newlots) {
                                Category.find({}, function(err, cats) {
                                    var currentCategoryIndex = undefined;
                                    var currentSubcategoryIndex = undefined;
                                    var lotsCounter = 0;
                                    cats.forEach(function(item, index) {
                                        if(item.name == req.body.category) {
                                            currentCategoryIndex = index;
                                            currentSubcategoryIndex = item.subcats.indexOf(req.body.subcategory);
                                        }
                                        if(currentCategoryIndex === undefined && currentSubcategoryIndex === undefined) {
                                            var categoryLength = newlots.filter(function(el) {
                                                return el.category == item.name && el._id != req.body.id
                                            })
                                            lotsCounter = lotsCounter + categoryLength.length;
                                        } else if(currentCategoryIndex === index && currentSubcategoryIndex === item.subcats.indexOf(req.body.subcategory)) {
                                            for (var i = 0; i <= currentSubcategoryIndex; i++) {
                                                var subcategoryLength = newlots.filter(function(el) {
                                                    return el.subcategory == item.subcats[i] && el._id != req.body.id
                                                })
                                                lotsCounter = lotsCounter + subcategoryLength.length;
                                            } 
                                        }
                                    });
                                    lotsCounter = lotsCounter + 1; 
                                    lot.number = lotsCounter; 
                                    recountLots = [];
                                    var willBeRecount = newlots.filter(function(el) {
                                        return el.number >= lotsCounter && el._id != req.body.id
                                    })
                                    willBeRecount.forEach(function(elem) {
                                        recountLots.push(function(callback) {
                                            Lot.findById(elem._id, function(err, recountLot) {
                                                recountLot.number = recountLot.number + 1;
                                                recountLot.save(function(err) {
                                                    callback(null, 'success')
                                                })
                                            });
                                        })
                                    })
                                    async.series(recountLots, function(err, results) {
                                        lot.save(function(err, currentLot) { 
                                            req.files.photos.forEach(function (el) { 
                                                var path = el.path;
                                                fs.unlink(path)
                                            }); 
                                            res.json({ 
                                                success: true,
                                                message: 'Lot updated!'
                                            });  
                                        });
                                    }); 
                                });
                            });
                        }); 
                    }
                })
            })  
        }
    });

    return apiRouter
}