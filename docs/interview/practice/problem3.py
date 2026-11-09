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
