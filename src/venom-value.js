import IdService from "./id-service.js";
import VenomValueHandlers from "./venom-value-handler.js";
import UpdateHandler from "./update-handler.js";
import ArrayHandler from "./array-handler.js";
import draw from './drawer.js';
import Venom from './venom.js';
import {parseValue} from "./helpers.js";
import VenomElement from "./venom-element.js";
import VenomComponent from "./venom-component.js";

export default class VenomValue {
  id;
  value;
  elemRefs = [];
  constructor(value) {
    this.id = IdService.nextId();
    this.value = this.transformValue(value);
    return new Proxy(this, VenomValueHandlers);
  }

  get = () => {
    return parseValue(this.value);
  };
  
  set = value => {
    value = this.transformValue(value);
    if (this && this.value === value) {
      return true;
    }
    this.value = value;
    this.elemRefs.forEach(({ ref, updateHandler }) => {
      updateHandler(ref, this.value);
    });
    return true;
  };

  transformValue = value => {
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        value = value.map(item => item instanceof VenomValue
          || item instanceof VenomComponent
          || item instanceof VenomElement ? item : new VenomValue(item));
        value._push = value.push;
        value.push = this.push;
        value._pop = value.pop;
        value.pop = this.pop;
        value = new Proxy(value, ArrayHandler)
      } else {
        const newValue = new Proxy({}, UpdateHandler);
        for (let key in value) {
          newValue[key] = value[key];
        }
        value = newValue;
      }
    }
    return value;
  };

  copy = () => {
    const res = new VenomValue(this.value);
    this.elemRefs.push({
      ref: res,
      updateHandler: (ref, value) => ref.set(value)
    });
    return res;
  };

  domPush = item => this.elemRefs.forEach(ref => {
    const newRef = ref.templateFunction(item, ref.ref.length - 1, this.value);
    const lastReference = ref.ref[ref.ref.length - 1].elemRef;
    lastReference.parentNode.insertBefore(draw(newRef), lastReference.nextSibling);
    ref.ref.push(newRef);
  });

  push = (...items) => {
    items = items.map(item => item instanceof VenomElement || item instanceof VenomComponent ? item : new VenomValue(item));
    items.forEach(item => this.value[this.value.length] = item);
    items.forEach(this.domPush);
  };

  domPop = () => {
    this.elemRefs.forEach(ref => {
      if (ref.ref.length === 1) return;
      ref.ref[ref.ref.length - 1].__remove__();
      ref.ref.pop();
    });
  };

  pop = () => {
    this.domPop();
    return this.value._pop();
  };

  map = (templateFunction, thisArg) => {
    if (!Array.isArray(this.value)) {
      throw new TypeError("you can't map over objects");
    }
    if (thisArg) {
      templateFunction = templateFunction.bind(thisArg);
    }
    const elements = [Venom.createElement('span', {}, []), ...this.value.map(templateFunction)];
    this.elemRefs.push({
      ref: elements,
      templateFunction,
      updateHandler: (ref, value) => {
        while (value.length < ref.length - 1) {
          this.domPop();
        }
        value.forEach((item, index) => {
          if (index < ref.length - 1) {
            const newRef = templateFunction(item, index, value);
            ref[index + 1].elemRef.parentNode.replaceChild(draw(newRef), ref[index + 1].elemRef);
            ref[index + 1] = newRef;
          } else {
            this.domPush(item);
          }
        });
      }
    });
    return elements;
  };
};
