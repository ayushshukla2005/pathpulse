# PathPulse: Mock Coding Round Problems & Solutions

This document provides three interview coding problems drawn from the core algorithmic patterns used in PathPulse: state-expanded graph pathfinding (Dijkstra), priority queue manipulation (Min-Heap), and directed topological graph ordering.

All solutions follow strict engineering constraints: optimal Big-O complexity, zero comments inside code, and verified test execution across both TypeScript and Python.

---

## Problem 1: Shortest Path in a Grid with at most K Obstacles Eliminated

### Pattern Relevance
Matches PathPulse's multi-floor Dijkstra engine ([`apps/api/src/navigation/routing/dijkstra.ts`](file:///c:/Users/AYUSH%20SHUKLA/Desktop/BTECH%20CSE%20STUDY%20MATERIALS/PROJECT%201/pathpulse/apps/api/src/navigation/routing/dijkstra.ts)), which tracks multi-dimensional traversal state (coordinates, current floor, step-free constraints) across intermediate nodes.

### Problem Statement
You are given an $m \times n$ integer matrix `grid` where each cell is either `0` (empty) or `1` (obstacle). You can move up, down, left, or right between adjacent empty cells. You can eliminate at most $k$ obstacles. Return the minimum number of steps to walk from the top-left cell `(0, 0)` to the bottom-right cell `(m - 1, n - 1)`. If no path exists, return `-1`.

### Examples
- **Example 1**:
  - Input: `grid = [[0,0,0],[1,1,0],[0,0,0],[0,1,1],[0,0,0]], k = 1`
  - Output: `6`
- **Example 2**:
  - Input: `grid = [[0,1,1],[1,1,1],[1,0,0]], k = 1`
  - Output: `-1`

### Constraints
- $1 \le m, n \le 40$
- $1 \le m \times n \le 1600$
- $0 \le k \le m \times n$
- `grid[i][j]` is either `0` or `1`
- `grid[0][0] == grid[m - 1][n - 1] == 0`

### Approach
We model each reachable state as `(row, col, remainingK)`. Because each step has a uniform cost of 1, we use Breadth-First Search (or Dijkstra). We maintain a 2D array `visited[row][col]` storing the maximum remaining obstacle budget $k$ observed when reaching cell `(row, col)`. If a subsequent path arrives at the same cell with less or equal $k$, it is pruned because it cannot produce a more optimal continuation. If $k \ge m + n - 2$, the Manhattan distance is directly returned because all obstacles along the direct shortest path can be cleared.

### Complexity
- **Time Complexity**: $O(m \cdot n \cdot k)$. In the worst case, every cell is visited for each distinct obstacle budget value $k$.
- **Space Complexity**: $O(m \cdot n \cdot k)$ to store queue states and the visited budget matrix.

### TypeScript Solution
```typescript
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
```

### Python Solution
```python
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
```

### Edge Cases
1. **Single Cell Grid**: `grid = [[0]], k = 1` &rarr; Expected Output: `0` (already at destination).
2. **Zero Budget with Blocked Path**: `grid = [[0, 1], [1, 0]], k = 0` &rarr; Expected Output: `-1` (all paths blocked).

---

## Problem 2: Merge K Sorted Lists (Priority Queue / Heap Pattern)

### Pattern Relevance
Directly implements the min-heap tie-breaking and multi-stream consolidation pattern used in PathPulse's `MinHeap` ([`apps/api/src/navigation/routing/min-heap.ts`](file:///c:/Users/AYUSH%20SHUKLA/Desktop/BTECH%20CSE%20STUDY%20MATERIALS/PROJECT%201/pathpulse/apps/api/src/navigation/routing/min-heap.ts)).

### Problem Statement
You are given an array of $k$ sorted integer lists. Merge all the lists into one sorted list and return it.

### Examples
- **Example 1**:
  - Input: `arrays = [[1, 4, 5], [1, 3, 4], [2, 6]]`
  - Output: `[1, 1, 2, 3, 4, 4, 5, 6]`
- **Example 2**:
  - Input: `arrays = [[], []]`
  - Output: `[]`

### Constraints
- $k \ge 0$
- $0 \le \text{total elements } N \le 10^5$
- $-10^4 \le \text{arrays}[i][j] \le 10^4$
- Each `arrays[i]` is sorted in ascending order.

### Approach
We initialize a binary min-heap containing the head element of each non-empty list. Each heap entry stores `(value, sequence, listIndex, elementIndex)`. In each iteration, we pop the minimum element, append it to the result list, and if that list has a successor element, push the successor into the heap. The monotonic sequence counter enforces deterministic FIFO ordering when values collide.

### Complexity
- **Time Complexity**: $O(N \log k)$, where $N$ is the total count of elements across all $k$ arrays and $k$ is the number of arrays. Each insertion and extraction takes $O(\log k)$ time.
- **Space Complexity**: $O(k)$ auxiliary space for the heap, plus $O(N)$ for the returned result list.

### TypeScript Solution
```typescript
interface HeapNode {
  value: number;
  arrayIndex: number;
  elementIndex: number;
  sequence: number;
}

export class MinHeapLists {
  private tree: HeapNode[] = [];
  private seq = 0;

  push(val: number, arrIdx: number, elemIdx: number): void {
    const node: HeapNode = {
      value: val,
      arrayIndex: arrIdx,
      elementIndex: elemIdx,
      sequence: this.seq++,
    };
    this.tree.push(node);
    this.up(this.tree.length - 1);
  }

  pop(): HeapNode | undefined {
    if (this.tree.length === 0) {
      return undefined;
    }
    const root = this.tree[0]!;
    const last = this.tree.pop()!;
    if (this.tree.length > 0) {
      this.tree[0] = last;
      this.down(0);
    }
    return root;
  }

  size(): number {
    return this.tree.length;
  }

  private compare(a: HeapNode, b: HeapNode): boolean {
    if (a.value !== b.value) {
      return a.value < b.value;
    }
    return a.sequence < b.sequence;
  }

  private up(idx: number): void {
    let curr = idx;
    while (curr > 0) {
      const p = Math.floor((curr - 1) / 2);
      if (this.compare(this.tree[curr]!, this.tree[p]!)) {
        const tmp = this.tree[curr]!;
        this.tree[curr] = this.tree[p]!;
        this.tree[p] = tmp;
        curr = p;
      } else {
        break;
      }
    }
  }

  private down(idx: number): void {
    let curr = idx;
    const len = this.tree.length;
    while (curr * 2 + 1 < len) {
      let best = curr * 2 + 1;
      const right = curr * 2 + 2;
      if (right < len && this.compare(this.tree[right]!, this.tree[best]!)) {
        best = right;
      }
      if (this.compare(this.tree[best]!, this.tree[curr]!)) {
        const tmp = this.tree[curr]!;
        this.tree[curr] = this.tree[best]!;
        this.tree[best] = tmp;
        curr = best;
      } else {
        break;
      }
    }
  }
}

export function mergeKSortedLists(arrays: number[][]): number[] {
  const heap = new MinHeapLists();
  const result: number[] = [];

  for (let i = 0; i < arrays.length; i++) {
    const arr = arrays[i]!;
    if (arr.length > 0) {
      heap.push(arr[0]!, i, 0);
    }
  }

  while (heap.size() > 0) {
    const node = heap.pop()!;
    result.push(node.value);

    const nextIdx = node.elementIndex + 1;
    const sourceArr = arrays[node.arrayIndex]!;
    if (nextIdx < sourceArr.length) {
      heap.push(sourceArr[nextIdx]!, node.arrayIndex, nextIdx);
    }
  }

  return result;
}
```

### Python Solution
```python
import heapq
from typing import List

def merge_k_sorted_lists(arrays: List[List[int]]) -> List[int]:
    heap = []
    result = []
    seq = 0

    for i, arr in enumerate(arrays):
        if arr:
            heapq.heappush(heap, (arr[0], seq, i, 0))
            seq += 1

    while heap:
        val, _, arr_idx, elem_idx = heapq.heappop(heap)
        result.append(val)

        next_idx = elem_idx + 1
        source_arr = arrays[arr_idx]
        if next_idx < len(source_arr):
            heapq.heappush(heap, (source_arr[next_idx], seq, arr_idx, next_idx))
            seq += 1

    return result
```

### Edge Cases
1. **Single Array**: `arrays = [[1, 2, 3]]` &rarr; Expected Output: `[1, 2, 3]`.
2. **Negative Values**: `arrays = [[-5, 0, 5], [-10, 10]]` &rarr; Expected Output: `[-10, -5, 0, 5, 10]`.

---

## Problem 3: Course Schedule II (Topological Sort & Cycle Detection)

### Pattern Relevance
Parallels PathPulse's multi-floor topological graph validation and report workflow dependency verification ([`apps/api/src/reports/workflow/state-machine.ts`](file:///c:/Users/AYUSH%20SHUKLA/Desktop/BTECH%20CSE%20STUDY%20MATERIALS/PROJECT%201/pathpulse/apps/api/src/reports/workflow/state-machine.ts)).

### Problem Statement
There are a total of `numCourses` courses you have to take, labeled from `0` to `numCourses - 1`. You are given an array `prerequisites` where `prerequisites[i] = [a, b]` indicates that you must take course `b` first if you want to take course `a`. Return the ordering of courses you should take to finish all courses. If it is impossible to finish all courses (due to a cycle), return an empty array `[]`.

### Examples
- **Example 1**:
  - Input: `numCourses = 2, prerequisites = [[1, 0]]`
  - Output: `[0, 1]`
- **Example 2**:
  - Input: `numCourses = 4, prerequisites = [[1, 0], [2, 0], [3, 1], [3, 2]]`
  - Output: `[0, 1, 2, 3]` (or `[0, 2, 1, 3]`)

### Constraints
- $1 \le \text{numCourses} \le 2000$
- $0 \le \text{prerequisites.length} \le \text{numCourses} \times (\text{numCourses} - 1)$
- `prerequisites[i].length == 2`
- All pairs `[a, b]` are distinct.

### Approach
We build a directed graph adjacency list and an in-degree array for each node. Using Kahn's algorithm (BFS topological sort), we push all nodes with in-degree 0 into a queue. As each node is dequeued, we append it to the topological order and decrement the in-degree of its outgoing neighbors. When a neighbor's in-degree reaches 0, it is enqueued. If the finalized order length is less than `numCourses`, the graph contains a directed cycle and an empty array `[]` is returned.

### Complexity
- **Time Complexity**: $O(V + E)$, where $V$ is `numCourses` and $E$ is `prerequisites.length`. We inspect each vertex and edge exactly once.
- **Space Complexity**: $O(V + E)$ to store the adjacency list and in-degree array.

### TypeScript Solution
```typescript
export function findCourseOrder(
  numCourses: number,
  prerequisites: [number, number][],
): number[] {
  const inDegree = new Array<number>(numCourses).fill(0);
  const adj = new Map<number, number[]>();

  for (let i = 0; i < numCourses; i++) {
    adj.set(i, []);
  }

  for (const [course, prereq] of prerequisites) {
    const list = adj.get(prereq);
    if (list) {
      list.push(course);
    }
    inDegree[course] = (inDegree[course] ?? 0) + 1;
  }

  const queue: number[] = [];
  for (let i = 0; i < numCourses; i++) {
    if ((inDegree[i] ?? 0) === 0) {
      queue.push(i);
    }
  }

  const order: number[] = [];
  let head = 0;

  while (head < queue.length) {
    const curr = queue[head++]!;
    order.push(curr);

    const neighbors = adj.get(curr) ?? [];
    for (const neighbor of neighbors) {
      inDegree[neighbor] = (inDegree[neighbor] ?? 0) - 1;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (order.length !== numCourses) {
    return [];
  }

  return order;
}
```

### Python Solution
```python
from collections import deque
from typing import List

def find_course_order(num_courses: int, prerequisites: List[List[int]]) -> List[int]:
    in_degree = [0] * num_courses
    adj = {i: [] for i in range(num_courses)}

    for course, prereq in prerequisites:
        adj[prereq].append(course)
        in_degree[course] += 1

    queue = deque([i for i in range(num_courses) if in_degree[i] == 0])
    order = []

    while queue:
        curr = queue.popleft()
        order.append(curr)

        for neighbor in adj[curr]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    if len(order) != num_courses:
        return []

    return order
```

### Edge Cases
1. **Direct Cycle**: `numCourses = 2, prerequisites = [[1, 0], [0, 1]]` &rarr; Expected Output: `[]` (deadlock detected).
2. **Independent Courses**: `numCourses = 1, prerequisites = []` &rarr; Expected Output: `[0]` (trivial topological sort).
