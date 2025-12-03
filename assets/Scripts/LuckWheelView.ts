import { _decorator, Component, Node, Button, Vec3, instantiate, director, v3, cclegacy } from 'cc';
import { AppGame } from './AppGame';
import { BTN_BACK, VALUE_COIN } from './TopUIView';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import { MgrLuckWheel } from './MgrLuckWheel';
import { LuckWheelViewLamp } from './LuckWheelViewLamp';
import { IWheel, WheelState } from './IWheel';
import { LuckWheelViewRewardItem } from './LuckWheelViewRewardItem';
import { TurntableRewardCfg } from './TurntableRewardCfg';
import { LuckWheelViewCiShuItem } from './LuckWheelViewCiShuItem';
import { ITEM, GameConst } from './GameConst';
import { GlobalEvent } from './Events';
import { AsyncQueue } from './AsyncQueue';
import { MgrUser } from './MgrUser';
import { AdsManager } from './AdsManager';
import { Toast } from './Toast';
import { Language } from './Language';
import { Utils } from './Utils';
import { findIndex } from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('LuckWheelView')
export class LuckWheelView extends IWheel {
    @property(Node)
    panNode: Node = null!;

    @property(Node)
    pointNode: Node = null!;

    @property(LuckWheelViewLamp)
    lampCmp: LuckWheelViewLamp = null!;

    @property(Node)
    rewardItems: Node = null!;

    @property(Button)
    spinBtn: Button = null!;

    @property(Node)
    freeGetNode: Node = null!;

    @property(Node)
    adGetNode: Node = null!;

    @property(Node)
    cishuItemNode: Node = null!;

    @property(Node)
    cishuItemContent: Node = null!;

    private _cishuItems: LuckWheelViewCiShuItem[] = [];
    private _rewardItems: LuckWheelViewRewardItem[] = [];
    private _resultAsync: AsyncQueue | null = null;

    onLoad() {
        this.spinBtn.node.on('click', this._onClickSpinBtn, this);
        
        for (let i = 0; i < GameConst.TurntableSpinNum; i++) {
            let item = instantiate(this.cishuItemNode);
            item.active = true;
            item.parent = this.cishuItemContent;
            this._cishuItems.push(item.getComponent(LuckWheelViewCiShuItem)!);
        }
    }

    onEnable() {
        AppGame.topUI.addBackFunc(() => {
            this._onBackBtn();
            AppGame.topUI.showMain();
        });
        
        AppGame.topUI.show(BTN_BACK | VALUE_COIN);
        MgrLuckWheel.Instance.data.isNew = false;
        
        director.on(GlobalEvent.luckWheelGetReward, this._onGetRewardRefresh, this);
        director.on(GlobalEvent.luckWheelRefreshData, this._luckWheelDataRefresh, this);
        this._luckWheelDataRefresh();
    }

    onDisable() {
        director.targetOff(this);
        
        if (this._resultAsync) {
            this._resultAsync.clear();
            this._resultAsync = null;
        }
    }

    private _luckWheelDataRefresh() {
        this._refreshReward();
        this._onGetRewardRefresh();
    }

    private _onGetRewardRefresh() {
        this._refreshCishu();
        this._refreshBtnStatus();
    }

    private _refreshReward() {
        const rewardIds = MgrLuckWheel.Instance.getRewardIds();
        
        if (this._rewardItems.length <= 0) {
            this.rewardItems.children.forEach(child => {
                this._rewardItems.push(child.getComponent(LuckWheelViewRewardItem)!);
            });
        }

        if (rewardIds.length === this._rewardItems.length) {
            for (let i = 0; i < rewardIds.length; i++) {
                const cfgId = rewardIds[i];
                const cfg = TurntableRewardCfg.Instance.get(cfgId);
                const itemId = cfg.rewardInfo.id;
                const count = cfg.rewardInfo.count;
                const isOwned = MgrLuckWheel.Instance.getOwnReward().includes(cfgId);
                const item = this._rewardItems[i];

                item.cfg = cfg;
                item.setIconSize(itemId);
                item.setIcon(itemId);
                item.setCount(count);
                item.setGet(isOwned);
            }
        } else {
            console.error('cfg Err!');
        }
    }

    private _refreshCishu() {
        const usedTimes = MgrLuckWheel.Instance.getGroupUseTime();
        this._cishuItems.forEach((item, index) => {
            item.setShow(index >= usedTimes);
        });
    }

    private _refreshBtnStatus() {
        const usedTimes = MgrLuckWheel.Instance.getGroupUseTime();
        this.freeGetNode.active = usedTimes <= 0;
        this.adGetNode.active = usedTimes > 0;
    }

    private _refreshRewardGet() {
        const rewardIds = MgrLuckWheel.Instance.getRewardIds();
        for (let i = 0; i < rewardIds.length; i++) {
            const cfgId = rewardIds[i];
            const isOwned = MgrLuckWheel.Instance.getOwnReward().includes(cfgId);
            this._rewardItems[i].setGet(isOwned);
        }
    }

    private _onClickSpinBtn() {
        if (MgrLuckWheel.Instance.getGroupUseTime() <= 0) {
            if (this.state !== WheelState.IDLE) return;
            if (!MgrLuckWheel.Instance.canSpin()) return;
            this._setRun(false);
        } else {
            if (this.state !== WheelState.IDLE) return;
            if (!MgrLuckWheel.Instance.canSpin()) return;
            
            this.state = WheelState.READY;
            AdsManager.getInstance().showRewardedVideo({
                OpenUi: 'LuckWheelView',
                AdsType: 'SpinReward',
                onSucceed: () => {
                    this._setRun(true);
                },
                onCancel: () => {
                    this.state = WheelState.IDLE;
                },
                onFail: () => {
                    this.state = WheelState.IDLE;
                    Toast.tip(Language.Instance.getLangByID('ad_not_ready'));
                }
            });
        }
    }

    private _setRun(isAd: boolean) {
        const rewardId = MgrLuckWheel.Instance.getSpinReward(isAd);
        if (rewardId) {
            const index = findIndex(this._rewardItems, item => item.cfg.id === rewardId);
            if (index < 0) {
                console.error('no index by cfgId:', rewardId);
            } else {
                this.lampCmp.showSpin();
                this.play();
                this.setResult(index);
            }
        }
    }

    private _onBackBtn() {
        this.getComponent(ViewAnimCtrl)!.onClose();
    }

    onStartup() {
        this.runningAngle = -this.panNode.eulerAngles.z;
    }

    refresh(angle: number) {
        const vec = v3(0, 0, -angle);
        this.panNode.eulerAngles = vec;
        
        const speedRatio = this.getSpeedRatio();
        let targetAngle = 30 * speedRatio;
        
        if (speedRatio >= 0.8) {
            targetAngle += Utils.randomRange(-4, 4);
        }
        
        this.pointNode.eulerAngles = v3(0, 0, targetAngle);
    }

    onEnterBack() {}

    onRunDone(index: number, callback: Function) {
        this.pointNode.eulerAngles = v3(0, 0, 0);
        
        const rewardItem = this._rewardItems[index];
        const worldPos = rewardItem.iconSp.node.getWorldPosition();
        const itemId = rewardItem.cfg.rewardInfo.id;
        const count = rewardItem.cfg.rewardInfo.count;
        
        this.lampCmp.showWin();
        callback();
        
        if (itemId === ITEM.Light) {
            this._createFlyTaskWithLight(worldPos, itemId, count);
        } else {
            this._createFlyTaskWithOutLight(worldPos, itemId, count);
        }
    }

    private _createFlyTaskWithLight(pos: Vec3, itemId: number, count: number) {
        this._resultAsync = new AsyncQueue();
        
        this._resultAsync.push((next: Function) => {
            AppGame.topUI.lightningItem.show(0.2, next);
        });
        
        this._resultAsync.push((next: Function) => {
            const currentCount = MgrUser.Instance.userData.getItem(itemId);
            MgrUser.Instance.userData.flyAddItem({
                itemId: itemId,
                change: count,
                result: currentCount,
                sourcePos: pos,
                callback: () => {
                    next();
                }
            });
        });
        
        this._resultAsync.push((next: Function) => {
            this.scheduleOnce(next, 0.4);
        });
        
        this._resultAsync.push((next: Function) => {
            AppGame.topUI.lightningItem.hide();
            this.lampCmp.showWait();
            next();
        });
        
        this._resultAsync.complete = () => {
            this._refreshRewardGet();
            if (!MgrLuckWheel.Instance.canSpin()) {
                AppGame.topUI.backToUpper();
            }
        };
        
        this._resultAsync.play();
    }

    private _createFlyTaskWithOutLight(pos: Vec3, itemId: number, count: number) {
        this._resultAsync = new AsyncQueue();
        
        this._resultAsync.push((next: Function) => {
            const currentCount = MgrUser.Instance.userData.getItem(itemId);
            MgrUser.Instance.userData.flyAddItem({
                itemId: itemId,
                change: count,
                result: currentCount,
                sourcePos: pos,
                callback: () => {
                    next();
                }
            });
        });
        
        this._resultAsync.push((next: Function) => {
            this.lampCmp.showWait();
            next();
        });
        
        this._resultAsync.complete = () => {
            this._refreshRewardGet();
            if (!MgrLuckWheel.Instance.canSpin()) {
                AppGame.topUI.backToUpper();
            }
        };
        
        this._resultAsync.play();
    }
}