
var Product    = require('../../models/product');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var config     = require('../../../config');
var cloudinary = require('cloudinary');
var async      = require('async');
var fs         = require('fs');

cloudinary.config(config.cloudinaryConf);

module.exports = function(express) {

	var apiRouter = express.Router();

    apiRouter.post('/addProduct', multipartMiddleware, function(req, res) {

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

            if (err) {
                res.send(err);
            }

            var product = new Product();

            req.body.props.forEach(function(el){
                product.props.push({
                    name: el.name,
                    meta: el.meta,
                    value: el.currentValue
                });
            });

            product.name = req.body.name;
            product.main_description = req.body.main_description;
            product.imgIds = results;
            product.availability = req.body.availability;
            product.price = req.body.price;
            product.category = req.body.category;
            product.subcategory = req.body.subcategory;

            product.save(function(err) {
                if (err) {
                    res.send(err);
                }

                req.files.photos.forEach(function (el) { 
                    var path = el.path;
                    fs.unlink(path)
                });

                res.json({ 
                    success:true,
                    message: 'Product created!' });
            });
        })      
    });

    apiRouter.post('/changeAvailability', function(req, res) {
        async.series([function(callback) {
            req.body.forEach(function(el) {
                Product.findByIdAndUpdate(el._id, {availability: el.availability}, function(err, user) {
                    if(err)
                        res.send(err)
                })
            });
            callback(null, "success");
        }], function(err, results) {
            res.json({
                success: true,
                message: "Availabilities was updated!"
            });
        });  
    });

    apiRouter.post('/changeProduct', multipartMiddleware, function(req, res) {
        if (Object.keys(req.files).length == 0) {

            Product.findById(req.body.id, function(err, product) {
                var arrToRemove = product.imgIds.filter(function(value) {
                    return (req.body.imgIds.indexOf(value) == -1)
                })
                arrToRemove.forEach(function(el) {
                    cloudinary.uploader.destroy(el, function(result) {})
                })
                var props = [];
                product.name = req.body.name;
                product.main_description = req.body.main_description;
                product.availability = req.body.availability;
                product.price = req.body.price;
                product.imgIds = req.body.imgIds;
                product.category = req.body.category;
                product.subcategory = req.body.subcategory;
                req.body.props.forEach(function(el){
                    props.push({
                        name: el.name,
                        meta: el.meta,
                        value: el.currentValue
                    });
                });
                product.props = props;
                product.save(function(err) {
                    if (err) {
                        res.send(err);
                    }

                    res.json({ 
                        success:true,
                        message: 'Product updated!' 
                    });
                });     
            })

        } else {

            Product.findById(req.body.id, function(err, product) {
                var newIds = [];
                var imgToUpload = [];
                var arrToRemove = [];
                if(req.body.imgIds == 0) {
                    arrToRemove = product.imgIds
                } else {
                    newIds = req.body.imgIds
                    arrToRemove = product.imgIds.filter(function(value) {
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
                    product.name = req.body.name;
                    product.main_description = req.body.main_description;
                    product.availability = req.body.availability;
                    product.price = req.body.price;
                    product.imgIds = newIds;
                    product.category = req.body.category;
                    product.subcategory = req.body.subcategory;
                    req.body.props.forEach(function(el){
                        props.push({
                            name: el.name,
                            meta: el.meta,
                            value: el.currentValue
                        });
                    });
                    product.props = props;
                    product.save(function(err) {
                        if (err) {
                            res.send(err);
                        }
                        req.files.photos.forEach(function (el) { 
                            var path = el.path;
                            fs.unlink(path)
                        });
                        res.json({ 
                            success:true,
                            message: 'Product updated!' 
                        });
                    });
                })
            })  
        }
    });

    apiRouter.post('/removeProds', function(req, res) {

        async.series([function(callback) {
            req.body.forEach(function(el) {
                Product.findByIdAndRemove(el._id, function(err) {
                    if(err)
                        res.send(err)
                })

                el.imgIds.forEach(function(id) {
                    cloudinary.uploader.destroy(id, function(result) {})
                })

            });
            callback(null, "success");
        }], function(err, results) {
            res.json({
                success: true,
                message: "Product was deleted!"
            });
        }); 
    });

    apiRouter.post('/removeProduct', function(req, res) {
        Product.remove({_id: req.body._id}, function(err) {
            if (err)
                res.send(err);
            req.body.imgIds.forEach(function(id) {
                cloudinary.uploader.destroy(id, function(result) {})
            })

            res.json({ message: 'Successfully deleted' });
        });
    });

    return apiRouter
}