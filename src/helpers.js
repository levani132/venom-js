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

export const intersects = (arr1, arr2) => arr1.reduce((res, cur) => res || arr2.includes(cur), false);