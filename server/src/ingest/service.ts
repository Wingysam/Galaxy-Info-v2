import { EventEmitter } from 'events'

import type { Client } from "discord.js"

export type IngestServiceArg = {
  GalaxyInfo: GalaxyInfo,
  client: Client,
  log: LogFunction
}
type LogFunction = (...message: any[]) => void

export abstract class IngestService extends EventEmitter {
  GalaxyInfo: GalaxyInfo
  client: Client
  log: LogFunction

  constructor({ GalaxyInfo, client, log }: IngestServiceArg) {
    super()
    this.GalaxyInfo = GalaxyInfo
    this.client = client
    this.log = log

    this.init()
  }

  abstract init(): Promise<void>
}