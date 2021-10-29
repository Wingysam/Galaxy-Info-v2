type ConstructorArg = {
  GalaxyInfo: GalaxyInfo
}

export class IngestService {
  private GalaxyInfo

  constructor ({ GalaxyInfo }: ConstructorArg) {
    this.GalaxyInfo = GalaxyInfo
    this.init()
  }

  async init () {
    if (!this.GalaxyInfo.config.ingest?.token) return
    console.log('init')
  }
}
