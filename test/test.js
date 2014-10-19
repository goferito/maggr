var rewire = require('rewire')
  , assert = require('assert')
  
var wiredMg = rewire('../lib/maggr')


describe("/lib/maggr.js", function(){


  it("truncates dates properly", function(done){
    var tt = wiredMg.__get__('truncTick');

    var dates = [
      [
        'Fri Oct 17 2014 17:45:43 GMT+0200 (CEST)',
        {
          minute: 'Fri Oct 17 2014 17:45:00 GMT+0200 (CEST)',
          hour:   'Fri Oct 17 2014 17:00:00 GMT+0200 (CEST)',
          day:    'Fri Oct 17 2014 00:00:00 GMT+0200 (CEST)',
          week:   'Mon Oct 13 2014 00:00:00 GMT+0200 (CEST)',
          month:  'Wed Oct 01 2014 00:00:00 GMT+0200 (CEST)',
        }
      ]
      // TODO add possible corner cases ( new year, 28 february )
    ];

    dates.forEach(function(date){
      // Translate to unix times
      var uts = {};
      for(var t in date[1]){
        uts[t] = new Date(date[1][t]).getTime()
      }

      assert.deepEqual(tt(new Date(date[0]).getTime()), uts)
      
    });
    
    done();
    
  });

  
  var Maggr = require('../index')
    , maggr = new Maggr({mongoDb: 'test'});
  
  it("doesn't crash adding a new metric", function(done){
    maggr.add({
                t: new Date().getTime(),
                n: 'p.n1.reqs',
                v: 15
              },
              done);
  });


});

