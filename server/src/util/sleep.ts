/**
 * Waits `time` ms then returns
 * @param time how long to wait (milliseconds)
 */
export function sleep (time: number): Promise<void> {
  return new Promise(resolve => setTimeout(() => resolve(), time))
}
