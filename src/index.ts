import * as crypto from "crypto";

const MINES_GAME_TILES_COUNT = 25;
const RTP = 1;

function generateMinesPosition(
  serverSeed: string,
  clientSeed: string,
  gameId: string,
  minesNum: number
): number[] {
  function* floatsGenerator(
    serverSeed: string,
    clientSeed: string,
    nonce: number
  ): Generator<number, number, never> {
    function* bytesGenerator(): Generator<number, number, never> {
      let currentRound = 0;

      while (true) {
        const hmac = crypto.createHmac("sha256", serverSeed);
        hmac.update(`${clientSeed}:${nonce}:${currentRound}`);
        const buffer = hmac.digest();

        for (let i = 0; i < buffer.length; i++) {
          yield buffer[i];
        }

        currentRound++;
      }
    }

    const byteRng = bytesGenerator();

    while (true) {
      const bytes = Array.from({ length: 4 }, () => byteRng.next().value);

      const float = bytes.reduce((result, value, i) => {
        return result + value / 256 ** (i + 1);
      }, 0);

      yield float;
    }
  }

  const combinedSeed = `${clientSeed}-${gameId}`;

  const floatsRng = floatsGenerator(serverSeed, combinedSeed, 0);

  const remainingPositions = Array.from(
    { length: MINES_GAME_TILES_COUNT },
    (_, i) => i
  );

  const minesPositions = Array.from({ length: minesNum }, (_, i) => {
    const float = floatsRng.next().value;
    const relativeMinePosition = Math.floor(
      float * (MINES_GAME_TILES_COUNT - i)
    );
    const [absoluteMinePosition] = remainingPositions.splice(
      relativeMinePosition,
      1
    );
    return absoluteMinePosition;
  });

  return minesPositions.sort((a, b) => a - b);
}

console.log(
  generateMinesPosition(
    "42ddb6076d640d326bbae46a084fef96b0bd2ee6222b3604fe9532158072052f",
    "0fbbcf1eeacee76df425b3d7a4072263",
    "805dc228-8034-4711-b5dc-3382888cba40",
    9
  )
);

class MinesGameCalculator {
  public calculateWinChance(diamonds: number, mines: number): number {
    let multiplier = 1;

    for (let i = 0; i < diamonds; i++) {
      const safeCells = MINES_GAME_TILES_COUNT - mines - i;
      const remainingCells = MINES_GAME_TILES_COUNT - i;

      multiplier *= safeCells / remainingCells;
    }

    return parseFloat(multiplier.toFixed(6));
  }

  public calculateMultiplier(diamonds: number, mines: number): number {
    let chance = 1;

    for (let i = 0; i < diamonds; i++) {
      const safeCells = MINES_GAME_TILES_COUNT - mines - i;
      const remainingCells = MINES_GAME_TILES_COUNT - i;

      chance *= safeCells / remainingCells;
    }

    return parseFloat(((1 / chance) * RTP).toFixed(2));
  }

  public printTable(): void {
    console.log("Diamond | Bomb | Multiplier | Win Chance");
    console.log("------------------------------------------");

    for (let diamonds = 1; diamonds <= MINES_GAME_TILES_COUNT; diamonds++) {
      if (diamonds > 1 && diamonds < 25) {
        console.log("\nDiamond | Bomb | Multiplier | Win Chance");
        console.log("------------------------------------------");
      }

      for (let mines = 1; mines <= MINES_GAME_TILES_COUNT - 1; mines++) {
        if (diamonds > MINES_GAME_TILES_COUNT - mines) break;

        const multiplier = this.calculateMultiplier(diamonds, mines);
        const winChance = this.calculateWinChance(diamonds, mines);

        console.log(
          `${diamonds.toString().padStart(7)} | ${mines
            .toString()
            .padStart(4)} | ${multiplier.toFixed(2).padStart(10)}x | ${winChance
            .toFixed(6)
            .padStart(10)}%`
        );
      }
    }
  }
}

const calculator = new MinesGameCalculator();
calculator.printTable();
