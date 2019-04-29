export const parseValue = target => {
  if (typeof target !== 'object') {
    return target;
  }
  if (Array.isArray(target)) {
    return target.map(value => parseValue(value));
  }
  const res = {};
  Object.keys(target).forEach(key => res[key.substr(2)] = target[key].get());
  return res;
};