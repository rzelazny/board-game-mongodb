const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const EnemySchema = new Schema({
    name: String,
    round: Number,
    strength: Number,
    penalty: String,
    reward: String,
});

const Enemy = mongoose.model("Enemy", EnemySchema);

module.exports = Enemy;
