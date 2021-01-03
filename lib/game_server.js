const mongo = require("./db-updates");

//connection variables
var io;
var gameSocket;
var db;
var room;

//gameplay variables
var nextEnemy = {};
var players = [];
var playersAll = [];
var curRound = 1;
var curPhase = 1;
var waitingForPlayers = 0;
var curGame = "";
var advisors = [];
var timeoutGlobal = "";
var completedPhase = 0;

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
    playersAll = [];
    curRound = 1;
    curPhase = 1;
    waitingForPlayers = 0;
    advisors = [];
    readyforNextPhase = 0;

    gameSocket.emit('connected', { message: "You are connected!" });

    //get the current game state from the DB then start the game logic
    mongo.getGame(curGame, aPrepStart);

    //response to user responses
    socket.on("player-choice", (choiceData) => {
		console.log("server received choice from", choiceData.player);
		receiveChoice(choiceData);
    });
    
    socket.on("prompt-building", (choiceData) => {
		console.log("Woo it worked");
    });
}

receiveChoice = function ({ player, choiceType, choice }) {
    console.log(player, "made a choice", choice);

    switch (choiceType) {
        case "aidResource":
            let field = "resource" + choice;
            let updateData = {
                player: player,
                field: field,
                data: 1
            }
            waitingForPlayers--;
            mongo.updatePlayer(updateData, sidebarUpdate)
            break;
        case "advisor":
            mongo.getPlayer(player, (playerData) => {
                let total = 0;
                let diceNums = [];
                //player sends a list of dice, add the numbers from those dice
                for (let i = 0; i < choice.length; i++) {
                    total += playerData.dice[choice[i]];
                    diceNums.push(playerData.dice[choice[i]]);
                }
                if (!advisors.includes(total)) { //if the advisor hasn't already been picked
                    //mark advisor
                    advisors.push(total);
                    console.log("Advisor", total, "chosen");

                    //tell room to show dice on their board
                    let placeDice = { dice: diceNums, color: playerData.color, advisor: total }
                    alertAll("mark-dice", placeDice);

                    //remove the spent dice from the player's dice pool
                    let remainingDice = playerData.dice;
                    //decrement since deleting from the start will throw off our index
                    for (let i = (playerData.dice.length - 1); i > -1; i--) {
                        if (choice.includes(i.toString())) {
                            remainingDice.splice(i, 1);
                        }
                    }
                    let diceUpdate = { player: playerData._id, field: "dice", data: remainingDice }
                    mongo.updatePlayerPush(diceUpdate, (playerData) => {
                        sidebarUpdate(playerData._id, "dice");
                    });

                    waitingForPlayers--;
                }
                else {
                    promptUser(player, "prompt-error", "Use your dice to influence an advisor.");
                }
            })

            break;
        default:
            console.log("unknown choice: ", choiceType);
    }
    console.log(player, "prompt response processed");
    if (waitingForPlayers === 0) {
        console.log("All players responded");
        //stop the timeout
        console.log("clearing timeout");
        clearTimeout(timeoutGlobal);
        
        nextPhase();

        // if(readyforNextPhase === playersAll.count){
        //     //if everyone is done with the current phase move on
        //     nextPhase();
        // }
        // else{ //otherwise run the next action in the current phase
        //     nextAction();
        // }
    }
    else {
        console.log("Still waiting for ", waitingForPlayers, " players");
    }
}

exports.getSocket = function (user, socket) {
    console.log("Adding socketID to player");
    let data = { player: user, field: "socket", data: socket };
    mongo.updatePlayer(data, () => { })
}

function sidebarUpdate(player, field) {
    console.log("sidebar updated needed for", player);
    switch (field) {
        case "resource1":
        case "resource2":
        case "resource3":
        case "score":
        case "buildings":
        case "twoToken":
            mongo.getPlayer(player, (playerData) => {
                console.log("update sidebar send to", player);
                promptUser(player, "update-sidebar", playerData, false);
            })
            break;
        case "dice":
            //TODO
            break;
        default:
            console.log("Unknown field update ", field);
    }
}

async function aPrepStart(gameData) {
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
        playersAll.push(gameData.players[i]._id);
    }
    console.log("Players with data: ", players.length);
    return "success"
};

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
        console.log("Moving to next phase");
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
    alertAll("next-phase", "1")

    let playerStats = [];
    let buildCount = [];
    let resourceCount = [];
    let worstOff = [];

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
        });
    }
    else { //if there's only one player with the least building they're the worst off
        console.log("Worst off player: ", leastBuildingPlayers);
        worstOff.push(leastBuildingPlayers[0].id);
    }

    //update the worst off player's bonus status in the db
    worstOff.forEach(player => {
        let update = { player: player, field: "hasBonus", data: true };
        mongo.updatePlayer(update, () => { });
    });

    promptUser(worstOff, "prompt-user", "You recieve the king's aid. Pick a bonus resource:");

    //move on even if all users haven't choosen their bonus resource
    console.log("starting Aid Phase timeout");
    beginPhaseTimeout(10, "Aid phase timed out");
}

function beginPhaseTimeout(timer, msg) {
    timeoutGlobal = setTimeout(() => {
        console.log(msg);
        waitingForPlayers = 0;
        nextPhase();
    }, timer * 1000);
}

//Function prompts specific players with a message, and tells all other users to wait
function promptUser(updatePlayer, prompt, msg, resNeeded = true) {
    console.log("Prompting users", updatePlayer);

    //check for error messages
    if (prompt === "prompt-error") {
        prompt = "prompt-user";
        msg = "Invalid choice. " + msg;
    }

    if (Array.isArray(updatePlayer)) {
        players.forEach(player => {
            if (updatePlayer.includes(player._id)) {
                //send msg
                console.log("sending message " + prompt + " to: ", player.socket)
                //gameSocket.to(player.socket).emit(prompt, player.socket, "test");  this works for some reason
                io.to(player.socket).emit(prompt, msg);
                //keep track of how many users we need to hear a response from
                if (resNeeded) {
                    waitingForPlayers++;
                }
                console.log("now waiting for", waitingForPlayers);
            }
            else {
                //send waiting for other players message
                console.log(player.socket, "being told to wait, they didn't get ", prompt);
                io.to(player.socket).emit("waiting", "Waiting for other players");
            }
        });
    } //then only one character was passed, not an array
    else {
        players.forEach(player => {
            if (player._id.equals(updatePlayer)) {
                //send msg
                console.log("sending message " + prompt + " to: ", player.socket)
                //gameSocket.to(player.socket).emit(prompt, player.socket, "test");  this works for some reason
                io.to(player.socket).emit(prompt, msg);
                //keep track of how many users we need to hear a response from
                if (resNeeded) {
                    waitingForPlayers++;
                }
                console.log("now waiting for", waitingForPlayers);
            }
            else {
                //send waiting for other players message
                console.log(player.socket, "being told to wait, they didn't get ", prompt);
                io.to(player.socket).emit("waiting", "Waiting for other players");
            }
        });
    }
}

//Function alerts all users, no prompt so no waiting counter
function alertAll(alert, msg) {
    console.log("Alerting all", alert, msg);
    io.to(room).emit(alert, msg);
}

//Function runs the game logic for productive phases (2, 4, 6)
function productivePhase(phase) {
    console.log("Productive phase running");
    //alert the room the phase has changed

    alertAll("next-phase", phase)

    //roll the dice
    //generate an array of 3 dice for each player
    players.forEach(player => {
        player.dice.push(generateDie(3));
    });
    console.log("Dice generated for", players);

    //get game data to see if anyone has dice related buildings
    mongo.getGame(curGame, aBuildingCheckBeforeProd);
}

function generateDie(numDice) {
    let diceArrary = [];
    for (let i = 0; i < numDice; i++) {
        diceArrary.push(Math.floor(Math.random() * 6) + 1)
    }
    return diceArrary
}

//Gives users x seconds to decide before moving on
async function countDown(timer) {
    console.log("starting timer");
    return new Promise(resolve => {
        let timeLeft = timer;
        timerCheck = setInterval(function () {
            if (waitingForPlayers === 0) {
                console.log("All players decided");
                clearInterval(timerCheck);
                resolve("success");
            }
            else {
                timeLeft--
                if (timeLeft === 0) {
                    console.log("Timer expired, moving on");
                    clearInterval(timerCheck);
                    resolve("success");
                }
            }
        }, 1000);
    });
}

//function prompts users that have buildings that take effect before productive seasons
async function aBuildingCheckBeforeProd(gameData) {

    let hasStatue = [];
    let hasChapel = [];
    let awaitBuildingResponse = 0;

    gameData.players.forEach(player => {
        if (player.constructedBuildings.some(e => e.name === "Statue").length > 0) {
            hasStatue.push(player)
        }

        if (player.constructedBuildings.some(e => e.name === "Chapel").length > 0) {
            hasChapel.push(player)
        }

        //see if the buildings apply
        hasStatue.forEach(player => { //Statue triggers if all 3 dice are the same
            if (player.dice[0] === player.dice[1] && player.dice[1] === player.dice[2]) {
                promptUser(player, "prompt-user", "Would you like to use your Statue?", false);
                buildingTimeout(player, 10, "Statue prompt timed out");
                awaitBuildingResponse++;
            }
        })
        //see if the buildings apply
        hasChapel.forEach(player => { //Chapel triggers when the dice total is 7 or less at the start of the round
            let diceSum = player.dice.reduce((a, b) => { return a + b })
            if (diceSum < 8 && player.dice.length > 2) {
                promptUser(player, "prompt-user", "Would you like to use your Chapel?");
                buildingTimeout(player, 10, "Chapel prompt timed out");
                awaitBuildingResponse++;
            }
        })
    });

    


    //Can't move on until all players that have an applicable building have used them or timed out
    const buildingCoundown = setInterval(() => {
        if (awaitBuildingResponse === 0) {
            players.forEach(player => {
                clearInterval(buildingCoundown);
                let diceUpdate = { player: player._id, field: "dice", data: player.dice[0] }
                mongo.updatePlayerPush(diceUpdate, blank);
            });
            setTurnOrder();

        }
    }, 1000);
}

//sets a timeout for the building prompt
function buildingTimeout(player, timer, msg) {
    timeout = setTimeout(() => {
        console.log(msg);
        awaitBuildingResponse--;
        exports.receiveChoice(player, "building", "timeout");
    }, timer * 1000);
}

//after dice are successfully rolled, turn order can be set
function setTurnOrder() {
    console.log("setting the turn order");

    let diceSumArray = [];

    //Get the data needed for updating turn order and displaying dice
    players.forEach(player => {
        //total the dice for determing turn order
        let total = player.dice[0].reduce((a, b) => { return a + b })
        let playerTotal = { player: player._id, name: player.name, color: player.color, total: total, dice: player.dice[0] }
        diceSumArray.push(playerTotal);
    })

    //sort the dice array as numbers not strings
    diceSumArray.sort(function (a, b) {
        console.log(a);
        var aNum = parseInt(a.total);
        var bNum = parseInt(b.total);
        return aNum - bNum;
    });

    //update turn order for all players
    alertAll("update-order", diceSumArray);

    //pick advisors in turn order
    aPickAdvisors(diceSumArray);
}

//have players pick advisors in turn order
async function aPickAdvisors(playerDiceData) {
    console.log("Select advisors in turn order");

    let playerArray = [];
    playerDiceData.forEach(player => {
        playerArray.push(player.player);
    });

    //playerdice is already sorted to match turn order
    for (let i = 0; i < playerArray.length; i++) {

        promptUser(playerArray[i], "prompt-user", "Use your dice to influence an advisor.")

        let response = await countDown(30);

        if (!response === "success") {
            console.log("Error!");
        }
        else {
            console.log("Player number", i, "selected their advisor");
        }
    }

    //move on to building phase
    //nextPhase();
}

//Function runs the game logic for aid phase two
function aidPhaseTwo() {
    console.log("Aid phase two running");
    //alert the room the phase has changed
}

//Function runs the game logic for reward phase
function rewardPhase() {
    console.log("Reward phase running");
    //alert the room the phase has changed
}

//Function runs the game logic for rally troops phase
function rallyPhase() {
    console.log("Rally phase running");
    //alert the room the phase has changed
}

//Function runs the game logic for combat phase
function combatPhase() {
    console.log("Combat phase running");
    //alert the room the phase has change
}

function endGame() {
    console.log("The game has ended!");
}

//sometimes we don't need a callback function
function blank() { }

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

// asyncEmit = function (eventName, data) {
    //     return new Promise(function (resolve, reject) {
    //         io.to(players[0].socket).emit(eventName, data);
    //         io.on(eventName, result => {
    //             console.log("we got a result");
    //             //io.off(eventName);
    //             resolve(result);
    //         });
    //         setTimeout(reject, 3000);
    //     });
    // }

    // aPromptUser = async (playerData) => {
    //     const result = await asyncEmit("prompt-building", playerData);
    //     console.log(result);
    // }

    // console.log("Is this running?");
    // aPromptUser("test data");