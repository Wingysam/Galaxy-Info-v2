/* eslint no-unused-vars: 0 */
declare global {
  type GalaxyInfo = {
    config: {
      token: string
      prefix: string,
      ingest?: {
        token?: string
      }
    }
  }
}

export {}
