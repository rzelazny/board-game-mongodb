const mongo = require("./db-updates");
const util = require('util');
const { getHeapCodeStatistics } = require("v8");
const { set } = require("mongoose");

//connection variables
var io;
var gameSocket;
var db;
var room;

//gameplay variables
var turnOrder = [];
var nextEnemy = {};
var players = [];
var curPlayer = 1;
var curRound = 1;
var curPhase = 1;
var waitingForPlayers = 0;
var curGame = "";

//This function is called by the server to initialize a new game instance.
exports.initGame = function (sio, socket, sdb, gameName) {
    console.log("New game launched");

    io = sio;
    gameSocket = socket;
    db = sdb;

    //initialize variables
    curGame = gameName;
    turnOrder = [];
    nextEnemy = {};
    players = [];
    curPlayer = 1;
    curRound = 1;
    curPhase = 1;
    waitingForPlayers = 0;

    gameSocket.emit('connected', { message: "You are connected!" });

    //get the current game state from the DB then start the game logic
    mongo.getGame(curGame, prepStart);
}

exports.sendChoice = function ({player, choiceType, choice}) {

    switch (choiceType) {
        case "resource":
            let field = "resource" + choice;
            let updateData = {
                player: player, 
                field: field, 
                data: 1}
            mongo.updatePlayer(updateData, updatePlayers)
            waitingForPlayers--;
            break;
        default:
            console.log("unknown choice: ", choiceType);
    }
    console.log("prompt registered");
    console.log("Still waiting for ", waitingForPlayers, " players");
    //If all the players have made a choice advance the game logic
    if (waitingForPlayers === 0) {
        nextPhase();
    }
}

exports.getSocket = function (user, socket) {
    console.log("Adding socketID to player");
    let data = {player:user, field: "socket", data: socket};
    mongo.updatePlayer(data,()=>{})
}

function updatePlayers(player, field){
    console.log("updating player", player);
    switch(field){
        case "resource1":
        case "resource2":
        case "resource3":
        case "score":
        case "buildings":
        case "twoToken":
            mongo.getPlayer(player, (playerData)=>{
                console.log("Got the data trying to update ", playerData);
                io.to(playerData.socket).emit("update-sidebar", playerData); //player doesn't have socket
            })
            break;
        default:
            console.log("Unknown field update ", field);
    }
}

async function prepStart(gameData) {
    let response = await setData(gameData);

    if (!response === "success") {
        console.log("Error!");
    } else {
        playGame();
    }
}

async function setData(gameData) {
    console.log("Setting game data");

    curPhase = gameData.curPhase;
    turnOrder = gameData.turnOrder;
    nextEnemy = gameData.nextEnemy;
    curPlayer = gameData.curPlayer;
    curRound = gameData.curRound;
    curPhase = gameData.curPhase;
    room = gameData.roomNumber;
    for (let i = 0; i < gameData.players.length; i++) {
        players.push(gameData.players[i]);
    }
    console.log("Players with data: ", players.length);
    return "success"
};

//update a player's sideboard
function updateSideboard(player) {


    let sidebarData = {
        vp: 0,
        buildings: 0,
        res1: 0,
        res2: 0,
        res3: 0,
        twoToken: 0
    };

    io.to(player.socket).emit("update-sideboard", sidebarData);
}

function turnOrder(diceTotals) {
    let newTurnOrder = [];

    mongo.updateGame(curGame, "turnOrder", newTurnOrder);
}

//function runs the game logic
function playGame() {

    switch (curPhase) {
        case 1:
            return aidPhaseOne();
        case 2:
            return productivePhase(curPhase);
        case 3:
            return rewardPhase();
        case 4:
            return productivePhase(curPhase);
        case 5:
            return aidPhaseTwo();
        case 6:
            return productivePhase(curPhase);
        case 7:
            return rallyPhase();
        case 8:
            return combatPhase();
        default:
            console.log("Phase not found");
            break;
    }
}

//updates the game phase
function nextPhase() {

    if (curPhase === 8) {
        //check if game is over when it's phase 8
        if (curRound === 5) endGame();
        else { //if not increment round and set phase back to one
            curRound++;
            curPhase = 1;
            mongo.updateGame(curGame, "curPhase", curPhase);
            mongo.updateGame(curGame, "curRound", curRound);
        }
    }
    else {
        curPhase++;
        mongo.updateGame(curGame, "curPhase", curPhase);

        //keep playing
        playGame();
    }
}

//Function runs the game logic for aid phase one - players with lowest building count get a bonus. 
function aidPhaseOne() {
    console.log("Aid phase one running");
    //alert the room the phase has changed
    io.to(room).emit("next-phase", "1");

    let playerStats = [];
    let buildCount = [];
    let resourceCount = [];
    let worstOff = [];

    console.log("players: ", players);

    //get current player stats
    players.forEach(player => {
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

    let leastBuildingPlayers = playerStats.filter(function (stats) {
        return stats.buildings === fewestBuildings;
    });

    //if there's a tie for fewest buildings check their resource count
    if (leastBuildingPlayers.length > 1) {
        leastBuildingPlayers.forEach(player => {
            resourceCount.push(player.resources);
        });

        //Find the lowest resource total
        const fewestResources = Math.min(...resourceCount);

        let leastResourcePlayers = leastBuildingPlayers.filter(function (stats) {
            return stats.resources === fewestResources;
        });

        leastResourcePlayers.forEach(player => {
            console.log("Worst off players: ", player);
            worstOff.push(player.id);
            //game will need to wait for all the players to choose before moving on
            waitingForPlayers++;
        });
    }
    else { //if there's only one player with the least building they're the worst off
        console.log("Worst off player: ", leastBuildingPlayers);
        worstOff.push(leastBuildingPlayers[0].id);
        waitingForPlayers++;
    }

    //update the worst off player's bonus status in the db
    worstOff.forEach(player => {
        let update = {player:player, field: "hadBonus", data: true};
        mongo.updatePlayer(update, ()=>{});
    });

    promptUser(worstOff, "prompt-user", "You recieve the king's aid. Pick a bonus resource:");
}

//Function prompts specific players with a message, and tells all other users to wait
function promptUser(updatePlayer, prompt, msg) {
    console.log("Prompting users");

    players.forEach(player => {
        if (updatePlayer.includes(player._id)) {
            //send msg
            console.log("Message to specific users");
            console.log("sending message " + prompt + " to: ", player.socket)
            //gameSocket.to(player.socket).emit(prompt, player.socket, "test");  this works for some reason
            io.to(player.socket).emit(prompt, msg);
        }
        else {
            //send waiting for other players message
            io.to(player.socket).emit("waiting", "Waiting for other players");
        }
    });
}

//Function runs the game logic for productive phases (2, 4, 6)
function productivePhase(phase) {
    console.log("Productive phase running");
    //alert the room the phase has changed
    io.to(room).emit("next-phase", phase);

    rollDice();
    //setTurnOrder();
    //promptUser();
}

//Function runs the game logic for aid phase two
function aidPhaseTwo() {
    console.log("Aid phase two running");
    //alert the room the phase has changed
    io.to(room).emit("next-phase", "3");


}

//Function runs the game logic for reward phase
function rewardPhase() {
    console.log("Reward phase running");
    //alert the room the phase has changed
    io.to(room).emit("next-phase", "5");


}

//Function runs the game logic for rally troops phase
function rallyPhase() {
    console.log("Rally phase running");
    //alert the room the phase has changed
    io.to(room).emit("next-phase", "7");

}

//Function runs the game logic for combat phase
function combatPhase() {
    console.log("Combat phase running");
    //alert the room the phase has changed
    io.to(room).emit("next-phase", "8");


}

function endGame() {
    console.log("The game has ended!");
}

function rollDice(){
    players.forEach(player => {
        player.dice.push(generateDie(3));
    });
    console.log("Dice generated for", players);
}

function generateDie(numDice){
    let diceArrary = [];
    for(let i=0; i<numDice; i++){
        diceArrary.push(Math.floor(Math.random() * 6) + 1)
    }
    return diceArrary
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
