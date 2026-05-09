import runServer from "./server";
import { Coord, GameState, InfoResponse, MoveResponse } from "./types";

function info(): InfoResponse {
  console.log("INFO");

  return {
    apiversion: "1",
    author: "Blackadder",
    color: "#000000",
    head: "tongue",
    tail: "bolt",
    version: "0.3.0",
  };
}

function start(gameState: GameState): void {
  console.log("GAME START");
}

function end(gameState: GameState): void {
  console.log("GAME OVER\n");
}

function getSafeMoves({
  gameState,
  considerHeadOnCollisions = true,
  boundaryBuffer = 0,
}: {
  gameState: GameState;
  considerHeadOnCollisions?: boolean;
  boundaryBuffer?: number;
}) {
  const boardWidth = gameState.board.width;
  const boardHeight = gameState.board.height;
  const mySnake = gameState.you;
  const headCoord = mySnake.body[0];
  const bodyCoords = mySnake.body;
  const otherSnakes = gameState.board.snakes.filter((snake) => snake.id !== mySnake.id);
  const otherSnakeCoords = otherSnakes.flatMap((snake) => snake.body);

  const otherPotentialSnakeHeadCoords = otherSnakes.flatMap((snake) =>
    mySnake.length <= snake.length
      ? [
          { x: snake.body[0].x, y: snake.body[0].y + 1 },
          { x: snake.body[0].x, y: snake.body[0].y - 1 },
          { x: snake.body[0].x - 1, y: snake.body[0].y },
          { x: snake.body[0].x + 1, y: snake.body[0].y },
        ]
      : []
  );

  const isCoordSafe = (coord: Coord) => {
    // Out of bounds check
    if (
      coord.x < 0 + boundaryBuffer ||
      coord.x >= boardWidth - boundaryBuffer ||
      coord.y < 0 + boundaryBuffer ||
      coord.y >= boardHeight - boundaryBuffer
    ) {
      return false;
    }

    // Check for collisions with own body
    if (bodyCoords.some((bodyCoord) => bodyCoord.x === coord.x && bodyCoord.y === coord.y)) {
      return false;
    }

    // Check for collisions with other snakes' bodies
    if (
      otherSnakeCoords.some((snakeCoord) => snakeCoord.x === coord.x && snakeCoord.y === coord.y)
    ) {
      return false;
    }

    // Check for potential head-on collisions with other snakes
    if (
      considerHeadOnCollisions &&
      otherPotentialSnakeHeadCoords.some(
        (potentialHeadCoord) => potentialHeadCoord.x === coord.x && potentialHeadCoord.y === coord.y
      )
    ) {
      return false;
    }

    return true;
  };

  return {
    up: isCoordSafe({ x: headCoord.x, y: headCoord.y + 1 }),
    down: isCoordSafe({ x: headCoord.x, y: headCoord.y - 1 }),
    left: isCoordSafe({ x: headCoord.x - 1, y: headCoord.y }),
    right: isCoordSafe({ x: headCoord.x + 1, y: headCoord.y }),
  };
}

function getClosestCoords(coords: Coord[], myCoord: Coord) {
  return coords.reduce(
    (closestCoord, coord) => {
      const distance = Math.abs(coord.x - myCoord.x) + Math.abs(coord.y - myCoord.y);
      return distance < closestCoord.distance ? { coord, distance: distance } : closestCoord;
    },
    { coord: null, distance: Infinity } as {
      coord: { x: number; y: number } | null;
      distance: number;
    }
  );
}

function getMoveToCoords(
  coord: Coord,
  headCoord: Coord,
  safeMoves: { up: boolean; down: boolean; left: boolean; right: boolean }
) {
  if (coord.x < headCoord.x && safeMoves.left) {
    return "left";
  } else if (coord.x > headCoord.x && safeMoves.right) {
    return "right";
  } else if (coord.y < headCoord.y && safeMoves.down) {
    return "down";
  } else if (coord.y > headCoord.y && safeMoves.up) {
    return "up";
  }

  return null;
}

function getPreferredMove(gameState: GameState) {
  const safeMoves = getSafeMoves({ gameState });
  const safeMoveBuffer = getSafeMoves({ gameState, boundaryBuffer: 1 });
  const probableSafeMoves = getSafeMoves({ gameState, considerHeadOnCollisions: false });
  const mySnake = gameState.you;
  const headCoord = mySnake.body[0];
  const health = mySnake.health;
  const otherSnakes = gameState.board.snakes.filter((snake) => snake.id !== mySnake.id);
  const closestFoodCoords = getClosestCoords(gameState.board.food, headCoord);

  if (health < 70 && closestFoodCoords.coord) {
    const move = getMoveToCoords(closestFoodCoords.coord, headCoord, safeMoves);

    if (move) {
      return move;
    }
  }

  const otherPotentialSnakeHeadCoords = otherSnakes.flatMap((snake) =>
    mySnake.length > snake.length
      ? [
          { x: snake.body[0].x, y: snake.body[0].y + 1 },
          { x: snake.body[0].x, y: snake.body[0].y - 1 },
          { x: snake.body[0].x - 1, y: snake.body[0].y },
          { x: snake.body[0].x + 1, y: snake.body[0].y },
        ]
      : []
  );

  const closestHeadCoord = getClosestCoords(otherPotentialSnakeHeadCoords, headCoord);

  if (closestHeadCoord.coord) {
    const move = getMoveToCoords(closestHeadCoord.coord, headCoord, safeMoveBuffer);

    if (move) {
      return move;
    }
  }

  return safeMoveBuffer.up
    ? "up"
    : safeMoveBuffer.down
      ? "down"
      : safeMoveBuffer.left
        ? "left"
        : safeMoveBuffer.right
          ? "right"
          : safeMoves.up
            ? "up"
            : safeMoves.down
              ? "down"
              : safeMoves.left
                ? "left"
                : safeMoves.right
                  ? "right"
                  : probableSafeMoves.up
                    ? "up"
                    : probableSafeMoves.down
                      ? "down"
                      : probableSafeMoves.left
                        ? "left"
                        : probableSafeMoves.right
                          ? "right"
                          : "up";
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
