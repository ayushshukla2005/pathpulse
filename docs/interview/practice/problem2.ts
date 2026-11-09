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
