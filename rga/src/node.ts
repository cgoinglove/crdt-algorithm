type Predicate<T> = (node: Node<T>) => boolean

export class Node<T> {
  deleted: boolean
  constructor(
    public readonly value: T,
    public left?: Node<T>,
    public right?: Node<T>,
  ) {
    this.deleted = false
  }
  slice() {
    const left = this.left
    if (left) {
      left.right = undefined
    }
    this.left = undefined
    return [left, this]
  }
  softDelete() {
    this.deleted = true
  }
  delete() {
    if (this.left) {
      this.left.right = this.right
    }
    if (this.right) {
      this.right.left = this.left
    }
    this.left = undefined
    this.right = undefined
  }
  append(node: Node<T>) {
    if (this.right) {
      const tail = node.getTail()
      tail.right = this.right
      this.right.left = tail
    }
    node.left = this
    this.right = node
  }
  prepend(node: Node<T>) {
    if (this.left) {
      node.left = this.left
      this.left.right = node
    }
    const tail = node.getTail()
    tail.right = this
    this.left = tail
  }
  find(predicate: Predicate<T>) {
    return this.findRight(predicate) || this.findLeft(predicate)
  }
  findRight(predicate: Predicate<T>) {
    let node: Node<T> | undefined = this
    while (node && !predicate(node)) {
      node = node?.right
    }
    return node
  }

  findLeft(predicate: Predicate<T>) {
    let node: Node<T> | undefined = this
    while (node && !predicate(node)) {
      node = node?.left
    }
    return node
  }
  getHead() {
    let head: Node<T> | undefined = this
    while (head.left) {
      head = head.left
    }
    return head
  }
  getTail() {
    let tail: Node<T> | undefined = this
    while (tail.right) {
      tail = tail.right
    }
    return tail
  }
}
