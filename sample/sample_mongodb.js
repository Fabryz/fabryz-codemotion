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
var data = new SensorData({ "type": "HQ", "level": "MEDIUM", "intensity": 6.1, "timestamp": "2012-11-18 20:20:20", "loc": { "lon": 45.563101016195546, "lat": 12.42467099999999}, "extra": { "description": "Roncade", "depth": "10km"}});
console.log(data);
data.save(function (err) {
  if (err) {
    console.log(err);
    return handleError(err);
  } 
  console.log("let's go");
  // saved!
});



