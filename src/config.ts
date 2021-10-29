export default async function parseConfig (): Promise<GalaxyInfo['config']> {
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
    fallback?: string | (() => Promise<undefined | string>),
    handle?: (arg: string) => Promise<undefined | string>
  ) {
    let cfgSection: any = cfg
    const nameSplit = name.split('.')
    const key = nameSplit[nameSplit.length - 1]
    for (const part of nameSplit.splice(0, nameSplit.length - 1)) {
      if (!cfgSection[part]) cfgSection[part] = {}
      cfgSection = cfgSection[part]
    }

    async function fb () {
      switch (typeof fallback) {
        case 'function':
          cfgSection[key] = await fallback()
          if (cfgSection[key]) log(name, 'defaulted to', cfgSection[key])
          return !!cfgSection[key]
        case 'string':
          cfgSection[key] = fallback
          log(name, 'defaulted to', cfgSection[key])
          return true
      }
      return false
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

    const handled = await handle(fromEnv)
    if (handled) fail(handled)
    cfgSection[key] = fromEnv
    log('Loaded option', name)
  }

  // Primary operations configuration
  await option('bot.token', 'must')
  await option('bot.prefix', 'may', '!')

  // Ingest service
  await option('ingest.token', 'should')

  // Web
  await option('web.port', 'should', '3000')

  return cfg
}
