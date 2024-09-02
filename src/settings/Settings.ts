export default class Settings {
    static production = true;
    static collaborativeURL = this.production ? '/' : 'http://localhost:5001';
    static persistanceURL = this.production ? '' : 'http://localhost:5002';
}
