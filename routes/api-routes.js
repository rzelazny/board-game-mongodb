const router = require("express").Router();
const db = require("../models");
var passport = require("../config/passport");

//signup functionality
router.post("/api/signup", ({ body }, res) => {
	console.log("Signing up " + body.email);

	db.User.create(body)
		.then(dbUser => {
			console.log(dbUser);
			res.json(dbUser);
		})
		.catch(err => {
			console.log(err);
			res.status(404).json(err);
		});
});

//login functionality
router.post("/api/login", passport.authenticate("local"), function (req, res) {
	console.log("Loging in ", req.body.email);
	res.json(req.user);
});

// router.post("/api/signup", async (req, res) => {
// 	console.log("Signing up " + req.body.email);
//     try {
//         var user = new db.User(req.body);
//         var result = await user.save();
//         res.send(result);
//     } catch (err) {
// 		console.log(err)
//         res.status(500).send(err);
//     }
// });

//get the current game state
router.get("/api/gameState/:id", (req, res) => {
	db.Game.findById(req.params.id)
		.populate("gameBoard")
		.populate("players")
		.then(gameData => {
			console.log("GameData: ", gameData);
			res.json(gameData);
		})
		.catch(err => {
			console.log(err);
			res.status(404).json(err);
		});
});

//update the game collection's phase and round
router.post("/api/updatePhase/:id", (req, res) => {
	db.Game.updateOne(
		{ _id: req.params.id },
		{
			$set:
			{
				curRound: req.body.curRound,
				curPhase: req.body.curPhase
			}
		})
		.then(gameData => {
			console.log("GameData: ", gameData);
			res.json(gameData);
		})
		.catch(err => {
			console.log(err);
			res.status(404).json(err);
		});
});

//update the game collection
router.post("/api/updateGame/:id", (req, res) => {
	db.Game.updateOne(
		{ _id: req.params.id }, req.body)
		.then(gameData => {
			console.log("Game Data: ", gameData);
			res.json(gameData);
		})
		.catch(err => {
			console.log(err);
			res.status(404).json(err);
		});
});

//update a player collection
router.post("/api/updatePlayer/:id", (req, res) => {
	db.Player.updateOne(
		{ _id: req.params.id }, req.body)
		.then(playerData => {
			console.log("Player Data: ", playerData);
			res.json(playerData);
		})
		.catch(err => {
			console.log(err);
			res.status(404).json(err);
		});
});

//update the gameBoard collection
router.post("/api/updateBoard/:id", (req, res) => {
	db.GameBoard.updateOne(
		{ _id: req.params.id }, req.body)
		.then(boardData => {
			console.log("Game Board Data: ", boardData);
			res.json(boardData);
		})
		.catch(err => {
			console.log(err);
			res.status(404).json(err);
		});
});
// router.post("/api/transaction", ({body}, res) => {
//   Game.create(body)
//     .then(dbTransaction => {
//       res.json(dbTransaction);
//     })
//     .catch(err => {
//       res.status(404).json(err);
//     });
// });

// router.post("/api/transaction/bulk", ({body}, res) => {
//   Game.insertMany(body)
//     .then(dbTransaction => {
//       res.json(dbTransaction);
//     })
//     .catch(err => {
//       res.status(404).json(err);
//     });
// });

// router.get("/api/transaction", (req, res) => {
//   Game.find({}).sort({date: -1})
//     .then(dbTransaction => {
//       res.json(dbTransaction);
//     })
//     .catch(err => {
//       res.status(404).json(err);
//     });
// });

module.exports = router;