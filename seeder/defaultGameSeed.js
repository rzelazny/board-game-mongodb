let mongoose = require("mongoose");
let db = require("../models");

mongoose.connect("mongodb://localhost/boardgame", {
    useNewUrlParser: true,
    useFindAndModify: false
});

let gameBoardSetup = {
    turnOrder: [0, 1],
    nextEnemy: {
        name: "Goblins",
        power: 3,
        penalty: "-1res 1, -1 building",
        reward: "+1 res3"
    }
}

let gameSetup = 
    {
        name: "Demo Game",
        players: ["Player 1", "AI Overlord"],
        gameBoard: "ObjectId(\"5fe79f6fb409e03588c55476\")",
        curPlayer: 1,
        curRound: 1,
        curPhase: 1
};

db.Building.deleteMany({})
    .then(() => db.GameBoard.collection.insertOne(gameBoardSetup))
    .then(data => {
        console.log(data.result.n + " records inserted!");
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
});

db.Building.deleteMany({})
    .then(() => db.Game.collection.insertOne(gameSetup))
    .then(data => {
        console.log(data.result.n + " records inserted!");
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
});
