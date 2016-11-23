
var Attribute  = require('../../models/attribute');
var async      = require('async');


module.exports = function(express) {

	var apiRouter = express.Router();

    apiRouter.post('/appendAttribute', function(req, res) {
        async.series([
            function(callback) {
                Attribute.findOne({name: req.body.name}, function(err, attr) {
                    if(!attr)
                        callback(null, true)
                    else 
                        callback("Такое название уже существует", false)
                })
            }, function(callback) {
                Attribute.findOne({meta: req.body.meta}, function(err, attr) {
                    if(!attr)
                        callback(null, true)
                    else 
                        callback("Такое мета-имя уже существует", false)
                })
            }
        ], function(err, results) {
            if(err) {
                res.json({ 
                    success: false,
                    message: err
                });
            } else {
                var attr = new Attribute({
                    name:req.body.name,
                    meta:req.body.meta,
                    type:req.body.type,
                    values: req.body.values,
                });
                attr.save(function(err) {
                    if (err)
                        res.send(err);
                    else {
                        res.json({ 
                            success:true,
                            message: 'Attribute created!'
                        });
                    }   
                });
            }
        })
    })

    apiRouter.put('/updateAttr', function(req, res) {
        async.parallel([
            function(callback) {
                Attribute.findOne({name: req.body.name}, function(err, attr) {
                    if(!attr)
                        callback(null, true)
                    else if (attr) {
                        if(req.body._id == attr._id) {
                            callback(null, true)
                        } else {
                            callback("Такое название уже существует", false)
                        }
                    }
                })
            }, function(callback) {
                Attribute.findOne({meta: req.body.meta}, function(err, attr) {
                    if(!attr)
                        callback(null, true)
                    else if (attr) {
                        if(req.body._id == attr._id) {
                            callback(null, true)
                        } else {
                            callback("Такое мета-имя уже существует", false)
                        }
                    }
                })
            }
        ], function(err, results) {
            if(err) {
                res.json({ 
                    success: false,
                    message: 'Невозможно сохранить атрибут с такими параметрами. '+err
                });
            } else {
                Attribute.findById(req.body._id, function(err, attr) {
                    if(err)
                        res.send(err)

                    attr.name = req.body.name;
                    attr.meta = req.body.meta;
                    attr.type = req.body.type;
                    attr.values = req.body.values;

                    attr.save(function(err) {
                        if(err)
                            res.send(err)
                        res.json({
                            success: true,
                            message: "Attribute was updated!"
                        })
                    })
                })
            }
        })   
    })

    apiRouter.delete('/removeAttr/:attr_id', function(req, res) {
        Attribute.remove({_id: req.params.attr_id}, function(err) {
            if (err)
                res.send(err);

            res.json({ message: 'Successfully deleted' });
        });
    })

    return apiRouter
}