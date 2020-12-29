const $events = document.getElementById('events');

const newItem = (content) => {
	const item = document.createElement('li');
	item.innerText = content;
	return item;
};

const socket = io();

socket.on('connect', () => {
	$events.appendChild(newItem('connect'));
});

let counter = 0;
setInterval(() => {
	++counter;
	socket.emit('hey', { counter }); // the object will be serialized for you
}, 1000);

//websocket connection
// const ws = new WebSocket('ws://localhost:3000/');
//         ws.onopen = function () {
//             console.log('WebSocket Client Connected');
//             ws.send('Hi this is web client.');
//         };
//         ws.onmessage = function (e) {
//             console.log("Received: '" + e.data + "'");
//         };
