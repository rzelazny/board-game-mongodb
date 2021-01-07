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
	chooseAdvisorEle = $("#select-advisor"),
	buildingEle = $("#use-buildings"),
	useAdvisorContainer = $("#use-advisors"),
	waitEle = $("#waiting"),
	diceImg = document.getElementsByClassName("dice-btn"),
	diceEle = document.getElementsByClassName("btn-die-choice"),
	diceTotalEle = document.getElementById("dice-total"),
	selectedDice = document.getElementsByClassName("clicked"),
	promptMsgEle = document.getElementById("prompt-message");

	

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
		$("#prompt-user-container").css("display", "none");
		selectDiceEle.css("display", "none");
		waitEle.css("display", "block");
		promptMsgEle.style.display = "none";
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

	//Sending advisor choices on click
	function sendAdvisors() {
		console.log("advisor choices submitted");
		event.preventDefault();

		let selectedBuildings = document.getElementsByClassName("advisor-clicked");
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

		// socket.emit("player-choice", myChoice);
		// promptEle.css("display", "none");
		// buildingEle.css("display", "none");
		// waitEle.css("display", "block");
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
		if(dice.length === 0){
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

function useAdvisor(){
	console.log("use building button");
	event.preventDefault();

	//find other buttons that are part of this choice
	let thisChoiceBtns = document.getElementsByClassName(this.id.slice(0,-2)); 
	let thisBtn = this.id;
	//if this button isn't selected select it
	if(!this.classList.contains("advisor-clicked") && !this.classList.contains("advisor-clicked-locked")) {
		this.classList.add("advisor-clicked");
	}
	
	//then deselect the other buttons in this choice
	for(let i=0; i<thisChoiceBtns.length; i++){
		if(thisChoiceBtns[i].id !== thisBtn){
			thisChoiceBtns[i].classList.remove("advisor-clicked");
		}
	}
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
		for(let i=0; i<advisorData.length; i++){
			//general layout
			let advisor = $("<div>").attr("class", "use-advisor"),
			row = $("<div>").attr("class", "row"),
			col1 = $("<div>").attr("class", "col-md-1"),
			col2 = $("<div>").attr("class", "col-md-2"),
			col3 = $("<div>").attr("class", "col-md-9");

		 	//create data elements
			let name = advisorData[i].name;
			let image = `<img alt=${advisorData[i].img.alt} class="adv-icon" src="${advisorData[i].img.url}" />`;
			
			col1.append(name);
			col2.append(image);

			//figure out how many choices need to be made for this advisor
			let rowsNeeded = advisorData[i].choice.length;
			console.log("rowsNeeded", rowsNeeded);

			//create as many button rows as the advisor requires
			for(let j=0;j<rowsNeeded;j++){
				let btnRow = $("<div>").attr("class", "row"),
				btnCol = $("<div>").attr("class", ("col-md-"+12/advisorData[i].choice[j].optNum)),
				btnCol2 = $("<div>").attr("class", ("col-md-"+12/advisorData[i].choice[j].optNum)),
				btnCol3 = $("<div>").attr("class", ("col-md-"+12/advisorData[i].choice[j].optNum));

				//create as many buttons as each choice requires
				for(let k=0; k<advisorData[i].choice[j].optNum; k++){

					var useBtn = $('<button/>', {
						id: `${name}-choice-${j}-${k}`,
						click: useAdvisor,
						class: ()=>{
							//if there's only one choice automatically select it
							if(advisorData[i].choice[j].optNum === 1){
								return `btn-choice advisor-clicked-locked ${name}-choice-${j}`;
							}
							else if(k===0){ //otherwise select the first option by default
								return `btn-choice advisor-clicked ${name}-choice-${j}`;
							}
							else return `btn-choice ${name}-choice-${j}`;
						},
						html: ()=>{ //display the icons on the buttons
							let advText = "";
							if(k===0){
								advText = textToIcon(advisorData[i].choice[j].option1);
							}
							else if(k===1){
								advText = textToIcon(advisorData[i].choice[j].option2);
							}
							else{
								advText = textToIcon(advisorData[i].choice[j].option3);
							}
							return advText
						}
					})
					if(k===0){
						btnCol.append(useBtn);
						btnRow.append(btnCol);
					}
					else if(k===1){
						btnCol2.append(useBtn);
						btnRow.append(btnCol2);
					}
					else{
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

	//function converts icon names into images
	function textToIcon(textIn){

		let splitText = textIn.split(", ");
		let imageResult = "";

		for(let i=0; i<splitText.length; i++){
			imageResult += `<img alt="${splitText[i]}" class="btn-icon" src="../assets/images/icons/${splitText[i]}-icon.png" />`;
		}

		return imageResult;
	}
});