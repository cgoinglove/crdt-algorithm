export class Node<T> {
  deleted: boolean;
  constructor(
    public id: T,
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
      const tail = node.findTail();
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
    const tail = node.findTail();
    tail.right = this;
    this.left = tail;
  }
  find(id: string) {
    return this.findRight(id) || this.findLeft(id);
  }
  findRight(id: string) {
    let node: Node<T> | undefined = this;
    while (node && node?.id != id) {
      node = node?.right;
    }
    return node;
  }

  findLeft(id: string) {
    let node: Node<T> | undefined = this;
    while (node && node?.id != id) {
      node = node?.left;
    }
    return node;
  }
  findHead() {
    let head: Node<T> | undefined = this;
    while (head.left) {
      head = head.left;
    }
    return head;
  }
  findTail() {
    let tail: Node<T> | undefined = this;
    while (tail.right) {
      tail = tail.right;
    }

    return tail;
  }
}
