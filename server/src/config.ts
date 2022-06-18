export type GalaxyInfoConfig = { // eslint-disable-line no-unused-vars
  bot: {
    token: string,
    prefix: string
  },
  ingest: {
    token?: string,
    verbose: boolean,
    quests: {
      npcHook?: string
    }
  },
  web: {
    port: number,
    frontendBase: string
  },
  // TODO: remove galaxy config
  galaxy: {
    guild?: string
  },
  guilds: {
    galaxy?: string,
    galaxyDevelopment?: string,
    bot?: string
  },
  db: {
    queryLog: boolean
  }
}

export async function parseConfig (): Promise<GalaxyInfoConfig> {
  function log (...args: any) {
    console.log('[Configuration]', ...args)
  }

  function fail (...reason: any) {
    console.error('[Configuration] Loading configuration failed:', ...reason)
    process.exit(1)
  }

  const cfg: any = {}

  async function option (
    name: string,
    requirementLevel: 'must' | 'should' | 'may',
    fallback?: any,
    handle?: (arg: string) => Promise<any>
  ) {
    let cfgSection: any = cfg
    const nameSplit = name.split('.')
    const key = nameSplit[nameSplit.length - 1]
    for (const part of nameSplit.splice(0, nameSplit.length - 1)) {
      if (!cfgSection[part]) cfgSection[part] = {}
      cfgSection = cfgSection[part]
    }

    async function fb () {
      if (fallback === undefined) return false
      if (typeof fallback === 'function') {
        cfgSection[key] = await fallback()
        if (cfgSection[key]) log(name, 'defaulted to', cfgSection[key])
        return !!cfgSection[key]
      } else {
        cfgSection[key] = fallback
        log(name, 'defaulted to', cfgSection[key])
        return true
      }
    }

    const fromEnv = process.env[name]
    const hasProp = Object.prototype.hasOwnProperty.call(process.env, name)
    if (!hasProp && fromEnv) fail(name, 'is a builtin')

    if (!fromEnv) {
      switch (requirementLevel) {
        case 'must':
          fail(`process.env['${name}'] must be set.`)
          break
        case 'should':
          log(`Warning: process.env['${name}'] is unset.`)
          break
        case 'may':
          break
      }
      await fb()
      return
    }

    if (!handle) {
      cfgSection[key] = fromEnv
      log('Loaded option', name)
      return
    }

    try {
      const handled = await handle(fromEnv)
      if (!handled) throw new Error('failed to parse')

      cfgSection[key] = handled
      log('Loaded option', name)
    } catch (error) {
      fail(error)
    }
  }

  // Primary operations configuration
  await option('bot.token', 'must')
  await option('bot.prefix', 'may', '!')

  // Ingest service
  await option('ingest.token', 'should')
  await option('ingest.verbose', 'may', false, async opt => opt === 'true')
  await option('ingest.quests.npcHook', 'should')

  // Galaxy Server
  await option('galaxy.guild', 'should')

  // Guilds
  await option('guilds.galaxy', 'should')
  await option('guilds.galaxyDevelopment', 'should')
  await option('guilds.bot', 'should')

  // Web
  await option('web.port', 'should', 3000, async port => Number(port))
  await option('web.frontendBase', 'must')

  // DB
  await option('db.queryLog', 'may', false, async opt => opt === 'true')

  return cfg
}
