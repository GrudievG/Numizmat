var User       = require('../../models/user');
var uuid       = require('uuid');
var nodemailer = require('nodemailer');
var config     = require('../../../config');
var jwt        = require('jsonwebtoken');



module.exports = function(express) {

	var apiRouter = express.Router();
    var transporter = nodemailer.createTransport(config.emailTransport);
    var superSecret = config.secret;

    apiRouter.post('/signup', function(req, res) {
        User.findOne({email:req.body.email}, function(err, user) {
            if(err)
                res.send(err);
            if(!user) {
                var user = new User({
                    email:req.body.email,
                    password:req.body.password,
                    name: req.body.name,
                    surname: req.body.surname,
                    tel: req.body.tel,
                    country: req.body.country,
                    region: req.body.region,
                    locality: req.body.locality,
                    postIndex: req.body.postIndex,
                    address: req.body.address,
                    admin: req.body.admin,
                    super: req.body.super,
                    active: false
                });
                var randomLink = uuid.v1()
                var linkToEmail = req.protocol + '://' + req.get('host') + '/activation/' + randomLink;
                
                user.reset = {
                    token: randomLink,
                    expires: Date.now() + 86400000
                }
                user.save(function(err) {
                    if (err)
                        res.send(err);

                    var mailOptions = {
                        from: 'Numizmat. Онлайн-аукцион', // sender address
                        to: req.body.email, // list of receivers
                        subject: 'Numizmat. Активируйте учётную запись', // Subject line
                        html: '<h3>Добрый день, '+ req.body.name + '!</h3><br><p>Вы только что прошли регистрацию в нашем ресурсе. Для активации аккаунта пройдите по ссылке:<br> <a href="' + linkToEmail + '">' + linkToEmail + '</a><br> Если вы не проходили процедуру регистрации, просто удалите это письмо. Вы больше не будете получать писем от нас.</p>' // You can choose to send an HTML body instead
                    };

                    transporter.sendMail(mailOptions, function(error, info){
                        if(error){
                            res.json({yo: 'error'});
                        }else{
                            console.log('Message sent: ' + info.response);
                        };
                    });

                    res.json({ 
                        success:true,
                        message: 'User created!' });
                });
            } else {
                res.json({ 
                    success: false,
                    message: 'Пользователь с таким email уже существует.'
                });
            }
        })    
    });

    apiRouter.post('/login', function(req, res) {
        User.findOne({email: req.body.email}).select('_id email password admin').exec(function(err, user) {
            if (err) 
                res.send(err);
            // no user with that username was found
            if (!user) {
                res.json({
                    success: false,
                    message: 'Такого email нет в базе.'
                });
            } else if (user) {
                // check if password matches
                var validPassword = user.comparePassword(req.body.password);
                if (!validPassword) {
                    res.json({
                        success: false,
                        message: 'Неверный пароль'
                    });
                } else {
                    // if user is found and password is right
                    // create a token
                    var accessToken = jwt.sign({
                        email: user.email
                    }, superSecret, {
                        expiresIn: 60*60*24*7 // expires in 1 week
                    });

                    res.json({
                        success: true,
                        message: 'Enjoy your token!',
                        accessToken: accessToken,
                        id: user._id,
                        email:user.email,
                        admin:user.admin
                    });
                }
            }
        });
    });

    apiRouter.post('/refresh', function(req, res) {

        User.findOne({email: req.body.user}, function(err, user) {
            if(err)
                res.send(err)
            if(!user) {
                res.status(403).send({
                    success: false,
                    message: 'No user'
                });
            } else if (user) {
                var token = req.body.accessToken || req.param('accessToken') || req.headers['x-access-token'];
                 if (token) {
                    jwt.verify(token, superSecret, function(err, decoded) {
                        if (err) {
                            return res.status(403).send({
                                success: false,
                                message: 'Failed to authenticate token.'
                            });
                        } else {
                            var accessToken = jwt.sign({email: req.body.user}, superSecret, {
                                expiresIn: 60*60*24*7 // expires in 1 week
                            });

                            res.json({
                                success: true,
                                message: 'Enjoy your token!',
                                accessToken: accessToken,
                                admin:user.admin
                            });
                        }
                    });
                } else {    
                    return res.status(403).send({
                        success: false,
                        message: 'No token provided.'
                    });
                }
            }
        })       
    });

    apiRouter.get('/activate/:token', function(req, res) {
        User.findOne({'reset.token': req.params.token}, function(err, user) {
            if(!user) {
                res.json({
                    success: false,
                    message:"Пользователь не найден"
                })
            } else if(user) {
                if(user.reset.expires < Date.now()) {
                    res.json({
                        success:false,
                        user: user,
                        message: "Срок действия ссылки истёк. Если вы не активировали аккаунт - отправьте запрос на активацию повторно."
                    })
                } else if(user.active == true) {
                    res.json({
                        success: false,
                        active: true,
                        message: "Ваш аккаунт уже активирован"
                    })
                } else {
                    user.active = true;
                    user.save(function(err) {
                        res.json({
                            success: true,
                            user: user
                        })
                    })
                }   
            }  
        })
    })

    apiRouter.get('/reactivate/:user_id', function(req, res) {
        User.findById(req.params.user_id, function(err, user) {

            var randomLink = uuid.v1();
            var linkToEmail = req.protocol + '://' + req.get('host') + '/activation/' + randomLink;

            user.reset = {
                token: randomLink,
                expires: Date.now() + 86400000
            }

            user.save(function(err) {
                if (err)
                    res.send(err);

                var mailOptions = {
                    from: 'Numizmat. Онлайн-аукцион', // sender address
                    to: user.email, // list of receivers
                    subject: 'Numizmat. Активируйте учётную запись', // Subject line
                    html: '<h3>Добрый день, '+ user.name + '!</h3><br><p>Вы только что повторно запросили ссылку для активации учётной записи. Для активации аккаунта пройдите по ссылке:<br> <a href="' + linkToEmail + '">' + linkToEmail + '</a><br> Если вы не проходили процедуру регистрации, просто удалите это письмо. Вы больше не будете получать писем от нас.</p>' // You can choose to send an HTML body instead
                };

                transporter.sendMail(mailOptions, function(error, info){
                    if(error){
                        console.log(error);
                        res.json({yo: 'error'});
                    }else{
                        console.log('Message sent: ' + info.response);
                    };
                });

                res.json({ 
                    success:true,
                    message: 'Mail sent!' });
            });
        })
    })

    apiRouter.post('/dropPassword', function(req, res) {
        User.findOne({email: req.body.email}, function(err, user) {
            if(!user) {
                res.json({
                    success:false,
                    message: "Пользователь не найден"
                })
            } else if (user) {
                var linkToEmail = req.protocol + '://' + req.get('host') + '/reset-password/' + user._id;
                var mailOptions = {
                    from: 'Numizmat. Онлайн-аукцион', // sender address
                    to: req.body.email, // list of receivers
                    subject: 'Numizmat. Восстановление пароля.', // Subject line
                    html: '<h3>Добрый день, '+ user.name + '!</h3><br><p>Для восстановления доступа к учётной записи перейдите по ссылке:<br> <a href="' + linkToEmail + '">' + linkToEmail + '</a><br> Если вы не запрашивали восстановление доступа, просто удалите это письмо.</p>' // You can choose to send an HTML body instead
                };
                user.dropPass = {
                    expires: Date.now() + 86400000,
                    status: 'pending'
                }
                user.save(function(err) {
                    transporter.sendMail(mailOptions, function(error, info){
                        if(error){
                            res.json({yo: 'error'});
                        }else{
                            console.log('Message sent: ' + info.response);
                            res.json(req.body)
                        };
                    });
                })    
            }
        })
    })

    apiRouter.get('/checkUpdating/:user_id', function(req, res) {
        User.findById(req.params.user_id, function(err, user) {
            if(user.dropPass.expires < Date.now() || user.dropPass.status != 'pending') {
                res.json({
                    success: false,
                    message: "Ссылка не активна"
                })
            } else {
                res.json({
                    success: true,
                    message: "Всё хорошо"
                })
            }
        })
    })

    apiRouter.post('/updatePassword', function(req, res) {
        User.findById(req.body.user_id, function(err, user) {
            user.password = req.body.pass;
            user.dropPass.status = 'done'
            user.save(function(err) {
                if (err)
                    res.send(err);

                res.json({ 
                    success: true,
                    message: 'Пароль обновлён!'
                });
            });    
        })
    })

    return apiRouter
}