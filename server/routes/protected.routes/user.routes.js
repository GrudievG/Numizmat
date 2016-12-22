var User       = require('../../models/user');
var config     = require('../../../config');
var nodemailer = require('nodemailer');

module.exports = function(express) {

	var apiRouter = express.Router();
    var transporter = nodemailer.createTransport(config.emailTransport);

	apiRouter.get('/getUserBets/:user_id', function(req, res) {
        User.findById(req.params.user_id).populate('bets.lot').exec(function(err, user) {
            user.bets.forEach(function(bet) {
                if (bet.lot == null) {
                    user.bets.splice(user.bets.indexOf(bet), 1)
                }
            })
            user.save(function(err, savedUser) {
                res.json(savedUser.bets);
            })
            
        });
    })
     
    apiRouter.route('/user/:user_id')
        .get(function(req, res) {
            User.findById(req.params.user_id, function(err, user) {
                if (err)
                    res.send(err);
                res.json(user);
            });
        })
        .put(function(req, res) {
            if (req.body.currentEmail == req.body.email) {
                User.findById(req.params.user_id, function(err, user) {

                    user.name = req.body.name;
                    user.surname = req.body.surname;
                    user.tel = req.body.tel;
                    user.country = req.body.country;
                    user.region = req.body.region;
                    user.locality = req.body.locality;
                    user.postIndex = req.body.postIndex;
                    user.address = req.body.address;

                    user.save(function(err) {
                        if (err)
                            res.send(err);

                        res.json({ 
                            success: true,
                            message: 'User updated!'
                        });
                    });
                });
            } else {
                User.findOne({email: req.body.email}, function(err, user) {
                    if(err)
                        res.send(err);
                    if(user) {
                        res.json({ 
                            success: false,
                            message: 'Пользователь с таким email уже существует.'
                        });
                    } else {
                        User.findById(req.params.user_id, function(err, user) {
                            if (err)
                                res.send(err);

                            user.email = req.body.email;
                            user.name = req.body.name;
                            user.surname = req.body.surname;
                            user.tel = req.body.tel;
                            user.country = req.body.country;
                            user.region = req.body.region;
                            user.locality = req.body.locality;
                            user.postIndex = req.body.postIndex;
                            user.address = req.body.address;

                            user.save(function(err) {
                                if (err)
                                    res.send(err);

                                res.json({ 
                                    success: true,
                                    message: 'User updated!'
                                });
                            });
                        });
                    }
                })
            }
        });

    apiRouter.put('/user/:user_id/changePass', function(req, res) {
        User.findById(req.params.user_id).select('_id password').exec(function(err, user) {
            if (err)
                res.send(err);

            // check if password matches
            var validPassword = user.comparePassword(req.body.currentPass);
            if (!validPassword) {
                res.json({
                    success: false,
                    message: 'Неверный пароль'
                });
            } else {
                // if user is found and password is right
                
                user.password = req.body.newPassTwo;

                user.save(function(err) {
                    if (err)
                        res.send(err);

                    res.json({ 
                        success: true,
                        message: 'Пароль обновлён!'
                    });
                });
            }
        });
    });

    apiRouter.post('/sendEmail', function(req, res) {
        User.findById(req.body.receiver, function(err, user) {
            var linkToEmail = req.protocol + '://' + req.get('host') + '/lot/' + req.body.lot;
            if(!user) {
                res.json({message: "User not exist"})
            } else {
                var mailOptions = {
                    from: 'Numizmat. Онлайн-аукцион',
                    to: user.email,
                    subject: 'Numizmat. Вы потеряли лидерство в торгах',
                    html: '<h3>Добрый день, '+ user.name + '!</h3><br><p>Ваша ставка больше не лидирует в торгах. Для дальнейшего участия в торгах за нужный вам лот перейдите по ссылке:<br> <a href="' + linkToEmail + '">' + linkToEmail + '</a><br> Если вы не участвуете в онлайн-аукционе, просто проигнорируйте это письмо.</p>' 
                };

                transporter.sendMail(mailOptions, function(error, info){
                    if(error){
                        res.json({yo: 'error'});
                    }else{
                        res.json({
                            message: 'Message sent',
                            info: info.response
                        });
                    };
                });
            }    
        })
    })

    return apiRouter
}