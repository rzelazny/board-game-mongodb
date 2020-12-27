const router = require("express").Router();
const db = require("../models");

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

//update the game collection
router.post("/api/updateGame/:id", (req , res) => {
	db.Game.updateOne(
		{_id: req.params.id},
		{$set: 
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

//update a player collection
router.post("/api/updatePlayer/:id", (req , res) => {
	db.Player.updateOne(
		{_id: req.params.id}, req.body)
		.then(playerData => {
			console.log("Player Data: ", playerData);
			res.json(playerData);
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