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
    this.deleted = true;
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

export const createNodeManager = () => {
  const cache = new Map<string, Node<string>>();

  return {
    find(id: string): Node<string> | undefined {
      return cache.get(id);
    },
    create(...args: ConstructorParameters<typeof Node<string>>): Node {
      const instance = new Node<string>(...args);
      cache.set(args[0], instance);
      return instance;
    },
    forceDelete(id: string) {
      const target = cache.get(id);
      cache.delete(id);
      if (target?.left) {
        target.left.right = target.right;
      }
      if (target?.right) {
        target.right.left = target.left;
      }
    },
  };
};
