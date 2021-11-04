export class Api {
  constructor({ store }) {
    this.store = store
  }

  async http (path, options = {}) {
    let qs = ''
    if (Object.prototype.hasOwnProperty.call(options, 'qs'))
      qs = '?' + Object.entries(options.qs).map(option => `${option[0]}=${encodeURIComponent(option[1])}`)

    if (!Object.prototype.hasOwnProperty.call(options, 'headers')) options.headers = {}
    options.headers['X-Discord-Token'] = this.store.state.discordToken

    const res = await fetch(process.env.VUE_APP_API + path + qs, options)
    const json = await res.json()
    return json
  }
}
