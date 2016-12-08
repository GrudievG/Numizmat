// BASE SETUP ======================================

var express        = require('express');
var app            = express();
var bodyParser     = require('body-parser');
var methodOverride = require('method-override');
var morgan         = require('morgan');
var mongoose       = require('mongoose');
var path           = require('path');
var config         = require('./config');
var http           = require('http').createServer(app);
var io             = require('socket.io')(http);

// APP CONFIGURATION ===============================

	// use body parser so we can grab information from POST requests
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(bodyParser.json());

	// configure our app to handle CORS requests
	app.use(function(req, res, next) {
		res.setHeader('X-Powered-By', 'GG');
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
		res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, Authorization');
		next();
	});

	// log all requests to the console
	app.use(morgan('dev'));

	// connect to our mongoDB database 
	mongoose.Promise = global.Promise;
	mongoose.connect(config.database); 

	// override with the X-HTTP-Method-Override header in the request. simulate DELETE/PUT
	app.use(methodOverride('X-HTTP-Method-Override')); 

	// set the static files location /client/img will be /img for users
	app.use(express.static(__dirname + '/client')); 

// ROUTES ======================================

	// api routes
	var apiRoutes = require('./server/routes/api')(app, express, io);

	app.use('/api', apiRoutes);
	app.use(require('prerender-node').set('prerenderServiceUrl', 'http://localhost:1337/').set('prerenderToken', '4STbks8F2IoVuiCtR8bd'));

	// route to handle all angular requests
	app.get('*', function(req, res) {
	    res.sendFile(path.join(__dirname + '/client/index.html')); // load our client/index.html file
	});

// START THE SERVER ========================================
http.listen(config.port);                                 
console.log('Magic happens on port ' + config.port);
	
	
