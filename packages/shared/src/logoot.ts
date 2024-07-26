type PositionID = number[];

export interface Operation {
  type: 'insert' | 'remove';
  posId: PositionID;
  character?: string;
}

export class Logoot {
  document: { pos: PositionID; char: string }[] = [];

  private generatePositionID(prevPos: PositionID, nextPos: PositionID): PositionID {
    const newPos: PositionID = [];
    for (let i = 0; i < Math.max(prevPos.length, nextPos.length); i++) {
      const prev = prevPos[i] || 0;
      const next = nextPos[i] || 10;
      const mid = Math.floor((prev + next) / 2);
      newPos.push(mid);
      if (prev + 1 < next) break;
    }
    return newPos;
  }

  public insert(position: number, character: string): void {
    const prevPos = position === 0 ? [] : this.document[position - 1].pos;
    const nextPos = position === this.document.length ? [] : this.document[position].pos;
    const newPos = this.generatePositionID(prevPos, nextPos);
    this.document.splice(position, 0, { pos: newPos, char: character });
  }

  public remove(position: number): void {
    this.document.splice(position, 1);
  }

  public getDocument(): string {
    return this.document.map(entry => entry.char).join('');
  }

  public applyOperation(op: Operation): void {
    if (op.type === 'insert' && op.character !== undefined) {
      const position = this.findInsertPosition(op.posId);
      this.document.splice(position, 0, { pos: op.posId, char: op.character });
    } else if (op.type === 'remove') {
      const position = this.findPosition(op.posId);
      if (position !== -1) {
        this.remove(position);
      }
    }
  }

  private findPosition(posId: PositionID): number {
    return this.document.findIndex(entry => JSON.stringify(entry.pos) === JSON.stringify(posId));
  }

  private findInsertPosition(posId: PositionID): number {
    for (let i = 0; i < this.document.length; i++) {
      if (this.comparePosIds(posId, this.document[i].pos) < 0) {
        return i;
      }
    }
    return this.document.length;
  }

  private comparePosIds(posId1: PositionID, posId2: PositionID): number {
    for (let i = 0; i < Math.max(posId1.length, posId2.length); i++) {
      const val1 = posId1[i] || 0;
      const val2 = posId2[i] || 0;
      if (val1 < val2) return -1;
      if (val1 > val2) return 1;
    }
    return 0;
  }

  public merge(operations: Operation[]): void {
    operations.forEach(op => {this.applyOperation(op)});
  }
}

