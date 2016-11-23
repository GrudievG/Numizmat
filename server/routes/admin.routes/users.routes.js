var User       = require('../../models/user');
var async      = require('async');


module.exports = function(express) {

	var apiRouter = express.Router();

    apiRouter.get('/users', function(req, res) {
        User.find(function(err, users) {
            if (err)
                res.send(err);

            res.json(users);
        });
    });

    apiRouter.post('/updateRoles', function(req, res) {
        async.series([function(callback) {
            req.body.users.forEach(function(el) {
                User.findByIdAndUpdate(el._id, {admin: el.admin}, function(err, user) {
                    if(err)
                        res.send(err)
                })
            });
            callback(null, "success");
        }], function(err, results) {
            res.json({
                success: true,
                message: "Roles was updated!"
            });
        });  
    });

    apiRouter.post('/removeUsers', function(req, res) {
        async.series([function(callback) {
            req.body.users.forEach(function(el) {
                User.findByIdAndRemove(el._id, function(err, user) {
                    if(err)
                        res.send(err)
                })
            });
            callback(null, "success");
        }], function(err, results) {
            res.json({
                success: true,
                message: "Users was deleted!"
            });
        }); 
    })

    apiRouter.delete('/removeUser/:user_id', function(req, res) {
        User.remove({_id: req.params.user_id}, function(err) {
            if (err)
                res.send(err);

            res.json({ message: 'Successfully deleted' });
        });
    })

    apiRouter.get('/searchUsers/:query', function(req, res) {
        var query = new RegExp(req.params.query, 'i')
        User.find({email: query}, function(err, users) {
            res.json(users)
        })
    })

    return apiRouter
}