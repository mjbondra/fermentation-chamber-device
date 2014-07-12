
/**
 * Module dependencies
 */
var tessel = require('tessel')
  , config = require('./config')
  , climate = require('climate-si7005').use(tessel.port[config.climate.port])
  , interval = config.socket.interval
  , host = config.socket.host
  , net = require('net')
  , port = config.socket.port;

/**
 * TCP server
 */

var client, connect = function () {
  client = net.connect(port, host, function () {
    console.log('Tessel connected to host: ', config.socket);
    client.on('close', function () {
      reconnect();
    });
    client.on('data', function (data) {
      console.log(data.toString());
    });
    client.setTimeout(config.socket.timeout, function () {
      console.log('Tessel connection will be closed due to inactivity');
      client.destroy();
    });
  });
  client.on('error', function (err) {
    console.error(err);
    reconnect();
  });
}, reconnect = function () {
  console.log('Tessel connection closed. Re-connecting in 15 seconds');
  setTimeout(connect, 15000); // retry connection
};
connect();

/**
 * Climate module
 */

// functions
var climateData = {
  create: function (data) {
    data = data || {};
    climate.readTemperature('f', function (err, temp) {
      if (err) return console.error(err);
      data.temperature = temp.toFixed(4);
      climate.readHumidity(function (err, humid) { // sync reads; async reads distort reporting on one or both values
        if (err) return console.error(err);
        data.humidity = humid.toFixed(4);
        data.createdAt = new Date().getTime();
      });
    });
    setTimeout(function () {
      if (!!client.write) client.write(JSON.stringify(data));
      climateData.update(data);
    }, interval);
  },
  noop: function () {},
  update: function () {}
};

// events
climate.on('error', function (err) {
  console.error('Climate module error', err);
  climateData.update = climateData.noop;
});
climate.on('ready', function () {
  console.log('Connected to si7005 climate module');
  climateData.update = climateData.create;
  climateData.create();
});
