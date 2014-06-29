
/**
 * Module dependencies
 */
var tessel = require('tessel')
  , climate = require('climate-si7005').use(tessel.port.B)
  , duration = 1000 // 1 second
  , ip = require('os').networkInterfaces().en1[0].address
  , net = require('net')
  , port = 1337;

/**
 * Climate module
 */

// vars
var climateData = {
  humidity: 0,
  temperature: 0
};

// functions
var climateFunctions = {
  noop: function () {},
  read: function () {
    climate.readTemperature('f', function (err, temp) {
      if (err) return console.error(err);
      climateData.temperature = temp.toFixed(4);
      climate.readHumidity(function (err, humid) { // sync reads; async reads distort reporting on one or both values
        if (err) return console.error(err);
        climateData.humidity = humid.toFixed(4);
      });
    });
    setTimeout(climateFunctions.update, duration);
  },
  update: function () {}
};

// events
climate.on('error', function (err) {
  console.error('Climate module error', err);
  climateFunctions.update = climateFunctions.noop;
  climateData = { humidity: 0, temperature: 0 };
});
climate.on('ready', function () {
  console.log('Connected to si7005 climate module');
  climateFunctions.update = climateFunctions.read;
  climateFunctions.read();
});

/**
 * TCP server
 */

// vars
var connections = [];

// functions
var socketFunctions = {
  closeAll: function () {
    var i = connections.length;
    while (i--) connections[i].close();
    connections = [];
  },
  loop: function (socket) {
    setTimeout(function () {
      socket.write(JSON.stringify(climateData) + '\r\n');
      socketFunctions[socket.id](socket);
    }, duration);
  },
  removeLoop: function (socket) {
    delete socketFunctions[socket.id];
  }
};

// events
var server = net.createServer(function (socket) {
  socketFunctions.closeAll(); // close other sockets; limit to one open connection
  socket.id = Math.round(new Date().getTime());
  connections.push(socket);
  socketFunctions[socket.id] = socketFunctions.loop;
  socketFunctions[socket.id](socket);
  console.log('socket connection ' + socket.id + ' opened');
  socket.on('close', function () {
    socketFunctions[socket.id] = socketFunctions.removeLoop;
    console.log('socket connection ' + socket.id + ' closed');
  });
  socket.on('data', function (data) {
    console.log(data.toString());
  });
});

server.listen(port, ip);
console.log('Tessel listening on: ', { ip: ip, port: port });
