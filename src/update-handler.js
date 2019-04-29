import ReservedKeys from './reserved-keys.js';
import VenomValue from './venom-value.js';
import VenomComponent from './venom-component.js';
import {parseValue} from "./helpers.js";

const intersects = (arr1, arr2) => arr1.reduce((res, cur) => res || arr2.includes(cur), false);

export default {
  get(target, key) {
    if (key === 'get') {
      return () => parseValue(target);
    }
    try {
      throw new Error();
    } catch (e) {
      const split = e.stack.split(/[\s]*at /);
      const callers = split.map(s => s.replace(/ \((.*?)\)/, ''));
      if (intersects(['Proxy.render', 'Object.templateFunction'], callers) && target['__' + key] && typeof target[key] !== 'function') {
        return target['__' + key];
      } else {
        return target['__' + key] ? target['__' + key].value : target[key];
      }
    }
  },
  set(target, key, value) {
    if (typeof(value) === 'function' || value instanceof VenomValue || ReservedKeys.includes(key)) {
      target[key] = value;
      return true;
    }
    if (target['__' + key] === undefined) {
      target['__' + key] = new VenomValue(value);
      return true;
    } else {
      return target['__' + key].set(value);
    }
  }
};

const UpdateComponent = (target, abstractValue) => {
  target.children.forEach(child => {
    if (child instanceof VenomValue && child.id === abstractValue.id) {
      child.value = abstractValue.value;
      child.elemRef.data = child.value;
    }
    if (child instanceof VenomComponent) {
      UpdateComponent(child, abstractValue);
    }
  });
};