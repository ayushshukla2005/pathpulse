export interface GridState {
  r: number;
  c: number;
  k: number;
  dist: number;
}

export function shortestPathKObstacles(grid: number[][], k: number): number {
  const m = grid.length;
  const n = grid[0]!.length;

  if (m === 1 && n === 1) {
    return 0;
  }

  if (k >= m + n - 2) {
    return m + n - 2;
  }

  const visited: number[][] = Array.from({ length: m }, () =>
    new Array<number>(n).fill(-1),
  );

  const queue: GridState[] = [{ r: 0, c: 0, k, dist: 0 }];
  visited[0]![0] = k;

  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  let head = 0;
  while (head < queue.length) {
    const { r, c, k: currentK, dist } = queue[head++]!;

    for (const [dr, dc] of directions) {
      const nr = r + dr!;
      const nc = c + dc!;

      if (nr < 0 || nr >= m || nc < 0 || nc >= n) {
        continue;
      }

      const nextK = currentK - grid[nr]![nc]!;
      if (nextK < 0) {
        continue;
      }

      if (nr === m - 1 && nc === n - 1) {
        return dist + 1;
      }

      if (nextK > visited[nr]![nc]!) {
        visited[nr]![nc] = nextK;
        queue.push({ r: nr, c: nc, k: nextK, dist: dist + 1 });
      }
    }
  }

  return -1;
}
