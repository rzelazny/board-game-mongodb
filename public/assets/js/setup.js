$(document).ready(function () {

    function init() {
        getTables();
    }

    init();

    //get the gaming tables that already exist and display them
    function getTables() {
        $.get("api/allgames", function (curGames) {

            for (i = 0; i < curGames.length; i++) {
                var columnCount = i;
                var card = $("<div>").addClass("card game-table");
                var cardBody = $("<div>").addClass("card-body");
                cardBody.attr("id", "resultCardBody");

                //create stats to append
                var id = $("<h4>").addClass("card-text").text("Table: " + curGames[i].name);

                let userNameArray = ["Open Seat", "Open Seat", "Open Seat", "Open Seat", "Open Seat"]
                for (let j = 0; j < curGames[i].players.length; j++) {
                    userNameArray[j] = curGames[i].players[j].name
                }

                var user1 = $("<p>").addClass("card-text").text("Player 1: " + userNameArray[0]);
                var user2 = $("<p>").addClass("card-text").text("Player 2: " + userNameArray[1]);
                var user3 = $("<p>").addClass("card-text").text("Player 3: " + userNameArray[2]);
                var user4 = $("<p>").addClass("card-text").text("Player 4: " + userNameArray[3]);
                var user5 = $("<p>").addClass("card-text").text("Player 5: " + userNameArray[4]);

                var joinBtn = $('<button/>', {
                    text: "Join Table",
                    id: "btnJoin",
                    table: curGames[i]._id,
                    click: joinTable
                })
                //append stats to the card
                cardBody.append(id, user1, user2, user3, user4, user5, joinBtn);
                card.append(cardBody);

                //there are 3 columns we append in sequence, the 4th table should be in the first column again.
                while (columnCount > 2) {
                    columnCount -= 3;
                }

                //append card to the correct column on the homepage
                $("#current-games" + columnCount).append(card);
            };
        });
    }

    //function lets user join an existing table
    function joinTable() {
        let tableId = $(this).attr("table")
        //let newMessage = {};
        //let openSeat = ""
        //$.get("/api/gameState/" + tableId).then( function(tableData){
        //make sure there's room at the table
        // if(tableData[0].players[0] === "Open Seat"){
        //     openSeat = "user1";
        // }else if(tableData[0].players[1] === "Open Seat"){
        //     openSeat = "user2";
        // }else if(tableData[0].players[2] === "Open Seat"){
        //     openSeat = "user3";
        // }else if(tableData[0].players[3] === "Open Seat"){
        //     openSeat = "user4";
        // }else if(tableData[0].players[4] === "Open Seat"){
        //     openSeat = "user5";
        // }else{
        //     //if the table is full refresh the page, it shouldn't show up as available anymore
        //     location.reload();
        //     return
        // }
        // $.get("/api/user_data", function(userData){
        //     let tableUpdate = {
        //         column: openSeat,
        //         data: userData.email
        //     }
        //     //update the table with the new user
        //     $.post("/api/table"+ tableId, tableUpdate).then(function(){
        //         //post message that player has joined the table
        //         newMessage = {
        //             message: " has entered chat.",
        //             table: tableId
        //         }
        //         //post the joining chat message
        //         $.post("/api/chat/", newMessage, function(){
        //             //join the table
        window.location.assign("/gameboard/" + tableId);
        //});
        //})
        //})
        //})
    }

    // Create a new game on click
    $("#new-game").on("click", async function (event) {

        //get the buildings we'll be using for this game, TODO: also allow variable advisors promise.all
        const response = await fetch("/api/buildingData/", {
            method: "GET",
            headers: {
                Accept: "application/json, text/plain, */*",
                "Content-Type": "application/json"
            }
        })
        if (!response.ok) { //check for fetch error
            const message = `An error has occured: ${response.status}`;
            throw new Error(message);
        }
        else {
            const buildings = await response.json()
            console.log(buildings);
            let newGameData = {
                name: "New Game",
                buildings: buildings
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
        }
    })
});