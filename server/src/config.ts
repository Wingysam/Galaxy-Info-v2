export type GalaxyInfoConfig = { // eslint-disable-line no-unused-vars
  bot: {
    token: string,
    clientSecret: string,
    staffCommands: {
      webhook?: string
    }
  },
  ingest: {
    token?: string,
    verbose: boolean,
    quests: {
      npcHooks?: string[]
    }
  },
  web: {
    port: number,
    frontendBase: string,
    clientId: string
  },
  // TODO: remove galaxy config
  galaxy: {
    guild?: string
  },
  guilds: {
    galaxy?: string,
    galaxyDevelopment?: string,
    galaxySupport?: string,
    bot?: string
  },
  db: {
    queryLog: boolean,
    kvKeys: {
      serializedShips: string,
      serializedTestShips: string,
      serializedTurrets: string,
      gameConstants: string
    }
  },
  bloxlink: {
    apiKey: string
  }
  export: {
    shipKills: {
      allowKillLogForAll: boolean
    }
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
    const nameSplit = name.split('_')
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
  await option('bot_token', 'must')
  await option('bot_clientSecret', 'must')
  await option('bot_staffCommands_webhook', 'should')

  // Ingest service
  await option('ingest_token', 'should')
  await option('ingest_verbose', 'may', false, async opt => opt === 'true')
  await option('ingest_quests_npcHooks', 'should', undefined, async hooks => hooks.split(','))

  // Galaxy Server
  await option('galaxy_guild', 'should')

  // Guilds
  await option('guilds_galaxy', 'should')
  await option('guilds_galaxyDevelopment', 'should')
  await option('guilds_galaxySupport', 'should')
  await option('guilds_bot', 'should')

  // Web
  await option('web_port', 'should', 3000, async port => Number(port))
  await option('web_frontendBase', 'must')
  await option('web_clientId', 'must')

  // DB
  await option('db_queryLog', 'may', false, async opt => opt === 'true')
  await option('db_kvKeys_serializedShips', 'may', 'ships_dump')
  await option('db_kvKeys_serializedTestShips', 'may', 'ships_dump_test')
  await option('db_kvKeys_serializedTurrets', 'may', 'turrets_dump')
  await option('db_kvKeys_gameConstants', 'may', 'game_constants_dump')

  // Bloxlink
  await option('bloxlink_apiKey', 'must')

  // Export
  await option('export_shipKills_allowKillLogForAll', 'may', true)

  return cfg
}
