export default class IdService {
  static id = 1;
  static nextId() {
    return this.id++;
  }
}
