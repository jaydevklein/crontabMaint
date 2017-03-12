var crontabModule = require('crontab')
var Promise = require('bluebird')
var user = process.env.USER;

exports.index = function (req, res, next) {
	res.render('index',{user: user, message: ''});
	return next();
};

exports.getAddJob = function (req, res, next) {
	res.render('addjob',{user: user});
	return next();
};

exports.createNewJob = function (req, res, next) {
	var command = req.body.p_command;
	var minute = req.body.p_minute;
	var hour = req.body.p_hour;
	var dayOfMonth = req.body.p_dayOfMonth;
	var month = req.body.p_month;
	var dayOfWeek = req.body.p_dayOfWeek;
	var customSchedule = req.body.p_customSchedule;
	//var special = req.body.p_special;
	var parameters, message;
	
	parameters = customSchedule ? customSchedule : parameters = minute + " " + hour + " " + dayOfMonth + " " + month + " " + dayOfWeek //+ " " + special

	crontabModule.load(function(err, crontab) {
		if (err) failureCallback(err);
		
		saveCronJob(crontab)
			.then(successCallback)
			.catch(failureCallback);
	});

	var successCallback = function(data) {
		console.log(data);
		res.status(200);
		res.render('index', {user: user, message: data});
		return next();
	}

	var failureCallback = function(data) {
		console.error(data);
		res.status(401);
		res.render('index', {user: user, message: data});
		return next();
	}
	
	function saveCronJob(crontab) {
		return new Promise(function(resolve, reject) {
			// create with string expression 
			var job = crontab.create(command, parameters);
			if (job === null) {
				message = 'Invalid crontab entry. Failed to create job. Check parameters. ' + command + ' ' + parameters
				reject(message);
			}
			else {
				// save 
				crontab.save(function(err, crontab) {
					if (err) {
						message = 'Failed to save crontab. ' + err;
						reject(message);
					}
					else {
						message = 'New job scheduled:' + command + ' ' + parameters;
						resolve(message);
					}
				});
			}
		});
	}
};

exports.getJobs = function(req, res, next) {

	crontabModule.load(function(err, crontab) {

		if (err) {
			console.error(err);
			res.status(500);
			res.send(err);
			return next();
		} 
		else {
			console.log('Listing jobs');

			var dictDayOfWeek = {"*":"All", "0": "Sunday", "1": "Monday", "2":"Tuesday", "3":"Wednesday", "4":"Thursday", "5":"Friday", "6": "Saturday"};
			var dictMonth = {"*":"All", "0": "January", "1": "February", "2": "March", "3": "April", "4": "May", "5": "June", "6": "July", "7": "August", "8":"September", "9": "October", "10": "November", "11": "December"};
			var command;
			var minute;
			var hour;
			var month;
			var dayOfMonth;
			var dayOfWeek;

			var jobs = crontab.jobs();

			var joblisthtml = '<!DOCTYPE html><html><head><link rel="stylesheet" type="text/css" href="css/style.css"></head><body>';
			joblisthtml = joblisthtml + '<a href="/">Home</a>'
			joblisthtml = joblisthtml + '<form id="form_remove" class="appnitro"  method="post" action="/removejob">';
			joblisthtml = joblisthtml + '<h1>Crontab Maintenance</h1><h2>Crontab Listing</h2><p>Account: '+ user +'</p>';

			joblisthtml = joblisthtml + '<div style="overflow-x:auto;"><table>';
			joblisthtml = joblisthtml + '<tr> <th></th> <th>Command</th> <th>Minute</th> <th>Hour</th> <th>Day of Month</th> <th>Month</th> <th>Day of Week</th> </tr>';

			jobs.forEach(function(job) {
				if (job) {
					monthLookup = dictMonth[job.month().toString()];
					month = job.month().toString();
					dayOfWeekLookup = dictDayOfWeek[job.dow().toString()];
					dayOfWeek = job.dow().toString();
					command = job.command().toString();
					minute = job.minute().toString();
					hour = job.hour().toString();
					dayOfMonth = job.dom().toString();

					var checkboxValue = "'" + minute + ' ' + hour + ' ' + dayOfMonth + ' ' + month + ' ' + dayOfWeek + ' ' + command + "'";
					
					joblisthtml = joblisthtml + '<tr> <td>' + '<input type="checkbox" name="jobEntry[]" value='+checkboxValue+'></td>' + '<td>' +
					command + '</td> <td>' +
					minute + '</td> <td>' +
					hour + '</td> <td>' +
					dayOfMonth + '</td> <td>' +
					month + '</td> <td>' +
					dayOfWeek + '</td> </tr>';
				}
			});

			joblisthtml = joblisthtml + '</table></div>';
			joblisthtml = joblisthtml + '<br><input id="saveForm" class="button_text" type="submit" name="submit" value="Remove Job" />';
			joblisthtml = joblisthtml + '</form></body></html>';

			res.status(200);
			res.send(joblisthtml);
			return next();
		}
	});
};

exports.removeJob = function (req, res, next) {

	if (req.body.jobEntry === undefined) {
		res.render('index',{user: user, message: 'No jobs to delete'});
		return next();
	}

	crontabModule.load(function(err, crontab) {
		var jobEntries = req.body.jobEntry;
		
		jobEntries.forEach(function(jobEntry) {
			console.log('Job to delete: ' + jobEntry);
		
			var jobs = crontab.jobs();
			jobs.forEach(function(job) {
				if (job.toString() === jobEntry.toString()) {
				   	console.log('Job will be deleted: ' + job.toString());
			    	crontab.remove(job);

			     	// save 
					crontab.save(function(err, crontab) {
						if (err) {
							console.error(err);
							res.status(500);
							res.send(err);
							return next();
						}
					});
					console.log('Job removed:' + jobEntry);
			    }
		  	});
		});

		res.render('index',{user: user, message: 'Job(s) removed: ' + jobEntries});
		return next();
	});
};
