import { MinHeap } from "../min-heap";

describe("MinHeap", () => {
  it("should extract items in ascending priority order", () => {
    const heap = new MinHeap<string>();
    heap.push("high", 100);
    heap.push("lowest", 10);
    heap.push("middle", 50);
    heap.push("negative", -5);

    expect(heap.size()).toBe(4);
    expect(heap.isEmpty()).toBe(false);
    expect(heap.peek()).toBe("negative");

    expect(heap.pop()).toBe("negative");
    expect(heap.pop()).toBe("lowest");
    expect(heap.pop()).toBe("middle");
    expect(heap.pop()).toBe("high");
    expect(heap.pop()).toBeUndefined();
    expect(heap.isEmpty()).toBe(true);
  });

  it("should break ties stably by insertion order when priorities are equal", () => {
    const heap = new MinHeap<string>();
    heap.push("first", 10);
    heap.push("second", 10);
    heap.push("third", 10);
    heap.push("fourth", 10);

    expect(heap.pop()).toBe("first");
    expect(heap.pop()).toBe("second");
    expect(heap.pop()).toBe("third");
    expect(heap.pop()).toBe("fourth");
    expect(heap.pop()).toBeUndefined();
  });

  it("should handle empty-pop and empty-peek gracefully", () => {
    const heap = new MinHeap<number>();
    expect(heap.isEmpty()).toBe(true);
    expect(heap.size()).toBe(0);
    expect(heap.peek()).toBeUndefined();
    expect(heap.pop()).toBeUndefined();
  });

  it("should maintain min-heap property under interleaved push and pop operations", () => {
    const heap = new MinHeap<number>();
    const values = [42, 17, 99, 8, 33, 5, 60, 2];

    for (const v of values) {
      heap.push(v, v);
    }

    const sorted: number[] = [];
    while (!heap.isEmpty()) {
      sorted.push(heap.pop()!);
    }

    expect(sorted).toEqual([2, 5, 8, 17, 33, 42, 60, 99]);
  });
});
