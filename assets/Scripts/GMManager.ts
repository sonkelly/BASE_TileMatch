import { _decorator } from 'cc';
import { config } from './Config';

const { ccclass, property } = _decorator;

@ccclass('GMManager')
class GMManager {
    private static _instance: GMManager | null = null;
    private inGameEnable: boolean | null = null;

    private constructor() {}

    public static getInstance(): GMManager {
        if (!this._instance) {
            this._instance = new GMManager();
        }
        return this._instance;
    }

    public getInGameGm(): boolean {
        if (this.inGameEnable === null) {
            this.inGameEnable = config.debug;
        }
        return this.inGameEnable;
    }

    public setInGameGm(enable: boolean): void {
        this.inGameEnable = enable;
    }
}

const GmMgr = GMManager.getInstance();
export { GMManager, GmMgr };