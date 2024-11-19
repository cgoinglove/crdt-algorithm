import { Command, Operation } from './interface';
import { Node } from './node';

export class NotFoundNode extends Error {
  constructor(id: string) {
    super(`Not Found Node ${id}`);
  }
}

export class NodeInsertCommand<T> implements Command {
  private node: Node<Operation<T>> | undefined;
  constructor(public operation: Operation<T>) {}
  get executed() {
    return Boolean(this.node);
  }
  execute(head: Node<Operation<T>>): void {
    if (this.executed) return;
    const node = new Node<Operation<T>>(this.operation);
    let parent: Node<Operation<T>> | undefined;
    if (!this.operation.parent) {
      parent = head.getHead();
    } else {
      parent = head.find(node => node.value.id == this.operation.parent);
    }
    if (!parent) throw new NotFoundNode(this.operation.parent!);
    parent.append(node);
    this.node = node;
  }
  undo(): void {
    if (!this.executed) throw new Error('Not Executed');
    this.node!.delete();
    this.node = undefined;
  }
}

export class NodeDeleteCommand<T> implements Command {
  private node: Node<Operation<T>> | undefined;

  get executed() {
    return Boolean(this.node);
  }
  constructor(public operation: Operation<T>) {}

  execute(head: Node<Operation<T>>): void {
    if (this.executed) return;
    const node = head.find(node => node.value.id == this.operation.id);
    if (!node) throw new NotFoundNode(this.operation.id);
    node.softDelete();
    this.node = node;
  }
  undo(): void {
    if (!this.executed) throw new Error('Not Executed');
    this.node!.deleted = false;
    this.node = undefined;
  }
}

export type NodeCommand<T> = NodeInsertCommand<T> | NodeDeleteCommand<T>;

export const generateNodeCommand = <T>(
  operation: Operation<T>,
): NodeCommand<T> => {
  switch (operation.type) {
    case 'insert':
      return new NodeInsertCommand(operation);
    case 'delete':
      return new NodeDeleteCommand(operation);
    default:
      throw new Error(`${operation.type} is ..`);
  }
};
