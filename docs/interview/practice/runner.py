import json
from problem1 import shortest_path_k_obstacles
from problem2 import merge_k_sorted_lists
from problem3 import find_course_order

def assert_equal(actual, expected, test_name):
    actual_str = json.dumps(actual)
    expected_str = json.dumps(expected)
    if actual_str != expected_str:
        raise AssertionError(f"FAIL: {test_name}\n  Expected: {expected_str}\n  Received: {actual_str}")
    print(f"PASS: {test_name}")

def run_tests():
    p1_grid1 = [
        [0, 0, 0],
        [1, 1, 0],
        [0, 0, 0],
        [0, 1, 1],
        [0, 0, 0],
    ]
    assert_equal(shortest_path_k_obstacles(p1_grid1, 1), 6, "P1 Example 1 (Path with K=1)")

    p1_grid2 = [
        [0, 1, 1],
        [1, 1, 1],
        [1, 0, 0],
    ]
    assert_equal(shortest_path_k_obstacles(p1_grid2, 1), -1, "P1 Example 2 (Impossible with K=1)")
    assert_equal(shortest_path_k_obstacles([[0]], 1), 0, "P1 Edge Case 1 (Single cell)")
    assert_equal(shortest_path_k_obstacles([[0, 1], [1, 0]], 0), -1, "P1 Edge Case 2 (Blocked with K=0)")

    p2_lists1 = [
        [1, 4, 5],
        [1, 3, 4],
        [2, 6],
    ]
    assert_equal(merge_k_sorted_lists(p2_lists1), [1, 1, 2, 3, 4, 4, 5, 6], "P2 Example 1 (Merge 3 lists)")
    assert_equal(merge_k_sorted_lists([[], []]), [], "P2 Example 2 (Empty lists)")
    assert_equal(merge_k_sorted_lists([[1, 2, 3]]), [1, 2, 3], "P2 Edge Case 1 (Single list)")
    assert_equal(merge_k_sorted_lists([[-5, 0, 5], [-10, 10]]), [-10, -5, 0, 5, 10], "P2 Edge Case 2 (Negative values)")

    p3_order1 = find_course_order(2, [[1, 0]])
    assert_equal(p3_order1, [0, 1], "P3 Example 1 (Simple pair)")

    p3_order2 = find_course_order(4, [[1, 0], [2, 0], [3, 1], [3, 2]])
    valid_p3 = p3_order2 in ([0, 1, 2, 3], [0, 2, 1, 3])
    if not valid_p3:
        raise AssertionError(f"FAIL: P3 Example 2 invalid order: {p3_order2}")
    print("PASS: P3 Example 2 (Diamond dependency)")

    assert_equal(find_course_order(2, [[1, 0], [0, 1]]), [], "P3 Edge Case 1 (Cycle detection)")
    assert_equal(find_course_order(1, []), [0], "P3 Edge Case 2 (Single course)")

    print("\nALL 12 PRACTICE CODING TESTS PASSED (Python)")

if __name__ == "__main__":
    run_tests()
