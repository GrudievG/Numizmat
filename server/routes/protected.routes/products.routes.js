var User       = require('../../models/user');
var Order      = require('../../models/order');
var Product    = require('../../models/product')
var async      = require('async');


module.exports = function(express) {

	var apiRouter = express.Router();

	apiRouter.post('/product/isInBasket', function(req, res) {
        User.findById(req.body.user_id, function(err, user) {
            if (user.basket.indexOf(req.body.product_id) < 0)
                res.json({success:false})
            else 
                res.json({success:true})
        });
    });

    apiRouter.put('/product/addToBasket', function(req, res) {
        User.findById(req.body.user_id, function(err, user) {
            user.basket.push(req.body.product)
            user.save(function(err) {
                if (err)
                    res.send(err);
                res.json({ 
                    success: true,
                    message: 'Товар добавлен в корзину!'
                });
            });
        })
    });

    apiRouter.get('/basketProducts/:user_id', function(req, res) {
        User.findById(req.params.user_id).populate('basket orders').exec(function(err, user) {
            var orders = user.orders.filter(function(item) {
                return item.status == 'new'
            })
            res.json({
                basket: user.basket,
                orders: orders
            });
        });   
    });

    apiRouter.put('/product/removeFromBasket',function(req, res) {
        User.findById(req.body.user_id, function(err, user) {
            user.basket.splice(user.basket.indexOf(req.body.product_id), 1)
            user.save(function(err) {
                res.json({ 
                    success: true,
                    products: 'Товар удален из корзины!'
                });
            });
        });
    });

    apiRouter.post('/createOrder', function(req, res) {
        var soldItems = [];
        req.body.items.forEach(function(item) {
            if (!item.availability)
                soldItems.push(item.name)
        })
        if(soldItems.length > 0) {
            res.json({
                success: false,
                soldItems: soldItems
            })
        } else {
            var query = new RegExp(req.body.date, 'i')
            Order.find({orderNumber: query}, function(err, orders) {
                var prodsToRemove = [];
                var orderNumber = req.body.date + String(orders.length + 1);
                var order = new Order({
                    comment: req.body.comment,
                    items: req.body.items,
                    customer: req.body.user_id,
                    price: req.body.price,
                    orderNumber: orderNumber,
                    status: 'new'
                })

                order.save(function(err) {
                    User.findById(req.body.user_id).populate('basket orders').exec(function(err, user) {
                        user.orders.push(order);
                        req.body.items.forEach(function(el) {
                            user.basket = user.basket.filter(function(item) {
                                return !(item._id == el._id);
                            });
                            prodsToRemove.push(function(callback) {
                                Product.findById(el._id, function(err, product) {
                                    product.availability = false;
                                    product.save(function(err) {
                                        callback(null, 'success')
                                    })
                                })
                            })
                        })
                        async.parallel(prodsToRemove, function(err, results) {
                            user.save(function(err) {
                                res.json({
                                    success: true,
                                    basket: user.basket,
                                    orders: user.orders
                                })
                            })
                        })
                    });
                });
            })
        }    
    });

	return apiRouter
}