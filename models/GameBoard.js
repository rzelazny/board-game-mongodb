const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const gameBoardSchema = new Schema(
    {
        turnOrder: [
            {
                type: Number
            }
        ],
        nextEnemy: {
            name: String,
            power: Number,
            penalty: String,
            reward: String
        }
    }
);

const GameBoard = mongoose.model("GameBoard", gameBoardSchema);

module.exports = GameBoard;
