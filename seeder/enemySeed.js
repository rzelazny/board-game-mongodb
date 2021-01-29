let mongoose = require("mongoose");
let db = require("../models");

mongoose.connect("mongodb://localhost/boardgame", {
    useNewUrlParser: true,
    useFindAndModify: false
});

let enemySetup = [
    {
        name: "Goblins",
        round: 1,
        strength: 2,
        penalty: "res2-1, res3-1, vp-1, building",
        reward: "res2-1"
    },
    {
        name: "Goblins",
        round: 1,
        strength: 3,
        penalty: "res1-1, building",
        reward: "res3-1"
    },
    {
        name: "Barbarians",
        round: 1,
        strength: 2,
        penalty: "resAny-1, building",
        reward: "res1-1"
    },
    {
        name: "Orcs",
        round: 1,
        strength: 3,
        penalty: "resAny-2, vp-1",
        reward: "res1"
    },
    {
        name: "Zombies",
        round: 1,
        strength: 4,
        penalty: "vp-2",
        reward: "vp-1"
    },

    {
        name: "Goblins",
        round: 2,
        strength: 3,
        penalty: "res2-2, res3-2, vp-1, building",
        reward: "res2-1"
    },
    {
        name: "Goblins",
        round: 2,
        strength: 4,
        penalty: "res1-2, building",
        reward: "res3-1"
    },
    {
        name: "Barbarians",
        round: 2,
        strength: 5,
        penalty: "resAny-1, vp-1",
        reward: "res1-1"
    },
    {
        name: "Orcs",
        round: 2,
        strength: 4,
        penalty: "resAny-2, vp-1",
        reward: "res1"
    },
    {
        name: "Zombies",
        round: 2,
        strength: 5,
        penalty: "vp-2",
        reward: "vp-1"
    },

    {
        name: "Goblins",
        round: 3,
        strength: 4,
        penalty: "res2-3, res3-3, vp-1, building",
        reward: "res2-1"
    },
    {
        name: "Goblins",
        round: 3,
        strength: 5,
        penalty: "res1-3, building",
        reward: "res3-1"
    },
    {
        name: "Barbarians",
        round: 3,
        strength: 2,
        penalty: "resAny-1, building",
        reward: "res1-1"
    },
    {
        name: "Demons",
        round: 3,
        strength: 6,
        penalty: "res1-2, res2-1, res3-1, vp-1",
        reward: "vp-1"
    },
    {
        name: "Zombies",
        round: 3,
        strength: 6,
        penalty: "vp-2",
        reward: "vp-1"
    },

    {
        name: "Goblins",
        round: 4,
        strength: 5,
        penalty: "res2-4, res3-4, vp-1, building",
        reward: "res2-1"
    },
    {
        name: "Goblins",
        round: 4,
        strength: 6,
        penalty: "res1-4, building",
        reward: "res3-1"
    },
    {
        name: "Demons",
        round: 4,
        strength: 6,
        penalty: "resAny-4, vp-1",
        reward: "res1-1, vp-1"
    },
    {
        name: "Orcs",
        round: 4,
        strength: 7,
        penalty: "resAny-2, vp-1",
        reward: "resAny-1"
    },
    {
        name: "Zombies",
        round: 4,
        strength: 7,
        penalty: "vp-2",
        reward: "vp-1"
    },

    {
        name: "Barbarians",
        round: 5,
        strength: 7,
        penalty: "vp-8",
        reward: "vp-1"
    },
    {
        name: "Barbarians",
        round: 5,
        strength: 8,
        penalty: "building",
        reward: "vp-1"
    },
    {
        name: "Demons",
        round: 5,
        strength: 8,
        penalty: "vp-2, building",
        reward: "vp-2"
    },
    {
        name: "Demons",
        round: 5,
        strength: 9,
        penalty: "building",
        reward: "vp-2"
    },
    {
        name: "Dragons",
        round: 5,
        strength: 9,
        penalty: "vp-5",
        reward: "vp-3"
    },
];

db.Enemy.deleteMany({})
    .then(() => db.Enemy.collection.insertMany(enemySetup))
    .then(data => {
        console.log(data.result.n + " records inserted!");
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
