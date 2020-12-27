const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const gameSchema = new Schema(
    {
        name: {
            type: String,
            trim: true,
            required: "Enter a name for the game"
        },
        players: [
            {
                type: Schema.Types.ObjectId,
                ref: "Player"
            }
        ],
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

const Game = mongoose.model("Game", gameSchema);

module.exports = Game;
