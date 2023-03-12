import fetch from 'node-fetch'
import { sleep } from './sleep'

import prisma from '../prismaClient'

type RobloxAPIGetByUsername = {
  code: number,
  message: string
} | {
  success: false,
  errorMessage: string
} | {
  Id: number,
  username: string
  // has other properties, but they aren't used by this
}

type RobloxAPIGetByUserId = {
  id: number
  name: string
  // has other properties that aren't used
}

function log (...message: any[]) {
  console.log('[Roblox Interface]', ...message)
}

class GalaxyInfoRobloxInterface {
  constructor () {
  }

  /**
   * Maps a Roblox username to an ID
   * @param name the name of the Roblox user
   * @returns the ID of the Roblox user
   */
  async nameToId (name: string, backoff?: number): Promise<bigint> {
    if (backoff) {
      await sleep(backoff)
    }
    name = name.toLowerCase()
    const existing = await prisma.user.findUnique({
      where: {
        name
      }
    })
    if (existing?.id) return existing.id

    let fromRoblox: RobloxAPIGetByUsername
    let text
    try {
      text = await (await fetch(`https://api.roblox.com/users/get-by-username?username=${encodeURIComponent(name)}`)).text()
      fromRoblox = (JSON.parse(text) as RobloxAPIGetByUsername)
    } catch {
      backoff = Math.min(10000, backoff ? backoff * 2 : 1000)
      log(name, backoff, 'Roblox API returned an invalid response', text)
      return this.nameToId(name, backoff)
    }

    if ('success' in fromRoblox) { // success is undefined when it should be true, success being present means it's false
      if (fromRoblox.success) {
        log('my assumption about success was wrong', fromRoblox)
        process.exit()
      }
      fromRoblox = {
        Id: -1,
        username: name
      }
    }

    if ('code' in fromRoblox) {
      log('Failed to fetch', name, fromRoblox)
      return 0n
    } // 5xx i think

    try {
      await prisma.user.upsert({
        create: {
          name,
          id: fromRoblox.Id
        },
        update: {
          id: fromRoblox.Id
        },
        where: {
          name
        }
      })
    } catch {
      log(name, 'Already exists')
      return BigInt(fromRoblox.Id)
    }
    log('Saved data for', name)
    return BigInt(fromRoblox.Id)
  }

  /**
   * Maps a Roblox ID to a username
   * @param id The ID of the Roblox user
   * @returns the name of the Roblox user
   */
  async idToName (id: bigint, backoff?: number): Promise<string> {
    if (backoff) {
      await sleep(backoff)
    }

    const existing = await prisma.user.findFirst({
      where: {
        id: id
      }
    })
    if (existing) return existing.name

    let fromRoblox: RobloxAPIGetByUserId
    let text
    try {
      text = await (await fetch(`https://users.roblox.com/v1/users/${encodeURIComponent(id.toString())}`)).text()
      fromRoblox = (JSON.parse(text) as RobloxAPIGetByUserId)
    } catch {
      backoff = Math.min(10000, backoff ? backoff * 2 : 1000)
      log(id, backoff, 'Roblox API returned an invalid response', text)
      return this.idToName(id, backoff)
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