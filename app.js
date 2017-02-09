var express = require('express');
var bodyParser = require('body-parser');
var routes = require('./routes');

var app = express();

app.use(express.static('public'));

//app.set('view engine', 'html')
app.set('view engine', 'ejs');

//app.use( bodyParser.json() )       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.listen(3000, function () {
	console.log('crontab app listening on port 3000!');
});

app.get('/', routes.index);
app.get('/addjob', routes.getAddJob);
app.post('/addjob', routes.createNewJob);
app.get('/listjobs', routes.getJobs);
app.post('/removejob', routes.removeJob);


/*

// Consider using a more RESTful approach for your endpoints:

app.get('/jobs', routes.getJobs);
app.post('/jobs', routes.createNewJob);
app.delete('/jobs', routes.removeJob);

*/
