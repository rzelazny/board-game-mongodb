const socket = io();

var curGame = document.defaultView.location.pathname.split("gameboard/").pop();

socket.on('connect', () => {
	//TODO: enter chat message here
});

//launch the game on click
$("#start-game").on("click", function (event) {
	socket.emit("start-game", curGame)
})



// let counter = 0;
// setInterval(() => {
// 	++counter;
// 	socket.emit('hey', { counter }); // the object will be serialized for you
// }, 10000);


