/**
 * Waits `time` ms then returns
 * @param time how long to wait (milliseconds)
 */
export async function sleep (time: number): Promise<void> {
  await new Promise(resolve => setTimeout(() => { resolve(undefined) }, time))
}
