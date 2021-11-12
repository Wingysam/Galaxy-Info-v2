/* eslint no-unused-vars: 0 */

export {}

declare global {
  namespace Express {
    interface Request {
      discordUser?: any
    }
  }

  type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>
  type AllProps<T> = { [P in keyof T]: Required<NonNullable<T[P]>>; };
}
