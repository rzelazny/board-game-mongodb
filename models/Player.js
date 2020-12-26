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
    buildingBoard: [
        {
            type: Schema.Types.ObjectId,
            ref: "BuildingBoard"
        }
    ]
});

const Player = mongoose.model("Player", PlayerSchema);

module.exports = Player;
