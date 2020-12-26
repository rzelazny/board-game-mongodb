const router = require("express").Router();
const db = require("../models");

router.get("/api/gameState/:id", (req, res) => {
	db.Game.findById(req.params.id)
		.populate("gameBoard")
		.then(gameData => {
			console.log("GameData: ", gameData);
			res.json(gameData);
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