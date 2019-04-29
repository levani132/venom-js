import UpdateHandler from "./update-handler.js";
import draw from "./drawer.js";
import VenomElement from "./venom-element.js";
import IdService from "./id-service.js";

export default class VenomComponent {
  id;
  elemRef;
  isMounted;
  children;

  constructor() {
    this.id = IdService.nextId();
    return new Proxy(this, UpdateHandler);
  }

  render() {
    return draw(new VenomElement('div'));
  }
}
