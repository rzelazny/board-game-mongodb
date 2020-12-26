const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const buildingSchema = new Schema(
    {
        name: {
            type: String,
            trim: true,
        },
        cost: {
            type: String,
            trim: true,
        },
        points: {
            type: String,
            trim: true,
        },
        effect: {
            type: String,
            trim: true,
        },
        built: {
            type: Boolean,
            default: false,
        }
    }
);

const Building = mongoose.model("Building", buildingSchema);

module.exports = Building;
