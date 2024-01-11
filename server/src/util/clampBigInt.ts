export async function min (one: bigint, two: bigint) {
  return one < two ? one : two
}

export async function max (one: bigint, two: bigint) {
  return one > two ? one : two
}

export async function clamp (value: bigint, minValue: bigint, maxValue: bigint) {
  return await min(await max(value, minValue), maxValue)
}
