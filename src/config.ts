export default async function parseConfig (): Promise<GalaxyInfo['config']> {
  function log (...args: any) {
    console.log('[Configuration]', ...args)
  }

  function fail (...reason: any) {
    console.error('[Configuration] Loading configuration failed:', ...reason)
    process.exit(1)
  }

  const cfg: any = {}

  async function option (name: string, requirementLevel: 'must' | 'should' | 'may', handle?: (arg: string) => Promise<undefined|string>) {
    const hasProp = Object.prototype.hasOwnProperty.call(process.env, name)
    if (!hasProp && process.env[name]) fail(name, 'is a builtin')

    if (!hasProp) {
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
      return
    }

    if (!handle) {
      cfg[name] = process.env[name]
      log('Loaded option', name)
      return
    }

    const handled = await handle(process.env[name])
    if (handled) fail(handled)
    cfg[name] = process.env[name]
    log('Loaded option', name)
  }

  await option('token', 'must')

  return cfg
}
