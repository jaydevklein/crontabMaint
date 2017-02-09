/*
npm install node
npm install --save express
npm install --save crontab
npm install --save body-parser
npm install --save ejs
*/

var express = require('express')
var app = express()
var user = process.env.USER

app.use(express.static('public'))
app.use(express.static('views'))

//app.set('view engine', 'html')
app.set('view engine', 'ejs');

var bodyParser = require('body-parser')
//app.use( bodyParser.json() )       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}))

app.listen(3000, function () {
	console.log('crontab app listening on port 3000!')
})

app.get('/', function (req, res) {
	res.render('index',{user: user, message: ''})
})

app.get('/addjob', function (req, res) {
	res.render('addjob',{user: user})
})

app.post('/addjob', function (req, res) {
	var command = req.body.p_command
	var minute = req.body.p_minute
	var hour = req.body.p_hour
	var dayOfMonth = req.body.p_dayOfMonth
	var month = req.body.p_month
	var dayOfWeek = req.body.p_dayOfWeek
	var customSchedule = req.body.p_customSchedule
	//var special = req.body.p_special
	var parameters 
	var message 

/*
	function saveCrontab (crontab, command, parameters, message) {

			crontab.save(function(err, crontab) {
				if (err) {
					message = 'Failed to save crontab. ' + err
					console.log(message)
				}
				else {
					message = 'New job scheduled:' + command + ' ' + parameters
					console.log(message)
				}
			})
			console.log(message + '-from function')
			return message 
		}
*/

	if (customSchedule) {
		parameters = customSchedule
	} else {
		parameters = minute + " " + hour + " " + dayOfMonth + " " + month + " " + dayOfWeek //+ " " + special		
	}
	//console.log(parameters)

	require('crontab').load(function(err, crontab) {

  		if (err) {
    		return console.error(err)
  		}

  		// create with string expression 
  		var job = crontab.create(command, parameters);
		if (job === null) {
			message = 'Invalid crontab entry. Failed to create job. Check parameters. ' + command + ' ' + parameters
			console.log(message)
			//return
		}
		else {
	  		// save 
	  		//saveCrontab(crontab, command, parameters, message)
	  		//console.log(message + '-after call')
	  		
	  			crontab.save(function(err, crontab) {
		  		if (err) {
		  			message = 'Failed to save crontab. ' + err;
		  			console.log(message);
		  			//return 
		  		}
		  		else {
		  			message = 'New job scheduled:' + command + ' ' + parameters;
		  			console.log(message);
		  		}
		  		//return message
	  		});
	  		
  		}
  		//console.log(message)
		//res.send('New job scheduled: ' + command + ' ' + parameters)
		//res.render('index',{user: user, message: message})
  	})

	console.log(message)
	//res.send('New job scheduled: ' + command + ' ' + parameters)
	res.render('index',{user: user, message: message})
})

app.get('/listjobs',function(req, res) {

	require('crontab').load(function(err, crontab) {

	if (err) {
		return console.error(err)
	}
	console.log('Listing jobs')

	var dictDayOfWeek = {"*":"All", "0": "Sunday", "1": "Monday", "2":"Tuesday", "3":"Wednesday", "4":"Thursday", "5":"Friday", "6": "Saturday"};
	var dictMonth = {"*":"All", "0": "January", "1": "February", "2": "March", "3": "April", "4": "May", "5": "June", "6": "July", "7": "August", "8":"September", "9": "October", "10": "November", "11": "December"};
	var command
	var minute
	var hour
	var month
	var dayOfMonth
	var dayOfWeek

	var jobs = crontab.jobs()

	var joblisthtml = '<!DOCTYPE html><html><head><link rel="stylesheet" type="text/css" href="css/style.css"></head><body>'
	joblisthtml = joblisthtml + '<form id="form_remove" class="appnitro"  method="post" action="/removejob">'
	joblisthtml = joblisthtml + '<h1>Crontab Maintenance</h1><h2>Crontab Listing</h2><p>Account: '+ user +'</p>'

	joblisthtml = joblisthtml + '<div style="overflow-x:auto;"><table>'
	joblisthtml = joblisthtml + '<tr> <th></th><th>Command</th> <th>Minute</th> <th>Hour</th> <th>Day of Month</th> <th>Month</th> <th>Day of Week</th> </tr>'

	jobs.forEach(function(job){
		if ( typeof job !== 'undefined' && job) {
			monthLookup = dictMonth[job.month().toString()]
			month = job.month().toString()
			dayOfWeekLookup = dictDayOfWeek[job.dow().toString()]
			dayOfWeek = job.dow().toString()
			command = job.command().toString() 
			minute = job.minute().toString()
			hour = job.hour().toString()
			dayOfMonth = job.dom().toString()

			var checkboxValue = "'" + minute + ' ' + hour + ' ' + dayOfMonth + ' ' + month + ' ' + dayOfWeek + ' ' + command + "'"
			//console.log(checkboxValue)
			
			joblisthtml = joblisthtml + '<tr> <td>' + '<input type="checkbox" name="jobEntry[]" value='+checkboxValue+'></td>' + '<td>' +
			command + '</td> <td>' +
			minute + '</td> <td>' +
			hour + '</td> <td>' +
			dayOfMonth + '</td> <td>' +
			month + '</td> <td>' +
			dayOfWeek + '</td> </tr>'
		}
	})
	joblisthtml = joblisthtml + '</table></div>'
	joblisthtml = joblisthtml + '<br><input id="saveForm" class="button_text" type="submit" name="submit" value="Remove Job" />'
	joblisthtml = joblisthtml + '</form></body></html>'

	res.send(joblisthtml)
	})
  
})

app.post('/removejob', function (req, res) {

if ( typeof req.body.jobEntry == 'undefined') {
	//res.send('No jobs to delete')
	return res.render('index',{user: user, message: 'No jobs to delete'})
}

	require('crontab').load(function(err, crontab) {

	var jobEntries = req.body.jobEntry
 /*
	for (i=0; i<req.body.jobEntry.length; i++) {
		console.log(req.body.jobEntry[i])
	}
*/
		jobEntries.forEach(function(jobEntry){
		
			console.log('Job to delete: ' + jobEntry)
		
			var jobs = crontab.jobs()
			jobs.forEach(function(job){
				 if (job.toString() == jobEntry.toString()) {
				   	console.log('Job will be deleted: ' + job.toString())
			    	crontab.remove(job);

			     	// save 
					crontab.save(function(err, crontab) {
						if (err) {
							return console.error(err)
						}
					})
					console.log('Job removed:' + jobEntry)
			    }
		  	})
		})

	//res.send('Job(s) removed: ' + jobEntries)
	return res.render('index',{user: user, message: 'Job(s) removed: ' + jobEntries})
	//res.render('listjobs',{user: user})
	})

})