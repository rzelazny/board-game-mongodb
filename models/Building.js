const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const buildingSchema = new Schema(
    {
        name: {
            type: String,
            trim: true,
        },
        column: {
            type: Number,
        },
        cost: [{
            resource1: Number,
            resource2: Number,
            resource3: Number,
        }],
        points: {
            type: Number,
        },
        effectTiming: {
            type: String,
            trim: true,
        },
        effectType: {
            type: String,
            trim: true,
        },
    }
);

const Building = mongoose.model("Building", buildingSchema);

module.exports = Building;
