$(document).ready(function () {
	var curGame = document.defaultView.location.pathname.split("gameboard/").pop();
	var curUser = "";
	var curRoom = 0;
	var myColor = "blue";
	var myTotal = 0;
	const socket = io();
	var playerListEle = $("#player-list");
	var playerCount = 0;

	//elements we adjust
	let promptEle = $("#prompt-user-container"),
		resEle = $("#select-resource"),
		selectDiceEle = $("#select-dice"),
		advisorEle = $("#advisor-container"),
		chatEle = $("#chat-container"),
		chooseAdvisorEle = $("#select-advisor"),
		buildingEle = $("#use-buildings"),
		chooseBuildingEle = $("#building-container"),
		createBuildingEle = $("#select-building"),
		useAdvisorContainer = $("#use-advisors"),
		rewardEle = $("#get-reward"),
		waitEle = $("#waiting"),
		diceImg = document.getElementsByClassName("dice-btn"),
		diceEle = document.getElementsByClassName("btn-die-choice"),
		diceTotalEle = document.getElementById("dice-total"),
		selectedDice = document.getElementsByClassName("clicked"),
		promptMsgEle = document.getElementById("prompt-message");
	//sidebar elements
	let sidebarVPEle = document.getElementById("sidebar-vp"),
		sidebarBuildingsEle = document.getElementById("sidebar-buildings"),
		sidebarStrEle = document.getElementById("sidebar-str"),
		sidebarRes1Ele = document.getElementById("sidebar-res1"),
		sidebarRes2Ele = document.getElementById("sidebar-res2"),
		sidebarRes3Ele = document.getElementById("sidebar-res3"),
		sidebar2TokenEle = document.getElementById("sidebar-2token");


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
						$.get("/api/gameState/" + curGame)
							.then(function (gameData) { //join the room for the game
								curRoom = gameData.roomNumber;
								let joinData = {
									userId: curUser,
									room: curRoom
								}
								socket.emit("join-room", joinData);
								console.log("I joined room ", joinData.room);
								//populate the board based on the game data
								populateBuildings(gameData.buildings);
								//TODO: populateAdvisors(gameData.advisors);
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
			myTotal -= parseInt(this.getAttribute("pips"));
		}
		else {
			myTotal += parseInt(this.getAttribute("pips"));
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

		//clear current total
		myTotal = 0;
		diceTotalEle.textContent = 0;

		//hide elements
		$("#prompt-user-container").css("display", "none");
		selectDiceEle.css("display", "none");
		waitEle.css("display", "block");
		promptMsgEle.style.display = "none";
	})

	//Sending choice of buildings to create on click
	$("#btn-create-building").on("click", function (event) {
		console.log("create building submitted");
		event.preventDefault();

		let toBuild = [];
		let chosenBuildings = $(".build-selected");

		//get the names of the buildings we've choosen to build
		for (let i = 0; i < chosenBuildings.length; i++) {
			toBuild.push(chosenBuildings[i].children[0].children[0].innerHTML);
		}

		console.log("I'm sending:", toBuild);

		let myChoice = {
			player: curUser,
			choiceType: "construct-building",
			choice: toBuild
		}
		socket.emit("player-choice", myChoice);
		$("#prompt-user-container").css("display", "none");
		createBuildingEle.css("display", "none");
		waitEle.css("display", "block");
		promptMsgEle.style.display = "none";
	})

	//Sending building usage on click
	function sendBuilding() {
		console.log("building choice submitted");
		event.preventDefault();

		let selectedBuildings = document.getElementsByClassName("building-clicked");
		let choice = [];

		for (let i = 0; i < selectedBuildings.length; i++) {
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

	//Sending advisor choices on click
	function sendAdvisors() {
		console.log("advisor choices submitted");
		event.preventDefault();

		//get the chosen advisor options
		let selAdvChoices = document.querySelectorAll(".advisor-clicked-locked, .advisor-clicked");
		let choice = [];

		//only need to send the adviser-choice-num class
		for (let i = 0; i < selAdvChoices.length; i++) {
			choice.push(selAdvChoices[i].id,);
		}

		let myChoice = {
			player: curUser,
			choiceType: "use-advisor",
			choice: choice
		}
		console.log("I'm sending:", myChoice);

		socket.emit("player-choice", myChoice);
		promptEle.css("display", "none");
		useAdvisorContainer.css("display", "none");
		waitEle.css("display", "block");
	}

	//Sending acknowledgement of reward bonus point
	$("#btn-get-reward").on("click", function (event) {
		console.log("reward acknowledged");
		let myChoice = {
			player: curUser,
			choiceType: "got-reward",
			choice: "done"
		}
		rewardEle.css("display", "none");
		socket.emit("player-choice", myChoice);
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
		advisorEle.css("display", "block");
		chatEle.css("display", "block");
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

		//hide elements from earlier phases, this is usually due to a timeout
		switch (parsePhase) {
			case 1:
				updateNavBar(parsePhase);
				//$("#select-resource").css("display", "block");
				break;
			case 2: //productive season 1
				updateNavBar(parsePhase);
				promptEle.css("display", "none");
				resEle.css("display", "none");
				break;
			case 7: // reward phase
				updateNavBar(3);
				break;
			case 8: //productive season 2
				promptEle.css("display", "none");
				resEle.css("display", "none");
				updateNavBar(4);
				break;
			default:
				console.log("Phase not found");
				break;
		}
	});

	//update the sidebar when prompted to
	socket.on("update-sidebar", (sidebarData) => {
		console.log("recieved sidebar update message", sidebarData);

		let { score, constructedBuildings, resource1, resource2, resource3, strength, twoToken } = sidebarData;

		let textSpace = " : ";
		//set the player stats
		sidebarVPEle.textContent = textSpace + score;
		sidebarBuildingsEle.textContent = textSpace + (constructedBuildings.length);
		sidebarStrEle.textContent = textSpace + strength;
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
			for (let ii = 0; ii < turnData[i].dice.slice().length; ii++) {
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
				advisorEle.css("display", "block");
				chooseAdvisorEle.css("display", "block");
				chooseBuildingEle.css("display", "none");
				selectDiceEle.css("display", "block");
				promptMsgEle.style.display = "block";
				break;
			case "You've gained a victory point from the King's reward.":
				rewardEle.css("display", "block");
				promptMsgEle.style.display = "block";
				break;
			default:
				console.log("Unknown message prompt: ", message);
		}
	});

	//update my dice buttons
	socket.on("update-dice", ({ color, dice }) => {
		console.log("update dice message recieved", color, dice)

		//set dice icons and value
		for (let i = 0; i < dice.length; i++) {
			diceImg[i].src = (`../assets/images/dice-${color}/die-${dice[i]}.png`);
			diceEle[i].setAttribute("pips", dice[i]);
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

		//if there are no dice don't show the section anymore
		if (dice.length === 0) {
			selectDiceEle.css("display", "none");
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
		console.log("wait message recieved");
		waitEle.css("display", "block");
		$("#prompt-user-container").css("display", "block");
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
		for (let i = 0; i < data[0].building.length; i++) {
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
				text: "Use " + name,
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
			if (data[0].building[i] === "Chapel" || data[0].building[i] === "Statue") {
				let row2 = $("<div>"),
					diceCol = $("<div>").attr("class", "col-md-12 text-center");

				for (let ii = 0; ii < data[0].dice.length; ii++) {
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

	function useBuilding() {
		console.log("use building button");
		event.preventDefault();
		this.classList.toggle("building-clicked");
	}

	//display the use advisors section
	socket.on("use-advisors", (advisorData) => {
		//{name, img:{url}, img:{alt}, choice1, choice2, choice3}
		console.log("use advisors recieved")
		console.log(advisorData);

		//always show the prompt container and hide the wait message
		$("#prompt-user-container").css("display", "block");
		waitEle.css("display", "none");
		promptMsgEle.style.display = "block";
		promptMsgEle.innerHTML = "You have influenced these advisors:"
		useAdvisorContainer.css("display", "block");

		//delete existing data before generating new divs
		useAdvisorContainer.empty();

		//create the advisor div
		for (let i = 0; i < advisorData.length; i++) {
			//general layout
			let advisor = $("<div>").attr("class", "use-advisor"),
				row = $("<div>").attr("class", "row"),
				col1 = $("<div>").attr("class", "col-md-1"),
				col2 = $("<div>").attr("class", "col-md-2"),
				col3 = $("<div>").attr("class", "col-md-9");

			//create data elements
			let number = advisorData[i].number;
			let image = `<img alt=${advisorData[i].img.alt} class="adv-icon" src="${advisorData[i].img.url}" />`;

			col1.append(number);
			col2.append(image);

			//figure out how many choices need to be made for this advisor
			let rowsNeeded = advisorData[i].choice.length;
			console.log("rowsNeeded", rowsNeeded);

			//create as many button rows as the advisor requires
			for (let j = 0; j < rowsNeeded; j++) {
				let btnRow = $("<div>").attr("class", "row"),
					btnCol = $("<div>").attr("class", ("col-md-" + 12 / advisorData[i].choice[j].optNum)),
					btnCol2 = $("<div>").attr("class", ("col-md-" + 12 / advisorData[i].choice[j].optNum)),
					btnCol3 = $("<div>").attr("class", ("col-md-" + 12 / advisorData[i].choice[j].optNum));

				//create as many buttons as each choice requires
				for (let k = 0; k < advisorData[i].choice[j].optNum; k++) {

					var useBtn = $('<button/>', {
						id: `${number}-choice-${j}-${k}`,
						click: useAdvisor,
						class: () => {
							//if there's only one choice automatically select it
							if (advisorData[i].choice[j].optNum === 1) {
								return `btn-choice advisor-clicked-locked ${number}-choice-${j}`;
							}
							else if (k === 0) { //otherwise select the first option by default
								return `btn-choice advisor-clicked ${number}-choice-${j}`;
							}
							else return `btn-choice ${number}-choice-${j}`;
						},
						html: () => { //display the icons on the buttons
							let advText = "";
							if (k === 0) {
								advText = textToIcon(advisorData[i].choice[j].option1);
							}
							else if (k === 1) {
								advText = textToIcon(advisorData[i].choice[j].option2);
							}
							else {
								advText = textToIcon(advisorData[i].choice[j].option3);
							}
							return advText
						}
					})
					if (k === 0) {
						btnCol.append(useBtn);
						btnRow.append(btnCol);
					}
					else if (k === 1) {
						btnCol2.append(useBtn);
						btnRow.append(btnCol2);
					}
					else {
						btnCol3.append(useBtn);
						btnRow.append(btnCol3);
					}
				}

				//append the set of buttons
				col3.append(btnRow);
			}

			row.append(col1, col2, col3);
			advisor.append(row);
			useAdvisorContainer.append(advisor);
		};
		let btnDone = $('<button/>', {
			text: "Done",
			id: "btn-send-advisor",
			class: "btn-choice",
			click: sendAdvisors
		})
		useAdvisorContainer.append(btnDone);
	});

	function useAdvisor() {
		console.log("use advisor button");
		event.preventDefault();

		//find other buttons that are part of this choice
		let thisChoiceBtns = document.getElementsByClassName(this.id.slice(0, -2));
		let thisBtn = this.id;
		//if this button isn't selected select it
		if (!this.classList.contains("advisor-clicked") && !this.classList.contains("advisor-clicked-locked")) {
			this.classList.add("advisor-clicked");
		}

		//then deselect the other buttons in this choice
		for (let i = 0; i < thisChoiceBtns.length; i++) {
			if (thisChoiceBtns[i].id !== thisBtn) {
				thisChoiceBtns[i].classList.remove("advisor-clicked");
			}
		}
	}

	//display enemy data
	socket.on("enemy-data", (enemyData) => {
		console.log("Enemy data recieved: ", enemyData);

		let chatLine = $("<li>")
		let chatScroll = $("#chat-log");

		chatLine.text(`Next enemy: ${enemyData.name} Strength: ${enemyData.strength}
		Penalty: ${enemyData.penalty} Reward: ${enemyData.reward}`);
		$("#chat-log").append(chatLine);

		//scroll to the bottom
		chatScroll.scrollTop(1000);
	});

	//display the pick buildings section
	socket.on("choose-buildings", (playerData) => {
		console.log("Got choose buildings");

		//populate building section and display it
		updateBuildings(playerData);
		waitEle.css("display", "none");
		advisorEle.css("display", "none");

		promptMsgEle.innerHTML = "Choose a building to construct."
		$("#prompt-user-container").css("display", "block");
		createBuildingEle.css("display", "block");
		chooseBuildingEle.css("display", "block");

	});

	/* ----------------------------
	 * Functions for displaying the client data
	 * ----------------------------
	 */

	//Populate the building sections
	function populateBuildings(buildingData) {
		console.log("Populating building section");
		console.log(buildingData);

		//clear existing before adding new buildings
		chooseBuildingEle.empty();

		//track our rows and columns, which are pivoted for display purposes
		let colCounter = 0;
		let rowCounter = 1;

		let row = $("<div>").attr("class", "row");
		let col1 = $("<div>").attr({ "class": "col-lg-1 sel-building-col", "id": "col1" }),
			col2 = $("<div>").attr({ "class": "col-lg-1 sel-building-col", "id": "col2" }),
			col3 = $("<div>").attr({ "class": "col-lg-1 sel-building-col", "id": "col3" }),
			col4 = $("<div>").attr({ "class": "col-lg-1 sel-building-col", "id": "col4" }),
			col5 = $("<div>").attr({ "class": "col-lg-1 sel-building-col", "id": "col5" }),
			col6 = $("<div>").attr({ "class": "col-lg-1 sel-building-col", "id": "col6" }),
			col7 = $("<div>").attr({ "class": "col-lg-1 sel-building-col", "id": "col7" });

		row.append(col1, col2, col3, col4, col5, col6, col7);
		chooseBuildingEle.append(row);

		//create the building div
		for (let i = 0; i < buildingData.length; i++) {
			//create data elements
			let name = buildingData[i].name;
			let description = buildingData[i].effectType;
			let costRes1 = buildingData[i].cost[0];
			let costRes2 = buildingData[i].cost[1];
			let costRes3 = buildingData[i].cost[2];
			let points = buildingData[i].points;

			//general layout
			let building = $("<div>").attr({ "class": "select-building", "name": name }),
				title = $("<div>").attr("class", "text-center"),
				cost = $("<div>").attr("class", "text-center"),
				effectRow = $("<div>").attr("class", "text-center"),
				imgVP = $("<div>").attr("class", "text-center")

			title.append(`<h5 style="text-align:center">${name}</h5>`);
			cost.append(`<img alt="Res1 Cost" class="icon" src="../assets/images/icons/res1-icon.png" />:${costRes1} 
				<img alt="Res2 Cost" class="icon" src="../assets/images/icons/res2-icon.png" />:${costRes2}
				<img alt="Res3 Cost" class="icon" src="../assets/images/icons/res3-icon.png" />:${costRes3}`);
			imgVP.append(`<img alt="${buildingData[i].name}" class="btn-icon" src="../assets/images/buildings/${buildingData[i].name}.png" />
			<img alt="Res1 Cost" class="icon" src="../assets/images/icons/VP-icon.png" />: ${points}`);
			effectRow.append(description);

			building.append(title, cost, imgVP, effectRow);

			$("#col" + rowCounter).append(building);
			//move to a new column every 4 buildings
			colCounter++;
			if (colCounter > 3) {
				colCounter = 0;
				rowCounter++;
			}
		};
	}

	//update the choose buildings tab
	function updateBuildings(playerData) {
		console.log("Updating building data")

		let buildings = document.getElementsByClassName("select-building");

		for (let i = 0; i < buildings.length; i++) {
			//set already created buildings
			if (playerData.constructedBuildings.includes(buildings[i].getAttribute("name"))) {
				buildings[i].classList.add("constructed");
				buildings[i].classList.remove("valid-building");
			}
			//see if the prior building has been created already
			let previousBuilt = false;
			//first row buildings, and buildings directly below already build buildings are valid
			if (i % 4 === 0) {
				previousBuilt = true;
			} else if (buildings[i - 1].classList.contains("constructed")) {
				previousBuilt = true;
			}

			//valid buildings have sufficient resources, aren't already built, and have the prior buildings built
			if (previousBuilt &&
				parseInt(playerData.resource1) >= parseInt(buildings[i].children[1].innerHTML.split(":")[1].charAt(0)) &&
				parseInt(playerData.resource2) >= parseInt(buildings[i].children[1].innerHTML.split(":")[2].charAt(0)) &&
				parseInt(playerData.resource3) >= parseInt(buildings[i].children[1].innerHTML.split(":")[3].charAt(0))) {

				buildings[i].classList.add("valid-building");
			} else {
				buildings[i].classList.remove("valid-building");
			}
		};

		//Select Building on click
		$(".select-building").on("click", function (event) {
			console.log("building clicked");
			event.preventDefault();

			//only valid choices can be selected
			if (this.classList.contains("valid-building")) {

				//deselect all other buildings unless the player has the envoy
				if (!playerData.hasBonus) {
					let buildings = document.getElementsByClassName("select-building");
					for (let i = 0; i < buildings.length; i++) {
						buildings[i].classList.remove("build-selected");
					}
				}
				//and select the current building
				this.classList.toggle("build-selected");
			}
		})
	}

	//Update the nav bar css to highlight the current phase
	function updateNavBar(phase) {
		console.log("Updating top navbar");
		let navBarEleList = document.getElementsByClassName("nav-phase");

		for (let i = 0; i < navBarEleList.length; i++) {
			if ((i + 1) === phase) navBarEleList[i].style.color = "red";
			else navBarEleList[i].style.color = "black";
		}
	}

	//function converts icon names into images
	function textToIcon(textIn) {

		let splitText = textIn.split(", ");
		let imageResult = "";

		for (let i = 0; i < splitText.length; i++) {
			imageResult += `<img alt="${splitText[i]}" class="btn-icon" src="../assets/images/icons/${splitText[i]}-icon.png" />`;
		}

		return imageResult;
	}
});