export class OperationToken implements Operation {
  private constructor(
    public type: Operation['type'],
    public id: Operation['id'],
    public parent?: Operation['parent'],
    public content?: Operation['content'],
  ) {}

  static ofInsert(operation: Pick<Operation, 'content' | 'id' | 'parent'>) {
    return new OperationToken(
      'insert',
      operation.id,
      operation.parent,
      operation.content,
    );
  }
  static ofDelete(operation: Pick<Operation, 'id'>) {
    return new OperationToken('delete', operation.id);
  }
  static hash(token: Operation): string {
    const args: any[] = [token.type, token.id];
    if (token.type == 'insert') args.push(token.parent, token.content);
    return JSON.stringify(args);
  }
  static fromHash(hash: string): OperationToken {
    const [type, id, parent, content] = JSON.parse(hash);
    switch (type as Operation['type']) {
      case 'insert':
        return new OperationToken(type, id, parent, content);
      case 'delete':
        return new OperationToken(type, id);
      default:
        throw new Error('TypeError');
    }
  }
}
