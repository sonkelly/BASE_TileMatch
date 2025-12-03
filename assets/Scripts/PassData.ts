import { _decorator, cclegacy } from 'cc';
import { set, isNil } from 'lodash-es';
import { Tools } from './Tools';
import { MgrTask } from './MgrTask';
import { TASK_TYPE } from './Const';
import { IDataObject } from './IDataObject';
import {get, each} from "lodash-es"
const { ccclass, property } = _decorator;

@ccclass('PassData')
export class PassData extends IDataObject {
    private _passTime: number = 0;
    private _passData: Record<number, any> = {};
    private _passLevel: number = 0;
    private _passTip: boolean = true;

    constructor(...args: any[]) {
        super(...args);
        this._passTime = 0;
        this._passData = {};
        this._passLevel = 0;
        this._passTip = true;
    }

    public earnPassFree(level: number, track: boolean = true): void {
        let data = get(this._passData, level);
        if (isNil(data)) {
            data = {
                lv: level,
                free: true,
                ad: true
            };
        }
        data.free = false;
        set(this._passData, level, data);
        this.doDrity();
        if (track) {
            MgrTask.Instance.data.addTaskData(TASK_TYPE.RECEIVE_PASS_REWARD, 1);
        }
    }

    public earnPassAd(level: number): void {
        let data = get(this._passData, level);
        if (isNil(data)) {
            data = {
                lv: level,
                free: true,
                ad: true
            };
        }
        data.ad = false;
        set(this._passData, level, data);
        this.doDrity();
        MgrTask.Instance.data.addTaskData(TASK_TYPE.RECEIVE_PASS_REWARD, 1);
    }

    public getPassData(level: number): any {
        let data = get(this._passData, level);
        if (isNil(data)) {
            data = {
                lv: level,
                free: true,
                ad: true
            };
        }
        return data;
    }

    public clearPassData(time: number): void {
        this._passData = {};
        this._passLevel = 0;
        this._passTime = time;
        this._passTip = true;
        this.doDrity();
    }

    public deserialized(data: any): void {
        this._passTime = get(data, 0, Tools.GetNowMoment().valueOf());
        this._passData = {};
        
        const passDataArray = get(data, 1, []);
        each(passDataArray, (item: any) => {
            set(this._passData, item.lv, item);
        });
        
        this._passLevel = get(data, 2, 0);
        this._passTip = get(data, 3, true);
        this.doDrity();
    }

    public serializeInfo(): any {
        const result: any = {};
        set(result, 0, this._passTime);
        
        const dataArray: any[] = [];
        each(this._passData, (item: any) => {
            dataArray.push(item);
        });
        set(result, 1, dataArray);
        
        set(result, 2, this._passLevel);
        set(result, 3, this._passTip);
        
        return result;
    }

    get passTime(): number {
        return this._passTime;
    }

    set passTime(value: number) {
        this._passTime = value;
        this.doDrity();
    }

    get passLevel(): number {
        return this._passLevel;
    }

    set passLevel(value: number) {
        this._passLevel = value;
        this.doDrity();
    }

    get passTip(): boolean {
        return this._passTip;
    }

    set passTip(value: boolean) {
        this._passTip = value;
        this.doDrity();
    }
}