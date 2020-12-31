$(document).ready(function () {
	var curGame = document.defaultView.location.pathname.split("gameboard/").pop();
	var curUser = "";
	var curRoom = 0;
	const socket = io();
	var playerListEle = $("#player-list");
	var playerCount = 0;
	let promptEle = $("#prompt-user-container");
	let resEle = $("#select-resource");
	let waitEle = $("#waiting");
	let sidebarTurnOrderEle = $("#sidebar-turn-order")
	let sidebarVPEle = $("#sidebar-vp")
	let sidebarBuildingsEle = $("#sidebar-buildings")
	let sidebarRes1Ele= $("#sidebar-res1")
	let sidebarRes2Ele = $("#sidebar-res2")
	let sidebarRes3Ele = $("#sidebar-res3")
	let sidebar2TokenEle = $("#sidebar-2token")
/* ----------------------------
 * Messages we're sending
 * ----------------------------
 */
	//initial setup on first opening the boardgame page
	socket.on("connect", () => {
	//TODO: check for existing/reconnect before making new player
		//TODO: On reconnect get game stats

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
	$(".btn-res-choice").on("click", function (event) {
		console.log("resource choice made");
		event.preventDefault();
		
		//hide choice, show waiting text
		promptEle.css("display", "none");
		waitEle.css("display", "block");

		let updateData = {
			player: curUser,
			choiceType: "resource",
			choice: this.getAttribute("choice")
		}
		socket.emit("player-choice", updateData)
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
		console.log("Next phase message recieved ", phase)
		let parsePhase = parseInt(phase);
		updateNavBar(parsePhase);

		switch (parsePhase) {
			case 1:
				//$("#select-resource").css("display", "block");
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

	//update the sidebar when prompted to
	socket.on("update-sidebar", (sidebarData) => {
		let {turnOrder, vp, buildings, res1, res2, res3, twoToken } = sidebarData;

		//clear and recreate the turn order
		sidebarTurnOrder.empty();
		for(let i=0; i<turnOrder.length; i++){
			let turn = $("<li>");
			turn.text(turnOrder[i]);
			turn.attr("color", turnOrder[i].color);
			sidebarTurnOrderEle.append(turn);
		}

		//set the player stats
		sidebarVPEle.text(vp);
		sidebarBuildingsEle.text(buildings);
		sidebarRes1Ele.text(res1);
		sidebarRes2Ele.text(res2);
		sidebarRes3Ele.text(res3);
		sidebar2TokenEle.text(twoToken);
	});

	//show prompt field when server sends a prompt
	socket.on("prompt-user", (message) => {
		console.log("prompt message recieved")
		let promptMsgEle = document.getElementById("prompt-message");

		//always show the prompt container on message
		$("#prompt-user-container").css("display", "block");

		promptMsgEle.innerHTML = message;
		
		//display various prompts based on the message
		switch(message){
			case "You recieve the king's aid. Pick a bonus resource:":
				resEle.css("display", "block");
				break;
			default:
				console.log("Unknown message prompt: ", message);
		}
	
		
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

/* ----------------------------
 * Functions for displaying the client data
 * ----------------------------
 */
	//Update the nav bar css to highlight the current phase
	function updateNavBar (phase){
		console.log("Updating navbar");
		let navBarEleList = document.getElementsByClassName("nav-phase");

		for(let i=0; i<navBarEleList.length; i++){
			if((i+1) === phase) navBarEleList[i].style.color="red";
			else navBarEleList[i].style.color="black";
		}
	}

});