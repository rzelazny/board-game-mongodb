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

let playersSetup = [{
    name: "Player One",
    score: 0,
    resource1: 0,
    resource2: 0,
    resource3: 0,
    hasBonus: false,
    constructedBuildings: [Sawmill]
    },
    {
    name: "AI Overlord",
    score: 0,
    resource1: 0,
    resource2: 1,
    resource3: 1,
    hasBonus: false,
    constructedBuildings: []
    },
]

let gameSetup = 
    {
        name: "Demo Game",
        players: ["Player 1", "AI Overlord"],
        gameBoard: "5fe7d983cdf2912048481cff",
        curPlayer: 1,
        curRound: 1,
        curPhase: 1
};

db.GameBoard.deleteMany({})
    .then(() => db.GameBoard.collection.insertOne(gameBoardSetup))
    .then(data => {
        console.log(data.result.n + " record inserted!");
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
});

db.Player.deleteMany({})
    .then(() => db.Player.collection.insertMany(playersSetup))
    .then(data => {
        console.log(data.result.n + " records inserted!");
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
});

db.Game.deleteMany({})
    .then(() => db.Game.collection.insertOne(gameSetup))
    .then(data => {
        console.log(data.result.n + " records inserted!");
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
});
