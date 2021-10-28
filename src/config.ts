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
    async function fb () {
      switch (typeof fallback) {
        case 'function':
          cfg[name] = await fallback()
          if (cfg[name]) log(name, 'defaulted to', cfg[name])
          return !!cfg[name]
        case 'string':
          cfg[name] = fallback
          log(name, 'defaulted to', cfg[name])
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
          fail(`process.env.${name} must be set.`)
          break
        case 'should':
          log(`Warning: process.env.${name} is unset.`)
          break
        case 'may':
          break
      }
      await fb()
      return
    }

    if (!handle) {
      cfg[name] = fromEnv
      log('Loaded option', name)
      return
    }

    const handled = await handle(fromEnv)
    if (handled) fail(handled)
    cfg[name] = fromEnv
    log('Loaded option', name)
  }

  await option('token', 'must')
  await option('prefix', 'may', '!')

  return cfg
}
