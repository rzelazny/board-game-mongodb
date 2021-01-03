$(document).ready(function () {
	var curGame = document.defaultView.location.pathname.split("gameboard/").pop();
	var curUser = "";
	var curRoom = 0;
	var myDice = [];
	var myColor = "blue";
	var myTotal = 0;
	const socket = io();
	var playerListEle = $("#player-list");
	var playerCount = 0;
	let promptEle = $("#prompt-user-container");
	let resEle = $("#select-resource");
	let yesNoEle = $("#select-yesno");
	let chooseAdvisorEle = $("#select-advisor");
	let waitEle = $("#waiting");
	let diceEle = document.getElementsByClassName("dice-btn");
	let diceTotalEle = document.getElementById("dice-total");
	let selectedDice = document.getElementsByClassName("clicked");

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
			.then(function (userData) {
				console.log("User Data: ", userData);
				let userName = {
					name: userData.email
				}
				$.post("/api/newPlayer", userName) //create the new player
					.then(function (newPlayer) { //add the new player to the current game
						console.log("New Player", newPlayer._id);
						curUser = newPlayer._id;
						addPlayer(curGame, curUser);
						//join the room for the game
						$.get("/api/gameState/" + curGame)
							.then(function (gameData) {
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
		resEle.css("display", "none");
		waitEle.css("display", "block");

		let updateData = {
			player: curUser,
			choiceType: "aidResource",
			choice: this.getAttribute("choice")
		}
		socket.emit("player-choice", updateData)
	})

	//Calcing dice total on click
	$(".btn-die-choice").on("click", function (event) {
		console.log("dice button");
		event.preventDefault();

		//If clicked add to the total, if clicked again remove it
		if (this.classList.contains("clicked")) {
			myTotal -= myDice[this.getAttribute("choice")];
		}
		else {
			myTotal += myDice[this.getAttribute("choice")];
		}

		this.classList.toggle("clicked");

		//display the new total
		diceTotalEle.textContent = myTotal;
	})

	//Sending dice total on click
	$(".btn-send-choice").on("click", function (event) {
		console.log("dice choice submitted");
		event.preventDefault();

		let diceNumber = [];

		for (let i = 0; i < selectedDice.length; i++) {
			diceNumber.push(selectedDice[i].getAttribute("choice"));
		}

		console.log("I'm sending:", diceNumber);

		let myChoice = {
			player: curUser,
			choiceType: "advisor",
			choice: diceNumber
		}
		socket.emit("player-choice", myChoice);
		promptEle.css("display", "none");
		waitEle.css("display", "block");
	})

	/* ----------------------------
	 * Messages we're listening for
	 * ----------------------------
	 */

	//Connected successfully
	socket.on("connected", ({ message }) => {
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

		//hide elements from earlier phases, this is usually due to a timeout
		switch (parsePhase) {
			case 1:
				//$("#select-resource").css("display", "block");
				break;
			case 2:
				promptEle.css("display", "none");
				resEle.css("display", "none");
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
		console.log("recieved sidebar update message", sidebarData);

		let { score, constructedBuildings, resource1, resource2, resource3, twoToken } = sidebarData;

		let sidebarVPEle = document.getElementById("sidebar-vp");
		let sidebarBuildingsEle = document.getElementById("sidebar-buildings");
		let sidebarRes1Ele = document.getElementById("sidebar-res1");
		let sidebarRes2Ele = document.getElementById("sidebar-res2");
		let sidebarRes3Ele = document.getElementById("sidebar-res3");
		let sidebar2TokenEle = document.getElementById("sidebar-2token");

		let textSpace = " : ";
		//set the player stats
		sidebarVPEle.textContent = textSpace + score;
		sidebarBuildingsEle.textContent = textSpace + (constructedBuildings.length);
		sidebarRes1Ele.textContent = textSpace + resource1;
		sidebarRes2Ele.textContent = textSpace + resource2;
		sidebarRes3Ele.textContent = textSpace + resource3;
		sidebar2TokenEle.textContent = textSpace + twoToken;
	});

	//update the turn order when prompted to
	socket.on("update-order", (turnData) => {
		console.log("recieved turnOrder update message", turnData);

		let sidebarTurnOrderEle = $("#sidebar-turn-order")

		//set dice variables we'll need shortly
		myDice = turnData[0].dice.slice();
		myTotal = 0;

		//clear and recreate the turn order on the sidebar
		sidebarTurnOrderEle.empty();
		for (let i = 0; i < turnData.length; i++) {
			let turn = $("<li>");
			turn.append(`<img alt="player dice" class="icon" src="../assets/images/dice-${turnData[i].color}/die-${turnData[i].dice[0]}.png" />`)
			turn.append(`<img alt="player dice" class="icon" src="../assets/images/dice-${turnData[i].color}/die-${turnData[i].dice[1]}.png" />`)
			turn.append(`<img alt="player dice" class="icon" src="../assets/images/dice-${turnData[i].color}/die-${turnData[i].dice[2]}.png" />`)
			// turn.text(turnData[i].name);
			// turn.attr("style", "color: " + turnData[i].color);
			sidebarTurnOrderEle.append(turn);
		}

	});

	//show prompt field when server sends a prompt
	socket.on("prompt-user", (message) => {
		console.log("prompt message recieved", message);
		let promptMsgEle = document.getElementById("prompt-message");

		//always show the prompt container and hide the wait message
		$("#prompt-user-container").css("display", "block");
		promptMsgEle.innerHTML = message;
		waitEle.css("display", "none");

		//display various prompts based on the message
		switch (message) {
			case "You recieve the king's aid. Pick a bonus resource:":
				resEle.css("display", "block");
				break;
			case "Would you like to use your Statue?":
			case "Would you like to use your Chapel?":
				yesNoEle.css("display", "block");
				break;
			case "Use your dice to influence an advisor.":
				chooseAdvisorEle.css("display", "block");
				//set dice icons
				for (let i = 0; i < 3; i++) {
					diceEle[i].src = (`../assets/images/dice-${myColor}/die-${myDice[i]}.png`);
				}
				// if ("king's die"){
				// 	diceEle[3].src = ("../assets/images/die-" + myDice[3] + ".png");
				// }

				break;
			default:
				console.log("Unknown message prompt: ", message);
		}
	});

	//display dice on the advisor board
	socket.on("mark-dice", (message) => {
		//{dice, color, advisor}
		console.log("mark dice message recieved", message);
		let advEle = $("#adv-" + message.advisor);
		for (let i = 0; i < message.dice.length; i++) {
			advEle.append(`<img alt="player dice" class="icon" src="../assets/images/dice-${message.color}/die-${message.dice[i]}.png" />`)
		}
	});

	//show waiting field when other users have gotten a prompt
	socket.on("waiting", ({ message }) => {
		console.log("wait message recieved")
		waitEle.css("display", "block");
	});

	//display the use building section
	socket.on("use-buildings", (data) => {
		console.log(data);
		console.log("wait message recieved")
		buildingEle.css("display", "block");

		for(let i=0; i<data.buildings.length; i++){
			let building = $("<div>");
			building.append(`<img alt="player dice" class="icon" src="../assets/images/buildings/${data.building[i]}.png" />`)
			building.append("<button>");
			// turn.text(turnData[i].name);
			// turn.attr("style", "color: " + turnData[i].color);
			buildingEle.prepend(building);
		};
	});


	/* ----------------------------
	 * Functions for displaying the client data
	 * ----------------------------
	 */
	//Update the nav bar css to highlight the current phase
	function updateNavBar(phase) {
		console.log("Updating top navbar");
		let navBarEleList = document.getElementsByClassName("nav-phase");

		for (let i = 0; i < navBarEleList.length; i++) {
			if ((i + 1) === phase) navBarEleList[i].style.color = "red";
			else navBarEleList[i].style.color = "black";
		}
	}

});