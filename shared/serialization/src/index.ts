type Serialized = [
  'object' | 'array' | 'bigint' | 'date' | 'error' | 'undefined' | 'native',
  any?
]

export function serialize (data: any): Serialized {
  if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean' || data === null) {
    return ['native', data]
  } else if (Object.prototype.toString.call(data) === '[object Object]') {
    const result: any = []
    for (const [key, value] of Object.entries(data)) {
      result.push([ key, serialize(value) ])
    }
    return ['object', result]
  } else if (Object.prototype.toString.call(data) === '[object Array]') {
    return ['array', data.map(serialize)]
  } else if (typeof data === 'bigint') {
    return ['bigint', data.toString()]
  } else if (data instanceof Date) {
    return ['date', data.toISOString()]
  } else if (data instanceof Error) {
    return ['error', data.message ?? JSON.stringify(data) ?? data ?? 'unknown error']
  } else if (typeof data === 'undefined') {
    return ['undefined']
  } else {
    if (globalThis.console) globalThis.console.log({unserializableData: data, type: typeof data })
    throw new Error('data unserializable')
  }
}

const deserializers = {
  object (data: any) {
    const result = {}
    for (const [ key, value ] of data) {
      result[key] = deserialize(value)
    }
    return result
  },

  array (data: any) {
    return data.map(deserialize)
  },

  bigint (data: any) {
    return BigInt(data)
  },

  date (data: any) {
    return new Date(data)
  },

  error (data: any) {
    return new Error(data)
  },

  undefined () {
    return
  },

  native (data: any) {
    return data
  }
}

export function deserialize (serialized: Serialized): any {
  if (typeof serialized !== 'object') throw new Error(`Expected serialized data to be an object. Got ${typeof serialized}.`)
  if (!serialized) throw new Error(`Serialized data is expected to be truthy. Data: ${serialized}`)

  const deserializer = deserializers[serialized[0]]
  return deserializer(serialized[1])
}
