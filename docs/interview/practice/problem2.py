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
