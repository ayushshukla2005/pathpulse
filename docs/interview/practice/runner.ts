import { shortestPathKObstacles } from "./problem1";
import { mergeKSortedLists } from "./problem2";
import { findCourseOrder } from "./problem3";

function assertEqual<T>(actual: T, expected: T, testName: string): void {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(`FAIL: ${testName}\n  Expected: ${expectedStr}\n  Received: ${actualStr}`);
  }
  console.log(`PASS: ${testName}`);
}

function runTests(): void {
  const p1Grid1 = [
    [0, 0, 0],
    [1, 1, 0],
    [0, 0, 0],
    [0, 1, 1],
    [0, 0, 0],
  ];
  assertEqual(shortestPathKObstacles(p1Grid1, 1), 6, "P1 Example 1 (Path with K=1)");

  const p1Grid2 = [
    [0, 1, 1],
    [1, 1, 1],
    [1, 0, 0],
  ];
  assertEqual(shortestPathKObstacles(p1Grid2, 1), -1, "P1 Example 2 (Impossible with K=1)");
  assertEqual(shortestPathKObstacles([[0]], 1), 0, "P1 Edge Case 1 (Single cell)");
  assertEqual(shortestPathKObstacles([[0, 1], [1, 0]], 0), -1, "P1 Edge Case 2 (Blocked with K=0)");

  const p2Lists1 = [
    [1, 4, 5],
    [1, 3, 4],
    [2, 6],
  ];
  assertEqual(mergeKSortedLists(p2Lists1), [1, 1, 2, 3, 4, 4, 5, 6], "P2 Example 1 (Merge 3 lists)");
  assertEqual(mergeKSortedLists([[], []]), [], "P2 Example 2 (Empty lists)");
  assertEqual(mergeKSortedLists([[1, 2, 3]]), [1, 2, 3], "P2 Edge Case 1 (Single list)");
  assertEqual(mergeKSortedLists([[-5, 0, 5], [-10, 10]]), [-10, -5, 0, 5, 10], "P2 Edge Case 2 (Negative values)");

  const p3Order1 = findCourseOrder(2, [[1, 0]]);
  assertEqual(p3Order1, [0, 1], "P3 Example 1 (Simple pair)");

  const p3Order2 = findCourseOrder(4, [
    [1, 0],
    [2, 0],
    [3, 1],
    [3, 2],
  ]);
  const validP3 =
    JSON.stringify(p3Order2) === JSON.stringify([0, 1, 2, 3]) ||
    JSON.stringify(p3Order2) === JSON.stringify([0, 2, 1, 3]);
  if (!validP3) {
    throw new Error(`FAIL: P3 Example 2 invalid order: ${JSON.stringify(p3Order2)}`);
  }
  console.log("PASS: P3 Example 2 (Diamond dependency)");

  assertEqual(findCourseOrder(2, [[1, 0], [0, 1]]), [], "P3 Edge Case 1 (Cycle detection)");
  assertEqual(findCourseOrder(1, []), [0], "P3 Edge Case 2 (Single course)");

  console.log("\nALL 12 PRACTICE CODING TESTS PASSED (TypeScript)");
}

runTests();
