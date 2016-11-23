module.exports = function(express) {

    var apiRouter          = express.Router();
    var productsRoutes     = require('./products.routes')(express);
    var usersRoutes        = require('./users.routes')(express);
    var attributeRoutes    = require('./attributes.routes')(express);
    var categoriesRoutes   = require('./categories.routes')(express);
    var auctionRoutes      = require('./auction.routes')(express);
    var lotsRoutes         = require('./lots.routes')(express);
    var ordersRoutes       = require('./orders.routes')(express);

    apiRouter.use(productsRoutes);   // work with products   ---------------------------------
    apiRouter.use(usersRoutes);      // work with users      ---------------------------------
    apiRouter.use(attributeRoutes);  // work with attributes ---------------------------------
    apiRouter.use(categoriesRoutes); // work with categories ---------------------------------
    apiRouter.use(auctionRoutes);    // work with auction    ---------------------------------
    apiRouter.use(lotsRoutes);       //  work with lots      ---------------------------------
    apiRouter.use(ordersRoutes);     // work with orders     ---------------------------------

    return apiRouter;
}