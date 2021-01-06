let mongoose = require("mongoose");
let db = require("../models");

mongoose.connect("mongodb://localhost/boardgame", {
    useNewUrlParser: true,
    useFindAndModify: false
});

let advisorSetup = [
    {
        name: "Jester",
        number: 1,
        img: {
            url: "../assets/images/advisors/advisor1.png",
            alt: "Jester"
        },
        choice: [{
            option1: "VP",
            option2: "",
            option3: "",
            optNum: 1
        }],
    },
    {
        name: "Squire",
        number: 2,
        img: {
            url: "../assets/images/advisors/advisor2.png",
            alt: "Squire"
        },
        choice: [{
            option1: "res1",
            option2: "",
            option3: "",
            optNum: 1
        }],
    },
    {
        name: "Architect",
        number: 3,
        img: {
            url: "../assets/images/advisors/advisor3.png",
            alt: "Architect"
        },
        choice: [{
            option1: "res2",
            option2: "",
            option3: "",
            optNum: 1
        }],
    },
    {
        name: "Merchant",
        number: 4,
        img: {
            url: "../assets/images/advisors/advisor4.png",
            alt: "Merchant"
        },
        choice: [{
            option1: "res1",
            option2: "res2",
            option3: "",
            optNum: 2
        }],
    },
    {
        name: "Sergeant",
        number: 5,
        img: {
            url: "../assets/images/advisors/advisor5.png",
            alt: "Sergeant"
        },
        choice: [{
            option1: "str",
            option2: "",
            option3: "",
            optNum: 1
        }],
    },
    {
        name: "Alchemist",
        number: 6,
        img: {
            url: "../assets/images/advisors/advisor6.png",
            alt: "Alchemist"
        },
        choice: [{
            option1: "res1, arrow, res2, res3",
            option2: "res2, arrow, res1, res3",
            option3: "res3, arrow, res1, res2",
            optNum: 3
        }],
    },
    {
        name: "Astronomer",
        number: 7,
        img: {
            url: "../assets/images/advisors/advisor7.png",
            alt: "Astronomer"
        },
        choice: [{
            option1: "res1",
            option2: "res2",
            option3: "res3",
            optNum: 3
        },
        {
            option1: "2oken",
            option2: "",
            option3: "",
            optNum: 1
        }],
    },
    {
        name: "Treasurer",
        number: 8,
        img: {
            url: "../assets/images/advisors/advisor8.png",
            alt: "Treasurer"
        },
        choice: [{
            option1: "res1, res1",
            option2: "",
            option3: "",
            optNum: 1
        }],
    },
    {
        name: "Master Hunter",
        number: 9,
        img: {
            url: "../assets/images/advisors/advisor9.png",
            alt: "Master Hunter"
        },
        choice: [{
            option1: "res1, res2",
            option2: "res3, res2",
            option3: "",
            optNum: 2
        }],
    },
    {
        name: "General",
        number: 10,
        img: {
            url: "../assets/images/advisors/advisor10.png",
            alt: "General"
        },
        choice: [{
            option1: "str, str, enemy",
            option2: "",
            option3: "",
            optNum: 1
        }],
    },
    {
        name: "Swordsmith",
        number: 11,
        img: {
            url: "../assets/images/advisors/advisor11.png",
            alt: "Swordsmith"
        },
        choice: [{
            option1: "res3, res1",
            option2: "res3, res2",
            option3: "",
            optNum: 2
        }],
    },
    {
        name: "Duchess",
        number: 12,
        img: {
            url: "../assets/images/advisors/advisor12.png",
            alt: "Duchess"
        },
        choice: [{
            option1: "res1",
            option2: "res2",
            option3: "res3",
            optNum: 3
        },
        {
            option1: "res1",
            option2: "res2",
            option3: "res3",
            optNum: 3
        },
        {
            option1: "2token",
            option2: "",
            option3: "",
            optNum: 1
        }],
    },
    {
        name: "Champion",
        number: 13,
        img: {
            url: "../assets/images/advisors/advisor13.png",
            alt: "Champion"
        },
        choice: [{
            option1: "res3, res3, res3",
            option2: "",
            option3: "",
            optNum: 1
        }],
    },
    {
        name: "Smuggler",
        number: 14,
        img: {
            url: "../assets/images/advisors/advisor14.png",
            alt: "Smuggler"
        },
        choice: [{
            option1: "vp, arrow, res1",
            option2: "vp, arrow, res2",
            option3: "vp, arrow, res3",
            optNum: 3
        },
        {
            option1: "res1",
            option2: "res2",
            option3: "res3",
            optNum: 3
        },
        {
            option1: "res1",
            option2: "res2",
            option3: "res3",
            optNum: 3
        }],
    },
    {
        name: "Inventor",
        number: 15,
        img: {
            url: "../assets/images/advisors/advisor15.png",
            alt: "Inventor"
        },
        choice: [{
            option1: "res1, res2, res3",
            option2: "",
            option3: "",
            optNum: 1
        }],
    },
    {
        name: "Wizard",
        number: 16,
        img: {
            url: "../assets/images/advisors/advisor16.png",
            alt: "Wizard"
        },
        choice: [{
            option1: "res1, res1, res1, res1",
            option2: "",
            option3: "",
            optNum: 1
        }],
    },
    {
        name: "Queen",
        number: 17,
        img: {
            url: "../assets/images/advisors/advisor17.png",
            alt: "Queen"
        },
        choice: [{
            option1: "res1",
            option2: "res2",
            option3: "res3",
            optNum: 3
        },
        {
            option1: "res1",
            option2: "res2",
            option3: "res3",
            optNum: 3
        },
        {
            option1: "vp, vp, vp, enemy",
            option2: "",
            option3: "",
            optNum: 1
        }],
    },
    {
        name: "King",
        number: 18,
        img: {
            url: "../assets/images/advisors/advisor18.png",
            alt: "King"
        },
        choice: [{
            option1: "res1, res2, res3, str",
            option2: "",
            option3: "",
            optNum: 1
        }],
    },
];

db.Advisor.deleteMany({})
    .then(() => db.Advisor.collection.insertMany(advisorSetup))
    .then(data => {
        console.log(data.result.n + " records inserted!");
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
