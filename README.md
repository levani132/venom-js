# VenomJS

Templating library with components, reactive variables (supports nested reactiveness too) and more.

## Usage

To use either manage your own project and import venom from node_modules as module or install [venom-cli](https://www.npmjs.com/package/venom-cli) and run:

```bash
venom init project_name
```

## Running

If you created project from [venom-cli](https://www.npmjs.com/package/venom-cli) you can start application with:

```bash
npm start
```

or build with:

```bash
npm run build
```

## Development

To launch venom you need to import venom and mount it to element. you can do this by venom's mount function which takes as arguments element selector and component to start with:

```js
import Venom  from "venom-js";
import AppComponent from "./src/app.component.js";

Venom.mount('#app', AppComponent);
```

You will also need component to mount.
To create component, simply extend VenomComponent with your class and define render function:

```js
import {template, VenomComponent} from "venom-js";

export default class AppComponent extends VenomComponent {
  constructor() {
    super();
  }

  render() {
    return template`
      <div class="my-app">
        Hello, Venom!
      </div>
    `;
  }
}
```

template takes html string and transforms it into real html. render function returns this html and after mounting this element becomes root of the app.

### Components

From here we can define new components and use them. To use component instead of html element name we need to inject class of the component we are using and close tag with empty closing tag:

```js
template`
  <div>
    <${MyComponent}></>
  </div>
`
```

You can declare any kind of variables and use them in templates. when variable values are updated, venom component also updates every place in real dom where it was used:

```js
import {template, VenomComponent} from "venom-js";

export default class AppComponent extends VenomComponent {
  constructor() {
    super();
    this.name = 'venom-js';
  }

  updateName = e => {
    this.name = e.target.value;
  };

  render() {
    return template`
      <div class="my-app">
        Hello, ${this.name}!
        <input value="${this.name}" oninput=${this.updateName} />
      </div>
    `;
  }
}
```

### Arrays

You can create templates for arrays which will be updated automatically + inserting new items in array won't rerender all items templates, but will only generate new template for new item and attach it to dom:

```js
import {template, VenomComponent} from "venom-js";

export default class ArraySimpleComponent extends VenomComponent {
  constructor() {
    super();
    this.arr = [];
    this.counter = 0;
  }

  addToArray = () => {
    this.arr.push(this.counter++);
  };

  pop = () => {
    this.arr.pop();
  };

  render() {
    return template`
      <div>
        <button onclick="${this.addToArray}">Add ${this.counter}</button>
        <button onclick="${this.pop}">Pop last item</button>
        ${this.arr.map((value, i) => template`
          <div>value ${i}: ${value}</div>
        `)}
      </div>
    `;
  }
}
```

### Objects

You can create any kind of object and update as nested value of it as you wish (Not sure you may find some bug but...) venom will be able to update all occurences of that nested object in the html:

```js
import {template, VenomComponent} from "venom-js";

export default class ObjectNestedComponent extends VenomComponent {
  obj;
  constructor() {
    super();
    this.counter = 0;
    this.obj = {
      obj: {
        obj: {
          x: 1,
          y: 2
        },
        arr: []
      }
    };
  }

  update = xy => e => {
    console.log(this.obj.get());
    this.obj.obj.obj[xy] = e.target.value;
  };

  addToArray = () => {
    this.obj.obj.arr.push(this.counter++);
  };

  render() {
    return template`
      <div>
        <div>
          x input: <input type="text" oninput="${this.update('x')}"/>
        </div>
        <div>
          y input: <input type="text" oninput="${this.update('y')}"/>
        </div>
        x: ${this.obj.obj.obj.x}
        y: ${this.obj.obj.obj.y}
        <button onclick="${this.addToArray}">Add ${this.counter} to array</button>
        ${this.obj.obj.arr.map(value => template`<div>this is special div #${value}</div>`)}
      </div>
    `;
  }
}
```

while nested reactiveness is supported, objects in component might look a little bit uggly, so you can use get method to get fresh javascript object.

### Venom Values

Venom thinks it should spread everywhere in the body, so instead of standard waterfall flow of variables, venom values are two way binded to each component, so no matter where you update the value if it was given from the parent, it will be given back to parent with new value. If you still preffer one way flow you can use copy method that every variable (or nested variable) of venom component has:

```js
import {template, VenomComponent} from "venom-js";

class CounterComponent extends VenomComponent {
  class = "counter";
  constructor() {
    super();
    this.counter = 0;
  }

  addCounter = () => {
    this.counter++;
  };

  render() {
    return template`
      <span class="${this.class}">
        <div>${this.children}: ${this.counter}</div>
        <button onclick=${this.addCounter}>Add Counter</button>
      </span>
    `;
  }
}

export default class SimpleExampleComponent extends VenomComponent {
  constructor() {
    super();
    this.counter = 10;
  }
  render() {
    return template`
      <div>
        <h1>App Global Counter: ${this.counter}</h1>
        <${CounterComponent} counter="${this.counter.copy()}" class="counter-1">
          first <span style="color: red">counter</span>
        </>
        <${CounterComponent} counter="${this.counter}" class="counter-2">
          second <span style="color: green">counter</span>
        </>
      </div>
    `;
  }
}
```

That's pretty much all for now. I hope venom will soon support ternary operators in templates.
p.s. you may not use variables as you would use it anywhere in render method. render method is only for declaring templates.