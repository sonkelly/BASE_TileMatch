import { _decorator, cclegacy } from 'cc';
import {MgrBase} from './MgrBase';
import { DetailData } from './DetailData';

const { ccclass, property } = _decorator;

@ccclass('MgrDetail')
export class MgrDetail extends MgrBase {
    private _data: DetailData | null = null;

    onLoad() {
        this._data = new DetailData('user-detail');
    }

    load() {
        this.data.load();
    }

    initLoadData() {}

    get data(): DetailData {
        return this._data!;
    }

    static get Instance(): MgrDetail {
        return MgrDetail._instance;
    }

    private static _instance: MgrDetail;
}