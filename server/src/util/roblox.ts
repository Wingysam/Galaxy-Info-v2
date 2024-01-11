import fetch from 'node-fetch'
import { sleep } from './sleep'

import prisma from '../prismaClient'

interface RobloxAPIGetByUsername {
  data: Array<{
    id: number
    // and others that are not used
  }>
}

interface RobloxAPIGetByUserId {
  id: number
  name: string
  // has other properties that aren't used
}

function log (...message: any[]) {
  console.log('[Roblox Interface]', ...message)
}

class GalaxyInfoRobloxInterface {
  private readonly nameToIdQueue: Array<{
    name: string
    resolve: (id: bigint) => unknown
    reject: (err: unknown) => unknown
  }> = []

  private runningNameToIdQueue = false

  /**
   * Maps a Roblox username to an ID
   * @param name the name of the Roblox user
   * @returns the ID of the Roblox user
   */
  async nameToId (name: string): Promise<bigint> {
    const promise = new Promise((resolve, reject) => {
      this.nameToIdQueue.push({ name, resolve, reject })
    })
    void this.checkNameToIdQueue()
    return await promise as bigint
  }

  private async checkNameToIdQueue () {
    if (this.runningNameToIdQueue) return
    this.runningNameToIdQueue = true

    log('starting name to id queue')

    while (this.nameToIdQueue.length > 0) {
      const queueItem = this.nameToIdQueue.shift()
      if (!queueItem) break
      const { name, resolve, reject } = queueItem
      try {
        const output = await this.runNameToId(name)
        resolve(output)
      } catch (err) {
        reject(err)
      }
    }

    this.runningNameToIdQueue = false
  }

  private async runNameToId (name: string, backoff?: number): Promise<bigint> {
    if (typeof backoff === 'number') {
      await sleep(backoff)
    }

    name = name.toLowerCase()
    const existing = await prisma.user.findUnique({
      where: {
        name
      }
    })
    if (typeof existing?.id === 'bigint') return existing.id

    let fromRoblox: RobloxAPIGetByUsername
    let text
    try {
      text = await (await fetch('https://users.roblox.com/v1/usernames/users', {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({ usernames: [name] })
      })).text()
      fromRoblox = (JSON.parse(text) as RobloxAPIGetByUsername)
    } catch {
      backoff = Math.min(10000, typeof backoff === 'number' ? backoff * 2 : 1000)
      log(name, backoff, 'Roblox API returned an invalid response', text)
      return await this.runNameToId(name, backoff)
    }

    if (fromRoblox.data.length === 0) {
      log('Failed to fetch', name, fromRoblox)
      return 0n
    }

    try {
      await prisma.user.upsert({
        create: {
          name,
          id: fromRoblox.data[0].id
        },
        update: {
          id: fromRoblox.data[0].id
        },
        where: {
          name
        }
      })
    } catch {
      log(name, 'Already exists')
      return BigInt(fromRoblox.data[0].id)
    }
    log('Saved data for', name)
    return BigInt(fromRoblox.data[0].id)
  }

  /**
   * Maps a Roblox ID to a username
   * @param id The ID of the Roblox user
   * @returns the name of the Roblox user
   */
  async idToName (id: bigint, backoff?: number): Promise<string> {
    if (typeof backoff === 'number') {
      await sleep(backoff)
    }

    const existing = await prisma.user.findFirst({
      where: {
        id
      }
    })
    if (existing) return existing.name

    let fromRoblox: RobloxAPIGetByUserId
    let text
    try {
      text = await (await fetch(`https://users.roblox.com/v1/users/${encodeURIComponent(id.toString())}`)).text()
      fromRoblox = (JSON.parse(text) as RobloxAPIGetByUserId)
    } catch {
      backoff = Math.min(10000, typeof backoff === 'number' ? backoff * 2 : 1000)
      log(id, backoff, 'Roblox API returned an invalid response', text)
      return await this.idToName(id, backoff)
    }

    try {
      await prisma.user.create({
        data: {
          name: fromRoblox.name,
          id
        }
      })
    } catch {
      log('Already exists')
      return fromRoblox.name
    }
    log('Saved data for', fromRoblox)
    return fromRoblox.name
  }
}

export default new GalaxyInfoRobloxInterface()
