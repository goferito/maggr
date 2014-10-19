var M = require('./lib/maggr')

// Crear una configuracion, y pasarsela a la libreria
// Iniciar un socket que escuche metricas, y se las pase a la
// libreria

var agg = new M()
agg.add({
  n: 'production.nginx1.reqs',
  t: new Date('Fri Oct 17 2014 00:00:00 GMT+0200 (CEST)').getTime(),
  v: 20
}, console.log);

agg.add({
  n: 'production.nginx1.reqs',
  t: new Date().getTime(),
  v: 20
}, console.log);

agg.getLast('hour', 'production.nginx1.reqs', 10, function(err, docs){
  
  console.log(err, docs);
});
