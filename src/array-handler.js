import {intersects} from "./helpers.js";

export default {
  get(target, key) {
    try {
      throw new Error();
    } catch (e) {
      const split = e.stack.split(/[\s]*at /);
      const callers = split.map(s => s.replace(/ \((.*?)\)/, ''));
      if (intersects(['Proxy.render', 'Object.templateFunction'], callers) && target['__' + key] && typeof target[key] !== 'function') {
        return target[key];
      } else {
        return target[key].value !== undefined ? target[key].value : target[key];
      }
    }
  }
};