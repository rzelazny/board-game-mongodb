// const $events = document.getElementById('events');

// const newItem = (content) => {
// 	const item = document.createElement('li');
// 	item.innerText = content;
// 	return item;
// };

const socket = io();

socket.on('connect', () => {
	//$events.appendChild(newItem('connect'));
	//TODO: enter chat message here
});

let counter = 0;
setInterval(() => {
	++counter;
	socket.emit('hey', { counter }); // the object will be serialized for you
}, 10000);

socket.on('connected', ({message}) => {
	console.log("message", message);
});


var curGame = document.defaultView.location.pathname.split("gameboard/").pop();
var curPlayer = "something";

//launch the game on click
$("#start-game").on("click", function (event) {
	console.log("Hit start button");
	socket.emit("start-game", curGame);
})

//resource choice made
$("#btn-choose-resource").on("click", function (event) {
	socket.emit("update-player", curPlayer)
})

