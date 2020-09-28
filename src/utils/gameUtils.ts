import { Game } from "../interfaces/game";
import { GameState } from "../enums/gameState";

let games: Game[];

export function generateId(): string {
    const minId = 0;
    const maxId = 99999999;

    let id = "";
    while (id === "") {
        id = (getRandomInt(minId, maxId) + "").padStart(4, "0");
        for (const game of games) {
            if (game.id === id) {
                id = "";
                break;
            }
        }
    }

    return id;
}

export function getGame(id: string): Promise<Game> {
    return new Promise<Game>((resolve, reject) => {
        for (const game of games) {
            if (game.id === id) {
                resolve(game);
            }
        }
        reject(null);
    });
}

export async function startGame(gameId: string) {
    return new Promise<Game>(async (resolve, reject) => {
        try {
            let game = await getGame(gameId);
            game.gameState = GameState.stated;
        } catch (error) {
            reject(error);
        }
    });
}

export async function joinGame(user: string, gameId: string): Promise<Game> {
    return new Promise<Game>(async (resolve, reject) => {
        try {
            let game = await getGame(gameId);
            game.players.push(user);
            return game;
        } catch (error) {
            reject(error);
        }
    });
}

export function createGame(user: string): Promise<Game> {
    return new Promise<Game>(async (resolve, reject) => {
        let game: Game = {
            gameState: GameState.requested,
            id: generateId(),
            players: [user],
        };
        games.push(game);
        resolve(game);
    });
}

function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
