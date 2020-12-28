
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

//function updates game collection
function updateGame(game, field, data) {

	let gameUpdateData = { $set: {} };
	gameUpdateData.$set[field] = data;

	console.log(`Updating game ${game} ${field} to ${data}`);
	fetch("/api/updateGame/" + game, {
		method: "POST",
		body: JSON.stringify(gameUpdateData),
		headers: {
			Accept: "application/json, text/plain, */*",
			"Content-Type": "application/json"
		}
	})
}

//function updates player collection
function updatePlayer(player, field, data) {

	let playerUpdateData = { $set: {} };
	playerUpdateData.$set[field] = data;

	console.log(`Updating player ${player} ${field} to ${data}`);
	fetch("/api/updatePlayer/" + player, {
		method: "POST",
		body: JSON.stringify(playerUpdateData),
		headers: {
			Accept: "application/json, text/plain, */*",
			"Content-Type": "application/json"
		}
	})
}

//function updates gameBoard collection
function updateBoard(board, field, data) {

	let boardUpdateData = { $set: {} };
	boardUpdateData.$set[field] = data;

	console.log(`Updating board ${board} ${field} to ${data}`);
	fetch("/api/updateBoard/" + board, {
		method: "POST",
		body: JSON.stringify(boardUpdateData),
		headers: {
			Accept: "application/json, text/plain, */*",
			"Content-Type": "application/json"
		}
	})
}

//function converts any passed function into a promisified function with a callback of err and result
function promisify(f) {
	return function (...args) { // return a wrapper-function (*)
		return new Promise((resolve, reject) => {
			function callback(err, result) { // our custom callback for f (**)
				if (err) {
					reject(err);
				} else {
					resolve(result);
				}
			}
			args.push(callback); // append our custom callback to the end of f arguments
			f.call(this, ...args); // call the original function
		});
	};
}