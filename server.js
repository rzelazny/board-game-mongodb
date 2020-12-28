const express = require("express");
const session = require('express-session');
const logger = require("morgan");
const mongoose = require("mongoose");
const passport = require("./config/passport");
const http = require('http');
const socketIO = require('socket.io');
//const compression = require("compression");

const PORT = process.env.PORT || 3000;

// Creating express app and configuring middleware needed for authentication
const app = express();

app.use(logger("dev"));
//app.use(compression());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

// We need to use sessions to keep track of our user's login status
app.use(session({ secret: "games rule", resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/boardgame", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

// routes
app.use(require("./routes/api-routes.js"));
app.use(require("./routes/html-routes.js"));

//start web server
app.listen(PORT, () => {
  console.log(`App running on port ${PORT}!`);
});

//websocket stuff
const Game = require('./lib/game_server');

var server = http.Server(app);
var io = socketIO(server);

var game = Game.create();

/**
 * Server side input handler, modifies the state of the players and the
 * game based on the input it receives. Everything here runs asynchronously.
 */
io.on('connection', (socket) => {
  socket.on('player-join', () => {
    game.addNewPlayer(socket);
  });

  socket.on('player-action', (data) => {
    game.updatePlayerOnInput(socket.id, data);
  });

  socket.on('disconnect', () => {
    game.removePlayer(socket.id);
  })
});

/**
 * Server side game loop. This runs at 60 frames per second.
 */
setInterval(() => {
  game.update();
  game.sendState();
}, 1000 / 60);


// Node.js WebSocket server script
// const http = require('http');
// const WebSocketServer = require('websocket').server;
// const server = http.createServer();
// server.listen(process.env.PORT || 9898);
// const wsServer = new WebSocketServer({
//     httpServer: server
// });
// wsServer.on('request', function(request) {
//     const connection = request.accept(null, request.origin);
//     connection.on('message', function(message) {
//       console.log('Received Message:', message.utf8Data);
//       connection.sendUTF('Hi this is WebSocket server!');
//     });
//     connection.on('close', function(reasonCode, description) {
//         console.log('Client has disconnected.');
//     });
// });
