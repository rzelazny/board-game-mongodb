$(document).ready(function () {
	var curGame = document.defaultView.location.pathname.split("gameboard/").pop();
	var curUser = "";
	var curRoom = 0;
	var myColor = "blue";
	var myTotal = 0;
	const socket = io();
	var playerListEle = $("#player-list");
	var playerCount = 0;
	let promptEle = $("#prompt-user-container");
	let resEle = $("#select-resource");
	let selectDiceEle = $("#select-dice");
	let advisorEle = $("#advisor-container")
	let chooseAdvisorEle = $("#select-advisor");
	let buildingEle = $("#use-buildings");
	let waitEle = $("#waiting");
	let diceImg = document.getElementsByClassName("dice-btn");
	let diceEle = document.getElementsByClassName("btn-die-choice");
	let diceTotalEle = document.getElementById("dice-total");
	let selectedDice = document.getElementsByClassName("clicked");
	let promptMsgEle = document.getElementById("prompt-message");

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
			myTotal -= this.value;
		}
		else {
			myTotal += this.value;
			//myTotal += myDice[this.getAttribute("choice")];
		}

		this.classList.toggle("clicked");

		//display the new total
		diceTotalEle.textContent = myTotal;
	})

	//Sending dice total on click
	$("#btn-send-dice").on("click", function (event) {
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
		promptMsgEle.style.display = "none";
		selectDiceEle.css("display", "none");
		waitEle.css("display", "block");
	})

	//Sending building total on click
	function sendBuilding() {
		console.log("building choice submitted");
		event.preventDefault();

		let selectedBuildings = document.getElementsByClassName("building-clicked");
		let choice = [];

		for(let i=0;i<selectedBuildings.length; i++){
			choice.push(selectedBuildings[i].getAttribute("building"));
		}

		let myChoice = {
			player: curUser,
			choiceType: "building",
			choice: choice
		}
		console.log("I'm sending:", choice);

		socket.emit("player-choice", myChoice);
		promptEle.css("display", "none");
		buildingEle.css("display", "none");
		waitEle.css("display", "block");
	}

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
		advisorEle.css("display", "block");
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

		//clear and recreate the turn order on the sidebar
		sidebarTurnOrderEle.empty();
		for (let i = 0; i < turnData.length; i++) {
			let turn = $("<li>");
			for(let ii=0; ii<turnData[i].dice.slice().length; ii++){
				turn.append(`<img alt="player dice" class="icon" src="../assets/images/dice-${turnData[i].color}/die-${turnData[i].dice[ii]}.png" />`)
			}
			sidebarTurnOrderEle.append(turn);
		}

	});

	//show prompt field when server sends a prompt
	socket.on("prompt-user", (message) => {
		console.log("prompt message recieved", message);
		

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
			case "Invalid choice. Use your dice to influence an advisor.":
				chooseAdvisorEle.css("display", "block");
				selectDiceEle.css("display", "block");
				promptMsgEle.style.display = "block";
				break;
			default:
				console.log("Unknown message prompt: ", message);
		}
	});

	//update my dice buttons
	socket.on("update-dice", ({color, dice}) => {
		console.log("update dice message recieved", color, dice)

		//set dice icons and value
		for (let i = 0; i < dice.length; i++) {
			diceImg[i].src = (`../assets/images/dice-${color}/die-${dice[i]}.png`);
			diceImg[i].setAttribute("value", dice[i]);
			diceEle[i].disabled = false;
			diceEle[i].classList.remove("clicked");
		}
		//disable buttons for used dice
		console.log("mydice length", dice.length);
		for (let i = dice.length; i < 3; i++) {
			diceImg[i].src = (`../assets/images/icons/die-3-dis.png`);
			diceEle[i].disabled = true;
			diceEle[i].classList.remove("clicked");
		}
		// if ("king's die"){
		// 	diceEle[3].src = ("../assets/images/die-" + myDice[3] + ".png");
		// }
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
		console.log("use buildings recieved")
		console.log(data);

		//always show the prompt container and hide the wait message
		$("#prompt-user-container").css("display", "block");
		waitEle.css("display", "none");
		promptMsgEle.innerHTML = "You have buildings that may be used."
		buildingEle.css("display", "block");

		//create the building div
		for(let i=0; i<data[0].building.length; i++){
			//general layout
			let building = $("<div>").attr("class", "use-building"),
			row = $("<div>").attr("class", "row"),
			col1 = $("<div>").attr("class", "col-md-2"),
			col2 = $("<div>").attr("class", "col-md-2"),
			col3 = $("<div>").attr("class", "col-md-4"),
			col4 = $("<div>").attr("class", "col-md-4");

			//create data elements
			let name = data[0].building[i];
			let img = `<img alt="player dice" class="btn-icon" src="../assets/images/buildings/${data[0].building[i]}.png" />`;
			let description = "If your dice total is under 8 you may reroll all dice." //TODO add to database somewhere
			var useBtn = $('<button/>', {
				text: "Use "+ name,
				id: "btnUse" + name,
				class: "btn-choice",
				building: name,
				click: useBuilding
			})
			col1.append(name);
			col2.append(img);
			col3.append(description);
			col4.append(useBtn);

			row.append(col1, col2, col3, col4);
			building.append(row);

			//show dice for the buildings it matters for
			if(data[0].building[i] === "Chapel" || data[0].building[i] === "Statue"){
				let row2 = $("<div>"),
				diceCol = $("<div>").attr("class", "col-md-12 text-center");

				for(let ii=0; ii<data[0].dice.length;ii++){
				diceCol.append(`<img alt="player dice" class="btn-icon" src="../assets/images/dice-${myColor}/die-${data[0].dice[ii]}.png" />`);
				};
				row2.append(diceCol);
				building.append(row2);
			}
			//clear existing then add the new buildings
			buildingEle.empty();
			let btnDone = $('<button/>', {
				text: "Done",
				id: "btn-send-building",
				class: "btn-choice",
				click: sendBuilding
			})
			buildingEle.append(btnDone);
			buildingEle.prepend(building);
		};
	});


function useBuilding(){
	console.log("use building button");
	event.preventDefault();
	this.classList.toggle("building-clicked");
}
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