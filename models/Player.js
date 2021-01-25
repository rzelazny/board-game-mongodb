const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PlayerSchema = new Schema({
    name: {
        type: String,
    },
    socket: {
        type: String,
        default: ""
    },
    color: {
        type: String,
        default: "blue"
    },
    turnOrder:{
        type: Number,
    },
    dice:[],
    score: {
        type: Number,
        default: 0
    },
    resource1: {
        type: Number,
        default: 0
    },
    resource2: {
        type: Number,
        default: 0
    },
    resource3: {
        type: Number,
        default: 0
    },
    twoToken: {
        type: Number,
        default: 0
    },
    strength: {
        type: Number,
        default: 0
    },
    hasBonus: {
        type: Boolean,
        default: false
    },
    constructedBuildings: [
        {
            type: Schema.Types.ObjectId,
            ref: "Building"
        }
    ]
});

const Player = mongoose.model("Player", PlayerSchema);

module.exports = Player;
