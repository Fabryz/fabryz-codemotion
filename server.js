/*
* Express
*/

var express = require('express'),
	app = module.exports = express.createServer();

// Configuration

app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.logger(':remote-addr - :method :url HTTP/:http-version :status :res[content-length] - :response-time ms'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
	app.use(express.favicon());
});

app.configure('development', function(){
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	app.set("post_domain", "10.1.89.47");
	app.set("post_port", 80);
});

app.configure('production', function(){
	app.use(express.errorHandler());
	//app.set("post_domain", "10.1.89.47");
	//app.set("post_port", 80); 
});

// Routes

// This should be useless
app.get('/',  function(req, res) {
	res.sendfile('index.html');
});

// POST from Arduino
app.post('/sensor',  function(req, res) {

	//console.log('POST /sensor '+ JSON.stringify(req.body));
	console.log(req.body);
	/*
    var sensorData = {
    	"type": req.body.type,
    	"level": req.body.level,
    	"val": req.body.val,
    	"timestamp": req.body.timestamp,
    	"loc": {
    		"lon": req.body.loc.lon,
    		"lat": req.body.loc.lat
    	},
    	"extra": {
        	"description": ( (req.body.extra && req.body.extra.description) ? req.body.extra.description : null),
        	"depth":  ( (req.body.extra && req.body.extra.depth) ? req.body.extra.depth : null)
    	}
	};
	*/

	//io.sockets.emit('sensorData', sensorData);
	io.sockets.emit('sensorData', req.body);

	var mongoose = require('mongoose');
	var db = mongoose.createConnection('mongodb://codello:codello@ds039437.mongolab.com:39437/rb-test');
	console.log("connected");
	var schema = mongoose.Schema(
	  {
	    type: 'string',
	    level: 'string',
	    intensity: 'number',
	    loc: { lon: 'number', lat:'number' },
	    timestamp: 'date',
	    extra: { description:'string', depth:'string'}

	  });
	console.log(schema);
	var SensorData = db.model('SensorData', schema);
	console.log(SensorData);
	var data = new SensorData(req.body);
	console.log(data);
	data.save(function (err) {
	  if (err) {
	    console.log(err);
	    return handleError(err);
	  } 
	  console.log("let's go");
	  // saved!
	});

console.log("molesto");

//req.body
	var querystring = require('querystring');
	var http = require('http');
	//var post_domain = app.get('post_domain');
	//var post_port = app.get('post_port');
	var post_domain = app.get("post_domain");
	var post_port = app.get("post_port");
	var post_path = '/emergencies';
	var post_data = JSON.stringify(req.body);
console.log(post_data);

	var post_options = {
	  host: post_domain,
	  port: post_port,
	  path: post_path,
	  method: 'POST',
	  headers: {
	    'Content-Type': 'application/json',
	    'Content-Length': post_data.length
	  }
	};
	console.log(post_options);
	var post_req = http.request(post_options, function(res) {
	  res.setEncoding('utf8');
	  res.on('data', function (chunk) {
	    console.log('Response: ' + chunk);
	  });
	});

	// write parameters to post body

	console.log(post_data);
	post_req.write(post_data);
	post_req.end();
	res.json(req.body );
	res.end();
});

app.listen(process.env.PORT || 8001);
console.log('* Express server listening in %s mode', app.settings.env);

/*
* Socket.IO
*/

var	io = require('socket.io').listen(app),
	Player = require('./public/js/Player.js').Player,
	players = [],
 	totPlayers = 0;
	
io.configure(function() { 
	io.enable('browser client minification');
	io.set('log level', 1); 
}); 

function getPlayerById(id) {
	var length = players.length;
	for(var i = 0; i < length; i++) {
		if (players[i].id == id) {
			return players[i];
		}
	}

	return null;
}

function newPlayer(client) {
	p = new Player(client.id);
	players.push(p);

	client.emit('join', { player: p });
	client.broadcast.emit('newplayer', { player: p });

	console.log('+ New player: '+ p.nick);
}

function sendPlayerList(client) {
	client.emit('playerlist', { list: players });
	console.log('* Sent player list to '+ client.id);
}

io.sockets.on('connection', function(client) {
	newPlayer(client);
	sendPlayerList(client);

	totPlayers++;
	console.log('+ Player '+ client.id +' connected, total players: '+ totPlayers);

	io.sockets.emit('tot', { tot: totPlayers });

	client.on('disconnect', function() {
		var quitter = '';

		var length = players.length;
		for(var i = 0; i < length; i++) {
			if (players[i].id == client.id) {
				quitter = players[i].nick;
				players.splice(i, 1);
				break;
			}
		}

		totPlayers--;
		client.broadcast.emit('quit', { id: client.id });
		io.sockets.emit('tot', { tot: totPlayers });
		console.log('- Player '+ quitter +' ('+ client.id +') disconnected, total players: '+ totPlayers);
	});
});