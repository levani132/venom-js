import {intersects} from "./helpers.js";
import VenomValue from "./venom-value.js";
import VenomElement from "./venom-element.js";
import VenomComponent from "./venom-component.js";

export default {
  get(target, key) {
    try {
      throw new Error();
    } catch (e) {
      const split = e.stack.split(/[\s]*at /);
      const callers = split.map(s => s.replace(/ \((.*?)\)/, ''));
      if (intersects(['Proxy.render', 'Object.templateFunction'], callers) && target[key] && typeof target[key] !== 'function') {
        return target[key];
      } else {
        return target[key].value !== undefined ? target[key].value : target[key];
      }
    }
  },
  set(target, key, value) {
    if (value instanceof VenomValue
      || value instanceof VenomElement
      || value instanceof VenomComponent
      || key === 'length'
      || typeof value === 'function') {
      target[key] = value;
      return true;
    }
    if (target[key] === undefined) {
      target[key] = new VenomValue(value);
      return true;
    } else {
      return target[key].set(value);
    }
  }
};