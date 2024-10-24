import { Command, Operation } from './interface';
import { Node } from './node';

export class DocInsertCommand implements Command {
  private node: Node<string> | undefined;
  constructor(public operation: Operation<string>) {}
  get executed() {
    return Boolean(this.node);
  }
  execute(head: Node<string>): void {
    if (this.executed) return;
    const { id, parent: parentId, value } = this.operation;
    const node = new Node(value!, id);
    let parent: Node<string> | undefined;
    if (!parentId) {
      parent = head.findHead();
    } else {
      parent = head.find(parentId);
    }
    if (!parent) throw new Error('Not Found Parent');
    parent.append(node);
    this.node = node;
  }
  undo(): void {
    if (!this.executed) throw new Error('Not Executed');
    this.node!.delete(true);
    this.node = undefined;
  }
}

export class DocDeleteCommand implements Command {
  private node: Node<string> | undefined;

  get executed() {
    return Boolean(this.node);
  }
  constructor(public operation: Operation<string>) {}

  execute(head: Node<string>): void {
    if (this.executed) return;
    const node = head.find(this.operation.id);
    if (!node) throw new Error('Not Found Node');
    node.delete();
    this.node = node;
  }
  undo(): void {
    if (!this.executed) throw new Error('Not Executed');
    this.node!.deleted = false;
    this.node = undefined;
  }
}

export type DocCommand = DocInsertCommand | DocDeleteCommand;
