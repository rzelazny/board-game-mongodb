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

module.exports = {

    //function updates game collection
    updateGame: function (game, field, data) {

        let gameUpdateData = { $set: {} };
        gameUpdateData.$set[field] = data;

        console.log(`Updating game ${game} ${field} to ${data}`);
        db.Game.updateOne(
            { _id: game }, gameUpdateData)
        .then(function(results){
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
        .then(function(results){
            console.log("add player results ", results);
        })
    },
    //function updates player collection
    updatePlayer: function (player, field, data) {

        let playerUpdateData = { $set: {} };
        playerUpdateData.$set[field] = data;

        console.log(`Updating player ${player} ${field} to ${data}`);
        db.Player.updateOne(
            { _id: player }, playerUpdateData)
        .then(function(results){
            console.log("update player results ", results);
        })
    }
    //function converts any passed function into a promisified function with a callback of err and result
    // function promisify(f) {
    // 	return function (...args) { // return a wrapper-function (*)
    // 		return new Promise((resolve, reject) => {
    // 			function callback(err, result) { // our custom callback for f (**)
    // 				if (err) {
    // 					reject(err);
    // 				} else {
    // 					resolve(result);
    // 				}
    // 			}
    // 			args.push(callback); // append our custom callback to the end of f arguments
    // 			f.call(this, ...args); // call the original function
    // 		});
    // 	};
    // }
};
