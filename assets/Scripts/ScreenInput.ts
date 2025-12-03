import { _decorator, EventTarget, input, cclegacy } from 'cc';

export const screenInput = new (class ScreenInput {
    public priority: number = 2;
    private _eventTarget: EventTarget;

    constructor() {
        this._eventTarget = new EventTarget();
        input._registerEventDispatcher(this);
    }

    public dispatchEvent(event: any): boolean {
        this._eventTarget.emit(event.type, event);
        return true;
    }

    public on(type: string, callback: Function, target?: any): Function {
        this._eventTarget.on(type, callback, target);
        return callback;
    }

    public once(type: string, callback: Function, target?: any): Function {
        this._eventTarget.once(type, callback, target);
        return callback;
    }

    public off(type: string, callback?: Function, target?: any): void {
        this._eventTarget.off(type, callback, target);
    }
})();