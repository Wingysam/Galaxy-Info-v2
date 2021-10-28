/* eslint no-unused-vars: 0 */
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      name: string;
    }
  }

  type GalaxyInfo = {
    config: {
      token: string
    }
  }
}

export { }
