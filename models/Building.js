const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const buildingSchema = new Schema(
    {
        name: {
            type: String,
            trim: true,
        },
        row: {
            type: Number,
        },
        cost: [
            Number, Number, Number
        ],
        points: {
            type: Number,
        },
        effectTiming: {
            type: String,
            trim: true,
        },
        effect: {
            type: String,
            trim: true,
        },
        choiceType: {
            type: String,
            trim: true,
        }
    }
);

const Building = mongoose.model("Building", buildingSchema);

module.exports = Building;
