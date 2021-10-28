type Arg = {
  GalaxyInfo: GalaxyInfo
}

export default async function Ingest ({
  GalaxyInfo
}: Arg) {
  if (!GalaxyInfo.config.ingest?.token) return
  console.log('Ingest initializing')
}
