
// Require dependencies
var mongo = require('mongoskin')
  , format = require('util').format


var db;

module.exports = function(host, port, db){

  //TODO support for replicas
  db = mongo.db(format('mongodb://%s:%s/%s?w=1', host, port, db),
                {native_parser: true}); 

  return {
    minute: db.bind('minute'),
    hour: db.bind('hour'),
    day: db.bind('day'),
    week: db.bind('week'),
    month: db.bind('month')
  }
};
