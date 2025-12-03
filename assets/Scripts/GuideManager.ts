import { _decorator, cclegacy } from 'cc';
import { config } from './Config';

const { ccclass, property } = _decorator;
const { sys } = cclegacy;

@ccclass('GuideManager')
export class GuideManager {
    private static _instance: GuideManager | null = null;
    private storageKey: string = '_guide';

    public static getInstance(): GuideManager {
        if (!this._instance) {
            this._instance = new GuideManager();
        }
        return this._instance;
    }

    public isInGuide(): boolean {
        const item = sys.localStorage.getItem(config.gameName + this.storageKey);
        return !(item || null);
    }

    public passGuide(): void {
        sys.localStorage.setItem(config.gameName + this.storageKey, 'true');
    }
}

export const guideMgr = GuideManager.getInstance();