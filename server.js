const express = require("express");
const http = require("http");
const path = require("path");
const socketIO = require("socket.io");
const pako = require("pako");
const base65536 = require("base65536");
const logtimestamp = require("log-timestamp");

const PORT = 80;

var app = express();
var server = http.Server(app);
var io = socketIO(server);

app.set('port', PORT);

app.use("/", express.static(__dirname + "/"));

server.listen(PORT, function () {
    console.log("Starting server on port " + PORT);
});

let Games = [
    // Game format example:
    // {
    //     id: "abc123", // ID of the game
    //     gameState: {
    //         // Game Obj (See polytopiachess.js)
    //     },
    //     numPlayers: 2, // The number of players in this game
    //     players: [null, "<user socket.id>"], 
    //                    // Player socket id. [0] is player 1, [1] is player 2 etc
    //     gameStarted: false // Has the game started yet?
    // }
];

// Util
const GamesGet = function (id) {
    for (const game of Games) {
        if (game.id === id)
            return game;
    }
    return null;
};

// New Socket IO connection
io.on("connection", function (socket) {
    // Log the connection
    console.log("New Connection [" + socket.id + "] Address: [" + socket.handshake.address + "]");
    
    // User Disconnect
    socket.on("disconnect", function (data) {
        console.log("User Disconnect [" + socket.id + "]");
        for (let g = 0; g < Games.length; g++) {
            let game = Games[g];
            let allDisconnect = true;
            for (let i = 0; i < game.numPlayers; i++) {
                if (game.players[i]) {
                    if (game.players[i] === socket.id) {
                        game.players[i] = null;
                        console.log("Removing [" + socket.id + "] from slot " + i + " of game [" + game.id + "]");
                    } else {
                        allDisconnect = false;
                    }
                }
            }
            if (allDisconnect) {
                console.log("All players have left game [" + game.id + "], deleting game");
                Games.splice(g, 1);
                g--;
            }
        }
    });

    socket.on("createReq", function (data) {
        let GameData = {};
        try {
            GameData = JSONUtil.unpack(data.gameCode);
        } catch (err) {
            console.error(err);
            socket.emit("err", {
                message: "Invalid Create Request"
            });
            return;
        }

        // Number of unique tribes
        const numPlayers = [...new Set(GameData.tribeOrder)].length;

        let players = [];
        for (let i = 0; i < numPlayers; i++) {
            players.push(null);
        }
        let newGame = {
            id: GenerateID(),
            gameState: GameData,
            numPlayers,
            players,
            gameStarted: false
        };
        Games.push(newGame);
        console.log("New game [" + newGame.id + "] created by [" + socket.id + "]");
        userJoinGame(newGame.id, true);
    });

    // User wishes to join game
    socket.on("joinReq", function (data) {
        let gameID = data.key;
        userJoinGame(gameID, false);
    });

    // User ends their turn, alerting everyone else
    socket.on("turn", function (data) {
        console.log("Turn completed for game [" + data.gameID + "] by [" + socket.id + "]");
        let game = GamesGet(data.gameID);
        // Verify that this is indeed the right turn
        if (game.players.indexOf(socket.id) === game.gameState.tribeToMove &&
            data.deltas && data.gameState) {
            game.gameState = JSONUtil.unpack(data.gameState);
            let deltas = JSONUtil.unpack(data.deltas);
            // Broadcast the turn to everyone
            let payload = {
                deltas: JSONUtil.pack(deltas),
                gameState: JSONUtil.pack(game.gameState),
                lastPlayerID: socket.id
            };
            for (const playerID of game.players) {
                io.to(playerID).emit("turn", payload);
            }
        }
    });

    function userJoinGame(gameID, gameHost) {
        let game = GamesGet(gameID);
        if (!game) {
            socket.emit("err", {
                message: "Invalid Join Key",
                key: gameID
            });
            return;
        }
        let connSlot = -1;
        for (let i = 0; i < game.numPlayers; i++) {
            if (!game.players[i]) {
                game.players[i] = socket.id;
                connSlot = i;
                break;
            }
        }
        if (connSlot === -1) {
            socket.emit("err", {
                message: "Game Full"
            });
        } else {
            console.log("User [" + socket.id + "] joined game [" + gameID + "] at slot " + connSlot);
            let data = {
                gameInitSetup: JSONUtil.pack(game.gameState),
                playerNum: connSlot,
                gameID,
                gameHost
            };
            socket.emit("joinGame", data);
            // Start the game if everyone is connected  (no more null values)
            let allPlayers = true;
            for (const player of game.players) {
                if (!player) {
                    allPlayers = false;
                    break;
                }
            }
            if (allPlayers) {
                setTimeout(gameStart, 1000, gameID);
            }
        }
    }

    // Start the game when everyone is done
    function gameStart(gameID) {
        console.log("Starting game [" + gameID + "]");
        let game = GamesGet(gameID);
        game.gameStarted = true;
        for (const playerID of game.players) {
            io.to(playerID).emit("gameStart");
        }
    }
});

// Generate an unused 8-digit ID
function GenerateID() {
    const MINID = 0;
    const MAXID = 99999999;

    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    let id = "";
    while (id === "") {
        id = (getRandomInt(MINID, MAXID) + "").padStart(4, "0");
        // Make sure it's not in use
        for (const game of Games) {
            if (game.id === id) {
                id = "";
                break;
            }
        }
    }

    return id;
}

// const JSONUtil = {
//     pack: function (data) {
//         return base65536.encode(pako.inflate(JSON.stringify(data)));
//     },

//     unpack: function (str) {
//         console.log("Unpacking ", str);
//         let baseDecoded = base65536.decode(str);
//         console.log("Deflating ", baseDecoded);
//         let pakoInflated = pako.deflate(baseDecoded, {to: "string"});
//         console.log("Parsing ", pakoInflated);
//         return JSON.parse(pakoInflated);
//     }
// };

// Use pako and base65536 to compress the file
// Kinda extra but why not
const JSONUtil = {
    pack: function (data) {
        return base65536.encode(pako.deflate(JSON.stringify(data)));
    },

    unpack: function (str) {
        return JSON.parse(pako.inflate(base65536.decode(str), {
            "to": "string"
        }));
    }
};
