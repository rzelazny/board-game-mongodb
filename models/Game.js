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
        nextEnemy: {
            name: String,
            power: Number,
            penalty: String,
            reward: String
        },
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
        },
        roomNumber: {
            type: Number,
            default: function(){
                return Math.floor(Math.random()*10000);
            }
        }
    }
);

const Game = mongoose.model("Game", gameSchema);

module.exports = Game;
