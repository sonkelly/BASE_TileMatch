import { _decorator, cclegacy } from 'cc';

const { ccclass } = _decorator;

@ccclass('Singleton')
export class Singleton {
    private static _instance: Singleton | null = null;

    public static getInstance<T extends Singleton>(): T {
        if (!this._instance) {
            this._instance = new this() as T;
        }
        return this._instance as T;
    }

    public static get<T extends Singleton>(): T {
        return this.getInstance<T>();
    }
}