import IdService from "./id-service.js";

export default class VenomElement {
  id;
  children;
  props;
  elemRef;

  constructor() {
    this.id = IdService.nextId();
  }
}