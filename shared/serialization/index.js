var __defProp = Object.defineProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
__export(exports, {
  deserialize: () => deserialize,
  serialize: () => serialize
});
function serialize(data) {
  const bigints = [];
  const objects = [];
  const arrays = [];
  const dates = [];
  const errors = [];
  const result = {};
  if (typeof data === "string") {
    return {
      bigints,
      objects,
      arrays,
      dates,
      errors,
      data
    };
  }
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "bigint") {
      result[key] = value.toString();
      bigints.push(key);
    } else if (Object.prototype.toString.call(value) === "[object Object]") {
      result[key] = serialize(value);
      objects.push(key);
    } else if (Object.prototype.toString.call(value) === "[object Array]") {
      result[key] = value.map(serialize);
      arrays.push(key);
    } else if (value instanceof Date) {
      result[key] = value.toISOString();
      dates.push(key);
    } else if (value instanceof Error) {
      result[key] = value.message ?? JSON.stringify(value) ?? value ?? "unknown error";
      errors.push(key);
    } else {
      result[key] = value;
    }
  }
  return {
    bigints,
    objects,
    arrays,
    dates,
    errors,
    data: result
  };
}
function deserialize(serialized) {
  if (typeof serialized !== "object")
    throw new Error(`Expected serialized data to be an object. Got ${typeof serialized}.`);
  if (!serialized)
    throw new Error(`Serialized data is expected to be truthy. Data: ${serialized}`);
  for (const bigint of serialized.bigints) {
    serialized.data[bigint] = BigInt(serialized.data[bigint]);
  }
  for (const obj of serialized.objects) {
    serialized.data[obj] = deserialize(serialized.data[obj]);
  }
  for (const arr of serialized.arrays) {
    serialized.data[arr] = serialized.data[arr].map(deserialize);
  }
  for (const date of serialized.dates) {
    serialized.data[date] = new Date(serialized.data[date]);
  }
  for (const error of serialized.errors) {
    serialized.data[error] = new Error(serialized.data[error]);
  }
  return serialized.data;
}
