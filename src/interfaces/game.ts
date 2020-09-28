import { GameState } from "./../enums/gameState";

export interface Game {
    id: string;
    gameState: GameState;
    players: string[];
}
