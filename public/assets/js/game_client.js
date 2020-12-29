$(document).ready(function () {
	var curGame = document.defaultView.location.pathname.split("gameboard/").pop();

	const socket = io();

	//initial setup on first opening the boardgame page
	socket.on("connect", () => {
		//get current user name for use in new player object
		$.get("/api/user_data")
		.then(function(userData){
			console.log("User Data: ", userData);
			let userName = {
				name: userData.email
			}
			$.post("/api/newPlayer", userName) //create the new player
			.then(function(newPlayer){ //add the new player to the current game
				console.log("New Player", newPlayer);
				addPlayer(curGame, newPlayer._id);
			})
		})
		
		//join the room for the game
		$.get("/api/gameState/" + curGame)
		.then(function(gameData){
			socket.emit("join-room", gameData.roomNumber);
			console.log("I joined room ", gameData.roomNumber);
		})
		//$events.appendChild(newItem('connect'));
		//TODO: enter chat message here
	});

	// let counter = 0;
	// setInterval(() => {
	// 	++counter;
	// 	socket.emit('hey', { counter }); // the object will be serialized for you
	// }, 10000);

	socket.on("connected", ({message}) => {
		console.log("message", message);
	});

	socket.on("update-board", ({message}) => {
		location.reload();
	});


	//launch the game on click
	$("#start-game").on("click", function (event) {
		console.log("Hit start button");
		socket.emit("start-game", curGame);
	})

	//resource choice made
	$("#btn-choose-resource").on("click", function (event) {
		socket.emit("update-player", curPlayer)
	})
});
