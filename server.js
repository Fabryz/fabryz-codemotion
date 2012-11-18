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
});

app.configure('production', function(){
	app.use(express.errorHandler()); 
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
	var db = mongoose.createConnection('localhost', 'test');
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