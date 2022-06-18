export abstract class Weapon {
  abstract dps(range?: number, loyalty?: number): Dps
  abstract alpha(range?: number, loyalty?: number): Alpha
}

export class Alpha {
  shield: number
  hull: number
  max: number
  
  constructor(shield?: number, hull?: number, max?: number) {
    this.shield = shield ?? 0
    this.hull = hull ?? 0
    this.max = max ?? 0
  }

  add(...alphas: Alpha[]) {
    for (const alpha of alphas) {
      this.shield += alpha.shield
      this.hull += alpha.hull
      this.max += alpha.max
    }

    return this
  }

  multiply(multiplier: number) {
    this.shield *= multiplier
    this.hull *= multiplier
    this.max *= multiplier

    return this
  }
}

export class Dps {
  shield: number
  hull: number
  
  constructor(shield?: number, hull?: number) {
    this.shield = shield ?? 0
    this.hull = hull ?? 0
  }

  add(...dpses: Dps[]) {
    for (const dps of dpses) {
      this.shield += dps.shield
      this.hull += dps.hull
    }

    return this
  }

  multiply(count: number) {
    this.shield *= count
    this.hull *= count

    return this
  }

  get average() {
    return (this.shield + this.hull) / 2
  }
}