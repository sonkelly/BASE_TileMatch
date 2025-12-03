import { _decorator, warn, director, cclegacy } from 'cc';
import { IDataObject } from './IDataObject';
import { AssetsCfg } from './AssetsCfg';
import { ITEM_TYPE, TASK_TYPE } from './Const';
import { ITEM } from './GameConst';
import { NumberPlus } from './NumberPlus';
import { UIAssetFlyView } from './UIAssetFlyView';
import { GlobalEvent } from './Events';
import { AnalyticsManager } from './AnalyticsManager';
import { MgrGame } from './MgrGame';
import { MgrTask } from './MgrTask';
import { MgrRank } from './MgrRank';
import { Utils } from './Utils';
import { AvatarCfg } from './AvatarCfg';
import { Tools } from './Tools';
import { LeaderboardManager } from './LeaderboardManager';
import { SdkBridge } from './SdkBridge';
import {get, set, isNil, each, parseInt} from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('UserData')
export class UserData extends IDataObject {
    private items: Record<number, number> = {};
    private _userName: string = '';
    private _userHead: number = 0;
    private _unlockHead: number[] = [];
    private _unlockHeadFrame: number[] = [];
    private _unlockHeadFrame2: number[] = [];
    private _lastLogin: number = 0;

    setItem(itemId: number, value: number): void {
        set(this.items, itemId, value);
        this.doDrity();
        
        switch (itemId) {
            case ITEM.Coin:
                AnalyticsManager.getInstance().setUserProperty({ CK_GoldCoin: value });
                break;
            case ITEM.Back:
                AnalyticsManager.getInstance().setUserProperty({ CK_Back: value });
                break;
            case ITEM.Fresh:
                AnalyticsManager.getInstance().setUserProperty({ CK_Refresh: value });
                break;
            case ITEM.Hint:
                AnalyticsManager.getInstance().setUserProperty({ CK_Tip: value });
                break;
            case ITEM.Light:
                AnalyticsManager.getInstance().setUserProperty({ CK_Light: value });
                break;
            case ITEM.Wisdom:
                LeaderboardManager.getInstance().setLeaderboardScoreAsync(value);
                break;
        }
    }

    getItem(itemId: number): number {
        return get(this.items, itemId, 0);
    }

    flyAddItem(options: any): void {
        const { itemId, change, result } = options;
        if (isNil(itemId) || isNil(change) || isNil(result)) {
            warn('执行飞行动画必须包含:\'itemId\', \'change\', \'result\'三个参数');
        } else {
            if (!options.notify) {
                const callback = options.callback;
                options.callback = () => {
                    if (options.notify !== null && options.notify !== 1 || true) {
                        director.emit(GlobalEvent.AssetItemChange + options.itemId, change);
                    }
                    callback?.();
                };
            }
            UIAssetFlyView.addAsset(options, options.info);
        }
    }

    addItem(itemId: number, amount: number, options?: any): void {
        if (!NumberPlus.compare(0, amount)) {
            options = options || { notify: true };
            const result = this.addMemItem(itemId, amount, options?.type);
            
            if (itemId === ITEM.Wisdom) {
                MgrRank.Instance.addMonthWisdom(amount);
            }
            
            if (options.sourcePos) {
                options.itemId = itemId;
                options.change = amount;
                options.result = result;
                this.flyAddItem(options);
                options.notify && director.emit(GlobalEvent.AssetItemChange + itemId, amount);
            } else {
                options.callback?.();
                if (options.notify !== null && options.notify !== 1 || true) {
                    director.emit(GlobalEvent.AssetItemChange + itemId, amount);
                }
            }
        }
    }

    addMemItem(itemId: number, amount: number, type?: string): number {
        let result = 0;
        const itemCfg = AssetsCfg.Instance.get(itemId);
        
        switch (itemCfg.type) {
            case ITEM_TYPE.Asset:
                const current = get(this.items, itemId, 0);
                if (amount <= 0) return current;
                
                result = current + amount;
                this.setItem(itemId, result);
                break;
        }
        
        if (type && type !== '') {
            this.reportAddItem(itemId, type, amount);
        }
        return result;
    }

    subItem(itemId: number, amount: number, options?: any): boolean {
        if (amount < 0) return false;
        
        const current = get(this.items, itemId, 0);
        if (current >= amount) {
            const result = current - amount;
            this.setItem(itemId, result);
            director.emit(GlobalEvent.AssetItemChange + itemId, -amount);
            this.reportUseItem(itemId, options?.type, amount);
            
            if (itemId === ITEM.Coin) {
                MgrTask.Instance.data.addTaskData(TASK_TYPE.USE_COIN, amount);
            }
            return true;
        }
        return false;
    }

    judgeItem(itemId: number, amount: number): boolean {
        return !(amount < 0) && get(this.items, itemId, 0) >= amount;
    }

    deserialized(data: any): void {
        if (isNil(data)) {
            const cfg = AssetsCfg.Instance.cfg;
            each(cfg, (item, id) => {
                if (item.type === ITEM_TYPE.Asset && item.baseNum) {
                    set(this.items, id, item.baseNum);
                }
            });
            this.doDrity();
        } else {
            this.items = get(data, 'UserItem', {});
            const cfg = AssetsCfg.Instance.cfg;
            
            each(cfg, (item, id) => {
                const current = get(this.items, parseInt(id));
                if (item.type === ITEM_TYPE.Asset && isNil(current) && item.baseNum) {
                    set(this.items, id, item.baseNum);
                }
            });
        }
        
        this._userName = get(data, 'UserName', '');
        if (!this._userName) {
            this._userName = 'User' + Utils.randomRange(100000, 999999);
            this.doDrity();
        }
        
        this._userHead = get(data, 'UserHead', 0);
        if (!this._userHead) {
            this._userHead = AvatarCfg.Instance.getDefaultHeadId();
            this.doDrity();
        }
        
        this._unlockHead = get(data, 'UnlockHead', []);
        this._unlockHeadFrame = get(data, 'UnlockHeadFrame', []);
        this._unlockHeadFrame2 = get(data, 'UnlockHeadFrame2', []);
        this._lastLogin = get(data, 'LastLogin', Tools.GetNowTime());
    }

    serializeInfo(): any {
        return {
            UserItem: this.items,
            UserHead: this._userHead,
            UserName: this._userName,
            UnlockHead: this._unlockHead,
            UnlockHeadFrame: this._unlockHeadFrame,
            UnlockHeadFrame2: this._unlockHeadFrame2,
            LastLogin: this._lastLogin
        };
    }

    reportAddItem(itemId: number, type: string, amount: number): void {
        if (itemId === ITEM.Coin) {
            const data = {
                Get_Type: type,
                Gold_GetNum: amount,
                Level_Id: MgrGame.Instance.gameData.curLv
            };
            AnalyticsManager.getInstance().reportCoinsGet(data);
        } else if (itemId === ITEM.Back || itemId === ITEM.Hint || itemId === ITEM.Fresh) {
            const data = {
                Get_Type: type,
                Prop_Type: itemId - 9,
                GetNum: amount,
                Level_Id: MgrGame.Instance.gameData.curLv
            };
            AnalyticsManager.getInstance().reportPropGet(data);
        } else if (itemId === ITEM.Light) {
            const data = {
                Get_Type: type,
                Prop_Type: itemId,
                GetNum: amount,
                Level_Id: MgrGame.Instance.gameData.curLv
            };
            AnalyticsManager.getInstance().reportPropGet(data);
        }
    }

    reportUseItem(itemId: number, type: string, amount: number): void {
        if (itemId === ITEM.Coin) {
            const data = {
                Gold_Type: type,
                Gold_CostNum: amount,
                Level_Id: MgrGame.Instance.gameData.curLv
            };
            AnalyticsManager.getInstance().reportCoinUse(data);
        } else if (itemId === ITEM.Back || itemId === ITEM.Hint || itemId === ITEM.Fresh) {
            const data = {
                Prop_Type: itemId - 9,
                Level_Id: MgrGame.Instance.gameData.curLv
            };
            AnalyticsManager.getInstance().reportPropUse(data);
        } else if (itemId === ITEM.Light) {
            const data = {
                Prop_Type: itemId,
                Level_Id: MgrGame.Instance.gameData.curLv
            };
            AnalyticsManager.getInstance().reportPropUse(data);
        }
    }

    setUserName(name: string): void {
        if (this._userName !== name) {
            this._userName = name;
            director.emit(GlobalEvent.refreshNick);
            this.doDrity();
            MgrTask.Instance.data.addTaskData(TASK_TYPE.CHANGE_NICK, 1);
        }
    }

    setUserHead(headId: number): void {
        if (this._userHead !== headId) {
            this._userHead = headId;
            director.emit(GlobalEvent.refreshAvatar);
            this.doDrity();
            MgrTask.Instance.data.addTaskData(TASK_TYPE.CHANGE_HEAD, 1);
        }
    }

    addUnlockHead(headId: number): void {
        if (!this._unlockHead.includes(headId)) {
            this._unlockHead.push(headId);
            this.doDrity();
        }
    }

    addUnlockHeadFrame(frameId: number): void {
        if (!this._unlockHeadFrame.includes(frameId)) {
            this._unlockHeadFrame.push(frameId);
            director.emit(GlobalEvent.unlockHeadFrame);
            this.doDrity();
        }
    }

    addUnlockHeadFrame2(frameId: number): void {
        if (!this._unlockHeadFrame2.includes(frameId)) {
            this._unlockHeadFrame2.push(frameId);
            director.emit(GlobalEvent.unlockHeadFrameV2);
            this.doDrity();
        }
    }

    get coins(): number { return get(this.items, ITEM.Coin, 0); }
    get stars(): number { return get(this.items, ITEM.Star, 0); }
    get energy(): number { return get(this.items, ITEM.Energy, 0); }
    get goldFlower(): number { return get(this.items, ITEM.GoldFlower, 0); }
    get challengeStar(): number { return get(this.items, ITEM.ChallengeStar, 0); }
    get pickAxe(): number { return get(this.items, ITEM.PickAxe, 0); }
    
    get userName(): string { return SdkBridge.getPlayerName(); }
    get userHead(): number { return this._userHead; }
    get unlockHead(): number[] { return this._unlockHead; }
    get unlockHeadFrame(): number[] { return this._unlockHeadFrame; }
    get unlockHeadFrame2(): number[] { return this._unlockHeadFrame2; }
    
    get lastLogin(): number { return this._lastLogin; }
    set lastLogin(value: number) { 
        this._lastLogin = value;
        this.doDrity();
    }
}