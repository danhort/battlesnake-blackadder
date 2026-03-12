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
    version: "0.2.0",
  };
}

function start(gameState: GameState): void {
  console.log("GAME START");
}

function end(gameState: GameState): void {
  console.log("GAME OVER\n");
}

function getSafeMoves(gameState: GameState) {
  let moves: { [key: string]: boolean } = {
    up: true,
    down: true,
    left: true,
    right: true,
  };

  const boardWidth = gameState.board.width;
  const boardHeight = gameState.board.height;
  const headCoord = gameState.you.body[0];
  const bodyCoords = gameState.you.body;
  const otherSnakeCoords = gameState.board.snakes.flatMap((snake) => snake.body);

  if (
    headCoord.x === 0 ||
    bodyCoords.some((coord) => coord.x === headCoord.x - 1 && coord.y === headCoord.y) ||
    otherSnakeCoords.some((coord) => coord.x === headCoord.x - 1 && coord.y === headCoord.y)
  ) {
    moves.left = false;
  }

  if (
    headCoord.x === boardWidth - 1 ||
    bodyCoords.some((coord) => coord.x === headCoord.x + 1 && coord.y === headCoord.y) ||
    otherSnakeCoords.some((coord) => coord.x === headCoord.x + 1 && coord.y === headCoord.y)
  ) {
    moves.right = false;
  }

  if (
    headCoord.y === 0 ||
    bodyCoords.some((coord) => coord.x === headCoord.x && coord.y === headCoord.y - 1) ||
    otherSnakeCoords.some((coord) => coord.x === headCoord.x && coord.y === headCoord.y - 1)
  ) {
    moves.down = false;
  }

  if (
    headCoord.y === boardHeight - 1 ||
    bodyCoords.some((coord) => coord.x === headCoord.x && coord.y === headCoord.y + 1) ||
    otherSnakeCoords.some((coord) => coord.x === headCoord.x && coord.y === headCoord.y + 1)
  ) {
    moves.up = false;
  }

  const safeMoves = Object.keys(moves).filter((key) => moves[key]);

  return safeMoves;
}

function getPreferredMove(gameState: GameState) {
  const safeMoves = getSafeMoves(gameState);
  const headCoord = gameState.you.body[0];

  const closestFoodCoords = gameState.board.food.reduce(
    (closestFood, food) => {
      const distance = Math.abs(food.x - headCoord.x) + Math.abs(food.y - headCoord.y);
      return distance < closestFood.distance ? { coord: food, distance: distance } : closestFood;
    },
    { coord: null, distance: Infinity } as {
      coord: { x: number; y: number } | null;
      distance: number;
    }
  );

  if (closestFoodCoords.coord) {
    if (closestFoodCoords.coord.x < headCoord.x && safeMoves.includes("left")) {
      return "left";
    } else if (closestFoodCoords.coord.x > headCoord.x && safeMoves.includes("right")) {
      return "right";
    } else if (closestFoodCoords.coord.y < headCoord.y && safeMoves.includes("down")) {
      return "down";
    } else if (closestFoodCoords.coord.y > headCoord.y && safeMoves.includes("up")) {
      return "up";
    }
  }

  return safeMoves[Math.floor(Math.random() * safeMoves.length)];
}

function move(gameState: GameState): MoveResponse {
  const nextMove = getPreferredMove(gameState);
  console.log(`MOVE ${gameState.turn}: ${nextMove}`);
  return { move: nextMove };
}

runServer({
  info: info,
  start: start,
  move: move,
  end: end,
});
