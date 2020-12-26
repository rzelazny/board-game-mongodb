const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const buildingRowSchema = new Schema(
    {
        col1: [
            {
                type: Schema.Types.ObjectId,
                ref: "Building"
            }
        ],
        col2: [
            {
                type: Schema.Types.ObjectId,
                ref: "Building"
            }
        ],
        col3: [
            {
                type: Schema.Types.ObjectId,
                ref: "Building"
            }
        ],
        col4: [
            {
                type: Schema.Types.ObjectId,
                ref: "Building"
            }
        ],
    }
);

const BuildingRow = mongoose.model("BuildingRow", buildingRowSchema);

module.exports = BuildingRow;
