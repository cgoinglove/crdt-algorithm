export class OperationToken implements Token {
  type: 'insert' | 'remove';
  id: OID;
  text?: string;

  private constructor(type: 'insert' | 'remove', id: OID, text?: string) {
    this.type = type;
    this.id = id;
    this.text = text;
  }

  static of(type: 'insert' | 'remove', id: OID, text?: string): OperationToken {
    return new OperationToken(type, id, text);
  }
  static fromHash(hash: string): OperationToken {
    const [type, id, text] = JSON.parse(hash);
    return OperationToken.of(type as Token['type'], id, text);
  }

  hash(): string {
    return JSON.stringify([this.type, this.id, this.text || '']);
  }
}
