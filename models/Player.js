const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const PlayerSchema = new Schema({
    name: {
        type: String,
        unique: true
    },
    score: {
        type: Number,
        default: 0
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
