export class Node<T = string> {
  deleted: boolean;
  constructor(
    public readonly id: string,
    public readonly value: T,
    public left?: Node<T>,
    public right?: Node<T>,
  ) {
    this.deleted = false;
  }
  delete(force: boolean = false) {
    if (!force) {
      this.deleted = true;
      return;
    }
    if (this?.left) {
      this.left.right = this.right;
    }
    if (this?.right) {
      this.right.left = this.left;
    }
  }
  append(node: Node<T>) {
    if (this.right) {
      const tail = node.getTail();
      tail.right = this.right;
      this.right.left = tail;
    }
    node.left = this;
    this.right = node;
  }
  prepend(node: Node<T>) {
    if (this.left) {
      node.left = this.left;
      this.left.right = node;
    }
    const tail = node.getTail();
    tail.right = this;
    this.left = tail;
  }
  getHead() {
    let head: Node<T> | undefined = this;
    while (head.left) {
      head = head.left;
    }
    return head;
  }
  getTail() {
    let tail: Node<T> | undefined = this;
    while (tail.right) {
      tail = tail.right;
    }
    return tail;
  }
}
