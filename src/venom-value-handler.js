export default {
  get(target, key) {
    if (target[key] !== undefined) {
      return target[key];
    }
    return target.value[key];
  },
  set(target, key, value) {
    target[key] = value;
    return true;
  }
};