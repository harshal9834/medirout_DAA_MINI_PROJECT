/**
 * Min-Priority Queue for Dijkstra's Algorithm
 * Ensures deterministic ordering:
 * 1. Smallest distance first
 * 2. If distances are identical, alphabetically by Node ID (deterministic tie-breaking)
 */
export interface PQElement<T> {
  element: T;
  priority: number;
  id: string;
}

export class MinPriorityQueue<T> {
  private heap: PQElement<T>[] = [];

  public enqueue(element: T, priority: number, id: string): void {
    const item: PQElement<T> = { element, priority, id };
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  public dequeue(): PQElement<T> | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const bottom = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this.sinkDown(0);
    }
    return top;
  }

  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  public size(): number {
    return this.heap.length;
  }

  public toSortedArray(): PQElement<T>[] {
    return [...this.heap].sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.id.localeCompare(b.id);
    });
  }

  private compare(a: PQElement<T>, b: PQElement<T>): number {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return a.id.localeCompare(b.id);
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.compare(this.heap[index], this.heap[parentIndex]) < 0) {
        [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  private sinkDown(index: number): void {
    const length = this.heap.length;
    while (true) {
      let smallest = index;
      const left = 2 * index + 1;
      const right = 2 * index + 2;

      if (left < length && this.compare(this.heap[left], this.heap[smallest]) < 0) {
        smallest = left;
      }
      if (right < length && this.compare(this.heap[right], this.heap[smallest]) < 0) {
        smallest = right;
      }

      if (smallest !== index) {
        [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
        index = smallest;
      } else {
        break;
      }
    }
  }
}
