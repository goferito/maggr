
// Require dependencies
var _ = require('underscore')

var db = require('./db')


/**
 * @param {Object} options  Options to init the aggregator. Allows
 *                          overriding of mongoHost, mongoPort, mongoDb
 *
 * @return {Mongregator}
 * @constructor
 */
var Mongregator = module.exports = function(options){
  
  // TODO support for replicas
  var defaults = {

    // Mongo options
    mongoHost: 'localhost',
    mongoPort: '27017',
    mongoDb: 'test'

  }

  // Merge options passed in with defaults
  var opts = this.options = _.extend(defaults, options);

  this.db = db;
  db.init(opts.mongoHost, opts.mongoPort, opts.mongoDb);

};


/**
 *
 * Stores metrics in mongodb, updating all the aggregation collections.
 *
 * @param Object metric  Metric data in the form of:
 *                         {
 *                           n: 'metric name',
 *                           v: 'metric value',
 *                           t: 'timestamp'
 *                         }
 */
Mongregator.prototype.add = function(metric){
  
  // Hay que mirar que pasa si intento incrementar un valor de mongo que no
  // existe.
  //
  // La idea es que se calculan los valores truncados del ts de la metrica,
  // y se intentan hacer incr para los documentos cuyo nombre y ts corresponden
  // en cada collection.
  // Ejemplo:
  // LLega la metrica { n: mac3, v: 100, t: 14543244454 }
  //  Hay que pillar la metrica, que se vera que es del 24/12/2024 23:05:07
  //  La funcion tiene que devolver un objeto tal que:
  //  {
  //    m: 24/12/2014 23:05:00 (pasado a unix time)
  //    h: 24/12/2014 23:00:00 (pasado a unix time)
  //    d: ...
  //    w: ...
  //    M: ...
  //  }
  //
  //  Luego otra funcion tiene que actualizar 5 documentos en mongo, uno por cada
  //  unidad temporal. Estos documentos seran tal que:
  //  min collection:
  //  {
  //    n: mac3.bytes.sent
  //    t: 24/12/2014 23:05:00
  //    sum: 1500,
  //    count: 75,
  //    last: 85,
  //    max: 154,
  //    min: 22
  //  }
  //  Con eso ya puedo mostrar cualquier cosa, hasta mi amada standard deviation
  //

  // Get ticks
  var ticks = truncTick(metric.t);

  console.log(ticks);
  
  var self = this;
  console.log('yo:', this.db);
  ['minute', 'hour', 'day', 'week', 'month'].forEach(function(collName){
    self.db.collection(collName)
      .findAndUpdate(
        {
          t: ticks[collName],
          n: metric.n
        },
        {
          $inc: {
            sum: metric.v,
            count: 1
          }
        },
        {
          upsert: true
        }, function(err, doc){
          console.log(err, doc);
        });
  });
  

};


/**
 * Returns a timestamp truncated to the initial ms of
 * the min|hour|day|week|month
 * @param {Number} ts  Timestamp to be truncated
 * @return {Object}
 */
var truncTick = function(ts){

  var dt = new Date(ts)
    , y = dt.getFullYear()
    , M = dt.getMonth()
    , d = dt.getDate()
    , h = dt.getHours()
    , m = dt.getMinutes()

  // Weekly aggregation (special case)
  var mon = getMonday(ts)
    , monY = mon.getFullYear()
    , monM = mon.getMonth()
    , monD = mon.getDate()

  return {
    minute: new Date(y, M, d, h, m).getTime(),
    hour: new Date(y, M, d, h).getTime(),
    day: new Date(y, M, d).getTime(),
    week: new Date(monY, monM, monD).getTime(),
    month: new Date(y, M).getTime()
  };

}


/**
 * Returns a Date() with the corresponding monday of the same week of the
 * passed timestamp.
 * @param String d  Anything that can be used to create a Date() object 
 *                  (<Number> unix timestamp, ISO formatted string, etc)
 */
function getMonday(d) {
  d = new Date(d);
  var day = d.getDay(),
      diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust for sundays
  return new Date(d.setDate(diff));
}
