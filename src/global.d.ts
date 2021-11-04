/* eslint no-unused-vars: 0 */

export {}

declare global {
  namespace Express {
    interface Request {
      discordUser?: any
    }
  }
}
