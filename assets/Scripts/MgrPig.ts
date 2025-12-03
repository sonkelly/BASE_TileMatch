import { _decorator, cclegacy } from 'cc';
import { MgrBase } from './MgrBase';
import { PigData } from './PigData';
import { GameConst } from './GameConst';
import { MgrGame } from './MgrGame';
import { MgrUi } from './MgrUi';
import { UIPrefabs } from './Prefabs';
import { Utils } from './Utils';
import { Tools } from './Tools';

const { ccclass, property } = _decorator;

@ccclass('MgrPig')
export class MgrPig extends MgrBase {
    private _data: PigData = null!;
    private _dirtyAnim: boolean = false;

    private static _instance: MgrPig;

    public static get Instance(): MgrPig {
        return MgrPig._instance;
    }

    protected onLoad(): void {
        this._data = new PigData('PigBank');
    }

    public load(): void {
        this._data.load();
    }

    public initLoadData(): void {}

    public isGoldBankOpen(): boolean {
        return MgrGame.Instance.gameData.maxLv >= GameConst.GOLDEN_PIG_LEVEL;
    }

    public addPigCoin(): void {
        if (this.isGoldBankOpen() && !(this._data.pigCoin >= GameConst.GOLDEN_PIG_MAX_COIN)) {
            this._dirtyAnim = false;
            let coin = this._data.pigCoin + GameConst.GOLDEN_PIG_PROGRESS;
            coin = Math.min(GameConst.GOLDEN_PIG_MAX_COIN, coin);
            this._data.pigCoin = coin;
            if (this._data.pigCoin >= GameConst.GOLDEN_PIG_MAX_COIN) {
                this._data.pigFullTimeStamp = Tools.GetNowTime();
            }
        }
    }

    public addPassLevelCnt(): void {
        if (this.isGoldBankOpen()) {
            this._data.passLvCnt += 1;
        }
    }

    public playCoinAnima(): void {
        this._dirtyAnim = true;
    }

    public checkPigCoinIsMax(): boolean {
        return this._data.pigCoin >= GameConst.GOLDEN_PIG_MAX_COIN;
    }

    public buyGoldPig(): void {
        this._data.resetData();
    }

    public async checkPop(): Promise<void> {
        if (this.checkPigCoinIsMax()) {
            this._data.checkPopTimeAndCnt();
            const popCnt = this._data.pigPopCnt;
            const passLvLimited = this._data.passLvCnt >= GameConst.GOLDEN_PIG_POP_PASSLV_LIMITED;
            const isSameDayFlag = Utils.isSameDay(Tools.GetNowTime(), this._data.pigFullTimeStamp);
            
            let shouldPop = false;
            
            if (isSameDayFlag && popCnt === 0) {
                shouldPop = true;
            } else if (isSameDayFlag && popCnt === 1 && passLvLimited) {
                shouldPop = true;
            } else if (!isSameDayFlag && popCnt === 0 && passLvLimited) {
                shouldPop = true;
            }
            
            if (shouldPop) {
                this._data.pigPopCnt++;
                this._data.passLvCnt = 0;
                await MgrUi.Instance.addViewAsyncQueue(UIPrefabs.PigBankView, {
                    root: MgrUi.root(2)
                });
            }
        }
    }

    public get data(): PigData {
        return this._data;
    }

    public get dirtyAnim(): boolean {
        return this._dirtyAnim;
    }
}