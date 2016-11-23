
var Category   = require('../../models/category');

module.exports = function(express) {

	var apiRouter = express.Router();

    apiRouter.post('/appendCategory', function(req, res) {
        Category.findOne({name: req.body.name}, function(err, cat) {
            if(cat) {
                res.json({
                    success: false,
                    message: "Категория с таким названием уже существует"
                })
            } else if(!cat) {
                var cat = new Category ({
                    name: req.body.name,
                    subcats: req.body.subcats
                })

                cat.save(function(err) {
                    res.json({
                        success: true,
                        message: "Category was created!"
                    })
                })
            }
        })
    })

    apiRouter.put('/updateCategory', function(req, res) {
        Category.findOne({name: req.body.name}, function(err, cat) {
            if (cat) {
                if(req.body._id == cat._id) {
                    cat.name = req.body.name;
                    cat.subcats = req.body.subcats;

                    cat.save(function(err) {
                        res.json({
                            success: true,
                            message: "Category was updated!"
                        })
                    })
                } else {
                    res.json({
                        success: false,
                        message: "Категория с таким названием уже существует"
                    })
                }
            } else if (!cat) {
                Category.findById(req.body._id, function(err, cat) {
                    cat.name = req.body.name;
                    cat.subcats = req.body.subcats;

                    cat.save(function(err) {
                        res.json({
                            success: true,
                            message: "Category was updated!"
                        })
                    })
                })
            }
        })
    })

    apiRouter.delete('/removeCategory/:cat_id', function(req, res) {
        Category.remove({_id: req.params.cat_id}, function(err) {
            if (err)
                res.send(err);

            res.json({ message: 'Successfully deleted' });
        });
    })

    return apiRouter
}