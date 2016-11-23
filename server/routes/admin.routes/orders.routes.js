var User       = require('../../models/user');
var Order      = require('../../models/order');
var async      = require('async');

module.exports = function(express) {

	var apiRouter = express.Router();

	apiRouter.get('/getOrders', function(req, res) {
        Order.find({status: 'new'}, function(err, orders) {
            res.json(orders)
        })
    })

    apiRouter.post('/getCustomers', function(req, res) {
        var users = []
        req.body.forEach(function(item) {
            users.push(function(callback) {
                User.findById(item, function(err, user) {
                    callback(null, user.email)
                })
            })
        })
        async.parallel(users, function(err, results) {
            res.json(results)
        })
    })

    apiRouter.get('/getCustomer/:user', function(req, res) {
        User.findOne({email: req.params.user}, function(err, user) {
            res.json(user)
        })
    })

    apiRouter.get('/changeOrderStatus/:order_id', function(req, res) {
        Order.findById(req.params.order_id, function(err, order) {
            order.status = 'done';
            order.save(function(err) {
                res.json(order.status)
            })
        })
    })

    apiRouter.get('/searchOrders/:query', function(req, res) {
        var query = new RegExp(req.params.query, 'i')
        Order.find({orderNumber: query}, function(err, orders) {
            res.json(orders)
        })
    })

    return apiRouter
}