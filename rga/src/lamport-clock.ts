export class LamportClock {
  private time: number

  constructor(initialTime = 0) {
    this.time = initialTime
  }

  reset(initialTime = 0): void {
    this.time = initialTime
  }

  tick(): number {
    return ++this.time
  }

  update(time: number): void {
    this.time = Math.max(time, this.time)
  }

  getTime(): number {
    return this.time
  }
}
