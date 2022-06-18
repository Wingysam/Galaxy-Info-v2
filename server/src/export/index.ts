type ConstructorArg = {
  GalaxyInfo: GalaxyInfo
}

function log (...message: any[]) {
  console.log('[Export]', ...message)
}

export class ExportService {
  private GalaxyInfo
  constructor ({ GalaxyInfo }: ConstructorArg) {
    this.GalaxyInfo = GalaxyInfo
    this.init()
  }

  async init () {
    return [ this.GalaxyInfo, log ]
  }
}
