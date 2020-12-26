const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const buildingBoardSchema = new Schema(
    {
        row1: [
            {
                type: Schema.Types.ObjectId,
                ref: "BuildingRow"
            }
        ],
        row2: [
            {
                type: Schema.Types.ObjectId,
                ref: "BuildingRow"
            }
        ],
        row3: [
            {
                type: Schema.Types.ObjectId,
                ref: "BuildingRow"
            }
        ],
        row4: [
            {
                type: Schema.Types.ObjectId,
                ref: "BuildingRow"
            }
        ],
        row5: [
            {
                type: Schema.Types.ObjectId,
                ref: "BuildingRow"
            }
        ],
        row6: [
            {
                type: Schema.Types.ObjectId,
                ref: "BuildingRow"
            }
        ],
        row7: [
            {
                type: Schema.Types.ObjectId,
                ref: "BuildingRow"
            }
        ]
    }
);

const BuildingBoard = mongoose.model("BuildingBoard", buildingBoardSchema);

module.exports = BuildingBoard;
