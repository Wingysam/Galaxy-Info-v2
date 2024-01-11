import { ShipKillsExport } from './ShipKills'

interface ConstructorArg {
  GalaxyInfo: GalaxyInfo
}

function log (...message: any[]) {
  console.log('[Export]', ...message)
}

export class ExportService {
  private readonly GalaxyInfo
  shipKills!: ShipKillsExport
  constructor ({ GalaxyInfo }: ConstructorArg) {
    this.GalaxyInfo = GalaxyInfo
    void this.init()
  }

  async init () {
    this.shipKills = new ShipKillsExport({
      GalaxyInfo: this.GalaxyInfo,
      log
    })
    return [this.GalaxyInfo, log]
  }
}
