var querystring = require('querystring');
var http = require('http');

//var post_domain = '10.1.91.98';
//var post_domain = '151.1.104.9';
var post_domain ='localhost';
var post_port = 8001;
//var post_port = 80;
var post_path = '/sensor';

var post_data = '{ "type": "HQ", "level": "MEDIUM", "intensity": 6.1, "timestamp": "2012-11-21 10:10:10", "loc": { "lat": 12.42467, "lon": 45.56310 }, "extra": { "description": "Roncade", "depth": "10km"}}';
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