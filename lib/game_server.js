var io;
var gameSocket;
var db;
var room;

//game variables
var curPhase = 1;
var turnOrder = [];
var nextEnemy = {};
var curPlayer = 1;
var curRound = 1;
var curPhase = 1;

/**
 * This function is called by index.js to initialize a new game instance.
 *
 * @param sio The Socket.IO library
 * @param socket The socket object for the connected client.
 */
exports.initGame = function (sio, socket, sdb, gameName) {
    console.log("New game launched");
    io = sio;
    gameSocket = socket;
    db = sdb;

    db.Game.findById(gameName)
		.then(gameData => {
            room = gameData.roomNumber;
            console.log("Room number :", room);
		})
		.catch(err => {
			console.log(err);
			res.status(404).json(err);
		});

    gameSocket.emit('connected', { message: "You are connected!" });
    
    //common event
    gameSocket.on('findLeader', findLeader);


    // Host Events
    gameSocket.on('hostCreateNewGame', hostCreateNewGame);
    gameSocket.on('hostRoomFull', hostPrepareGame);
    gameSocket.on('hostCountdownFinished', hostStartGame);
    gameSocket.on('hostNextRound', hostNextRound);

    // Player Events
    gameSocket.on('playerJoinGame', playerJoinGame);
    gameSocket.on('playerAnswer', playerAnswer);
    gameSocket.on('playerRestart', playerRestart);
}

/* *******************************
   *                             *
   *       HOST FUNCTIONS        *
   *                             *
   ******************************* */

/**
 * The 'START' button was clicked and 'hostCreateNewGame' event occurred.
 */

function updateBoard() {
    socket.to(room).emit("update-board");
}



function hostCreateNewGame() {
    // Create a unique Socket.IO Room
    var thisGameId = (Math.random() * 100000) | 0;

    // Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
    this.emit('newGameCreated', { gameId: thisGameId, mySocketId: this.id });

    // Join the Room and wait for the players
    this.join(thisGameId.toString());
};

/*
 * Two players have joined. Alert the host!
 * @param gameId The game ID / room ID
 */
function hostPrepareGame(gameId) {
    var sock = this;
    var data = {
        mySocketId: sock.id,
        gameId: gameId
    };
    //console.log("All Players Present. Preparing game...");
    io.sockets.in(data.gameId).emit('beginNewGame', data);
}

/*
 * The Countdown has finished, and the game begins!
 * @param gameId The game ID / room ID
 */
function hostStartGame(gameId) {
    console.log('Game Started.');
    sendWord(0, gameId);
};

/**
 * A player answered correctly. Time for the next word.
 * @param data Sent from the client. Contains the current round and gameId (room)
 */
function hostNextRound(data) {
    if (data.round < wordPool.length) {
        // Send a new set of words back to the host and players.
        sendWord(data.round, data.gameId);
    } else {

        if (!data.done) {
            //updating players win count
            db.all("SELECT * FROM player WHERE player_name=?", data.winner, function (err, rows) {
                rows.forEach(function (row) {
                    win = row.player_win;
                    win++;
                    console.log(win);
                    db.run("UPDATE player SET player_win = ? WHERE player_name = ?", win, data.winner);
                    console.log(row.player_name, row.player_win);
                })
            });
            data.done++;
        }
        // If the current round exceeds the number of words, send the 'gameOver' event.
        io.sockets.in(data.gameId).emit('gameOver', data);
    }
}

// function for finding leader
function findLeader() {
    console.log("finding leader");
    var sock = this;
    var i = 0;
    leader = {};
    db.all("SELECT * FROM player ORDER BY player_win DESC LIMIT 10", function (err, rows) {
        if (rows != undefined) {
            rows.forEach(function (row) {
                leader[i] = {};
                leader[i]['name'] = row.player_name;
                leader[i]['win'] = row.player_win;
                console.log(row.player_name);
                console.log(row.player_win);
                i++;
            })
        }
        console.log("found leader");
        sock.emit('showLeader', leader);
    });

}
/* *****************************
   *                           *
   *     PLAYER FUNCTIONS      *
   *                           *
   ***************************** */

/**
 * A player clicked the 'START GAME' button.
 * Attempt to connect them to the room that matches
 * the gameId entered by the player.
 * @param data Contains data entered via player's input - playerName and gameId.
 */
function playerJoinGame(data) {
    //console.log('Player ' + data.playerName + 'attempting to join game: ' + data.gameId );

    // A reference to the player's Socket.IO socket object
    var sock = this;

    // Look up the room ID in the Socket.IO manager object.
    var room = gameSocket.manager.rooms["/" + data.gameId];

    // If the room exists...
    if (room != undefined) {
        // attach the socket id to the data object.
        data.mySocketId = sock.id;

        // Join the room
        sock.join(data.gameId);
        db.serialize(function () {
            var stmt = " SELECT * FROM player WHERE player_name='" + data.playerName + "';";
            db.get(stmt, function (err, row) {
                if (err) throw err;
                if (typeof row == "undefined") {
                    db.prepare("INSERT INTO player (player_name,player_win) VALUES(?,?)").run(data.playerName, 0).finalize();
                } else {
                    console.log("row is: ", row);
                }
            });
        });
        //console.log('Player ' + data.playerName + ' joining game: ' + data.gameId );

        // Emit an event notifying the clients that the player has joined the room.
        io.sockets.in(data.gameId).emit('playerJoinedRoom', data);

    } else {
        // Otherwise, send an error message back to the player.
        this.emit('error', { message: "This room does not exist." });
    }
}

/**
 * A player has tapped a word in the word list.
 * @param data gameId
 */
function playerAnswer(data) {
    // console.log('Player ID: ' + data.playerId + ' answered a question with: ' + data.answer);

    // The player's answer is attached to the data object.  \
    // Emit an event with the answer so it can be checked by the 'Host'
    io.sockets.in(data.gameId).emit('hostCheckAnswer', data);
}

/**
 * The game is over, and a player has clicked a button to restart the game.
 * @param data
 */
function playerRestart(data) {
    // console.log('Player: ' + data.playerName + ' ready for new game.');

    // Emit the player's data back to the clients in the game room.
    data.playerId = this.id;
    io.sockets.in(data.gameId).emit('playerJoinedRoom', data);
}

/* *************************
   *                       *
   *      GAME LOGIC       *
   *                       *
   ************************* */

/**
 * Get a word for the host, and a list of words for the player.
 *
 * @param wordPoolIndex
 * @param gameId The room identifier
 */
function sendWord(wordPoolIndex, gameId) {
    var data = getWordData(wordPoolIndex);
    io.sockets.in(data.gameId).emit('newWordData', data);
}

/**
 * This function does all the work of getting a new words from the pile
 * and organizing the data to be sent back to the clients.
 *
 * @param i The index of the wordPool.
 * @returns {{round: *, word: *, answer: *, list: Array}}
 */
function getWordData(i) {
    // Randomize the order of the available words.
    // The first element in the randomized array will be displayed on the host screen.
    // The second element will be hidden in a list of decoys as the correct answer
    var words = shuffle(wordPool[i].words);

    // Randomize the order of the decoy words and choose the first 5
    var decoys = shuffle(wordPool[i].decoys).slice(0, 5);

    // Pick a random spot in the decoy list to put the correct answer
    var rnd = Math.floor(Math.random() * 5);
    decoys.splice(rnd, 0, words[1]);

    // Package the words into a single object.
    var wordData = {
        round: i,
        word: words[0],   // Displayed Word
        answer: words[1], // Correct Answer
        list: decoys      // Word list for player (decoys and answer)
    };

    return wordData;
}

/*
 * Javascript implementation of Fisher-Yates shuffle algorithm
 * http://stackoverflow.com/questions/2450954/how-to-randomize-a-javascript-array
 */
function shuffle(array) {
    var currentIndex = array.length;
    var temporaryValue;
    var randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

/**
 * Each element in the array provides data for a single round in the game.
 *
 * In each round, two random "words" are chosen as the host word and the correct answer.
 * Five random "decoys" are chosen to make up the list displayed to the player.
 * The correct answer is randomly inserted into the list of chosen decoys.
 *
 * @type {Array}
 */
var wordPool = [
    {
        "words": ["sale", "seal", "ales", "leas"],
        "decoys": ["lead", "lamp", "seed", "eels", "lean", "cels", "lyse", "sloe", "tels", "self"]
    },

    {
        "words": ["item", "time", "mite", "emit"],
        "decoys": ["neat", "team", "omit", "tame", "mate", "idem", "mile", "lime", "tire", "exit"]
    },

    {
        "words": ["spat", "past", "pats", "taps"],
        "decoys": ["pots", "laps", "step", "lets", "pint", "atop", "tapa", "rapt", "swap", "yaps"]
    },

    {
        "words": ["nest", "sent", "nets", "tens"],
        "decoys": ["tend", "went", "lent", "teen", "neat", "ante", "tone", "newt", "vent", "elan"]
    },

    {
        "words": ["pale", "leap", "plea", "peal"],
        "decoys": ["sale", "pail", "play", "lips", "slip", "pile", "pleb", "pled", "help", "lope"]
    },

    {
        "words": ["races", "cares", "scare", "acres"],
        "decoys": ["crass", "scary", "seeds", "score", "screw", "cager", "clear", "recap", "trace", "cadre"]
    },

    {
        "words": ["bowel", "elbow", "below", "beowl"],
        "decoys": ["bowed", "bower", "robed", "probe", "roble", "bowls", "blows", "brawl", "bylaw", "ebola"]
    },

    {
        "words": ["dates", "stead", "sated", "adset"],
        "decoys": ["seats", "diety", "seeds", "today", "sited", "dotes", "tides", "duets", "deist", "diets"]
    },

    {
        "words": ["spear", "parse", "reaps", "pares"],
        "decoys": ["ramps", "tarps", "strep", "spore", "repos", "peris", "strap", "perms", "ropes", "super"]
    },

    {
        "words": ["stone", "tones", "steno", "onset"],
        "decoys": ["snout", "tongs", "stent", "tense", "terns", "santo", "stony", "toons", "snort", "stint"]
    }
]

// setInterval(() => {
//     game.update();
//     game.sendState();
// }, 1000 / 60);

// //This class encapsulates an active game on the server and  handles game updates.
// const HashMap = require('hashmap');
// const Player = require('./Player');
// const Util = require('./shared/Util');

// //Game object constructor
// function Game() {
//     this.clients = new HashMap();
//     this.players = new HashMap();
// }

// //Factory method for a Game object.
// Game.create = function () {
//     return new Game();
// };

// //Return list of connected players
// Game.prototype.getPlayers = function () {
//     return this.players.values();
// };

// /**
//  * Returns callbacks that can be passed into an update()
//  * method for an object so that it can access other elements and
//  * entities in the game.
//  * @return {Object<string, Function>}
//  */
// Game.prototype._callbacks = function () {
//     return {
//         players: Util.bind(this, this.players)
//     };
// };

// Game.prototype.addNewPlayer = function (socket, data) {
//     this.clients.set(socket.id, socket);
//     this.players.set(socket.id, Player.create(socket.id, [10, 10]));
// };

// Game.prototype.removePlayer = function (id) {
//     this.clients.delete(id);
//     this.players.delete(id);
// }

// /**
//  * Updates a player based on input received from their client.
//  * @param {string} id The socket ID of the client
//  * @param {Object} data The input received from the client
//  */
// Game.prototype.updatePlayerOnInput = function (id, data) {
//     var player = this.players.get(id);
//     if (player) {
//         player.updateOnInput(data.keyboardState);
//     }
// }

// /**
//  * Steps the server forward in time. Updates every entity in the game.
//  */
// Game.prototype.update = function () {
//     var players = this.getPlayers();
//     for (var i = 0; i < players.length; ++i) {
//         players[i].update();
//     }
// };

// /**
//  * Sends the state of the game to every client.
//  */
// Game.prototype.sendState = function () {
//     var ids = this.clients.keys();
//     for (var i = 0; i < ids.length; ++i) {
//         this.clients.get(ids[i]).emit('update', {
//             self: this.players.get(ids[i]),
//             players: this.players.values().filter((player) => player.id != ids[i])
//         });
//     }
// };

// module.exports = Game;

/// *************** ?????

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