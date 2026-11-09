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
