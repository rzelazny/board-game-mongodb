const express = require("express");
const session = require('express-session');
const logger = require("morgan");
const mongoose = require("mongoose");
const passport = require("./config/passport");
const db = require("./models");
const game = require("./lib/game_server")
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

//websocket stuff
const http = require('http').Server(app);
const io = require('socket.io')(http);

//var game = Game.create();
/**
 * Server side input handler, modifies the state of the players and the
 * game based on the input it receives. Everything here runs asynchronously.
 */
io.on('connection', (socket) => {

	socket.on('hey', data => {
		console.log('hey', data);
	});

	socket.on('start-game', data => {
		console.log('Starting game', data);
		game.initGame(io, socket, db);
	});

	io.sockets.on('connection', function (data) {
		console.log('client connected');
	});

	socket.on('disconnect', () => {
		//game.removePlayer(socket.id);
		console.log("Someone left");
	})
});

//start web server
http.listen(PORT, () => {
	console.log(`App running on port ${PORT}!`);
});