let mongoose = require("mongoose");
let db = require("../models");

mongoose.connect("mongodb://localhost/boardgame", {
    useNewUrlParser: true,
    useFindAndModify: false
});

let buildingSetup = [
    {
        name: "Sawmill",
        column: 1,
        cost: [0,2,1],
        points: 1,
        effectTiming: ["P4"],
        effectType: "May -1 res2, +2 res1",
    },
    {
        name: "Quarry",
        column: 2,
        cost: [1,1,2],
        points: 2,
        effectTiming: ["P4"],
        effectType: "May -1 res3, +3 res1",
    },
    {
        name: "GoldSmith",
        column: 3,
        cost: [2,2,2],
        points: 3,
        effectTiming: ["P4"],
        effectType: "May -1 res1, +1 Military, +1VP",
    },
    {
        name: "Mint",
        column: 4,
        cost: [6,1,1],
        points: 5,
        effectTiming: ["P2", "P6"],
        effectType: "A1, A2, A3 work in P1 and P3 as well",
    },
    {
        name: "Statue",
        column: 1,
        cost: [2,0,0],
        points: 3,
        effectTiming: ["P2", "P4", "P6"],
        effectType: "If all dice same reroll 1",
    },
    {
        name: "Chapel",
        column: 2,
        cost: [3,0,1],
        points: 5,
        effectTiming: ["P2", "P4", "P6"],
        effectType: "If dice total <8 may reroll all dice",
    },
    {
        name: "Church",
        column: 3,
        cost: [3,1,2],
        points: 7,
        effectTiming: ["P8"],
        effectType: "+1 Military vs Demons",
    },
    {
        name: "Cathedral",
        column: 4,
        cost: [5,0,3],
        points: 9,
        effectTiming: ["End"],
        effectType: "+1VP per 2 goods left",
    },
    {
        name: "Inn",
        column: 1,
        cost: [1,1,0],
        points: 0,
        effectTiming: ["P4"],
        effectType: "+1 2token",
    },
    {
        name: "Market",
        column: 2,
        cost: [2,2,0],
        points: 1,
        effectTiming: ["P2", "P4", "P6"],
        effectType: "May Dice set +1 or -1",
    },
    {
        name: "Farms",
        column: 3,
        cost: [2,3,1],
        points: 2,
        effectTiming: ["P2", "P4", "P6", "P8"],
        effectType: "+1 white die, Military -1",
    },
    {
        name: "Merchants' Guild",
        column: 4,
        cost: [3,1,2],
        points: 4,
        effectTiming: ["P2", "P4", "P6"],
        effectType: "+1 res1",
    },
    {
        name: "Guard Tower",
        column: 1,
        cost: [1,0,1],
        points: 1,
        effectTiming: ["P8"],
        effectType: "+1 Military",
    },
    {
        name: "Blacksmith",
        column: 2,
        cost: [1,2,0],
        points: 2,
        effectTiming: ["P8"],
        effectType: "+1 Military",
    },
    {
        name: "Barracks",
        column: 3,
        cost: [2,2,1],
        points: 4,
        effectTiming: ["P7"],
        effectType: "Recruit cost is only 1 good",
    },
    {
        name: "Wizards' Guild",
        column: 4,
        cost: [3,2,2],
        points: 6,
        effectTiming: ["P8"],
        effectType: "+2 Military",
    },
    {
        name: "Palisade",
        column: 1,
        cost: [2,0,0],
        points: 0,
        effectTiming: ["P8"],
        effectType: "+1 Military, +2 vs Zombies",
    },
    {
        name: "Stable",
        column: 2,
        cost: [1,1,1],
        points: 2,
        effectTiming: ["P2", "P4", "P6"],
        effectType: "+1 Military when gaining Military",
    },
    {
        name: "Stone Wall",
        column: 3,
        cost: [2,0,2],
        points: 2,
        effectTiming: ["P8"],
        effectType: "+1 Military, you also win ties",
    },
    {
        name: "Fortress",
        column: 4,
        cost: [3,0,2],
        points: 4,
        effectTiming: ["P8"],
        effectType: "+1 Military, +1VP on win",
    },
    {
        name: "Barricade",
        column: 1,
        cost: [1,0,0],
        points: 0,
        effectTiming: ["P8"],
        effectType: "+1 Military vs Goblins",
    },
    {
        name: "Crane",
        column: 2,
        cost: [1,0,1],
        points: 1,
        effectTiming: ["P2", "P4", "P6"],
        effectType: "Column 3 and 4 buildings cost -1 res1",
    },
    {
        name: "Town Hall",
        column: 3,
        cost: [2,1,1],
        points: 2,
        effectTiming: ["P2", "P4", "P6"],
        effectType: "May -1 and res or 2token for +1VP",
    },
    {
        name: "Embassy",
        column: 4,
        cost: [2,2,2],
        points: 4,
        effectTiming: ["P2", "P4", "P6"],
        effectType: "+1VP",
    },
    {
        name: "Improvised Defenses",
        column: 1,
        cost: [0,0,1],
        points: 0,
        effectTiming: ["P8"],
        effectType: "+1 Military vs Enemites <6",
    },
    {
        name: "Recruiting Center",
        column: 2,
        cost: [1,1,0],
        points: 1,
        effectTiming: ["P7"],
        effectType: "May spend 2token to recruit",
    },
    {
        name: "Training Camp",
        column: 3,
        cost: [1,2,0],
        points: 2,
        effectTiming: ["P7"],
        effectType: "If Military <2 then +1 Military",
    },
    {
        name: "Military Academy",
        column: 4,
        cost: [2,1,1],
        points: 3,
        effectTiming: ["P8"],
        effectType: "Gain 1 die worth of military",
    },
    
];

db.Building.deleteMany({})
    .then(() => db.Building.collection.insertMany(buildingSetup))
    .then(data => {
        console.log(data.result.n + " records inserted!");
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
