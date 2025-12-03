import { _decorator, cclegacy } from 'cc';
import { ICfgParse } from './ICfgParse';
import { Utils } from './Utils';
import { each } from 'lodash-es';
const { ccclass, property } = _decorator;

@ccclass('FbHeadCfg')
export class FbHeadCfg extends ICfgParse {
    private static _instance: FbHeadCfg | null = null;
    private _ids: number[] = [];

    constructor(...args: any[]) {
        super(...args);
        this.jsonFileName = 'fbHead';
        this._ids = [];
    }

    loaded(): void {
        const self = this;
        each(this._cfg, (config: any) => {
            self._ids.push(config.id);
        });
    }

    getRandomHead(): string | null {
        const randomIndex = Utils.randomRange(1, this._ids.length);
        const config = this.get(randomIndex);
        return config ? config.photo : (console.error('no cfg by headId:', randomIndex), null);
    }

    get(id: number): any {
        return this.cfg[id];
    }

    static get Instance(): FbHeadCfg {
        if (!FbHeadCfg._instance) {
            FbHeadCfg._instance = new FbHeadCfg().load();
        }
        return FbHeadCfg._instance;
    }
}