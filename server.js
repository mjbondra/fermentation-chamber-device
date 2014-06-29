
/**
 * Module dependencies
 */
var tessel = require('tessel')
  , climate = require('climate-si7005').use(tessel.port.B)
  , duration = 1000
  , ip = require('os').networkInterfaces().en1[0].address
  , port = 1337
  , net = require('net');

/**
 * Climate module
 */
climate.on('error', function (err) {
 console.error('error connecting module', err);
});
climate.on('ready', function () {
  console.log('Connected to si7005 climate module');
});

/**
 * TCP server
 */

// vars
var connections = [];

// functions
var socketLoops = {
  loop: function (socket) {
    setTimeout(function () {
      socketLoops[socket.id](socket);
    }, duration);
    climate.readTemperature('f', function (err, temp) {
      climate.readHumidity(function (err, humid) {
        socket.write('Degrees: ' + temp.toFixed(4) + 'F\r\n');
      });
    });
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
