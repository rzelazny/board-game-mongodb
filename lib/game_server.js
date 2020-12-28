/**
 * @fileoverview This class encapsulates an active game on the server and
 *   handles game updates.
 * @author alvin@omgimanerd.tech (Alvin Lin)
 */

const HashMap = require('hashmap');
const Player = require('./Player');
//const Util = require('../shared/Util');

/**
 * Constructor for a Game object.
 * @constructor
 */
function Game() {
    this.clients = new HashMap();
    this.players = new HashMap();
}

/**
 * Factory method for a Game object.
 * @return {Game}
 */
Game.create = function () {
    return new Game();
};

/**
 * Returns a list containing the connected Player objects.
 * @return {Array<Player>}
 */
Game.prototype.getPlayers = function () {
    return this.players.values();
};

/**
 * Returns callbacks that can be passed into an update()
 * method for an object so that it can access other elements and
 * entities in the game.
 * @return {Object<string, Function>}
 */
Game.prototype._callbacks = function () {
    return {
        //players: Util.bind(this, this.players)
    };
};

Game.prototype.addNewPlayer = function (socket, data) {
    this.clients.set(socket.id, socket);
    this.players.set(socket.id, Player.create(socket.id, [10, 10]));
};

Game.prototype.removePlayer = function (id) {
    this.clients.remove(id);
    this.players.remove(id);
}

/**
 * Updates a player based on input received from their client.
 * @param {string} id The socket ID of the client
 * @param {Object} data The input received from the client
 */
Game.prototype.updatePlayerOnInput = function (id, data) {
    var player = this.players.get(id);
    if (player) {
        player.updateOnInput(data.keyboardState);
    }
}

/**
 * Steps the server forward in time. Updates every entity in the game.
 */
Game.prototype.update = function () {
    var players = this.getPlayers();
    for (var i = 0; i < players.length; ++i) {
        players[i].update();
    }
};

/**
 * Sends the state of the game to every client.
 */
Game.prototype.sendState = function () {
    var ids = this.clients.keys();
    for (var i = 0; i < ids.length; ++i) {
        this.clients.get(ids[i]).emit('update', {
            self: this.players.get(ids[i]),
            players: this.players.values().filter((player) => player.id != ids[i])
        });
    }
};

module.exports = Game;

// let gameState = {};
// const currentGame = document.defaultView.location.pathname.split("gameboard/").pop();

// //websocket connection
// const ws = new WebSocket('ws://localhost:9898/');
//         ws.onopen = function () {
//             console.log('WebSocket Client Connected');
//             ws.send('Hi this is web client.');
//         };
//         ws.onmessage = function (e) {
//             console.log("Received: '" + e.data + "'");
//         };

// //get the state of the game on load
// function init() {
// 	fetch("/api/gameState/" + currentGame)
// 		.then(response => {
// 			return response.json();
// 		})
// 		.then(data => {
// 			// save db data on global variable
// 			gameState = data;

// 			console.log(gameState);

// 			playGame();
// 		});
// }

// init();

// //Function process game logic through the phases of the game
// function playGame() {
// 	switch (gameState.curPhase) {
// 		case 1:
// 			return aidPhaseOne()
// 		case 2:
// 			return productivePhase()
// 		case 3:
// 			return rewardPhase()
// 		case 4:
// 			return productivePhase()
// 		case 5:
// 			return aidPhaseTwo()
// 		case 6:
// 			return productivePhase()
// 		case 7:
// 			return rallyPhase()
// 		case 8:
// 			return combatPhase()
// 		default:
// 			console.log("Phase not found");
// 			break;
// 	}
// }

// //Function moves game state between phases and ends the game after round 5 phase 8
// function nextPhase() {
// 	//let {curPhase, curRound} = gameState;

// 	if (gameState.curPhase === 8) {
// 		//check if game is over when it's phase 8
// 		if (gameState.curRound === 5) endGame();
// 		else { //if not increment round and set phase back to one
// 			gameState.curRound++;
// 			gameState.curPhase = 1;
// 			updateGame(currentGame, "curPhase", gameState.curPhase);
// 			updateGame(currentGame, "curRound", gameState.curRound);
// 		}
// 	}
// 	else {
// 		gameState.curPhase++;
// 		updateGame(currentGame, "curPhase", gameState.curPhase);

// 		//keep playing
// 		playGame();
// 	}
// }

// //Function runs the game logic for aid phase one - players with lowest building count get a bonus. 
// function aidPhaseOne() {
// 	console.log("Aid phase one running");

// 	let playerStats = [];
// 	let buildCount = [];
// 	let resourceCount = [];
// 	let worstOff = [];

// 	//get current player stats
// 	gameState.players.forEach(player => {
// 		let stats = {
// 			id: player._id,
// 			buildings: player.constructedBuildings.length,
// 			resources: (player.resource1 + player.resource2 + player.resource3)
// 		}
// 		playerStats.push(stats);
// 		buildCount.push(stats.buildings);
// 	});

// 	//Find the lowest building total
// 	const fewestBuildings = Math.min(...buildCount);

// 	let leastBuildingPlayers = playerStats.filter(function(stats){
// 		return stats.buildings === fewestBuildings;
// 	});

// 	//if there's a tie for fewest buildings check their resource count
// 	if(leastBuildingPlayers.length > 1){
// 		leastBuildingPlayers.forEach(player => {
// 			resourceCount.push(player.resources);
// 		});

// 		//Find the lowest resource total
// 		const fewestResources = Math.min(...resourceCount);

// 		let leastResourcePlayers = leastBuildingPlayers.filter(function(stats){
// 			return stats.resources === fewestResources;
// 		});
		
// 		leastResourcePlayers.forEach(player => {
// 			worstOff.push(player.id);
// 		});
// 	}
// 	else{ //if there's only one player with the least building they're the worst off
// 		worstOff.push(leastBuildingPlayers[0].id);
// 	}

// 	//update the worst off player's bonus status in the db
// 	worstOff.forEach(player => {
// 		updatePlayer(player, "hasBonus", true);
// 	});
	

// 	let promptUserPromise = promisify(promptUser);
// 	promptUserPromise(worstOff, "")
// 	.then(
// 		//move on to the next phase
// 		//nextPhase();
// 		)

// 	//promptUser(worstOff, "");
// }

// //Function prompts specific players with a message, and tells all other users to wait
// function promptUser(updatePlayer, msg){
// 	console.log("Prompting users");

// 	let {players} = gameState

// 	//
// 	players.forEach(player => {
// 		if(updatePlayer.includes(player._id) ){
// 			//send msg
// 			console.log("Message to specific users");
// 			$("#waiting").css("display", "none");
//             $("#select-resource").css("display", "block");
// 		}
// 		else{
// 			//send waiting for other players message
// 			console.log("Waiting on other players");
// 			$("#waiting").css("display", "block");
// 		}
// 	});
// }

// //Function runs the game logic for product phases (2, 4, 6)
// function productivePhase() {
// 	console.log("Productive phase running");

// 	//move on to the next phase
// 	nextPhase();
// }


// //Function runs the game logic for aid phase two
// function aidPhaseTwo() {
// 	console.log("Aid phase two running");

// 	//move on to the next phase
// 	nextPhase();
// }

// //Function runs the game logic for reward phase
// function rewardPhase() {
// 	console.log("Reward phase running");

// 	//move on to the next phase
// 	nextPhase();
// }

// //Function runs the game logic for rally troops phase
// function rallyPhase() {
// 	console.log("Rally phase running");

// 	//move on to the next phase
// 	nextPhase();
// }

// //Function runs the game logic for combat phase
// function combatPhase() {
// 	console.log("Combat phase running");

// 	//move on to the next phase
// 	nextPhase();
// }

// function endGame() {
// 	console.log("The game has ended!");
// }