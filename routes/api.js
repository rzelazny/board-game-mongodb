const router = require("express").Router();
const Game = require("../models");

router.get("/api/gameState/:id", (req, res) => {
  Game.find({})  //{_id: req.params.id}
    .then(gameData => {
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