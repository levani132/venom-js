import draw, {valuer} from "./drawer.js";
import VenomElement from "./venom-element.js";
import { VenomParser } from "./venom-parser.js";
import VenomValue from "./venom-value.js";
import VenomComponent from "./venom-component.js";

export default class Venom {
  static mount = (el, Component) => {
    const component = new Component();
    const element = draw(component);
    component.elemRef = element;
    document.querySelector(el).innerHTML = "";
    document.querySelector(el).append(element);
    component.isMounted = true;
  };
  
  static createElement = (name, props, children) => {
    if (typeof(name) === 'string') {
      const item = new VenomElement();
      item.elem = name;
      item.props = props;
      item.children = children || [];
      return item;
    }
    const item = new name();
    for (let prop in props) {
      if (props.hasOwnProperty(prop)) {
        if (!Array.isArray(props[prop])) {
          props[prop] = [props[prop]];
        }
        props[prop] = props[prop].filter(item => item !== '');
        if (props[prop].length === 1 && props[prop][0] instanceof VenomValue) {
          item['__' + prop] = props[prop][0];
          item[prop] = props[prop][0].value;
        } else if (props[prop].length === 1 && typeof props[prop][0] === 'function') {
          item[prop] = props[prop][0];
        } else {
          item[prop] = props[prop].map(valuer).join('');
        }
      }
    }
    item.children = children;
    // IMPORTANT: First lifecycle hook called on component creation.
    if (item.onCreate && typeof item.onCreate === 'function') item.onCreate();
    return item;
  };
};



export const template = (strings, ...vars) => {
  return new VenomParser(strings, vars).parse();
};

export const render = component => {
  if (VenomComponent.isPrototypeOf(component)) {
    return new component().render();
  } else {
    return {
      templateFunction: component
    }.templateFunction();
  }
}