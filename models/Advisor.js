const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const AdvisorSchema = new Schema({
    name: {
        type: String,
    },
    number: {
        type: Number,
    },
    img: {
        url: String,
        alt: String
    },
    choice1: {
        option1: String,
        option2: String,
        option3: String,
        optNum: Number
    },
    choice2: {
        option1: String,
        option2: String,
        option3: String,
        optNum: Number
        
    },
    choice3: {
        option1: String,
        option2: String,
        option3: String,
        optNum: Number
    },
});

const Advisor = mongoose.model("Advisor", AdvisorSchema);

module.exports = Advisor;
