import { MalformedHtmlException } from "./errors.js";
import Venom from './venom.js';
import VenomComponent from "./venom-component.js";
import VenomValue from "./venom-value.js";

const ParserState = {
  NOTHING: 0,
  IN_TAG_NAME: 1,
  DONE_TAG_NAME: 2,
  IN_ATTR_KEY: 3,
  DONE_ATTR_KEY: 4,
  IN_ATTR_VALUE_START: 5,
  IN_ATTR_VALUE: 6,
  DONE_ATTR: 7,
  DONE_TAG_START: 8,
  DONE_TAG: 9,
  IN_TAG_END: 10,
  DONE_TAG_END: 11
};

const QuoteMode = {
  NONE: 0,
  SINGLE: 1,
  DOUBLE: 2
};

export class VenomParser {
  strings;
  vars;
  isChild;
  result;

  static validHtmlChar = (string, i) => {
    return string[i].toLowerCase() >= 'a' && string[i].toLowerCase() <= 'z' ||
      string[i - 1] !== '<' && '0123456789-.'.includes(string[i]);
  };

  static validAttrChar = (string, i) => {
    return !` '">/=`.includes(string[i]);
  };

  static isWhiteSpace = (string, i) => {
    return /\s/.test(string[i]);
  };

  constructor(strings, vars, isChild = false) {
    this.storeStrings(strings);
    this.vars = vars;
    this.isChild = isChild;
  }

  storeStrings = strings => {
    strings = strings.map(value => value);
    strings[0] = strings[0].trimLeft();
    strings[strings.length - 1] = strings[strings.length - 1].trimRight();
    this.strings = strings;
  };

  parseTag = () => {
    if (this.strings[0][0] !== '<') {
      throw new MalformedHtmlException(this.strings, this.vars, 0, 0, ParserState.NOTHING);
    }
    const stack = [];
    let mode = ParserState.NOTHING;
    let escapeOn = false;
    let tagName = '';
    let tagEndName = '';
    let attrName = '';
    let attrValue = [''];
    let text = '';
    let quoteMode = QuoteMode.NONE;
    let attributes = {};
    this.strings.forEach((string, index) => {
      if (this.result) {
        return;
      }
      const inAttrValue = i => () => {
        if (!VenomParser.validAttrChar(string, i)) {
          if (string[i] === '=') {
            mode = ParserState.IN_ATTR_VALUE_START;
          } else if (VenomParser.isWhiteSpace(string[i])) {
            mode = ParserState.DONE_ATTR_KEY;
          } else if (string[i] === '>') {
            mode = ParserState.DONE_TAG_START;
          } else if (string[i] === '/') {
            mode = ParserState.DONE_TAG;
          } else {
            throw new MalformedHtmlException(this.strings, this.vars, index, i, mode);
          }
        } else {
          attrName += string[i];
        }
      };
      const doneAttr = i => () => { // DONE_ATTR
        if (attrName.length) {
          if (attrValue.length) {
            attrValue = attrValue.filter(item => item !== '');
            if (attrValue.length && typeof attrValue[0] === 'function') {
              attributes[attrName] = attrValue[0];
            } else {
              attributes[attrName] = attrValue.length === 1 && attrValue[0] === 'false' ? false : attrValue;
            }
            attrValue = [''];
          } else {
            attributes[attrName] = true;
          }
          attrName = '';
        }
        if (!VenomParser.isWhiteSpace(string, i)) {
          if (string[i] === '>') {
            mode = ParserState.DONE_TAG_START;
          } else if (string[i] === '/') {
            mode = ParserState.DONE_TAG;
          } else {
            mode = ParserState.IN_ATTR_KEY;
            return inAttrValue(i)();
          }
        }
      };
      (string).split('').forEach((char, i) => {
        if (this.result) {
          return;
        }
        const actions = [
          () => { // NOTHING
            if (char === '<') {
              if (text.length) {
                if (stack.length) {
                  stack[stack.length - 1].children.push(text);
                  text = '';
                } else {
                  throw new MalformedHtmlException(this.strings, this.vars, index, i, mode);
                }
              }
              mode = ParserState.IN_TAG_NAME;
            } else if ((text.length && text[text.length - 1] !== ' ' || !text.length) && VenomParser.isWhiteSpace(string, i)) {
              text += ' ';
            } else if (!VenomParser.isWhiteSpace(string, i)) {
              text += char;
            }
          },
          () => { // IN_TAG_NAME
            if (!VenomParser.validHtmlChar(string, i)) {
              if (VenomParser.isWhiteSpace(string, i)) {
                mode = ParserState.DONE_TAG_NAME;
                return;
              } else if (char === '>') {
                mode = ParserState.DONE_TAG_NAME;
                return actions[mode]();
              } else if (char === '/' && string[i - 1] === '<') {
                mode = ParserState.IN_TAG_END;
                return;
              } else if (char === '/') {
                mode = ParserState.DONE_TAG;
                return;
              }
              throw new MalformedHtmlException(this.strings, this.vars, index, i, mode);
            } else if (typeof(tagName) !== 'string') {
              throw new MalformedHtmlException(this.strings, this.vars, index, i, mode);
            }
            tagName += char;
          },
          () => { // DONE_TAG_NAME
            if (!VenomParser.isWhiteSpace(string, i)) {
              stack.push({tagName});
              tagName = '';
              if (char === '>') {
                mode = ParserState.DONE_TAG_START;
                return;
              } else if (char === '/') {
                mode = ParserState.DONE_TAG;
                return;
              }
              mode = ParserState.IN_ATTR_KEY;
              return actions[mode]();
            }
          },
          inAttrValue(i), // IN_ATTR_KEY
          () => { // DONE_ATTR_KEY
            if (!VenomParser.isWhiteSpace(string, i)) {
              if (char === '=') {
                mode = ParserState.IN_ATTR_VALUE_START;
              } else if (char === '>') {
                mode = ParserState.DONE_TAG_START;
              } else if (char === '/') {
                mode = ParserState.DONE_TAG;
              } else {
                mode = ParserState.DONE_ATTR;
                return actions[mode]();
              }
            }
          },
          () => { // IN_ATTR_VALUE_START
            if (!VenomParser.isWhiteSpace(string, i)) {
              mode = ParserState.IN_ATTR_VALUE;
              if (char === '\'') {
                quoteMode = QuoteMode.SINGLE;
              } else if (char === '"') {
                quoteMode = QuoteMode.DOUBLE;
              } else {
                quoteMode = QuoteMode.NONE;
                actions[mode]();
              }
            }
          },
          () => { // IN_ATTR_VALUE
            [
              () => { // QuoteMode.NONE
                if (VenomParser.isWhiteSpace(string, i)) {
                  mode = ParserState.DONE_ATTR;
                  return;
                }
                if ('\'"=<>`/'.includes(char)) {
                  throw new MalformedHtmlException(this.strings, this.vars, index, i, mode);
                } 
              },
              () => { // QuoteMode.SINGLE
                if (!escapeOn && char === '\'') {
                  mode = ParserState.DONE_ATTR;
                  return;
                }
                if (!escapeOn && char === '\\') {
                  escapeOn = true;
                  return;
                }
                escape = false;
              },
              () => { // QuoteMode.DOUBLE
                if (!escapeOn && char === '"') {
                  mode = ParserState.DONE_ATTR;
                  return;
                }
                if (!escapeOn && char === '\\') {
                  escapeOn = true;
                  return;
                }
                escape = false;
              }
            ][quoteMode]();
            if (typeof(attrValue[attrValue.length - 1]) !== 'string') {
              attrValue.push('');
            }
            if (mode === ParserState.IN_ATTR_VALUE) {
              attrValue[attrValue.length - 1] += char;
            }
          },
          doneAttr(i), // DONE_ATTR
          () => { // DONE_TAG_START
            stack[stack.length - 1].attributes = attributes;
            attributes = {};
            stack[stack.length - 1].children = [];
            mode = ParserState.NOTHING;
            return actions[mode]();
          },
          () => { // DONE_TAG
            stack[stack.length - 1].attributes = attributes;
            attributes = {};
            let elem = stack.pop();
            elem = Venom.createElement(
              elem.tagName,
              elem.attributes,
              elem.children
            );
            if (!stack.length) {
              this.result = elem;
            } else {
              stack[stack.length - 1].children.push(elem);
            }
            mode = ParserState.NOTHING;
          },
          () => { // IN_TAG_END
            if (!VenomParser.validHtmlChar(string, i)) {
              if (VenomParser.isWhiteSpace(char)) {
                return;
              } else if (char === '>') {
                mode = ParserState.DONE_TAG_END;
                return actions[mode]();
              }
              throw new MalformedHtmlException(this.strings, this.vars, index, i, mode);
            }
            tagEndName += char;
          },
          () => { // DONE_TAG_END
            if (typeof stack[stack.length - 1].tagName !== 'function' && stack[stack.length - 1].tagName !== tagEndName
              || typeof stack[stack.length - 1].tagName === 'function' && tagEndName !== ''
            ) {
              throw new MalformedHtmlException(this.strings, this.vars, index, i, mode);
            }
            tagEndName = '';
            let elem = stack.pop();
            elem = Venom.createElement(
              elem.tagName,
              elem.attributes,
              elem.children
            );
            if (!stack.length) {
              this.result = elem;
            } else {
              stack[stack.length - 1].children.push(elem);
            }
            mode = ParserState.NOTHING;
          }
        ];
        actions[mode]();
      });
      if (this.vars[index] === undefined) {
        return;
      }
      // Variable handlers
      const actions = [
        () => { // NOTHING
          if (!stack.length) {
            throw new MalformedHtmlException(this.strings, this.vars, index, 0, mode);
          }
          if (text.length) {
            stack[stack.length - 1].children.push(text);
            text = "";
          }
          if (Array.isArray(this.vars[index])) {
            stack[stack.length - 1].children.push(...this.vars[index]);
          } else {
            stack[stack.length - 1].children.push(this.vars[index]);
          }
        },
        () => { // IN_TAG_NAME
          if (typeof(this.vars[index]) === 'string') {
            tagName += this.vars[index];
            return;
          } else if (this.vars[index] instanceof VenomValue && typeof(this.vars[index].value) === 'string') {
            tagName += this.vars[index].value;
            return;
          } else if (tagName === '' && VenomComponent.isPrototypeOf(this.vars[index])) {
            tagName = this.vars[index];
            mode = ParserState.IN_TAG_NAME;
            return;
          }
          throw new TypeError('Only strings or component classes are allowed as tagnames.');
        },
        () => { // DONE_TAG_NAME
          mode = ParserState.IN_ATTR_KEY;
          if (typeof(this.vars[index]) === 'string') {
            attrName += this.vars[index];
            return;
          } else if (this.vars[index] instanceof VenomValue && typeof(this.vars[index].value) === 'string') {
            attrName += this.vars[index].value;
            return;
          }
          if (typeof(this.vars[index].value) !== 'string') {
            throw new TypeError('Only strings are allowed as prop/attribute names.');
          }
        },
        () => { // IN_ATTR_KEY
          return actions[mode - 1]();
        },
        () => { // DONE_ATTR_KEY
          doneAttr()();
          actions[ParserState.DONE_TAG_START]();
        },
        () => { // IN_ATTR_VALUE_START
          quoteMode = QuoteMode.NONE;
          attrValue.push(this.vars[index]);
          mode = ParserState.DONE_ATTR;
        },
        () => { // IN_ATTR_VALUE
          attrValue.push(this.vars[index]);
        },
        () => { // DONE_ATTR
          actions[ParserState.DONE_TAG_START]();
        },
        () => { // DONE_TAG_START
          stack[stack.length - 1].attributes = attributes;
          attributes = {};
          stack[stack.length - 1].children = [];
          mode = ParserState.NOTHING;
          return actions[mode]();
        },
        () => { // DONE_TAG
          throw new MalformedHtmlException(this.strings, this.vars, index, 0, mode);
        },
        () => { // IN_TAG_END
          throw new MalformedHtmlException(this.strings, this.vars, index, 0, mode);
        },
        () => { // DONE_TAG_END
          throw new MalformedHtmlException(this.strings, this.vars, index, 0, mode);
        }
      ];
      actions[mode]();
    });
    if (mode !== ParserState.NOTHING) {
      throw new MalformedHtmlException(this.strings, this.vars, null, null, mode);
    }
  };

  parse = () => {
    this.parseTag();
    return this.result;
  };
}
