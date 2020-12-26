let mongoose = require("mongoose");
let db = require("../models");

mongoose.connect("mongodb://localhost/boardgame", {
    useNewUrlParser: true,
    useFindAndModify: false
});

let buildingSetup = [
    {
        name: "A1",
        cost: [0,2,1],
        points: 1,
        effectTiming: "P2",
        effectType: "May -1 res2, +2 res1",
        built: false
    },
    {
        name: "A2",
        cost: [1,1,2],
        points: 2,
        effectTiming: "P2",
        effectType: "May -1 res2, +2 res1",
        built: false
    },
    {
        name: "A3",
        cost: [2,2,2],
        points: 3,
        effectTiming: "P2",
        effectType: "May -1 res2, +2 res1",
        built: false
    },
    {
        name: "A4",
        cost: [6,1,1],
        points: 5,
        effectTiming: "P2",
        effectType: "May -1 res2, +2 res1",
        built: false
    },
    {
        name: "B1",
        cost: [2,0,0],
        points: 3,
        effectTiming: "P2",
        effectType: "May -1 res2, +2 res1",
        built: false
    },
    {
        name: "B2",
        cost: [3,0,1],
        points: 5,
        effectTiming: "P2",
        effectType: "May -1 res2, +2 res1",
        built: false
    },
    {
        name: "B3",
        cost: [3,1,2],
        points: 7,
        effectTiming: "P2",
        effectType: "May -1 res2, +2 res1",
        built: false
    },
    {
        name: "B4",
        cost: [5,0,3],
        points: 9,
        effectTiming: "P2",
        effectType: "May -1 res2, +2 res1",
        built: false
    },
    {
        name: "C1",
        cost: [1,1,0],
        points: 0,
        effectTiming: "P2",
        effectType: "May -1 res2, +2 res1",
        built: false
    },
    {
        name: "C2",
        cost: [2,2,0],
        points: 1,
        effectTiming: "P2",
        effectType: "May -1 res2, +2 res1",
        built: false
    },
    {
        name: "C3",
        cost: [2,3,1],
        points: 2,
        effectTiming: "P2",
        effectType: "May -1 res2, +2 res1",
        built: false
    },
    {
        name: "C4",
        cost: [3,1,2],
        points: 4,
        effectTiming: "P2",
        effectType: "May -1 res2, +2 res1",
        built: false
    },
    {
        name: "D1",
        cost: [1,0,1],
        points: 1,
        effectTiming: "P2",
        effectType: "May -1 res2, +2 res1",
        built: false
    },
    {
        name: "D2",
        cost: [1,2,0],
        points: 2,
        effectTiming: "P2",
        effectType: "May -1 res2, +2 res1",
        built: false
    },
    {
        name: "D3",
        cost: [2,2,1],
        points: 4,
        effectTiming: "P2",
        effectType: "May -1 res2, +2 res1",
        built: false
    },
    {
        name: "D4",
        cost: [3,2,2],
        points: 6,
        effectTiming: "P2",
        effectType: "May -1 res2, +2 res1",
        built: false
    },
    {
        name: "E1",
        cost: [2,0,0],
        points: 0,
        effectTiming: "P2",
        effectType: "May -1 res2, +2 res1",
        built: false
    },
    {
        name: "E2",
        cost: [1,1,1],
        points: 2,
        effectTiming: "P2",
        effectType: "May -1 res2, +2 res1",
        built: false
    },
    {
        name: "E3",
        cost: [2,0,2],
        points: 2,
        effectTiming: "P2",
        effectType: "May -1 res2, +2 res1",
        built: false
    },
    {
        name: "E4",
        cost: [3,0,2],
        points: 4,
        effectTiming: "P2",
        effectType: "May -1 res2, +2 res1",
        built: false
    },
    {
        name: "F1",
        cost: [1,0,0],
        points: 0,
        effectTiming: "P2",
        effectType: "May -1 res2, +2 res1",
        built: false
    },
    {
        name: "F2",
        cost: [1,0,1],
        points: 1,
        effectTiming: "P2",
        effectType: "May -1 res2, +2 res1",
        built: false
    },
    {
        name: "F3",
        cost: [2,1,1],
        points: 2,
        effectTiming: "P2",
        effectType: "May -1 res2, +2 res1",
        built: false
    },
    {
        name: "F4",
        cost: [2,2,2],
        points: 4,
        effectTiming: "P2",
        effectType: "May -1 res2, +2 res1",
        built: false
    },
    {
        name: "G1",
        cost: [0,0,1],
        points: 0,
        effectTiming: "P2",
        effectType: "May -1 res2, +2 res1",
        built: false
    },
    {
        name: "G2",
        cost: [1,1,0],
        points: 1,
        effectTiming: "P2",
        effectType: "May -1 res2, +2 res1",
        built: false
    },
    {
        name: "G3",
        cost: [1,2,0],
        points: 2,
        effectTiming: "P2",
        effectType: "May -1 res2, +2 res1",
        built: false
    },
    {
        name: "G4",
        cost: [2,1,1],
        points: 3,
        effectTiming: "P2",
        effectType: "May -1 res2, +2 res1",
        built: false
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
