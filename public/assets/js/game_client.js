$(document).ready(function () {
	var curGame = document.defaultView.location.pathname.split("gameboard/").pop();

	const socket = io();

	// const $events = document.getElementById('events');

	// const newItem = (content) => {
	// 	const item = document.createElement('li');
	// 	item.innerText = content;
	// 	return item;
	// };


	socket.on('connect', () => {
		$.get("/api/user_data")
		.then(function(userData){
			console.log("User Data: ", userData);
			let userName = {
				name: userData.email
			}
			$.post("/api/newPlayer", userName)
			.then(function(newPlayer){
				console.log("New Player", newPlayer);
				addPlayer(curGame, newPlayer._id);
			})
		})
		

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




	//launch the game on click
	$("#start-game").on("click", function (event) {
		console.log("Hit start button");
		socket.emit("start-game", curGame);
	})

	//resource choice made
	$("#btn-choose-resource").on("click", function (event) {
		socket.emit("update-player", curPlayer)
	})
});
