const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const gameBoardSchema = new Schema(
    {
        name: {
            type: String,
            trim: true,
            required: "Enter a name for the game"
        },
        players: {
            type: String,
            required: true
        },
        gameBoard: [
            {
                type: Schema.Types.ObjectId,
                ref: "GameBoard"
            }
        ],
        curPlayer: {
            type: Number,
            default: 1
        },
        curRound: {
            type: Number,
            default: 1
        },
        curPhase: {
            type: Number,
            default: 1
        }
    }
);

const GameBoard = mongoose.model("GameBoard", gameBoardSchema);

module.exports = GameBoard;
