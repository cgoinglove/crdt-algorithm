export class LamportClock {
  constructor(private time = 0) {}
  tick(): number {
    return ++this.time;
  }
  update(time: number): void {
    this.time = Math.max(time, this.time);
  }
  getTime(): number {
    return this.time;
  }
}
