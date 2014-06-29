
/**
 * Module dependencies
 */
var tessel = require('tessel')
  , climate = require('climate-si7005').use(tessel.port.B)
  , duration = 5000
  , ip = require('os').networkInterfaces().en1[0].address
  , port = 1337
  , net = require('net');

/**
 * Climate module
 */

// vars
var climateData = {
  humidity: 0,
  temperature: 0
};

// functions
var climateLoop = function () {
  climate.readTemperature('f', function (err, temp) {
    if (err) return console.error(err);
    climateData.temperature = temp.toFixed(4);
  });
  climate.readHumidity(function (err, humid) {
    if (err) return console.error(err);
    climateData.humidity = humid.toFixed(4);
  });
  setTimeout(climateLoop, duration);
};

// events
climate.on('error', function (err) {
 console.error('Climate module error', err);
 climateLoop = function () {};
});
climate.on('ready', function () {
  console.log('Connected to si7005 climate module');
  climateLoop();
});

/**
 * TCP server
 */

// vars
var connections = [];

// functions
var socketLoops = {
  loop: function (socket) {
    socket.write(JSON.stringify(climateData) + '\r\n');
    setTimeout(function () {
      socketLoops[socket.id](socket);
    }, duration);
  },
  remove: function (socket) {
    delete socketLoops[socket.id];
  }
};
var closeSockets = function () {
  var i = connections.length;
  while (i--) connections[i].close();
  connections = [];
};

// events
var server = net.createServer(function (socket) {
  closeSockets(); // close other sockets; limit to one open connection
  socket.id = Math.round(new Date().getTime());
  connections.push(socket);
  socketLoops[socket.id] = socketLoops.loop;
  socketLoops[socket.id](socket);
  console.log('socket connection ' + socket.id + ' opened');
  socket.on('close', function () {
    socketLoops[socket.id] = socketLoops.remove;
    console.log('socket connection ' + socket.id + ' closed');
  });
  socket.on('data', function (data) {
    console.log(data.toString());
  });
});

server.listen(port, ip);
console.log('Tessel listening on: ', { ip: ip, port: port });
