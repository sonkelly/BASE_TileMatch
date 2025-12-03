import { _decorator } from 'cc';
import {MgrBase} from './MgrBase';
import { LevelChestData } from './LevelChestData';

const { ccclass, property } = _decorator;

@ccclass('MgrLevelChest')
export class MgrLevelChest extends MgrBase {
    private _data: LevelChestData | null = null;

    onLoad() {
        this._data = new LevelChestData('level-chest');
    }

    load() {
        this.data.load();
    }

    initLoadData() {
        // Implementation for initLoadData
    }

    get data(): LevelChestData | null {
        return this._data;
    }

    static get Instance(): MgrLevelChest {
        return MgrLevelChest._instance;
    }

    private static _instance: MgrLevelChest;
}