$(document).ready(function () {
	var curGame = document.defaultView.location.pathname.split("gameboard/").pop();
	var curUser = "";
	var curRoom = 0;
	const socket = io();
	var playerListEle = $("#player-list");
	var promptMsgEle = document.getElementById("prompt-message");
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
					curRoom = gameData.roomNumber;
					let joinData = {
						userId: curUser,
						room: curRoom
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
		let gameData = {
			game: curGame,
			room: curRoom
		}
		socket.emit("start-game", gameData);
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

	//When someone starts the game
	socket.on("game-started", () => {
		console.log("Got game start message");
		$("#start-game").css("display", "none");
		$("#advisor-container").css("display", "block");
	});

	//When someone joins the game
	socket.on("player-join", (message) => {
		console.log("Someone joined our game");
		console.log(message);
		playerCount++;
		let playerEle = $("<li>")
		playerEle.text(`Player ${playerCount}: ${message}`);
		playerListEle.append(playerEle);
	});

	
	//update the board for the next phase
	socket.on("next-phase", (phase) => {
		console.log("Next phase message recieved")
		switch (phase) {
			case 1:
				$("#select-resource").css("display", "block");
				break;
			case 2:
				break;
			case 3:
				break;
			case 4:
				break;
			case 5:
				break;
			case 6:
				break;
			case 7:
				break;
			case 8:
				break;
			default:
				console.log("Phase not found");
				break;
		}
		
	});

	//show prompt field when server sends a prompt
	socket.on("prompt-user", (message) => {
		console.log("prompt message recieved")
		
		$("#select-resource").css("display", "block");
		console.log(promptMsgEle);
		promptMsgEle.innerHTML = message;
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