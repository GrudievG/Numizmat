var jwt         = require('jsonwebtoken');
var config      = require('../../config');
var superSecret = config.secret;



module.exports = function(express) {

	var apiRouter = express.Router();

	apiRouter.use(function(req, res, next) {
        var token = req.body.accessToken || req.param('accessToken') || req.headers['x-access-token'];
        var email = req.headers['current-user']

        if (token) {
            jwt.verify(token, superSecret, function(err, decoded) {
                if (err) {
                    return res.status(403).send({
                        success: false,
                        message: 'Failed to authenticate token.'
                    });
                } else {
                    req.decoded = decoded;
                    if(email == req.decoded.email) {
                        next();
                    } else {
                        return res.status(403).send({
                            success: false,
                            message: 'Authentication failed.'
                        });
                    }
                }
            });
        } else {    
            return res.status(403).send({
                success: false,
                message: 'No token provided.'
            });
        }
    });

    return apiRouter
}