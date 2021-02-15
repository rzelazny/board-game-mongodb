let mongoose = require("mongoose");
let db = require("../models");

mongoose.connect("mongodb://localhost/boardgame", {
    useNewUrlParser: true,
    useFindAndModify: false
});

let buildingSetup = [
    {
        name: "Sawmill",
        row: 1,
        cost: [0,2,1],
        points: 1,
        strength: 0,
        combatBonus: "N/A",
        effectTiming: "Summer",
        effect: "may spend res2 arrow res1 res1",
        choiceType: "YN"
    },
    {
        name: "Quarry",
        row: 2,
        cost: [1,1,2],
        points: 2,
        strength: 0,
        combatBonus: "N/A",
        effectTiming: "Summer",
        effect: "may spend res3 arrow res1 res1 res1",
        choiceType: "YN"
    },
    {
        name: "GoldSmith",
        row: 3,
        cost: [2,2,2],
        points: 3,
        strength: 0,
        combatBonus: "N/A",
        effectTiming: "Summer",
        effect: "may spend res1 arrow str, vp",
        choiceType: "YN"
    },
    {
        name: "Mint",
        row: 4,
        cost: [6,1,1],
        points: 5,
        strength: 0,
        combatBonus: "N/A",
        effectTiming: "Spring and Autumn",
        effect: "may use Sawmill, Quarry, and Goldsmith",
        choiceType: ""
    },
    {
        name: "Statue",
        row: 1,
        cost: [2,0,0],
        points: 3,
        strength: 0,
        combatBonus: "N/A",
        effectTiming: "Productive Seasons",
        effect: "may reroll a die if all die match",
        choiceType: "Dice"
    },
    {
        name: "Chapel",
        row: 2,
        cost: [3,0,1],
        points: 5,
        strength: 0,
        combatBonus: "N/A",
        effectTiming: "Productive Seasons",
        effect: "if dice total <8 may reroll all dice",
        choiceType: "Dice YN"
    },
    {
        name: "Church",
        row: 3,
        cost: [3,1,2],
        points: 7,
        strength: 0,
        combatBonus: "Demons",
        effectTiming: "Combat",
        effect: "+1 str vs Demons",
        choiceType: ""
    },
    {
        name: "Cathedral",
        row: 4,
        cost: [5,0,3],
        points: 9,
        strength: 0,
        combatBonus: "N/A",
        effectTiming: "End of Game",
        effect: "+1 vp per 2 goods left",
        choiceType: ""
    },
    {
        name: "Inn",
        row: 1,
        cost: [1,1,0],
        points: 0,
        strength: 0,
        combatBonus: "N/A",
        effectTiming: "Summer",
        effect: "+1 2token",
        choiceType: "YN"
    },
    {
        name: "Market",
        row: 2,
        cost: [2,2,0],
        points: 1,
        strength: 0,
        combatBonus: "N/A",
        effectTiming: "Productive Seasons",
        effect: "may adjust dice total by +-1",
        choiceType: ""
    },
    {
        name: "Farms",
        row: 3,
        cost: [2,3,1],
        points: 2,
        strength: -1,
        combatBonus: "N/A",
        effectTiming: "Productive Seasons",
        effect: "gain a bonus die, but lose 1 str during Combat",
        choiceType: ""
    },
    {
        name: "Merchants' Guild",
        row: 4,
        cost: [3,1,2],
        points: 4,
        strength: 0,
        combatBonus: "N/A",
        effectTiming: "Productive Seasons",
        effect: "+1 res1",
        choiceType: ""
    },
    {
        name: "Guard Tower",
        row: 1,
        cost: [1,0,1],
        points: 1,
        strength: 1,
        combatBonus: "N/A",
        effectTiming: "Combat",
        effect: "+1 str",
        choiceType: ""
    },
    {
        name: "Blacksmith",
        row: 2,
        cost: [1,2,0],
        points: 2,
        strength: 1,
        combatBonus: "N/A",
        effectTiming: "Combat",
        effect: "+1 str",
        choiceType: ""
    },
    {
        name: "Barracks",
        row: 3,
        cost: [2,2,1],
        points: 4,
        strength: 0,
        combatBonus: "N/A",
        effectTiming: "Rally",
        effect: "recruit cost is only 1 good",
        choiceType: ""
    },
    {
        name: "Wizards' Guild",
        row: 4,
        cost: [3,2,2],
        points: 6,
        strength: 2,
        combatBonus: "N/A",
        effectTiming: "Combat",
        effect: "+2 str",
        choiceType: ""
    },
    {
        name: "Palisade",
        row: 1,
        cost: [2,0,0],
        points: 0,
        strength: 1,
        combatBonus: "Zombies",
        effectTiming: "Combat",
        effect: "+1 str, +2 vs Zombies",
        choiceType: ""
    },
    {
        name: "Stable",
        row: 2,
        cost: [1,1,1],
        points: 2,
        strength: 0,
        combatBonus: "N/A",
        effectTiming: "Productive Seasons",
        effect: "+1 str when gaining str from an advisor",
        choiceType: ""
    },
    {
        name: "Stone Wall",
        row: 3,
        cost: [2,0,2],
        points: 2,
        strength: 1,
        combatBonus: "N/A",
        effectTiming: "Combat",
        effect: "+1 str, you also win combat ties",
        choiceType: ""
    },
    {
        name: "Fortress",
        row: 4,
        cost: [3,0,2],
        points: 4,
        strength: 1,
        combatBonus: "N/A",
        effectTiming: "Combat",
        effect: "+1 str, +1 vp for combat victory",
        choiceType: ""
    },
    {
        name: "Barricade",
        row: 1,
        cost: [1,0,0],
        points: 0,
        strength: 0,
        combatBonus: "Goblins",
        effectTiming: "Combat",
        effect: "+1 str vs Goblins",
        choiceType: ""
    },
    {
        name: "Crane",
        row: 2,
        cost: [1,0,1],
        points: 1,
        strength: 0,
        combatBonus: "N/A",
        effectTiming: "Productive Seasons",
        effect: "row 3 and 4 buildings cost 1 less res1",
        choiceType: ""
    },
    {
        name: "Town Hall",
        row: 3,
        cost: [2,1,1],
        points: 2,
        strength: 0,
        combatBonus: "N/A",
        effectTiming: "Productive Seasons",
        effect: "may spend resAny / 2token arrow vp",
        choiceType: "Resource"
    },
    {
        name: "Embassy",
        row: 4,
        cost: [2,2,2],
        points: 4,
        strength: 0,
        combatBonus: "N/A",
        effectTiming: "Productive Seasons",
        effect: "+1 vp",
        choiceType: ""
    },
    {
        name: "Improvised Defenses",
        row: 1,
        cost: [0,0,1],
        points: 0,
        strength: 0,
        combatBonus: "Str<6",
        effectTiming: "Combat",
        effect: "+1 str vs Enemies with <6 Strength",
        choiceType: ""
    },
    {
        name: "Recruiting Center",
        row: 2,
        cost: [1,1,0],
        points: 1,
        strength: 0,
        combatBonus: "N/A",
        effectTiming: "Rally",
        effect: "may spend 2token to recruit",
        choiceType: ""
    },
    {
        name: "Training Camp",
        row: 3,
        cost: [1,2,0],
        points: 2,
        strength: 0,
        combatBonus: "N/A",
        effectTiming: "Rally",
        effect: "if str <2 then +1 str",
        choiceType: ""
    },
    {
        name: "Military Academy",
        row: 4,
        cost: [2,1,1],
        points: 3,
        strength: 0,
        combatBonus: "N/A",
        effectTiming: "Combat",
        effect: "roll a die. May use it instead of reinforcements in combat",
        choiceType: "Recruit YN"
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
