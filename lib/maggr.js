
// Require dependencies
var _ = require('underscore')


/**
 * @param {Object} options  Options to init the aggregator. Allows
 *                          overriding of mongoHost, mongoPort, mongoDb
 *
 * @return {Maggr}
 * @constructor
 */
var Maggr = module.exports = function(options){
  
  // TODO support for replicas
  var defaults = {

    // Mongo options
    mongoHost: 'localhost',
    mongoPort: '27017',
    mongoDb: 'test'

  }

  // Merge options passed in with defaults
  var opts = this.options = _.extend(defaults, options);

  this.db = require('./db')(opts.mongoHost, opts.mongoPort, opts.mongoDb);

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
Maggr.prototype.add = function(metric, cb){
  
  var ticks = truncTick(metric.t);
  
  var tasks = {};
  var self = this;
  ['minute', 'hour', 'day', 'week', 'month'].forEach(function(collName){

    tasks[collName] = false;

    self.db[collName]
      .findAndModify(
        {
          t: ticks[collName],
          n: metric.n
        },
        [],
        {
          $inc: {
            sum: metric.v,
            count: 1
          }
        },
        {
          upsert: true,
          new: true
        },
        function(err, doc){
          if(err) return console.error(err);
          
          self.db[collName].update(
            {
              t: ticks[collName],
              n: metric.n
            },
            {
              $set: {
                max: doc.max > metric.v ? doc.max : metric.v,
                min: doc.min < metric.v ? doc.min : metric.v,
                last: metric.v
              }
            },
            {
               w: typeof cb === 'function' ? 1 : 0 
            },
            cb && function(err, doc){
              if(err) return console.error(err);
              complete(collName);
            });
        });
  });

  function complete(task){
    tasks[task] = true;
    var stillToDo = Object.keys(tasks).some(function(t){
      return !tasks[t];
    });
    if(!stillToDo) return cb();
  }
  
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
