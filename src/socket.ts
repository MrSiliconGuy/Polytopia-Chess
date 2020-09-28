import { server } from "./server";
import SocketIO, { Socket } from "socket.io";
import { Game } from "./interfaces/game";

import { pack, unpack } from "./utils/JSONUtil";
import { getGame, joinGame, startGame, createGame } from "./utils/gameUtils";
import { GameState } from "./enums/gameState";

const sio = SocketIO(server);

let games: Game[];

const maxNumberOfPlayers = 4;

sio.on("connection", function (socket: Socket) {
    console.log(`New connection [${socket.id}], Address: [${socket.handshake.address}]`);

    socket.on("disconnect", function () {
        console.log(`User disconnected [${socket.id}]`);
        for (let game of games) {
            for (let user of game.players) {
                if (user == socket.id) {
                    game.gameState = GameState.ended;
                }
            }
        }
    });

    socket.on("create", async function (data) {
        let gameCode = data.gameCode;
        try {
            let gameData = unpack(gameCode);
            await createGame(socket.id);
        } catch (error) {
            console.log(error.message);
            socket.emit("err", {
                message: "Invalid Create Request",
            });
        }
    });

    socket.on("join", async function (data) {
        let gameId = data.key;
        try {
            let game = await joinGame(socket.id, gameId);
            if (game.players.length == 10) {
                socket.emit("err", {
                    message: "Game Full",
                });
            } else {
                console.log(`User [${socket.id}] joined game [${gameId}]`);
            }
        } catch (error) {
            socket.emit("err", {
                message: "Invalid Join Key",
                key: gameId,
            });
        }
    });

    socket.on("start", async function (data) {
        let gameId = data.key;
        try {
            let game = await startGame(gameId);
            for (let player of game.players) {
                sio.to(player).emit("gameStart");
            }
            if (game.players.length == maxNumberOfPlayers) {
                socket.emit("err", {
                    message: "Game Full",
                });
            } else {
                console.log(`Game [${gameId}] started`);
            }
        } catch (e) {
            socket.emit("err", {
                message: "Invalid Join Key",
                key: gameId,
            });
        }
    });

    socket.on("turn", async function (data) {
        console.log("Turn completed for game [" + data.gameID + "] by [" + socket.id + "]");
        let gameId = data.gameID;
        try {
            let game = await getGame(gameId);
            // TODO: Verify that this is indeed the right turn
            if (data.deltas && data.gameState) {
                game.gameState = unpack(data.gameState);
                let deltas = unpack(data.deltas);
                let payload = {
                    deltas: pack(deltas),
                    gameState: pack(game.gameState),
                    lastPlayerId: socket.id,
                };
                for (const playerId of game.players) {
                    sio.to(playerId).emit("turn", payload);
                }
            }
        } catch (error) {
            socket.emit("err", {
                message: "Invalid Join Key",
                key: gameId,
            });
        }
    });
});
