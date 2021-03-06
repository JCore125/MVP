var express = require('express');
var app = express();
var server = require('http').Server(app);
var socketIo = require('socket.io');
io = socketIo(server);

var players = {};

var star = {
  x: Math.floor(Math.random() * 700) + 50,
  y: Math.floor(Math.random() * 500) + 50
};
var bomb = {
  x: Math.floor(Math.random() * 700) + 50,
  y: Math.floor(Math.random() * 500) + 50
};
var scores = {
  blue: 0,
  red: 0
};

app.use(express.static(__dirname + '/public'));
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  console.log('a user connected: ', socket.id);
  // create a new player and add it to our players object
  players[socket.id] = {
    rotation: 0,
    x: Math.floor(Math.random() * 700) + 50,
    y: Math.floor(Math.random() * 500) + 50,
    playerId: socket.id,
    team: (Math.floor(Math.random() * 2) == 0) ? 'red' : 'blue'
  };
// send the players object to the new player
  socket.emit('currentPlayers', players);
  // send the star object to the new player
  socket.emit('starLocation', star);
  // send the current scores
  socket.emit('scoreUpdate', scores);
  // send the bomb location to the new player
  socket.emit('bombLocation', bomb);
  // update all other players of the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);
  socket.on('disconnect', function () {
    console.log('user disconnected');
    // remove this player from our players object
    delete players[socket.id];
    // emit a message to all players to remove this player
    //io.emit('disconnect', socket.id);
    socket.disconnect(socket.id);

    });
  // when a player moves, update the player data
  socket.on('playerMovement', function (movementData) {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].rotation = movementData.rotation;
    // emit a message to all players about the player that moved
    socket.broadcast.emit('playerMoved', players[socket.id]);
  });

  socket.on('starCollected', function () {
    if (players[socket.id].team === 'red') {
      scores.red += 10;
    } else {
      scores.blue += 10;
    }
    if(scores.red === 100) {
      console.log("Red Team Wins!");
      scores.red = 0;
      scores.blue = 0;
    }
    if(scores.blue === 100) {
      console.log("Blue Team Wins!")
      scores.red = 0;
      scores.blue = 0;
    }
    star.x = Math.floor(Math.random() * 1000) + 50;
    star.y = Math.floor(Math.random() * 1000) - 300;
    io.emit('starLocation', star);
    io.emit('scoreUpdate', scores);
  });

  socket.on('bombCollision', function () {
    if (players[socket.id].team === 'red') {
      scores.red -= 10;
    } else {
      scores.blue -= 10;
    }
    bomb.x = Math.floor(Math.random() * 1500) + 50;
    bomb.y = Math.floor(Math.random() * 1200) + 100;
    io.emit('bombLocation', bomb);
    io.emit('scoreUpdate', scores);
  });

});
server.listen(process.env.PORT || 8081, function () {
  console.log(`Listening on ${server.address().port}`);
});