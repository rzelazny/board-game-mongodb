const mongo = require("./db-updates");

//connection variables
var io;
var gameSocket;
var room;

//gameplay variables
var nextEnemy = {};
var players = [];
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
    curRound = 1;
    curPhase = 1;
    waitingForPlayers = 0;
    waitingForDB = 0;
    advisors = [];
    clearTimeout(timeoutGlobal);

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
        case "resource": //player sends resource choices during the aid phase and rally phase
            if (curPhase == 1) return resolveAid(player, choice);
            else return rallyStrenth(player, choice);
        case "advisor":
            return influenceAdvisors(player, choice);
        case "use-advisor":
            return advisorResources(player, choice);
        case "building":
            return resolveBuildings(player, choice);
        case "construct-building":
            return constructBuilding(player, choice);
        case "got-reward":
            waitingForPlayers--;
            return choiceProcessed();
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
        if ((resource1 === 0 && updateData.res1 < 0) ||
            (resource2 === 0 && updateData.res2 < 0) ||
            (resource3 === 0 && updateData.res3 < 0)) {
            console.log("Negative resource choice");
        }
        else { //otherwise update the player resources
            console.log("Resources validated");
            mongo.incrementPlayerResources(updateData, (player) => {
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
    }
    generateEnemy(curRound);
    console.log("Players with data: ", players.length);
    return "success"
};

//function gets the enemy for the upcoming round
function generateEnemy(curRound) {
    mongo.getEnemy(curRound, (enemy) => {
        nextEnemy = enemy;
        console.log("Next enemu is: ", enemy);
    });
}

//function runs the game logic
function playGame() {

    console.log("advancing game, current phase:", curPhase);
    switch (curPhase) {
        case 1:
            return aidPhaseOne(); //Aid Phase One
        case 2:
            return productivePhase(curPhase); //Spring
        case 3:
            return setTurnOrder();
        case 4:
            return pickAdvisors();
        case 5:
            return resolveAdvisors();
        case 6:
            return pickBuildings();
        case 7:
            return postProdCleanup();
        case 8:
            return rewardPhase(curPhase); //Reward Phase
        case 9:
            return productivePhase(curPhase); //Summer
        case 10:
            return setTurnOrder();
        case 11:
            return pickAdvisors();
        case 12:
            return resolveAdvisors();
        case 13:
            return pickBuildings();
        case 14:
            return postProdCleanup();
        case 15:
            return aidPhaseTwo(curPhase); //Aid Phase Two
        case 16:
            return productivePhase(curPhase); //Autumn
        case 17:
            return setTurnOrder();
        case 18:
            return pickAdvisors();
        case 19:
            return resolveAdvisors();
        case 20:
            return pickBuildings();
        case 21:
            return postProdCleanup();
        case 22:
            return rallyPhase(curPhase);
        //     return productivePhase(curPhase);
        // case 5:
        //     
        // case 6:
        //     return productivePhase(curPhase);
        // case 7:
        //     
        // case 8:
        //     return combatPhase();
        default:
            console.log("Phase not found");
            break;
    }
}

//updates the game phase
function nextPhase() {

    if (curPhase === 99) {
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
async function aidPhaseOne() {
    console.log("Aid phase one running");

    //alert the room the phase has changed
    alertAll("next-phase", curPhase)

    let worstOff = await findWorstOffPlayer();
    //if there are multiple worst off players give them all a bonus resource
    if (worstOff.length > 1) {
        promptUser(worstOff, "prompt-user", "You recieve the king's aid. Pick a bonus resource:");
    }
    else { //if there's only one worst off player they get a bonus die
        console.log(worstOff[0], "is worst off");
        promptUser(worstOff[0], "prompt-user", "You recieve the king's aid. Roll an extra die in Spring.")
        let bonusDie = generateDie(1);
        mongo.updatePlayer({ player: worstOff[0], field: "bonusDie", data: bonusDie[0] }, blank)
    };

    //move on even if all users haven't choosen their bonus resource
    console.log("starting Aid Phase timeout");
    beginPhaseTimeout(10, "Aid phase timed out");
}

//Function runs the game logic for aid phase two
async function aidPhaseTwo(curPhase) {
    console.log("Aid phase two running");
    //alert the room the phase has changed
    alertAll("next-phase", curPhase)

    //only one player can gain the bonus, nothing happens for ties
    let worstOff = await findWorstOffPlayer();
    if (worstOff.length === 1) {
        console.log(worstOff[0], "is worst off");
        mongo.updatePlayer({ player: worstOff[0], field: "hasBonus", data: true }, () => {
            promptUser(worstOff[0], "prompt-user", "You recieve the king's envoy. Use it to build an extra building or influence" +
                "an already influenced advisor.")
        });
    }

    //move on even if the worst off hasn't acknowledged their bonus
    console.log("starting Aid Phase Two timeout");
    beginPhaseTimeout(10, "Aid phase Two timed out");
}

//finds the player with the fewest buildings then tie breaker of fewest resources
async function findWorstOffPlayer() {
    return new Promise((resolve, reject) => {
        let playerStats = [];
        let buildCount = [];
        let resourceCount = [];
        let worstOff = [];

        //get current player stats
        mongo.getGame(curGame, (gameData) => {
            for (const player of gameData.players) {
                let stats = {
                    id: player._id,
                    buildings: player.constructedBuildings.length,
                    resources: (player.resource1 + player.resource2 + player.resource3)
                }
                playerStats.push(stats);
                buildCount.push(stats.buildings);
                console.log(stats);
            }

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
                resolve(worstOff);
            }
            else { //if only one player has the fewest buildings that player is the worstOff
                worstOff.push(leastBuildingPlayers[0].id);
                resolve(worstOff);
            }
        })
    })
}

//function takes the player's aid choice and updates the db appropriately
function resolveAid(player, choice) {
    let updateData = {
        player: player,
        field: "resource" + choice,
        data: 1
    }
    waitingForPlayers--;
    mongo.updatePlayer(updateData, sidebarUpdate)
    choiceProcessed();
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
    console.log("Prompting users", updatePlayer, prompt, msg);

    //check for error messages
    if (prompt === "prompt-error") {
        prompt = "prompt-user";
        msg = "Invalid choice. " + msg;
    }

    //Updates to the sidebar do not require a response
    let resNeeded = true;
    if (prompt === "update-dice" || prompt === "update-sidebar" || prompt === "enemy-data") {
        resNeeded = false;
    }

    //if multiple players need to be alerted at once
    if (Array.isArray(updatePlayer)) {
        players.forEach(player => { //check each player in the list of players to see if they're in the array
            if (updatePlayer.some(player => player.equals(player._id))) {
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
                console.log(player._id, "being told to wait, they didn't get ", prompt);
                io.to(player.socket).emit("waiting", "Waiting for other players");
            }
        });
    }
    else { //else only one character was passed, not an array
        players.forEach(player => {
            console.log("id", player._id);
            console.log("updateplayer", updatePlayer);
            console.log("test", player._id.toString());
            if (player._id.equals(updatePlayer)) { // player._id.toString() === updatePlayer.toString()
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
                console.log(player._id, "being told to wait, they didn't get ", prompt);
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
        mongo.updatePlayer({ player: player, field: "dice", data: newDice }, blank); //this was push
    });
    console.log("Dice generated for", players);

    //get game data to see if anyone has dice related buildings
    mongo.getGame(curGame, checkUsableBuildings);
}

function generateDie(numDice) {
    let diceArrary = [];
    for (let i = 0; i < numDice; i++) {
        diceArrary.push(Math.floor(Math.random() * 6) + 1)
    }
    return diceArrary
}

//function prompts users that have buildings that take effect before productive seasons
function checkUsableBuildings(gameData) {
    console.log("checking for usable buildings");
    //create flags
    let beforeProd = false,
        //season1 = false,
        season2 = false,
        season3 = false;

    //see if we're checking the before or after prod buildings
    if (gameData.curPhase === 2 || gameData.curPhase === 9 || gameData.curPhase === 16) beforeProd = true

    //set the season
    if (gameData.curPhase === 7) season1 = true;
    if (gameData.curPhase === 14) season2 = true;
    if (gameData.curPhase === 21) season3 = true;

    //for each player check for usable buildings 
    const usableBuildings = async (gameData) => {
        const players = gameData.players;
        for (const player of players) {
            const hasUsableBuildings = await findUsable(player);
            console.log("buildings: ", hasUsableBuildings);
            //Prompt the player to use any available buildings
            if (Object.keys(hasUsableBuildings).length > 0) {
                promptUser(hasUsableBuildings[0].player, "use-buildings", hasUsableBuildings);
                console.log(waitingForPlayers, "player(s) have buildings they can use");
            }
        }
    }

    //if a building is usable add it to the canUseBuilding object
    const findUsable = player => {
        return new Promise((resolve, reject) => {
            let canUseBuilding = [];
            if (beforeProd) {
                console.log("Checking preprod buildings for", player);
                //see if they've built a Statue
                if (player.constructedBuildings.some(e => e.name === "Statue")) {
                    //see if the Statue has triggered - all 3 dice must match
                    if (player.dice[0] === player.dice[1] && player.dice[1] === player.dice[2]) {
                        canUseBuilding.push("Statue");
                        //player, gameData.buildings.filter(building => building.name === "Statue"), canUseBuilding, "Choose-Dice", player.dice);
                    }
                }

                //see if they've buit a Chapel
                if (player.constructedBuildings.some(e => e.name === "Chapel")) {
                    //Chapel triggers when the dice total is 7 or less at the start of the round
                    let diceSum = player.dice.reduce((a, b) => { return a + b })
                    if (diceSum < 8 && player.dice.length > 2) {
                        canUseBuilding.push("Chapel");
                        //player, gameData.buildings.filter(building => building.name === "Chapel"), canUseBuilding, "Choose-YN", player.dice);
                    }
                }
                //see if they've buit a Merchants' Guild
                if (player.constructedBuildings.some(e => e.name === "Merchants' Guild")) {
                    //Merchants' Guild triggers at the start of every productive season
                    canUseBuilding.push("Merchants' Guild");
                    //player, gameData.buildings.filter(building => building.name === "Merchants' Guild"), canUseBuilding, "Choose-YN");
                }
            }
            else { //checking for post prod season buildings
                console.log("Checking for post prod buildings for ", player);
                //see if they've buit a Mint
                let mintFlag = false;
                if (player.constructedBuildings.some(e => e.name === "Mint")) {
                    //Mint modifies when other buildings can be used
                    mintFlag = true;
                }
                //see if they've buit a Sawmill
                if (player.constructedBuildings.some(e => e.name === "Sawmill") && (mintFlag || season2)) {
                    //Sawmill triggers end of Summer unless the mint has been built
                    canUseBuilding.push("Sawmill");
                    //player, gameData.buildings.filter(building => building.name === "Sawmill"), canUseBuilding, "Choose-YN");
                }
                //see if they've buit a Quarry
                if (player.constructedBuildings.some(e => e.name === "Quarry") && (mintFlag || season2)) {
                    //Quarry triggers end of Summer unless the mint has been built
                    canUseBuilding.push("Quarry");
                    //player, gameData.buildings.filter(building => building.name === "Quarry"), canUseBuilding, "Choose-YN");
                }
                //see if they've buit a Goldsmith
                if (player.constructedBuildings.some(e => e.name === "Goldsmith") && (mintFlag || season2)) {
                    //Goldsmith triggers end of Summer unless the mint has been built
                    canUseBuilding.push("Goldsmith");
                    //player, gameData.buildings.filter(building => building.name === "Goldsmith"), canUseBuilding, "Choose-YN");
                }
                //see if they've buit a Inn
                if (player.constructedBuildings.some(e => e.name === "Inn") && season2) {
                    //Inn triggers end of Summer
                    canUseBuilding.push("Inn");
                    //player, gameData.buildings.filter(building => building.name === "Inn"), canUseBuilding, "Choose-YN");
                }
                //see if they've buit a Town Hall
                if (player.constructedBuildings.some(e => e.name === "Town Hall")) {
                    //Town Hall triggers end of every productive season
                    canUseBuilding.push("Town Hall");
                    //player, gameData.buildings.filter(building => building.name === "Town Hall"), canUseBuilding, "Choose-Resource");
                }
                //see if they've buit an Embassy
                if (player.constructedBuildings.some(e => e.name === "Embassy")) {
                    //Embassy triggers end of every productive season
                    canUseBuilding.push("Embassy");
                    //player, gameData.buildings.filter(building => building.name === "Embassy"), canUseBuilding, "Choose-YN");
                }
                //see if they've buit a Training Camp
                if (player.constructedBuildings.some(e => e.name === "Training Camp") && season3) {
                    //Training Camp triggers end of season 3
                    canUseBuilding.push("Training Camp");
                    //player, gameData.buildings.filter(building => building.name === "Training Camp"), canUseBuilding);
                }
            }
            let result = playerCanUseBuilding(player, canUseBuilding, gameData.buildings, player.dice)
            resolve(result);
        });
    }
    usableBuildings(gameData).then(() => {
        console.log("Usable building checks complete")
        //if someone has buildings to use start the phase timer, otherwise move on
        if (waitingForPlayers > 0) beginPhaseTimeout(10, "Use buildings expired");
        else nextPhase();
    })
}

//If a player can use a building create an object with the necessary info for the client
async function playerCanUseBuilding(player, usableBuildings, gameData, dice) {
    let canUseObj = [];
    console.log("can use data:", usableBuildings, gameData, dice);
    for (const build of usableBuildings) {
        let buildData = gameData.filter(building => building.name === build);

        canUseObj.push({ player: player._id, building: buildData[0], dice: dice });
    }
    //if we didn't find the player in the obj
    // if (Object.keys(canUseObj).length === 0) {
    //     console.log("Adding", player._id, "to the use building array");

    // }
    // else { //otherwise we need to update the existing object
    //     console.log(player, "can use another building");
    //     canUseObj.building.push([building]);
    //     canUseObj.choiceType.push([choiceType]);
    // }
    return canUseObj;
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

        console.log("what's my dicedata:", diceData);
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
            //check if player has built a market
            marketFlag = (playerData.constructedBuildings.some(e => e.name === "Market"))
            //send relevant dice data to the client
            let diceData = {
                dice: playerData.dice,
                color: playerData.color,
                bonusDie: playerData.bonusDie,
                token: playerData.twoToken,
                market: marketFlag
            };
            promptUser(playerData._id, "update-dice", diceData);
        })
    }))

    promptUser(players[curPlayer - 1]._id, "prompt-user", "Use your dice to influence an advisor.");

    //reset the timer each time someone makes a choice
    clearTimeout(timeoutGlobal);
    beginPhaseTimeout(30, ("Player number", curPlayer, "timed out on advisor"));
}

//function handles user submitting a building choice
function resolveBuildings(player, choices) {
    console.log("choice", choices);
    mongo.getPlayer(player, (playerData) => {
        //for each building a player has chosen to use
        for (const choice of choices) {
            let updateData = {};
            switch (choice.building) {
                case "Sawmill": //may turn a res2 into 2 res1
                    updateData = {
                        player: playerData.player,
                        score: 0,
                        resource1: 2,
                        resource2: -1,
                        resource3: 0,
                        strength: 0,
                        twoToken: 0,
                        bonusDie: 0
                    }
                    validateData(updateData);
                    break;
                case "Quarry": //may turn a res3 into 3 res1
                    updateData = {
                        player: playerData.player,
                        score: 0,
                        resource1: 3,
                        resource2: 0,
                        resource3: -1,
                        strength: 0,
                        twoToken: 0,
                        bonusDie: 0
                    }
                    validateData(updateData);
                    break;
                case "Goldsmith": // may spend a res1 for 1 str and 1 vp
                    updateData = {
                        player: playerData.player,
                        score: 1,
                        resource1: -1,
                        resource2: 0,
                        resource3: 0,
                        strength: 1,
                        twoToken: 0,
                        bonusDie: 0
                    }
                    validateData(updateData);
                    break;
                case "Statue": //may reroll the chosen die
                    console.log(choice.data);
                    let newDie = (generateDie(1));
                    myDice = playerData.dice.splice(choice.data, 1, newDie); //remove the chosen die and replace with the new die
                    mongo.updatePlayer({ player: playerData._id, field: "dice", data: myDice }, () => {
                        sidebarUpdate(player, "dice");
                    });
                    console.log(player, "has new dice", myDice);
                    break;
                case "Chapel": //reroll all dice
                    let newDice = (generateDie(3));
                    mongo.updatePlayer({ player: playerData._id, field: "dice", data: newDice }, () => {
                        sidebarUpdate(player, "resource1");
                    });
                    console.log(player, "has new dice", newDice);
                    break;
                case "Inn": // give a 2token
                    mongo.updatePlayer({ player: playerData._id, field: "twoToken", data: (playerData.twoToken + 1) }, () => {
                        sidebarUpdate(player, "resource1");
                    });
                    break;
                case "Merchants' Guild": // give a res1
                    mongo.updatePlayer({ player: playerData._id, field: "resource1", data: (playerData.resource1 + 1) }, () => {
                        sidebarUpdate(player, "resource1");
                    });
                    break;
                case "Town Hall": //may spend a res or 2token for a vp

                    let res1Update = 0,
                        res2Update = 0,
                        res3Update = 0,
                        tokenUpdate = 0;

                    //client sends choice number, 0-3 for res 1/2/3/2token
                    if (choice.data = 0) res1Update = -1
                    else if (choice.data = 1) res2Update = -1
                    else if (choice.data = 2) res3Update = -1
                    else tokenUpdate = -1;

                    updateData = {
                        player: playerData.player,
                        score: 1,
                        resource1: 0 + res1Update,
                        resource2: 0 + res2Update,
                        resource3: 0 + res3Update,
                        strength: 0,
                        twoToken: 0 + tokenUpdate,
                        bonusDie: 0
                    }
                    validateData(updateData);
                    break;
                case "Embassy": // give a vp
                    mongo.updatePlayer({ player: playerData._id, field: "score", data: (playerData.score + 1) }, () => {
                        sidebarUpdate(player, "score");
                    });
                    break;
                case "Military Academy": //use the die roll for str instead of reinforcements 
                    let strDie = (generateDie(1));
                    mongo.updatePlayer({ player: playerData._id, field: "str", data: strDie[0] }, () => {
                        sidebarUpdate(player, "resource1");
                    });
                    break;
                default:
                    console.log("Unknown building", building);
            }
        };
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
        let diceToAdd = choice.length;
        let usedBonus = 0;
        let usedToken = 0;

        //check for bonus die usage
        if (choice.indexOf("bonus-die") > 0) {
            console.log("bonusDie used");
            diceToAdd--;
            total += playerData.bonusDie;
            usedBonus = playerData.bonusDie;
        }
        //check for 2token die usage
        if (choice.indexOf("twotoken") > 0) {
            console.log("2token used");
            diceToAdd--;
            total += 2;
            usedToken = 1;
        }

        //player sends a list of dice, add the numbers from those dice
        for (let i = 0; i < diceToAdd; i++) {
            total += playerData.dice[choice[i]];
            diceNums.push(playerData.dice[choice[i]]);
        }
        //if player has passed
        if (total === 0) {
            console.log(player, "passed their advisor phase");
            waitingForPlayers--;
            curPlayer++;

            let diceUpdate = { player: playerData._id, field: "dice", data: [] }
            mongo.updatePlayer(diceUpdate, (playerData) => { //this was push
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
            let placeDice = { dice: diceNums, color: playerData.color, advisor: total, bonus: usedBonus, token: usedToken }
            alertAll("mark-dice", placeDice);

            //remove the spent dice from the player's dice pool
            let remainingDice = playerData.dice;
            //decrement since deleting from the start will throw off our index
            for (let i = (playerData.dice.length - 1); i > -1; i--) {
                if (choice.includes(i.toString())) {
                    remainingDice.splice(i, 1);
                }
            }

            let diceUpdate = { player: playerData._id, field: "dice", data: remainingDice };
            console.log("Diceupdate:", diceUpdate);
            mongo.updatePlayer(diceUpdate, () => { //this was push
                sidebarUpdate(playerData._id, "dice");
                //if a token or a bonus die was used, remove that as well
                if (usedToken > 0 || usedBonus > 0) {

                    playerData.twoToken -= usedToken;
                    playerData.bonusDie -= usedBonus;
                    console.log("playerdata", playerData);
                    mongo.updatePlayerResources(playerData, (playerData) => { //this was push
                        sidebarUpdate(playerData._id, "dice");
                    });
                }
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
                        if (sendEnemyData) promptUser(player._id, "enemy-data", nextEnemy);
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
    let score = (advResult.match(/vp/g) || []).length;
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
        resource1: res1,
        resource2: res2,
        resource3: res3,
        strength: str,
        twoToken: token,
        bonusDie: 0
    }
    console.log("Update data:", updateData);

    return updateData;
}

//Function lets players choose buildings to construct
function pickBuildings() {
    console.log("Selecting buildings to construct");

    players.forEach(player => {
        mongo.getPlayer(player, (playerData => {
            promptUser(player._id, "choose-buildings", playerData);
        }))
    });
}

//function validates user choice and constructs the building if they have the resources available
function constructBuilding(player, choice) {
    console.log("Constructing buildings for ", player, choice);

    if (!Array.isArray(choice) || !choice.length) { //if player passed without making a building
        waitingForPlayers--;
        choiceProcessed();
    } else {
        mongo.getPlayer(player, (playerData) => {
            mongo.getBuilding(choice, (buildingData) => {
                let costRes1 = buildingData[0].cost[0];
                let costRes2 = buildingData[0].cost[1];
                let costRes3 = buildingData[0].cost[2];

                //validate that player can afford the building
                if (playerData.resource1 >= costRes1 &&
                    playerData.resource2 >= costRes2 &&
                    playerData.resource3 >= costRes3
                ) {
                    waitingForDB++;
                    playerData.resource1 -= costRes1;
                    playerData.resource2 -= costRes2;
                    playerData.resource3 -= costRes3;
                    playerData.score += buildingData[0].points;

                    mongo.updatePlayerResources(playerData, () => {
                        mongo.updatePlayerPush({ player: player, field: "constructedBuildings", data: buildingData[0]._id }, () => {
                            waitingForPlayers--;
                            waitingForDB--;
                            sidebarUpdate(player, "buildings");
                            choiceProcessed();
                        });
                    });
                } else { //player can't afford it, alert them to make another choice
                    console.log("Error: can't afford the building");
                    //waitingForPlayers --
                    //promptUser(player, );
                }
            })
        })
    }
}

//Function runs the game logic for reward phase
function rewardPhase(phase) {
    console.log("Reward phase running");

    //alert the room the phase has changed
    alertAll("next-phase", phase)
    let playerStats = [];
    let buildCount = [];

    //get current player stats
    mongo.getGame(curGame, ({ players }) => {
        players.forEach(player => {
            let stats = {
                id: player._id,
                buildings: player.constructedBuildings.length,
                score: player.score
            }
            playerStats.push(stats);
            buildCount.push(stats.buildings);
        });

        //Find the highest building total
        const mostBuildings = Math.max(...buildCount);

        let mostBuildingPlayers = playerStats.filter(function (stats) {
            return stats.buildings === mostBuildings;
        });

        console.log("Players with the most buildings:", mostBuildingPlayers);

        //update the winning player's score in the db
        for (let i = 0; i < mostBuildingPlayers.length; i++) {
            let update = {
                player: mostBuildingPlayers[i].id,
                field: "score",
                data: mostBuildingPlayers[i].score + 1
            };
            mongo.updatePlayer(update, () => {
                sidebarUpdate(mostBuildingPlayers[i].id, "score");
                promptUser(mostBuildingPlayers[i].id, "prompt-user", "You've gained a victory point from the King's reward.");
            });
        }

        //move on even if all users haven't acknowledged their bonus
        console.log("starting Reward Phase timeout");
        beginPhaseTimeout(10, "Reward phase timed out");
    })
}

//function clears out saved data between productive phases
function postProdCleanup() {
    console.log("Cleaning up prod phase data");

    mongo.getGame(curGame, (gameData) => {
        //prompt users if they have any usable buildings
        checkUsableBuildings(gameData);
        //remove marked dice
        alertAll("remove-dice", "clear-all");

        //clean out influenced advisors
        advisors = [];

        //remove bonus die if it wasn't used in the spring
        if (gameData.curPhase === 7) {
            gameData.players.forEach(player => {
                if (player.bonusDie > 0) {
                    mongo.updatePlayer({ player: player._id, field: "bonusDie", data: 0 }, blank)
                }
            });
        }
    });
}

//Function runs the game logic for rally troops phase
function rallyPhase(phase) {
    console.log("Rally phase running");
    //alert the room the phase has changed
    alertAll("next-phase", phase)

    mongo.getGame(curGame, (gameData) => {
        gameData.players.forEach(player => {
            promptUser(player._id, "rally-prompt", player);
        });
    });

    //move on even if all users haven't finished rallying strength
    console.log("starting Rally Phase timeout");
    beginPhaseTimeout(30, "Rally phase timed out");
}

//function handles player spending resources for strength during rally phase
function rallyStrenth(player, resource) {
    console.log("rallying strength for", player, resource)

    let update = {
        player: player,
        resource1: 0,
        resource2: 0,
        resource3: 0,

    }

    switch (resource) {
        case 1:
            update.resource1 = -2;
        case 2:
            update.resource2 = -2;
        case 3:
            update.resource3 = -2;
        case 4:
            update.twoToken = -2;
    }

    console.log("update", update);

    validateData(update);
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