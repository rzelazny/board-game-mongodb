const db = require("../models");
//function updates current phase in the db
// function updatePhase() {
// 	let phaseUpdateData = {
// 		round: gameState.curRound,
// 		phase: gameState.curPhase
// 	};
// 	console.log(`Updating game ${currentGame} phase to ${gameState.curPhase} and round to ${gameState.curRound}`);
// 	fetch("/api/updatePhase/" + currentGame, {
// 		method: "POST",
// 		body: JSON.stringify(phaseUpdateData),
// 		headers: {
// 			Accept: "application/json, text/plain, */*",
// 			"Content-Type": "application/json"
// 		}
// 	})
// }
/*

*/

module.exports = {

    //function gets game data
    getGame: (id, cb) => {
        db.Game.findById(id)
            .populate("advisors")
            .populate("buildings")
            .populate({
                path: "players",
                populate: {
                    path: "constructedBuildings"
                }
            })
            .then((gameData) => {
                console.log("Got game data");
                cb(gameData);
            })
            .catch(err => {
                console.log(err);
            });
    },
    //function gets player data
    getPlayer: (playerID, cb) => {
        db.Player.findById(playerID)
            .populate("constructedBuildings")
            .then((playerData) => {
                console.log("Got player data");
                cb(playerData);
            })
            .catch(err => {
                console.log(err);
            });
    },
    //function gets single advisor data
    getAdvisor: (number, cb) => {
        db.Advisor.findOne(number)
            .then((advisorData) => {
                console.log("Got advisor data");
                cb(advisorData);
            })
            .catch(err => {
                console.log(err);
            });
    },
    //function gets all advisor data
    getAdvisors: (cb) => {
        db.Advisor.find()
            .then((advisorData) => {
                console.log("Got all advisor data");
                cb(advisorData);
            })
            .catch(err => {
                console.log(err);
            });
    },
    //function gets enemy data
    getEnemy: (round, cb) => {
        db.Enemy.find({ round: round })
            .then((enemyData) => {
                console.log("Got enemy data");
                //return one of the 5 random enemies per round
                cb(enemyData[Math.floor(Math.random() * 5)]);
            })
            .catch(err => {
                console.log(err);
            });
    },
    //function gets all building data
    getBuilding: (name, cb) => {
        db.Building.find({ name: name })
            .then((buildingData) => {
                console.log("Got building data");
                cb(buildingData);
            })
            .catch(err => {
                console.log(err);
            });
    },
    //function gets all building data
    getBuildings: (cb) => {
        db.Building.find()
            .then((buildingData) => {
                console.log("Got all building data");
                cb(buildingData);
            })
            .catch(err => {
                console.log(err);
            });
    },


    //function updates game collection
    updateGame: function (game, field, data) {

        let gameUpdateData = { $set: {} };
        gameUpdateData.$set[field] = data;

        console.log(`Updating game ${game} ${field} to ${data}`);
        db.Game.updateOne(
            { _id: game }, gameUpdateData)
            .then(function (results) {
                console.log("update game results ", results);
            })
    },
    //function adds a player to the game collection
    addPlayer: function (game, data) {

        let gameUpdateData = { $push: {} };
        gameUpdateData.$push["players"] = data;

        console.log(`Adding player ${data} to ${game}`);
        db.Game.updateOne(
            { _id: game }, gameUpdateData)
            .then(function (results) {
                console.log("add player results ", results);
            })
    },
    updateTurnOrder: function (game, data) {

        let gameUpdateData = { $push: {} };
        gameUpdateData.$push["players"] = data;

        console.log(`Adding player ${data} to ${game}`);
        db.Game.updateOne(
            { _id: game }, gameUpdateData)
            .then(function (results) {
                console.log("updated turn order ", results);
            })
    },

    //function updates player collection
    updatePlayer: ({ player, field, data }, cb) => {
        let playerUpdateData = { $set: {} };
        playerUpdateData.$set[field] = data;
        console.log(`Updating ${field} for ${player} to ${data}`);
        db.Player.updateOne(
            { _id: player }, playerUpdateData)
            .then(() => {
                console.log("updated player data");
                cb(player, field);
            })
            .catch(err => {
                console.log(err);
            });
    },
    //function updates player collection when a push is needed
    updatePlayerPush: ({ player, field, data }, cb) => {
        let playerUpdateData = { $push: {} };
        playerUpdateData.$push[field] = data;
        console.log(`Pushing ${field} for ${player} to ${data}`);
        db.Player.updateOne(
            { _id: player }, playerUpdateData)
            .then(() => {
                console.log("Pushed player data");
                cb(player, field);
            })
            .catch(err => {
                console.log(err);
            });
    },

    //function updates all player resources at once
    updatePlayerResources: ({
        _id, score, resource1, resource2, resource3,
        strength, twoToken, bonusDie }, cb) => {
        console.log(`Updating all resources for ${_id}`);
        db.Player.updateOne(
            { _id: _id }, {
            $set: {
                score: score,
                resource1: resource1,
                resource2: resource2,
                resource3: resource3,
                strength: strength,
                twoToken: twoToken,
                bonusDie: bonusDie
            }
        })
            .then(() => {
                console.log("Updated player resources");
                cb(_id, "resource1");
            })
            .catch(err => {
                console.log(err);
            });
    },
    //function increments all player resources at once
    incrementPlayerResources: ({
        player, score, resource1, resource2, resource3,
        strength, twoToken, bonusDie }, cb) => {
        console.log(`Updating all resources for ${player}`);
        db.Player.updateOne(
            { _id: player }, {
            $inc: {
                score: score,
                resource1: resource1,
                resource2: resource2,
                resource3: resource3,
                strength: strength,
                twoToken: twoToken,
                bonusDie: bonusDie
            }
        })
            .then(() => {
                console.log("Updated player resources");
                cb(player, "resource1");
            })
            .catch(err => {
                console.log(err);
            });
    }
};

