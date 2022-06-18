import { promisify } from 'node:util'

import Nodemw from 'nodemw'

export class Galaxypedia extends Nodemw {
  constructor() {
    super({
      server: 'robloxgalaxy.wiki'
    })

    this.getImageInfo = promisify(super.getImageInfo)
  }
}