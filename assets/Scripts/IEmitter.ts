import { _decorator, Component, Pool, js, isCCObject, isValid, cclegacy } from 'cc';
const { ccclass, property } = _decorator;

function emptyCallback() {}

class CallbackInfo {
    public callback: Function = emptyCallback;
    public target: any = undefined;
    public once: boolean = false;

    set(callback: Function, target: any, once: boolean) {
        this.callback = callback || emptyCallback;
        this.target = target;
        this.once = !!once;
    }

    reset() {
        this.target = undefined;
        this.callback = emptyCallback;
        this.once = false;
    }

    check(): boolean {
        return !(isCCObject(this.target) && !isValid(this.target, true));
    }
}

const callbackInfoPool = new Pool(() => new CallbackInfo(), 32);

class EventCallbackList {
    public callbackInfos: (CallbackInfo | null)[] = [];
    public isInvoking: boolean = false;
    public containCanceled: boolean = true;

    removeByCallback(callback: Function) {
        for (let i = 0; i < this.callbackInfos.length; ++i) {
            const info = this.callbackInfos[i];
            if (info && info.callback === callback) {
                info.reset();
                callbackInfoPool.free(info);
                js.array.fastRemoveAt(this.callbackInfos, i);
                --i;
            }
        }
    }

    removeByTarget(target: any) {
        for (let i = 0; i < this.callbackInfos.length; ++i) {
            const info = this.callbackInfos[i];
            if (info && info.target === target) {
                info.reset();
                callbackInfoPool.free(info);
                js.array.fastRemoveAt(this.callbackInfos, i);
                --i;
            }
        }
    }

    cancel(index: number) {
        const info = this.callbackInfos[index];
        if (info) {
            info.reset();
            if (this.isInvoking) {
                this.callbackInfos[index] = null;
            } else {
                js.array.fastRemoveAt(this.callbackInfos, index);
            }
            callbackInfoPool.free(info);
            this.containCanceled = true;
        }
    }

    cancelAll() {
        for (let i = 0; i < this.callbackInfos.length; i++) {
            const info = this.callbackInfos[i];
            if (info) {
                info.reset();
                callbackInfoPool.free(info);
                this.callbackInfos[i] = null;
            }
        }
        this.containCanceled = true;
    }

    purgeCanceled() {
        for (let i = this.callbackInfos.length - 1; i >= 0; --i) {
            if (!this.callbackInfos[i]) {
                js.array.fastRemoveAt(this.callbackInfos, i);
            }
        }
        this.containCanceled = false;
    }

    clear() {
        this.cancelAll();
        this.callbackInfos.length = 0;
        this.isInvoking = false;
        this.containCanceled = true;
    }
}

const eventCallbackListPool = new Pool(() => new EventCallbackList(), 16);

@ccclass('IEmitter')
export class IEmitter extends Component {
    private _callbackTable: Record<string, EventCallbackList> = js.createMap(true);

    on(event: string, callback: Function, target?: any): Function {
        if (!this.hasEventListener(event, callback, target)) {
            let list = this._callbackTable[event];
            if (!list) {
                list = this._callbackTable[event] = eventCallbackListPool.alloc();
            }
            const info = callbackInfoPool.alloc();
            info.set(callback, target, false);
            list.callbackInfos.push(info);
        }
        return callback;
    }

    once(event: string, callback: Function, target?: any): Function {
        if (!this.hasEventListener(event, callback, target)) {
            let list = this._callbackTable[event];
            if (!list) {
                list = this._callbackTable[event] = eventCallbackListPool.alloc();
            }
            const info = callbackInfoPool.alloc();
            info.set(callback, target, true);
            list.callbackInfos.push(info);
        }
        return callback;
    }

    hasEventListener(event: string, callback?: Function, target?: any): boolean {
        const list = this._callbackTable && this._callbackTable[event];
        if (!list) {
            return false;
        }

        const infos = list.callbackInfos;
        if (!callback) {
            if (list.isInvoking) {
                for (let i = 0; i < infos.length; ++i) {
                    if (infos[i]) {
                        return true;
                    }
                }
                return false;
            }
            return infos.length > 0;
        }

        for (let i = 0; i < infos.length; ++i) {
            const info = infos[i];
            if (info && info.check() && info.callback === callback && info.target === target) {
                return true;
            }
        }
        return false;
    }

    emit(event: string, arg1?: any, arg2?: any, arg3?: any, arg4?: any, arg5?: any) {
        const list = this._callbackTable && this._callbackTable[event];
        if (list) {
            const wasNotInvoking = !list.isInvoking;
            list.isInvoking = true;

            const snapshot = [];
            Object.assign(snapshot, list.callbackInfos);

            for (let i = 0, len = snapshot.length; i < len; ++i) {
                const info = snapshot[i];
                if (info) {
                    const callback = info.callback;
                    const target = info.target;
                    
                    if (info.once) {
                        this.off(event, callback, target);
                    }
                    
                    if (info.check()) {
                        if (target) {
                            callback.call(target, arg1, arg2, arg3, arg4, arg5);
                        } else {
                            callback(arg1, arg2, arg3, arg4, arg5);
                        }
                    } else {
                        this.off(event, callback, target);
                    }
                }
            }

            if (wasNotInvoking) {
                list.isInvoking = false;
                if (list.containCanceled) {
                    list.purgeCanceled();
                }
            }
        }
    }

    off(event: string, callback?: Function, target?: any) {
        const list = this._callbackTable && this._callbackTable[event];
        if (list) {
            const infos = list.callbackInfos;
            if (callback) {
                for (let i = 0; i < infos.length; ++i) {
                    const info = infos[i];
                    if (info && info.callback === callback && info.target === target) {
                        list.cancel(i);
                        break;
                    }
                }
            } else {
                this.removeAll(event);
            }
        }
    }

    removeAll(event?: string | number) {
        if (typeof event === 'string' || typeof event === 'number') {
            const list = this._callbackTable && this._callbackTable[event];
            if (list) {
                if (list.isInvoking) {
                    list.cancelAll();
                } else {
                    list.clear();
                    eventCallbackListPool.free(list);
                    delete this._callbackTable[event];
                }
            }
        } else if (event) {
            for (const key in this._callbackTable) {
                const list = this._callbackTable[key];
                if (list.isInvoking) {
                    const infos = list.callbackInfos;
                    for (let i = 0; i < infos.length; ++i) {
                        const info = infos[i];
                        if (info && info.target === event) {
                            list.cancel(i);
                        }
                    }
                } else {
                    list.removeByTarget(event);
                }
            }
        }
    }

    targetOff(target: any) {
        for (const key in this._callbackTable) {
            const list = this._callbackTable[key];
            if (list.isInvoking) {
                const infos = list.callbackInfos;
                for (let i = 0; i < infos.length; ++i) {
                    const info = infos[i];
                    if (info && info.target === target) {
                        list.cancel(i);
                    }
                }
            } else {
                list.removeByTarget(target);
            }
        }
    }

    clearEvents() {
        for (const key in this._callbackTable) {
            const list = this._callbackTable[key];
            if (list) {
                list.clear();
                eventCallbackListPool.free(list);
                delete this._callbackTable[key];
            }
        }
    }
}