const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const buildingSchema = new Schema(
    {
        name: {
            type: String,
            trim: true,
        },
        cost: [{
            name: resource1,
            type: Number,
        },
        {
            name: resource2,
            type: Number,
        },
        {
            name: resource3,
            type: Number,
        }],
        points: {
            type: String,
            trim: true,
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
