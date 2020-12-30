$(document).ready(function () {
	var curGame = document.defaultView.location.pathname.split("gameboard/").pop();
	var curUser = "";
	const socket = io();
	var playerListEle = $("#player-list");
	var playerCount = 0;
/* ----------------------------
 * Messages we're sending
 * ----------------------------
 */
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
				console.log("New Player", newPlayer._id);
				curUser = newPlayer._id;
				addPlayer(curGame, curUser);
				//join the room for the game
				$.get("/api/gameState/" + curGame)
				.then(function(gameData){
					let joinData = {
						userId: curUser,
						room: gameData.roomNumber
					}
					socket.emit("join-room", joinData);
					console.log("I joined room ", joinData.room);
				})
			})
		})
		
		//TODO: enter chat message here
	});

	//launch the game on click
	$("#start-game").on("click", function (event) {
		console.log("Hit start button");
		socket.emit("start-game", curGame);
	})

	//Send resource choice on click
	$("#btn-choose-resource").on("click", function (event) {
		let updateData = {
			player: curUser,
			choice: $("#form-choose-resource").val()
		}
		socket.emit("update-player", updateData)
	})

/* ----------------------------
 * Messages we're listening for
 * ----------------------------
 */

	//Connected successfully
	socket.on("connected", ({message}) => {
		console.log("message", message);
	});

	//When someone else starts the game
	socket.on("game-started", ({message}) => {
		console.log("Got game start message");
		$("#start-game").css("display", "none");
	});

	//When someone else starts the game
	socket.on("player-join", (message) => {
		console.log("Someone joined our game");
		console.log(message);
		playerCount++;
		let playerEle = $("<li>")
		playerEle.text(`Player ${playerCount}: ${message}`);
		playerListEle.append(playerEle);
	});

	//show prompt field when server sends a prompt
	socket.on("prompt-user", ({message}) => {
		console.log("prompt message recieved")
		$("#select-resource").css("display", "block");
	});

	//show waiting field when other users have gotten a prompt
	socket.on("waiting", ({message}) => {
		console.log("wait message recieved")
		$("#waiting").css("display", "block");
	});

	//update the gameboard
	socket.on("update-board", ({message}) => {
		//location.reload();
		//will need to get correct socket from player.socket
	});

});