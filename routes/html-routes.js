const router = require("express").Router();
var path = require("path");

//go home, default path
router.get("/", function(req, res) {
    console.log("html get home");
    res.sendFile(path.join(__dirname, "../public/index.html"));
});

//go to the main boardgame page
router.get("/gameboard", function(req, res) {
    console.log("html get gameBoard");
    res.sendFile(path.join(__dirname, "../public/gameboard.html"));
});

//go to for game setup page
router.get("/setup", function(req, res) {
    console.log("html get setup");
    res.sendFile(path.join(__dirname, "../public/setup.html"));
});

module.exports = router;