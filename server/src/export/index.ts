import { ShipKillsExport } from "./ShipKills"

type ConstructorArg = {
  GalaxyInfo: GalaxyInfo
}

function log (...message: any[]) {
  console.log('[Export]', ...message)
}

export class ExportService {
  private GalaxyInfo
  shipKills!: ShipKillsExport
  constructor ({ GalaxyInfo }: ConstructorArg) {
    this.GalaxyInfo = GalaxyInfo
    this.init()
  }

  async init () {
    this.shipKills = new ShipKillsExport({
      GalaxyInfo: this.GalaxyInfo,
      log
    })
    return [ this.GalaxyInfo, log ]
  }
}
