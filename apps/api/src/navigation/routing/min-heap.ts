export interface HeapEntry<T> {
  item: T;
  priority: number;
  sequence: number;
}

export class MinHeap<T> {
  private heap: HeapEntry<T>[] = [];
  private sequenceCounter = 0;

  push(item: T, priority: number): void {
    const entry: HeapEntry<T> = {
      item,
      priority,
      sequence: this.sequenceCounter++,
    };
    this.heap.push(entry);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) {
      return undefined;
    }
    const root = this.heap[0]!;
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }
    return root.item;
  }

  peek(): T | undefined {
    return this.heap[0]?.item;
  }

  size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  private isHigherPriority(a: HeapEntry<T>, b: HeapEntry<T>): boolean {
    if (a.priority !== b.priority) {
      return a.priority < b.priority;
    }
    return a.sequence < b.sequence;
  }

  private bubbleUp(index: number): void {
    let current = index;
    while (current > 0) {
      const parent = Math.floor((current - 1) / 2);
      if (this.isHigherPriority(this.heap[current]!, this.heap[parent]!)) {
        const temp = this.heap[current]!;
        this.heap[current] = this.heap[parent]!;
        this.heap[parent] = temp;
        current = parent;
      } else {
        break;
      }
    }
  }

  private bubbleDown(index: number): void {
    let current = index;
    const length = this.heap.length;

    while (true) {
      let priorityIndex = current;
      const left = 2 * current + 1;
      const right = 2 * current + 2;

      if (left < length && this.isHigherPriority(this.heap[left]!, this.heap[priorityIndex]!)) {
        priorityIndex = left;
      }

      if (right < length && this.isHigherPriority(this.heap[right]!, this.heap[priorityIndex]!)) {
        priorityIndex = right;
      }

      if (priorityIndex !== current) {
        const temp = this.heap[current]!;
        this.heap[current] = this.heap[priorityIndex]!;
        this.heap[priorityIndex] = temp;
        current = priorityIndex;
      } else {
        break;
      }
    }
  }
}
