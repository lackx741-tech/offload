import EventEmitter from "eventemitter3";

export class ModalModule extends EventEmitter {
  private _isOpen = false;

  get isOpen() {
    return this._isOpen;
  }

  open() {
    this._isOpen = true;
    this.emit("open");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("waas:modal-open"));
    }
  }

  close() {
    this._isOpen = false;
    this.emit("close");
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("waas:modal-close"));
    }
  }

  toggle() {
    this._isOpen ? this.close() : this.open();
  }
}
