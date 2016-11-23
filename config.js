module.exports = {
	'port': process.env['PORT'] || 3000,
	'database': process.env['MongodbUri'] || 'mongodb://localhost/numizmat',
	'secret': 'iwanttoblowupthisnumismaticservice',
	'cloudinaryConf': {
		cloud_name: process.env['cloud_name'] || 'dsimmrwjb', 
	    api_key: process.env['api_key'] || '734793373773451', 
	    api_secret: process.env['api_secret'] || 'WIdBy9RDkEe9wa-L9rWGT9yoz9g'
	},
	'emailTransport': {
		service: process.env['service'] || 'Gmail',
	    auth: {
	        user: process.env['user'] || 'tosend.emailstest@gmail.com',
	        pass: process.env['pass'] || 'testaccount'
	    }
	}
};