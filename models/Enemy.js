const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const EnemySchema = new Schema({
    name: {
        type: String,
    },
    round: {
        type: Number,
    },
    penalty: {
        type: String,
    },
    reward: [{
        type: String,
    }],
});

const Enemy = mongoose.model("Enemy", EnemySchema);

module.exports = Enemy;
