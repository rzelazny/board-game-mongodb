let gameState = {};
const currentGame = "5fe7d983cdf2912048481cfc";

//get the state of the game on load
function init() {
	fetch("/api/gameState/" + currentGame)
		.then(response => {
			return response.json();
		})
		.then(data => {
			// save db data on global variable
			gameState = data;
			console.log(gameState);

			playGame();
		});
}

init();

//Function process game logic through the phases of the game
function playGame() {
	switch (gameState.curPhase) {
		case 1:
			return aidPhaseOne()
		case 2:
			return productivePhase()
		case 3:
			return rewardPhase()
		case 4:
			return productivePhase()
		case 5:
			return aidPhaseTwo()
		case 6:
			return productivePhase()
		case 7:
			return rallyPhase()
		case 8:
			return combatPhase()
		default:
			console.log("Phase not found");
			break;
	}
}

//Function moves game state between phases and ends the game after round 5 phase 8
function nextPhase() {
	//let {curPhase, curRound} = gameState;

	if (gameState.curPhase === 8) {
		//check if game is over when it's phase 8
		if (gameState.curRound === 5) endGame();
		else { //if not increment round and set phase back to one
			gameState.curRound++;
			gameState.curPhase = 1;
			updatePhase();
		}
	}
	else {
		gameState.curPhase++;
		updatePhase();
		//update global variable
		//Object.assign(gameState, phaseUpdateData);

		//keep playing
		playGame();
	}
}

//function updates current phase in the db
function updatePhase() {
	let phaseUpdateData = {
		round: gameState.curRound,
		phase: gameState.curPhase
	};
	console.log(`Updating game ${currentGame} phase to ${gameState.curPhase} and round to ${gameState.curRound}`);
	fetch("/api/updatePhase/" + currentGame, {
		method: "POST",
		body: JSON.stringify(phaseUpdateData),
		headers: {
			Accept: "application/json, text/plain, */*",
			"Content-Type": "application/json"
		}
	})
}

//Function runs the game logic for aid phase one - players with lowest building count get a bonus. 
function aidPhaseOne() {
	console.log("Aid phase one running");

	let playerStats = [];
	let buildCount = [];
	let resourceCount = [];
	let worstOff = [];

	//get current player stats
	gameState.players.forEach(player => {
		let stats = {
			id: player._id,
			buildings: player.constructedBuildings.length,
			resources: (player.resource1 + player.resource2 + player.resource3)
		}
		playerStats.push(stats);
		buildCount.push(stats.buildings);
	});

	//Find the lowest building total
	const fewestBuildings = Math.min(...buildCount);

	let leastBuildingPlayers = playerStats.filter(function(stats){
		return stats.buildings === fewestBuildings;
	});

	//if there's a tie for fewest buildings check their resource count
	if(leastBuildingPlayers.length > 1){
		leastBuildingPlayers.forEach(player => {
			resourceCount.push(player.resources);
		});

		//Find the lowest resource total
		const fewestResources = Math.min(...resourceCount);

		let leastResourcePlayers = leastBuildingPlayers.filter(function(stats){
			return stats.resources === fewestResources;
		});
		
		leastResourcePlayers.forEach(player => {
			worstOff.push(player.id);
		});
	}
	else{ //if there's only one player with the least building they're the worst off
		worstOff.push(leastBuildingPlayers[0].id);
	}
	console.log("filtered players", worstOff);

	

	//move on to the next phase
	//nextPhase();
}

//Function runs the game logic for product phases (2, 4, 6)
function productivePhase() {
	console.log("Productive phase running");

	//move on to the next phase
	nextPhase();
}


//Function runs the game logic for aid phase two
function aidPhaseTwo() {
	console.log("Aid phase two running");

	//move on to the next phase
	nextPhase();
}

//Function runs the game logic for reward phase
function rewardPhase() {
	console.log("Reward phase running");

	//move on to the next phase
	nextPhase();
}

//Function runs the game logic for rally troops phase
function rallyPhase() {
	console.log("Rally phase running");

	//move on to the next phase
	nextPhase();
}

//Function runs the game logic for combat phase
function combatPhase() {
	console.log("Combat phase running");

	//move on to the next phase
	nextPhase();
}

function endGame() {
	console.log("The game has ended!");
}

// let transactions = [];
// let myChart;

// fetch("/api/transaction")
//   .then(response => {
//     return response.json();
//   })
//   .then(data => {
//     // save db data on global variable
//     transactions = data;

//     populateTotal();
//     populateTable();
//     populateChart();
//   });

// function populateTotal() {
//   // reduce transaction amounts to a single total value
//   let total = transactions.reduce((total, t) => {
//     return total + parseInt(t.value);
//   }, 0);

//   let totalEl = document.querySelector("#total");
//   totalEl.textContent = total;
// }

// function populateTable() {
//   let tbody = document.querySelector("#tbody");
//   tbody.innerHTML = "";

//   transactions.forEach(transaction => {
//     // create and populate a table row
//     let tr = document.createElement("tr");
//     tr.innerHTML = `
//       <td>${transaction.name}</td>
//       <td>${transaction.value}</td>
//     `;

//     tbody.appendChild(tr);
//   });
// }

// function populateChart() {
//   // copy array and reverse it
//   let reversed = transactions.slice().reverse();
//   let sum = 0;

//   // create date labels for chart
//   let labels = reversed.map(t => {
//     let date = new Date(t.date);
//     return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
//   });

//   // create incremental values for chart
//   let data = reversed.map(t => {
//     sum += parseInt(t.value);
//     return sum;
//   });

//   // remove old chart if it exists
//   if (myChart) {
//     myChart.destroy();
//   }

//   let ctx = document.getElementById("myChart").getContext("2d");

//   myChart = new Chart(ctx, {
//     type: 'line',
//       data: {
//         labels,
//         datasets: [{
//             label: "Total Over Time",
//             fill: true,
//             backgroundColor: "#6666ff",
//             data
//         }]
//     }
//   });
// }

// function sendTransaction(isAdding) {
//   let nameEl = document.querySelector("#t-name");
//   let amountEl = document.querySelector("#t-amount");
//   let errorEl = document.querySelector(".form .error");

//   // validate form
//   if (nameEl.value === "" || amountEl.value === "") {
//     errorEl.textContent = "Missing Information";
//     return;
//   }
//   else {
//     errorEl.textContent = "";
//   }

//   // create record
//   let transaction = {
//     name: nameEl.value,
//     value: amountEl.value,
//     date: new Date().toISOString()
//   };

//   // if subtracting funds, convert amount to negative number
//   if (!isAdding) {
//     transaction.value *= -1;
//   }

//   // add to beginning of current array of data
//   transactions.unshift(transaction);

//   // re-run logic to populate ui with new record
//   populateChart();
//   populateTable();
//   populateTotal();

//   // also send to server
//   fetch("/api/transaction", {
//     method: "POST",
//     body: JSON.stringify(transaction),
//     headers: {
//       Accept: "application/json, text/plain, */*",
//       "Content-Type": "application/json"
//     }
//   })
//   .then(response => {    
//     return response.json();
//   })
//   .then(data => {
//     if (data.errors) {
//       errorEl.textContent = "Missing Information";
//     }
//     else {
//       // clear form
//       nameEl.value = "";
//       amountEl.value = "";
//     }
//   })
//   .catch(err => {
//     // fetch failed, so save in indexed db
//     saveRecord(transaction);

//     // clear form
//     nameEl.value = "";
//     amountEl.value = "";
//   });
// }

// document.querySelector("#add-btn").onclick = function() {
//   sendTransaction(true);
// };

// document.querySelector("#sub-btn").onclick = function() {
//   sendTransaction(false);
// };
