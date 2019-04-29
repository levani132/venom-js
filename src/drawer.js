import VenomComponent from "./venom-component.js";
import VenomValue from "./venom-value.js";
import VenomElement from "./venom-element.js";

export const valuer = item => item instanceof VenomValue ? item.value : item;

const isAllWhiteSpace = string => Array.from(string).reduce((p, c) => p && /\s/.test(c), true);

const draw = item => {
  if (item instanceof VenomElement) {
    const elem = document.createElement(item.elem);
    Object.keys(item.props).forEach(prop => {
      if (typeof item.props[prop] === 'function') {
        return elem[prop] = item.props[prop];
      }
      if (!Array.isArray(item.props[prop])) {
        let updateHandler;
        if (prop === 'class') {
          updateHandler = (ref, value) => ref[prop] = value;
        } else {
          updateHandler = (ref, value) => value.split(' ').forEach(item => !isAllWhiteSpace(item) && ref.classList.add(item));
        }
        updateHandler(elem, valuer(item.props[prop]));
      } else {
        item.props[prop] = item.props[prop].filter(item => item !== '');
        const getUpdateHandler = i => prop === 'class' ? (ref, value) => {
          ref[prop] = item.props[prop].slice(0, i).map(valuer).join('') + value + item.props[prop].slice(i + 1).map(valuer).join('');
        } : (ref, value) => {
          (item.props[prop].slice(0, i).map(valuer).join('') + value + item.props[prop].slice(i + 1).map(valuer).join('')).split(' ').forEach(item => !isAllWhiteSpace(item) && ref.classList.add(item));
        };
        if (prop === 'class') {
          item.props[prop].map(valuer).join('').split(' ').forEach(item => !isAllWhiteSpace(item) && elem.classList.add(item));
        } else {
          elem[prop] = item.props[prop].map(valuer).join('');
        }
        item.props[prop].forEach((propItem, i) => {
          if (propItem instanceof VenomValue) {
            propItem.elemRefs.push({
              ref: elem,
              updateHandler: getUpdateHandler(i)
            });
          }
        });
      }
    });
    elem.append(...(item.children.map(draw)));
    item.children.forEach(child => child instanceof VenomComponent ? child.isMounted = true : null);
    item.elemRef = elem;
    return item.elemRef;
  }
  if (item instanceof VenomComponent) {
    item.elemRef = draw(item.render());
    return item.elemRef;
  }
  if (item instanceof VenomValue) {
    const elem = document.createTextNode(item.value + '');
    item.elemRefs.push({
      ref: elem,
      updateHandler: (ref, value) => ref.data = value
    });
    return elem;
  }
  return document.createTextNode(item);
};

export default draw;