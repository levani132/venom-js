import IdService from "./id-service.js";

export default class VenomElement {
  id;
  children;
  props;
  elemRef;

  constructor() {
    this.id = IdService.nextId();
  }

  __remove__() {
    this.elemRef.remove();
    // IMPORTANT: Last lifecycle hook called before component will be removed.
    if (this.onDestroy && typeof this.onDestroy === 'function') this.onDestroy();
  }
}