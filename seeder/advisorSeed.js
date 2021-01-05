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
            url: "../assets/images/advisors/adv1",
            alt: "Jester"
        },
        choice1:{
            option1: "VP",
            option2: "",
            option3: "",
            optNum: 1
        },
        choice2:{
            option1: "",
            option2: "",
            option3: "",
            optNum: 0
        },
        choice3:{
            option1: "",
            option2: "",
            option3: "",
            optNum: 0
        },
    },
    {
        name: "Squire",
        number: 2,
        img: {
            url: "../assets/images/advisors/adv2",
            alt: "Squire"
        },
        choice1:{
            option1: "res1",
            option2: "",
            option3: "",
            optNum: 1
        },
        choice2:{
            option1: "",
            option2: "",
            option3: "",
            optNum: 0
        },
        choice3:{
            option1: "",
            option2: "",
            option3: "",
            optNum: 0
        },
    },
    {
        name: "Architect",
        number: 3,
        img: {
            url: "../assets/images/advisors/adv3",
            alt: "Architect"
        },
        choice1:{
            option1: "res2",
            option2: "",
            option3: "",
            optNum: 1
        },
        choice2:{
            option1: "",
            option2: "",
            option3: "",
            optNum: 0
        },
        choice3:{
            option1: "",
            option2: "",
            option3: "",
            optNum: 0
        },
    },
    {
        name: "Merchant",
        number: 4,
        img: {
            url: "../assets/images/advisors/adv4",
            alt: "Merchant"
        },
        choice1:{
            option1: "res1",
            option2: "res2",
            option3: "",
            optNum: 2
        },
        choice2:{
            option1: "",
            option2: "",
            option3: "",
            optNum: 0
        },
        choice3:{
            option1: "",
            option2: "",
            option3: "",
            optNum: 0
        },
    },
    {
        name: "Sergeant",
        number: 5,
        img: {
            url: "../assets/images/advisors/adv5",
            alt: "Sergeant"
        },
        choice1:{
            option1: "str",
            option2: "",
            option3: "",
            optNum: 1
        },
        choice2:{
            option1: "",
            option2: "",
            option3: "",
            optNum: 0
        },
        choice3:{
            option1: "",
            option2: "",
            option3: "",
            optNum: 0
        },
    },
    {
        name: "Alchemist",
        number: 6,
        img: {
            url: "../assets/images/advisors/adv6",
            alt: "Alchemist"
        },
        choice1:{
            option1: "res1, arrow, res2, res3",
            option2: "res2, arrow, res1, res3",
            option3: "res3, arrow, res1, res2",
            optNum: 3
        },
        choice2:{
            option1: "",
            option2: "",
            option3: "",
            optNum: 0
        },
        choice3:{
            option1: "",
            option2: "",
            option3: "",
            optNum: 0
        },
    },
    {
        name: "Astronomer",
        number: 7,
        img: {
            url: "../assets/images/advisors/adv7",
            alt: "Astronomer"
        },
        choice1:{
            option1: "res1",
            option2: "res2",
            option3: "res3",
            optNum: 3
        },
        choice2:{
            option1: "2oken",
            option2: "",
            option3: "",
            optNum: 1
        },
        choice3:{
            option1: "",
            option2: "",
            option3: "",
            optNum: 0
        },
    },
    {
        name: "Treasurer",
        number: 8,
        img: {
            url: "../assets/images/advisors/adv8",
            alt: "Treasurer"
        },
        choice1:{
            option1: "res1, res1",
            option2: "",
            option3: "",
            optNum: 1
        },
        choice2:{
            option1: "",
            option2: "",
            option3: "",
            optNum: 0
        },
        choice3:{
            option1: "",
            option2: "",
            option3: "",
            optNum: 0
        },
    },
    {
        name: "Master Hunter",
        number: 9,
        img: {
            url: "../assets/images/advisors/adv9",
            alt: "Master Hunter"
        },
        choice1:{
            option1: "res1, res2",
            option2: "res3, res2",
            option3: "",
            optNum: 2
        },
        choice2:{
            option1: "",
            option2: "",
            option3: "",
            optNum: 0
        },
        choice3:{
            option1: "",
            option2: "",
            option3: "",
            optNum: 0
        },
    },
    {
        name: "General",
        number: 10,
        img: {
            url: "../assets/images/advisors/adv10",
            alt: "General"
        },
        choice1:{
            option1: "str, str, enemy",
            option2: "",
            option3: "",
            optNum: 1
        },
        choice2:{
            option1: "",
            option2: "",
            option3: "",
            optNum: 0
        },
        choice3:{
            option1: "",
            option2: "",
            option3: "",
            optNum: 0
        },
    },
    {
        name: "Swordsmith",
        number: 11,
        img: {
            url: "../assets/images/advisors/adv11",
            alt: "Swordsmith"
        },
        choice1:{
            option1: "res3, res1",
            option2: "res3, res2",
            option3: "",
            optNum: 2
        },
        choice2:{
            option1: "",
            option2: "",
            option3: "",
            optNum: 0
        },
        choice3:{
            option1: "",
            option2: "",
            option3: "",
            optNum: 0
        },
    },
    {
        name: "Duchess",
        number: 12,
        img: {
            url: "../assets/images/advisors/adv12",
            alt: "Duchess"
        },
        choice1:{
            option1: "res1",
            option2: "res2",
            option3: "res3",
            optNum: 3
        },
        choice2:{
            option1: "res1",
            option2: "res2",
            option3: "res3",
            optNum: 3
        },
        choice3:{
            option1: "2token",
            option2: "",
            option3: "",
            optNum: 1
        },
    },
    {
        name: "Champion",
        number: 13,
        img: {
            url: "../assets/images/advisors/adv13",
            alt: "Champion"
        },
        choice1:{
            option1: "res3, res3, res3",
            option2: "",
            option3: "",
            optNum: 1
        },
        choice2:{
            option1: "",
            option2: "",
            option3: "",
            optNum: 0
        },
        choice3:{
            option1: "",
            option2: "",
            option3: "",
            optNum: 0
        },
    },
    {
        name: "Smuggler",
        number: 14,
        img: {
            url: "../assets/images/advisors/adv14",
            alt: "Smuggler"
        },
        choice1:{
            option1: "vp, arrow, res1",
            option2: "vp, arrow, res2",
            option3: "vp, arrow, res3",
            optNum: 3
        },
        choice2:{
            option1: "vp, arrow, res1",
            option2: "vp, arrow, res2",
            option3: "vp, arrow, res3",
            optNum: 3
        },
        choice3:{
            option1: "vp, arrow, res1",
            option2: "vp, arrow, res2",
            option3: "vp, arrow, res3",
            optNum: 3
        },
    },
    {
        name: "Inventor",
        number: 15,
        img: {
            url: "../assets/images/advisors/adv15",
            alt: "Inventor"
        },
        choice1:{
            option1: "res1, res2, res3",
            option2: "",
            option3: "",
            optNum: 1
        },
        choice2:{
            option1: "",
            option2: "",
            option3: "",
            optNum: 0
        },
        choice3:{
            option1: "",
            option2: "",
            option3: "",
            optNum: 0
        },
    },
    {
        name: "Wizard",
        number: 16,
        img: {
            url: "../assets/images/advisors/adv16",
            alt: "Wizard"
        },
        choice1:{
            option1: "res1, res1, res1, res1",
            option2: "",
            option3: "",
            optNum: 1
        },
        choice2:{
            option1: "",
            option2: "",
            option3: "",
            optNum: 0
        },
        choice3:{
            option1: "",
            option2: "",
            option3: "",
            optNum: 0
        },
    },
    {
        name: "Queen",
        number: 17,
        img: {
            url: "../assets/images/advisors/adv17",
            alt: "Queen"
        },
        choice1:{
            option1: "res1",
            option2: "res2",
            option3: "res3",
            optNum: 3
        },
        choice2:{
            option1: "res1",
            option2: "res2",
            option3: "res3",
            optNum: 3
        },
        choice3:{
            option1: "vp, vp, vp, enemy",
            option2: "",
            option3: "",
            optNum: 1
        },
    },
    {
        name: "King",
        number: 18,
        img: {
            url: "../assets/images/advisors/adv18",
            alt: "King"
        },
        choice1:{
            option1: "res1, res2, res3, str",
            option2: "",
            option3: "",
            optNum: 1
        },
        choice2:{
            option1: "",
            option2: "",
            option3: "",
            optNum: 0
        },
        choice3:{
            option1: "",
            option2: "",
            option3: "",
            optNum: 0
        },
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
