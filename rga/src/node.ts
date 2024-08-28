export class Node<T = string> {
  deleted: boolean;
  constructor(
    public id: string,
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
      node.right = this.right;
      this.right.left = node;
    }
    node.left = this;
    this.right = node;
  }
  prepend(node: Node<T>) {
    if (this.left) {
      node.left = this.left;
      this.left.right = node;
    }
    node.right = this;
    this.left = node;
  }
}
