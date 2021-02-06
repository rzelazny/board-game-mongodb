const mongo = require("./db-updates");

//connection variables
var io;
var gameSocket;
var room;

//gameplay variables
var nextEnemy = {};
var players = [];
var playersAll = [];
var curRound = 1;
var curPhase = 1;
var waitingForPlayers = 0;
var waitingForDB = 0;
var curGame = "";
var advisors = [];
var timeoutGlobal = "";

//This function is called by the server to initialize a new game instance.
exports.initGame = function (sio, socket, sdb, gameName) {
    console.log("New game launched");

    io = sio;
    gameSocket = socket;
    db = sdb;

    gameSocket.emit('connected', { message: "You are connected!" });

    //initialize variables
    curGame = gameName;
    players = [];
    playersAll = [];
    curRound = 1;
    curPhase = 1;
    waitingForPlayers = 0;
    waitingForDB = 0;
    advisors = [];
    clearTimeout(timeoutGlobal);

    generateEnemy(curRound);

    //get the current game state from the DB then start the game logic
    mongo.getGame(curGame, aPrepStart);

    //response to user responses
    socket.on("player-choice", (choiceData) => {
        console.log("server received choice from", choiceData.player);
        receiveChoice(choiceData);
    });

}

//function calls the appropriate function to process responses from the client
receiveChoice = function ({ player, choiceType, choice }) {
    console.log(player, "made a choice", choice);

    switch (choiceType) {
        case "aidResource":
            let updateData = {
                player: player,
                field: "resource" + choice,
                data: 1
            }
            waitingForPlayers--;
            mongo.updatePlayer(updateData, sidebarUpdate)
            choiceProcessed();
            break;
        case "advisor":
            return influenceAdvisors(player, choice);
        case "use-advisor":
            return advisorResources(player, choice);
        case "building":
            return resolveBuildings(player, choice);
        default:
            console.log("unknown choice: ", choiceType);
    }
    console.log(player, "prompt response processed");
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
        case "strength":
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

//function makes sure resource updates are valid and reverts them if not
function validateData(updateData) {
    console.log("validating data for", updateData.player);
    mongo.getPlayer(updateData.player, ({ resource1, resource2, resource3 }) => {
        console.log("Resources: ", resource1, resource2, resource3);

        //if a resource is 0 and the update for that res is negative change nothing
        if ((resource1 === 0 && updateData.res1 === -1) ||
            (resource2 === 0 && updateData.res2 === -1) ||
            (resource3 === 0 && updateData.res3 === -1)) {
            console.log("Negative resource choice");
        }
        else { //otherwise update the player resources
            console.log("Resources validated");
            mongo.updatePlayerResources(updateData, (player)=>{
                waitingForDB--;
                sidebarUpdate(player, "resource1");
                choiceProcessed();
            })
        }
    })
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

//function gets the enemy for the upcoming round
function generateEnemy(curRound){
    mongo.getEnemy(curRound, (enemy)=>{
        nextEnemy = enemy;
        console.log("Next enemu is: ", enemy);
    });
}  

//function runs the game logic
function playGame() {

    console.log("advancing game, current phase:", curPhase);
    switch (curPhase) {
        case 1:
            return aidPhaseOne();
        case 2:
            return productivePhase(curPhase); //Spring
        case 3:
            return setTurnOrder();
        case 4:
            return pickAdvisors();
        case 5:
            return resolveAdvisors();
        case 6:
            return constructBuildings();
        //     return productivePhase(curPhase);
        // case 5:
        //     return aidPhaseTwo();
        // case 6:
        //     return productivePhase(curPhase);
        // case 7:
        //     return rallyPhase();
        // case 8:
        //     return combatPhase();
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

//after a choice is processed determine if we're moving to the next phase, or calling the next player in turn order
function choiceProcessed() {
    if (waitingForPlayers === 0 && waitingForDB === 0) {
        console.log("All players responded");
        //stop the timeout
        console.log("clearing timeout");
        clearTimeout(timeoutGlobal);

        curPlayer = 1;
        nextPhase();
    }
    else {
        console.log("Still waiting for ", waitingForPlayers, " players and ", waitingForDB, " updates");
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
    else { //if there's only one player with the fewest buildings they're the worst off
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

//function sets a timer before moving on to the next phase
function beginPhaseTimeout(timer, msg) {
    timeoutGlobal = setTimeout(() => {
        console.log(msg);
        waitingForPlayers = 0;
        nextPhase();
    }, timer * 1000);
}

//Function prompts specific players with a message, and tells all other users to wait
function promptUser(updatePlayer, prompt, msg) {
    console.log("Prompting users", updatePlayer);

    //check for error messages
    if (prompt === "prompt-error") {
        prompt = "prompt-user";
        msg = "Invalid choice. " + msg;
    }

    //Updates to the sidebar do not require a response
    let resNeeded = true
    if(prompt ==="update-dice" || prompt ==="update-sidebar")
    resNeeded = false;

    //if multiple players need to be alerted at once
    if (Array.isArray(updatePlayer)) {
        players.forEach(player => {
            if (updatePlayer.includes(player._id)) {
                //send msg
                console.log("sending message " + prompt + " to: ", player.socket)
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
    else { //else only one character was passed, not an array
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
        //player.dice.push(generateDie(3));
        let newDice = generateDie(3);
        mongo.updatePlayerPush({ player: player, field: "dice", data: newDice }, blank);
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

//function prompts users that have buildings that take effect before productive seasons
function aBuildingCheckBeforeProd(gameData) {
    console.log("checking dice buildings");

    gameData.players.forEach(player => {
        let canUseBuilding = [];
        //see if they've built a Statue
        if (player.constructedBuildings.some(e => e.name === "Statue").length > 0) {
            //see if the Statue has triggered - all 3 dice must match
            if (player.dice[0] === player.dice[1] && player.dice[1] === player.dice[2]) {
                canUseBuilding = playerCanUseBuilding(player, "Statue", canUseBuilding, player.dice);
                //promptUser(player, "prompt-user", "Would you like to use your Statue?", false);
                //buildingTimeout(player, 10, "Statue prompt timed out");
                //awaitBuildingResponse++;
            }
        }

        //see if they've buit a Chapel
        //if (player.constructedBuildings.some(e => e.name === "Chapel").length > 0) {
        //Chapel triggers when the dice total is 7 or less at the start of the round
        let diceSum = player.dice.reduce((a, b) => { return a + b })
        if (diceSum < 8 && player.dice.length > 2) {
            canUseBuilding = playerCanUseBuilding(player, "Chapel", canUseBuilding, player.dice); //free chapel to all for testing purposes
        }
        // }
        if (canUseBuilding.length > 0) promptUser(player._id, "use-buildings", canUseBuilding);
    });

    if (waitingForPlayers > 0) {
        console.log(waitingForPlayers, "have dice buildings they can use");
        beginPhaseTimeout(10, "Use dice buildings expired");
    }
    else {
        nextPhase();
    }
}

//If a player can use a building, add them to an array to be passed to the client
function playerCanUseBuilding(player, building, canUseArray, dice) {

    //see if the player is already in the canUseArray
    let objIndex = canUseArray.findIndex((obj => obj.player === player));

    //if we didn't find the player in the array
    if (objIndex === -1) {
        console.log("Adding", player._id, "to the use building array");
        let playerObj = { player: player._id, building: [building], dice: dice }
        canUseArray.push(playerObj);
    }
    else { //otherwise we need to update the existing object
        console.log(player, "can use another building");
        canUseArray[objIndex].building.push([building]);
    }
    return canUseArray;
}

//function sets the turn order, lowest dice total goes first
function setTurnOrder() {
    console.log("setting turn order");
    prepTurnOrder((diceData) => {

        //sort the dice array as numbers not strings
        diceData.sort(function (a, b) {
            console.log(a);
            var aNum = parseInt(a.total);
            var bNum = parseInt(b.total);
            return aNum - bNum;
        });

        //update turn order for all players
        alertAll("update-order", diceData);

        nextPhase(); //need to update game player order here TODO
    })
}

//function gets data from the db before the turn order can be set
function prepTurnOrder(cb) {
    let diceSumArray = [];
    //Get the data needed for updating turn order and displaying dice
    mongo.getGame(curGame, (gameData) => {
        for (let i = 0; i < gameData.players.length; i++) {
            console.log("setting turn order for", gameData.players[i]);
            //total the dice for determing turn order
            let total = gameData.players[i].dice.reduce((a, b) => { return a + b })
            let playerTotal = { player: gameData.players[i]._id, name: gameData.players[i].name, color: gameData.players[i].color, total: total, dice: gameData.players[i].dice }
            diceSumArray.push(playerTotal);
            console.log("diceArray", diceSumArray);
        }
        cb(diceSumArray);
    })
}

//have players pick advisors in turn order
function pickAdvisors() {
    console.log("Selecting advisors in turn order");

    if (curPlayer > players.length) curPlayer = 1;
    console.log("current player", curPlayer);

    mongo.getGame(curGame, ((gameData) => {
        mongo.getPlayer(gameData.players[curPlayer - 1], (playerData) => {
            let diceData = { dice: playerData.dice, color: playerData.color };
            promptUser(playerData._id, "update-dice", diceData);
        })
    }))

    promptUser(players[curPlayer - 1]._id, "prompt-user", "Use your dice to influence an advisor.");

    //reset the timer each time someone makes a choice
    clearTimeout(timeoutGlobal);
    beginPhaseTimeout(30, ("Player number", curPlayer, "timed out on advisor"));
}

//function handles user submitting a building choice
function resolveBuildings(player, choice) {
    console.log("choice", choice);
    mongo.getPlayer(player, (playerData) => {
        choice.forEach(building => {
            switch (building) {
                case "Chapel": //reroll all dice
                    let newDice = (generateDie(3));
                    mongo.updatePlayerPush({ player: playerData._id, field: "dice", data: newDice }, blank);
                    console.log(player, "has new dice", newDice);
                    break;
                default:
                    console.log("Unknown building", building);
            }
        });
        waitingForPlayers--;

        if (1 === 1) { //make sure all choices were valid
            choiceProcessed();
        } else {
            promptUser(player, "prompt-error", "You have buildings that may be used.");
        }
    });
};

//function handles user submitting an advisor choice
function influenceAdvisors(player, choice) {

    mongo.getPlayer(player, (playerData) => {
        console.log(choice);
        console.log(playerData);
        let total = 0;
        let diceNums = [];
        //player sends a list of dice, add the numbers from those dice
        for (let i = 0; i < choice.length; i++) {
            total += playerData.dice[choice[i]];
            diceNums.push(playerData.dice[choice[i]]);
        }
        //if player has passed
        if (total === 0) {
            console.log(player, "passed their advisor phase");
            waitingForPlayers--;
            curPlayer++;

            let diceUpdate = { player: playerData._id, field: "dice", data: [] }
            mongo.updatePlayerPush(diceUpdate, (playerData) => {
                sidebarUpdate(playerData._id, "dice");

                //if there are still dice to be used call pick advisors again
                mongo.getGame(curGame, (gameData) => {
                    let playersLeft = playersWithDice(gameData)
                    if (playersLeft.length > 0) pickAdvisors();
                    else choiceProcessed();
                })
            });
        }
        else if (!advisors.some(e => e.advisor === total)) { //if the advisor hasn't already been picked
            console.log("advisors:", advisors);
            //mark advisor
            advisors.push({ advisor: total, player: player });
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
            curPlayer++;
            //if there are still dice to be used call pick advisors again
            mongo.getGame(curGame, (gameData) => {
                let playersLeft = playersWithDice(gameData)
                if (playersLeft.length > 0) pickAdvisors();
                else choiceProcessed();
            })
        }
        else {
            waitingForPlayers--;
            promptUser(player, "prompt-error", "Use your dice to influence an advisor.");
        }
    })
}

//function checks who still has dice
function playersWithDice({ players }) {
    let remainingPlayers = [];

    players.forEach(player => {
        if (player.dice.length > 0) {
            remainingPlayers.push(player);
        }
    });

    return remainingPlayers;
}

//function prompts players to make choices as needed for their influenced advisors
function resolveAdvisors() {
    console.log("Resolving advisor choices");

    //for each player check the list of picked advisors
    players.forEach(player => {
        let chosenAdvisors = [];
        let sendEnemyData = false;
        advisors.forEach(function (i, idx, array) {
            //console.log("advisor:", i.player);
            if (i.player == player._id) { //if the player is the one that chose the advisor get the data on it
                let advObj = { number: i.advisor }
                mongo.getAdvisor(advObj, (advisorData) => {
                    chosenAdvisors.push(advisorData) //and add it to the list of advisors this player picked
                    if (advisorData.number === 10 || advisorData.number === 17) sendEnemyData = true; // if one of the advisors reveals the enemy send that data along
                    //on the last loop send a list of chosen advisors to the current player
                    if (idx === array.length - 1) {
                        //advisors are resolved in order form lowest to highest
                        chosenAdvisors.sort(function (a, b) {
                            var aNum = parseInt(a.number);
                            var bNum = parseInt(b.number);
                            return aNum - bNum;
                        });
                        promptUser(player._id, "use-advisors", chosenAdvisors);
                        //send enemy data if needed
                        if(sendEnemyData) promptUser(player._id, "enemy-data", nextEnemy);
                    }
                })
            }
        });

    });

    console.log("Starting resolve advisors timeout");
    beginPhaseTimeout(30, "Resolving advisor choices timed out.");
}

//function gives players resources based on their advisor choices
function advisorResources(player, choice) {
    console.log("Resolving advisor resources for", player);
    waitingForPlayers--;

    console.log("choice: ", choice); //ex: choice: (3) ["Duchess-choice-0-2", "Duchess-choice-1-1", "Duchess-choice-2-0"]
    console.log(advisors);

    //for each choice assign the appropriate resources
    for (let i = 0; i < choice.length; i++) {
        //split the choice into the advisor number and which option
        let advisor = choice[i].split("-choice-")[0];
        let pick = choice[i].split("-choice-")[1];
        console.log(advisor, " ", pick);
        mongo.getAdvisor({ number: advisor }, (advData) => {
            console.log(advData);
            let updateData = imgToResource(advData, player, pick);

            waitingForDB++;
            validateData(updateData);
            // //on the last loop check if it's time for the next phase.
            // if(i+1 === choice.length){ 
            //     choiceProcessed();
            // }
        })
    }
}

//function converts the advisor response choice into a db update format
function imgToResource(advData, player, choice) {
    console.log("img2Resource", choice);

    //split passed choice into which choice we're dealing with and which option was picked
    let advChoice = choice.split("-")[0];
    let option = choice.split("-")[1];

    console.log("choices: ", advChoice, option);

    advResult = "";

    switch (option) {
        case "0":
            advResult = advData.choice[advChoice].option1;
            break;
        case "1":
            advResult = advData.choice[advChoice].option2;
            break;
        case "2":
            advResult = advData.choice[advChoice].option3;
            break;
        default:
            console.log("Unknown advisor choice", option);
    }
    console.log("advResult", advResult);
    //get a count of how many times a resouce shows up in this choice
    let score = (advResult.match(/score/g) || []).length;
    let res1 = (advResult.match(/res1/g) || []).length;
    let res2 = (advResult.match(/res2/g) || []).length;
    let res3 = (advResult.match(/res3/g) || []).length;
    let str = (advResult.match(/str/g) || []).length;
    let token = (advResult.match(/token/g) || []).length;
    let arrow = (advResult.match(/arrow/g) || []).length;

    //extra logic for arrow to remove resources when needed
    //Adv 6 converts a resource, adv 13 costs a VP
    if (arrow > 0) {
        let reduceRes = advResult.split(",")[0];
        switch (reduceRes) {
            case "res1":
                res1 = -1;
                break;
            case "res2":
                res2 = -1;
                break;
            case "res3":
                res3 = -1;
                break;
            case "vp":
                score = -1;
                break;
        }
    }

    let updateData = {
        player: player,
        score: score,
        res1: res1,
        res2: res2,
        res3: res3,
        str: str,
        twoToken: token,
    }
    console.log("Update data:", updateData);

    return updateData;
}

//Function lets players choose buildings to construct
function constructBuildings() {
    console.log("Building construction starting");

    players.forEach(player => {
        mongo.getPlayer(player, (playerData =>{
            promptUser(player._id, "choose-buildings", playerData);
        }))
    });
}

// //function gives players resource and prompts for their choice based on their advisor choices
// function resolveAdvisors(){
//     console.log("Resolving advisor choices");
//     console.log("adv", advisors);
//     players.forEach(player => {
//         let chosenAdvisors = [];
//         advisors.forEach(advisor => {
//             console.log("advisor:", advisor.player);
//             if(advisor.player == player._id){
//                 let advObj = {number: advisor.advisor}
//                 getAdvisor(advObj, (advisorData)=>{
//                     chosenAdvisors.push(advisorData)
//                     console.log("chosen:",chosenAdvisors);

//                     promptUser(player._id, "use-advisors", chosenAdvisors);
//                 })
//             }
//         });

//     });

//     //promptUser(players[curPlayer-1]._id, "prompt-user", "Use your dice to influence an advisor.");

//     //beginPhaseTimeout(30, ("Player number", curPlayer, "timed out on resolving advisor choices"));
// }

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

//Gives users x seconds to decide before moving on
// async function countDown(timer) {
//     console.log("starting timer");
//     return new Promise(resolve => {
//         let timeLeft = timer;
//         timerCheck = setInterval(function () {
//             if (waitingForPlayers === 0) {
//                 console.log("All players decided");
//                 clearInterval(timerCheck);
//                 resolve("success");
//             }
//             else {
//                 timeLeft--
//                 if (timeLeft === 0) {
//                     console.log("Timer expired, moving on");
//                     clearInterval(timerCheck);
//                     resolve("success");
//                 }
//             }
//         }, 1000);
//     });
// }

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



// async function setTurnOrder(){
//     let result = await prepTurnOrder(() =>{
//         console.log("diceData", result);
//         if (diceData === "no data") {
//             console.log("Error!");
//         } else {
//             console.log("Response is", diceData);
//             //sort the dice array as numbers not strings
//             diceData.sort(function (a, b) {
//                 console.log(a);
//                 var aNum = parseInt(a.total);
//                 var bNum = parseInt(b.total);
//                 return aNum - bNum;
//             });

//             //update turn order for all players
//             alertAll("update-order", diceData);

//             //pick advisors in turn order
//             PickAdvisors(diceData);
//         }
//     })
// }

    //Why doesn't this work?
    // async function prepTurnOrder () {
    //     let diceSumArray = [];
    //     result = new Promise((resolve, reject) => {
    //         //Get the data needed for updating turn order and displaying dice
    //         mongo.getGame(curGame, (gameData)=>{
    //             if(!gameData){
    //                 reject("no data");
    //             }
    //             for(let i=0; i< gameData.players.length; i++){
    //                 console.log("setting turn order for", gameData.players[i]);
    //                 //total the dice for determing turn order
    //                 let total = gameData.players[i].dice.reduce((a, b) => { return a + b })
    //                 let playerTotal = { player: gameData.players[i]._id, name: gameData.players[i].name, color: gameData.players[i].color, total: total, dice: gameData.players[i].dice }
    //                 diceSumArray.push(playerTotal);
    //                 console.log("diceArray", diceSumArray);
    //             }
    //         })
    //         resolve(diceSumArray);
    //     })
    //     // console.log("returning: ", result);
    //     // return result;
    // }