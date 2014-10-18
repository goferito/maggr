// Require dependencies
var MongoClient = require('mongodb').MongoClient  
  , format = require('util').format
  
module.exports = {

  // Database connection
  db: null,

  // Init Db connection
  init: function(host, port, db, cb){

    var self = this;

    //TODO support for replicas
    MongoClient
      .connect(format('mongodb://%s:%s/%s?w=1',
                       host,
                       port,
                       db),
               function(err, db){
                 if(err) return cb(err);
                 self.db = db;
                 cb();
               });
  }
};
// TODO igual puedo mover esto tb al modulo agregator
