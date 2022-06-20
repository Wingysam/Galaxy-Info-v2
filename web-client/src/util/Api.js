import { serialize, deserialize } from '@galaxyinfo/galaxy-info-serialization'

const sleep = time => new Promise(resolve => setTimeout(resolve, time))
export class Api {
  constructor({ store }) {
    this.store = store
  }

  async http (path, options = {}) {
    if (!Object.prototype.hasOwnProperty.call(options, 'headers')) options.headers = {}

    let qs = ''
    if (Object.prototype.hasOwnProperty.call(options, 'qs'))
      qs = '?' + Object.entries(options.qs).map(option => `${option[0]}=${encodeURIComponent(option[1])}`)

    if (options.post) {
      options.method = 'POST'
      options.headers['content-type'] = 'application/json'
      options.body = JSON.stringify(serialize(options.post))
    }

    options.headers['X-Discord-Token'] = this.store.state.discordToken

    const res = await fetch(process.env.VUE_APP_API + path + qs, options)
    const json = await res.json()
    return deserialize(json)
  }

  async discord (path, options = {}) {
    let qs = ''
    if (Object.prototype.hasOwnProperty.call(options, 'qs'))
      qs = '?' + Object.entries(options.qs).map(option => `${option[0]}=${encodeURIComponent(option[1])}`)

    if (!Object.prototype.hasOwnProperty.call(options, 'headers')) options.headers = {}
    options.headers.Authorization = 'Bearer ' + this.store.state.discordToken

    const res = await fetch('https://discord.com/api/v9' + path + qs, options)
    const json = await res.json()

    if (json.retry_after) {
      console.log('discord api ratelimited', json.retry_after)
      await sleep(json.retry_after * 1000)
      return this.discord(path, options)
    }
    return json
  }
}
