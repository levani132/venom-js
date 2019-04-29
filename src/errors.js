export class MalformedHtmlException {
  constructor(strings, vars, index, i, mode) {
    this.strings = strings;
    let counter = 0;
    const errString = index != undefined && strings[index].split('').map(c => c === '\n' ? [(() => counter++)(), '\\n'][1] : c).join('');
    this.errorLocation = i != undefined && errString + '\n' + ' '.repeat(i + counter) + '^' + ' '.repeat(errString.length - i - 1);
    this.vars = vars;
    this.index = index;
    this.i = i;
    this.mode = mode;
    console.log(this.errorLocation);
  }
}