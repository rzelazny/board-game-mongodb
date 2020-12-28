$(document).ready(function () {

    // Create a new gaming table on click
    $("#newGame").on("click", function (event) {
        let newGameData = {
            name: "New Game",
            players: ["5fe7d983cdf2912048481cfd",
                "5fe7d983cdf2912048481cfe"],
            gameBoard: "5fe7d983cdf2912048481cff"
        }
        console.log(`Creating game`);
        fetch("/api/newGame/", {
            method: "POST",
            body: JSON.stringify(newGameData),
            headers: {
                Accept: "application/json, text/plain, */*",
                "Content-Type": "application/json"
            }
        })
        .then(response => {
            return response.json();
        })
        .then(data => {
            if (data.errors) {
                errorEl.textContent = "Missing Information";
            }
            else {
                console.log("Data: ", data);
                window.location.assign("/gameboard/" + data._id)
            }
        })
    })

});