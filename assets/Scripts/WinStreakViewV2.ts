import { _decorator, Label, Sprite, SpriteFrame, Node, Button, sp, Overflow, UITransform, director, Color, tween, Tween, Vec3, easing, cclegacy } from 'cc';
import {ListViewAdapter} from './ListViewAdapter';
import {ListView} from './ListView';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import { AppGame } from './AppGame';
import { BTN_BACK, VALUE_COIN } from './TopUIView';
import { UIPrefabs } from './Prefabs';
import {MgrUi} from './MgrUi';
import {Language} from './Language';
import {Utils} from './Utils';
import { MgrUser } from './MgrUser';
import {AvatarCfg} from './AvatarCfg';
import { MgrWinStreakV2 } from './MgrWinStreakV2';
import WinStreakV2Cfg from './WinStreakV2Cfg';
import { StreakItemV2 } from './StreakItemV2';
import {Tools} from './Tools';
import {indexOf, each, keys} from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('WinStreakViewV2')
export class WinStreakViewV2 extends ListViewAdapter {
    @property(Label)
    leftTime: Label | null = null;

    @property(Sprite)
    completeSprite: Sprite | null = null;

    @property(SpriteFrame)
    jobFrame: SpriteFrame | null = null;

    @property(SpriteFrame)
    endFrame: SpriteFrame | null = null;

    @property(Node)
    completeBg: Node | null = null;

    @property(Node)
    completeShain: Node | null = null;

    @property(Button)
    endRewardBtn: Button | null = null;

    @property(Node)
    endDot: Node | null = null;

    @property(Node)
    endEarnNode: Node | null = null;

    @property(ListView)
    list: ListView | null = null;

    @property(Label)
    langLabel: Label | null = null;

    @property(Label)
    streakLabel: Label | null = null;

    @property(Sprite)
    userIcon: Sprite | null = null;

    @property(sp.Skeleton)
    spineTop: sp.Skeleton | null = null;

    private _endCfg: any = null;
    private _userIconId: number | null = null;

    onLoad() {
        this._endCfg = WinStreakV2Cfg.Instance.getCfgByLevel(WinStreakV2Cfg.Instance.getMaxNum());
        this.endRewardBtn!.node.on('click', this.onEndBtn, this);
    }

    onEnable() {
        this.showUserIcon();
        MgrWinStreakV2.Instance.data.tip = true;
        this.fixLangLabel();
        
        AppGame.topUI.addBackFunc(() => {
            this.onBackBtn();
            AppGame.topUI.showMain();
        });
        
        AppGame.topUI.show(BTN_BACK | VALUE_COIN);
        MgrWinStreakV2.Instance.checkResetData();
        MgrWinStreakV2.Instance.checkResetEarn();
        
        const levelList = WinStreakV2Cfg.Instance.getLevelList();
        const maxNum = WinStreakV2Cfg.Instance.getMaxNum();
        const filteredList = levelList.filter(lv => lv !== maxNum);
        
        this.setDataSet(filteredList);
        this.list!.setAdapter(this);
        this.viewJump();
        this.showItem();
        this.showStreakLabel();
        this.showTime();
        this.schedule(this.showTime, 0.5);
        this._spineButterfly();
        
        if (MgrWinStreakV2.Instance.isShowClear) {
            this.scheduleOnce(() => {
                this.showClear();
            }, 0.5);
        }
    }

    async showUserIcon() {
        if (this._userIconId !== MgrUser.Instance.userData.userHead) {
            this._userIconId = MgrUser.Instance.userData.userHead;
            this.userIcon!.spriteFrame = await AvatarCfg.Instance.loadHeadSpriteframe(this._userIconId);
        }
    }

    fixLangLabel() {
        this.langLabel!.overflow = Overflow.NONE;
        this.langLabel!.string = Language.Instance.getLangByID('win_num');
        
        this.scheduleOnce(() => {
            if (this.langLabel!.getComponent(UITransform)!.width > 450) {
                this.langLabel!.overflow = Overflow.SHRINK;
                this.langLabel!.getComponent(UITransform)!.width = 450;
                this.langLabel!.enableWrapText = true;
            }
        }, 0.17);
    }

    showStreakLabel() {
        const streakTime = MgrWinStreakV2.Instance.getStreakTime();
        const maxNum = WinStreakV2Cfg.Instance.getMaxNum();
        const displayNum = Math.min(streakTime, maxNum);
        this.streakLabel!.string = '' + displayNum;
    }

    showClear() {
        let streakTime = MgrWinStreakV2.Instance.getStreakTime();
        if (streakTime > WinStreakV2Cfg.Instance.getMaxNum() - 1) {
            streakTime = WinStreakV2Cfg.Instance.getMaxNum() - 1;
        }
        
        if (streakTime > 0) {
            if (streakTime === 1) {
                MgrWinStreakV2.Instance.isShowClear = false;
            }
            
            const item = this.list!.getMatchItem(node => {
                return node.getComponent(StreakItemV2)!.lv === streakTime;
            });
            
            if (item && item.isValid) {
                MgrWinStreakV2.Instance.deleteWinTime();
                item.getComponent(StreakItemV2)!.showClear(0.1, () => {
                    this.showClear();
                    this.showStreakLabel();
                });
                this.viewJump(0.8, 5);
            }
        }
    }

    onDisable() {
        director.targetOff(this);
        this.unschedule(this.showTime);
        this.stopEndBoxAnim();
        this._stopSpineAct();
    }

    updateView(item: Node, index: number, data: any) {
        item.getComponent(StreakItemV2)!.show(data);
    }

    showItem() {
        const grayColor = new Color();
        const isCompleteAll = MgrWinStreakV2.Instance.isCompleteAll();
        const isMaxReached = MgrWinStreakV2.Instance.data.curTime >= WinStreakV2Cfg.Instance.getMaxNum();
        
        this.completeBg!.active = isMaxReached;
        this.checkShowShain(isMaxReached);
        this.completeSprite!.spriteFrame = isCompleteAll ? this.endFrame : this.jobFrame;
        
        const isEarned = MgrWinStreakV2.Instance.getIsEarn(this._endCfg.winnum);
        this.endRewardBtn!.interactable = !isEarned;
        this.endEarnNode!.active = isEarned;
        
        const hasMaxTime = MgrWinStreakV2.Instance.data.maxTime >= WinStreakV2Cfg.Instance.getMaxNum();
        this.endDot!.active = !isEarned && hasMaxTime;
        this.checkShowEndBoxAnim(!isEarned && hasMaxTime);
        this.boxStaticAnim(!hasMaxTime);
        
        const sprites = this.endRewardBtn!.node.getComponentsInChildren(Sprite);
        each(sprites, sprite => {
            sprite.color = isEarned ? Color.fromHEX(grayColor, '#B4B4B4') : Color.WHITE;
            sprite.grayscale = isEarned;
        });
    }

    checkShowShain(show: boolean) {
        this.completeShain!.active = false;
        if (show) {
            this.completeShain!.active = true;
            tween(this.completeShain)
                .by(1, { angle: -30 })
                .repeatForever()
                .start();
        } else {
            Tween.stopAllByTarget(this.completeShain);
        }
    }

    checkShowEndBoxAnim(show: boolean) {
        if (show) {
            tween(this.endRewardBtn!.node)
                .to(0.2, { angle: -3, position: new Vec3(-1, 3, 0) }, { easing: easing.cubicOut })
                .to(0.2, { angle: 0, position: new Vec3(0, 0, 0) }, { easing: easing.quartIn })
                .to(0.2, { angle: 3, position: new Vec3(1, 3, 0) }, { easing: easing.cubicOut })
                .to(0.2, { angle: 0, position: new Vec3(0, 0, 0) }, { easing: easing.quartIn })
                .union()
                .repeatForever()
                .start();
        } else {
            this.stopEndBoxAnim();
        }
    }

    boxStaticAnim(show: boolean) {
        if (show) {
            Tween.stopAllByTarget(this.endRewardBtn!.node);
            tween(this.endRewardBtn!.node)
                .delay(4)
                .to(0.2, { scale: new Vec3(0.98, 1.04, 1), position: new Vec3(0, 4, 0) })
                .to(0.2, { scale: new Vec3(1.02, 0.98, 1), position: new Vec3(0, -2, 0) })
                .to(0.1, { scale: Vec3.ONE, position: new Vec3(0, 0, 0) })
                .to(0.2, { scale: new Vec3(0.98, 1.04, 1), position: new Vec3(0, 4, 0) })
                .to(0.2, { scale: new Vec3(1.02, 0.98, 1), position: new Vec3(0, -2, 0) })
                .to(0.1, { scale: Vec3.ONE, position: new Vec3(0, 0, 0) })
                .union()
                .repeatForever()
                .start();
        } else {
            this.stopEndBoxAnim();
        }
    }

    stopEndBoxAnim() {
        Tween.stopAllByTarget(this.endRewardBtn!.node);
        this.endRewardBtn!.node.angle = 0;
        this.endRewardBtn!.node.setPosition(Vec3.ZERO);
        this.endRewardBtn!.node.scale = Vec3.ONE;
    }

    onEndBtn() {
        if (MgrWinStreakV2.Instance.getIsUnlock(this._endCfg.winnum)) {
            this.stopEndBoxAnim();
            MgrUi.Instance.openViewAsync(UIPrefabs.StreakEarnViewV2, {
                priority: 2,
                data: {
                    reward: this._endCfg.rewards,
                    cfg: this._endCfg,
                    delegate: this
                }
            });
        } else {
            MgrUi.Instance.openViewAsync(UIPrefabs.StreakDetailView, {
                priority: 2,
                data: {
                    reward: this._endCfg.rewards,
                    target: this.endRewardBtn!.node
                }
            });
        }
    }

    onBackBtn() {
        MgrWinStreakV2.Instance.isShowClear = false;
        this.node.getComponent(ViewAnimCtrl)!.onClose();
    }

    viewJump(duration: number = 0.5, offset: number = 3) {
        const streakTime = MgrWinStreakV2.Instance.getStreakTime();
        const levelList = WinStreakV2Cfg.Instance.getLevelList();
        let targetIndex = indexOf(levelList, streakTime) - offset;
        
        if (streakTime === 0) {
            targetIndex = levelList.length;
        } else if (streakTime > WinStreakV2Cfg.Instance.getMaxNum()) {
            targetIndex = 0;
        }
        
        this.list!.scrollToPage(targetIndex, 1, duration);
    }

    showTime() {
        const timeText = Language.Instance.getLangByID('Pass_Time');
        const remainTime = MgrWinStreakV2.Instance.getRemainTime();
        const timeStr = Utils.timeConvertToHHMM(remainTime);
        
        this.leftTime!.string = timeText + timeStr;
        
        if (remainTime <= 0) {
            this.unschedule(this.showTime);
            const rewards = MgrWinStreakV2.Instance.getAutoReward(true);
            
            if (keys(rewards).length > 0) {
                MgrUi.Instance.openViewAsync(UIPrefabs.CommonRewardView, {
                    priority: 2,
                    data: {
                        rewardData: rewards,
                        sourceType: 'WinStreak',
                        title: Language.Instance.getLangByID('win_title')
                    }
                });
            }
            
            MgrWinStreakV2.Instance.data.resetData(Tools.GetNowMoment().valueOf());
            this.onBackBtn();
            AppGame.topUI.backToUpper();
            MgrUi.Instance.closeView(UIPrefabs.StreakDetailView.url);
            MgrUi.Instance.closeView(UIPrefabs.StreakEarnViewV2.url);
        }
    }

    private _spineButterfly() {
        if (this.spineTop) {
            this.spineTop.setAnimation(0, 'streak2_butterfly', false);
            this.spineTop.setCompleteListener(() => {
                this._spineLight();
            });
        }
    }

    private _spineLight() {
        if (this.spineTop) {
            this.spineTop.setAnimation(0, 'streak2_light', false);
            this.spineTop.setCompleteListener(() => {
                this._spineParticle();
            });
        }
    }

    private _spineParticle() {
        if (this.spineTop) {
            this.spineTop.setAnimation(0, 'streak2_particle', false);
            this.spineTop.setCompleteListener(() => {
                this._spineButterfly();
            });
        }
    }

    private _stopSpineAct() {
        if (this.spineTop) {
            this.spineTop.clearAnimation();
            this.spineTop.setCompleteListener(null);
        }
    }
}