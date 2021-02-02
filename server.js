const express = require("express");
const session = require('express-session');
const logger = require("morgan");
const mongoose = require("mongoose");
const passport = require("./config/passport");
const db = require("./models");
const game = require("./lib/game_server");

const PORT = process.env.PORT || 3000;

// Creating express app and configuring middleware needed for authentication
const app = express();

app.use(logger("dev"));
//app.use(compression());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

//Session and passport setup for authentication
app.use(session({ secret: "games rule", resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

//Database connection
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

/**
 * Server side input handler, modifies the state of the players and the
 * game based on the input it receives. Everything here runs asynchronously.
 */
io.on("connection", (socket) => {

	//have the user join the room for the individual game
	socket.on("join-room", userData => {
		console.log("joining room ", userData.room);
		socket.join(userData.room);
		game.getSocket(userData.userId, socket.id)
		//alert the room that someone has joined
		console.log("alerting room" + userData.room + "they have a new player" + userData.userId);
		io.to(userData.room).emit("player-join", userData.userId);
	});

	socket.on("start-game", data => {
		console.log("Starting game", data.game);

		//start the game logic
		game.initGame(io, socket, db, data.game);

		//alert the room that the game has started
		io.to(data.room).emit("game-started");
	});

	// socket.on("player-choice", (choiceData) => {
	// 	console.log("server received choice from", choiceData.player);
	// 	game.receiveChoice(choiceData);
	// });

	socket.on("disconnect", () => {
		console.log("Socket "+  socket.id + " left");
		//game.removePlayer(socket.id);
	});
	// socket.on('disconnect', () => {
	// 	//game.removePlayer(socket.id);
	// 	console.log("Someone left");
	// })
});

//start web server
http.listen(PORT, () => {
	console.log(`App running on port ${PORT}!`);
});