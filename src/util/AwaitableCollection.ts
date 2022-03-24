import { Collection } from "discord.js"

export class AwaitableCollection<K, V> extends Collection<K, V> {
  private waits: Map<K, ((value: V) => any)[]>
  constructor (iterable?: Iterable<readonly [K, V]>) {
    super(iterable ?? [])
    this.waits = new Map()
  }

  wait (key: K) {
    return new Promise((resolve) => {
      const got = this.get(key)
      if (got) return resolve(got)
      const waitsInMap = this.waits.get(key)
      const wait = waitsInMap ?? []
      if (!waitsInMap) this.waits.set(key, wait)
      wait.push(resolve)
    })
  }

  set (key: K, value: V) {
    const waits = this.waits.get(key) ?? []
    waits.forEach(wait => wait(value))
    this.waits.set(key, [])
    return super.set(key, value)
  }
}