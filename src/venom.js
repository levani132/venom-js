import draw, {valuer} from "./drawer.js";
import VenomElement from "./venom-element.js";
import { VenomParser } from "./venom-parser.js";
import VenomValue from "./venom-value.js";

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
        } else {
          item[prop] = props[prop].map(valuer).join('');
        }
      }
    }
    item.children = children;
    return item;
  };
};



export const template = (strings, ...vars) => {
  return new VenomParser(strings, vars).parse();
};