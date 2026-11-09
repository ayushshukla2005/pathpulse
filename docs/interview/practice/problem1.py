from collections import deque
from typing import List

def shortest_path_k_obstacles(grid: List[List[int]], k: int) -> int:
    m = len(grid)
    n = len(grid[0])

    if m == 1 and n == 1:
        return 0

    if k >= m + n - 2:
        return m + n - 2

    visited = [[-1] * n for _ in range(m)]
    visited[0][0] = k

    queue = deque([(0, 0, k, 0)])
    directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]

    while queue:
        r, c, current_k, dist = queue.popleft()

        for dr, dc in directions:
            nr = r + dr
            nc = c + dc

            if 0 <= nr < m and 0 <= nc < n:
                next_k = current_k - grid[nr][nc]
                if next_k < 0:
                    continue

                if nr == m - 1 and nc == n - 1:
                    return dist + 1

                if next_k > visited[nr][nc]:
                    visited[nr][nc] = next_k
                    queue.append((nr, nc, next_k, dist + 1))

    return -1
