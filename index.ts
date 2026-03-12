import runServer from "./server";
import { GameState, InfoResponse, MoveResponse } from "./types";

function info(): InfoResponse {
  console.log("INFO");

  return {
    apiversion: "1",
    author: "Blackadder",
    color: "#000000",
    head: "tongue",
    tail: "bolt",
  };
}

function start(gameState: GameState): void {
  console.log("GAME START");
}

function end(gameState: GameState): void {
  console.log("GAME OVER\n");
}

function getMoves(gameState: GameState): { [key: string]: boolean } {
  let moves: { [key: string]: boolean } = {
    up: true,
    down: true,
    left: true,
    right: true,
  };

  const headCoord = gameState.you.body[0];
  const boardWidth = gameState.board.width;
  const boardHeight = gameState.board.height;
  const bodyCoords = gameState.you.body;

  if (
    headCoord.x === 0 &&
    bodyCoords.some((coord) => coord.x === headCoord.x - 1 && coord.y === headCoord.y)
  ) {
    moves.left = false;
  }

  if (
    headCoord.x === boardWidth - 1 &&
    bodyCoords.some((coord) => coord.x === headCoord.x + 1 && coord.y === headCoord.y)
  ) {
    moves.right = false;
  }

  if (
    headCoord.y === 0 &&
    bodyCoords.some((coord) => coord.x === headCoord.x && coord.y === headCoord.y - 1)
  ) {
    moves.down = false;
  }

  if (
    headCoord.y === boardHeight - 1 &&
    bodyCoords.some((coord) => coord.x === headCoord.x && coord.y === headCoord.y + 1)
  ) {
    moves.up = false;
  }

  return moves;
}

function move(gameState: GameState): MoveResponse {
  const moves = getMoves(gameState);
  const safeMoves = Object.keys(moves).filter((key) => moves[key]);

  if (safeMoves.length == 0) {
    console.log(`MOVE ${gameState.turn}: No safe moves detected! Moving down`);
    return { move: "down", shout: "Bummer, no more safe moves for me!" };
  }

  const nextMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];
  console.log(`MOVE ${gameState.turn}: ${nextMove}`);
  return { move: nextMove };
}

runServer({
  info: info,
  start: start,
  move: move,
  end: end,
});
