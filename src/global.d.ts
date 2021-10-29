/* eslint no-unused-vars: 0 */
declare global {
  type GalaxyInfo = {
    config: {
      bot: {
        token: string,
        prefix: string
      },
      ingest: {
        token?: string
      },
      web: {
        port: string
      }
    }
  }
}

export {}
