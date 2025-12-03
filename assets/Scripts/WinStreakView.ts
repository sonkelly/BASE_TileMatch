import { _decorator, Node, Label, Sprite, SpriteFrame, Button, Overflow, UITransform, director, Color, tween, Tween, Vec3, easing } from 'cc';
import {ListView} from './ListView';
import {ViewAnimCtrl} from './ViewAnimCtrl';
import { AppGame } from './AppGame';
import { BTN_BACK, VALUE_COIN } from './TopUIView';
import { MgrWinStreak } from './MgrWinStreak';
import {WinStreakCfg} from './WinStreakCfg';
import { StreakItem } from './StreakItem';
import { UIPrefabs } from './Prefabs';
import {MgrUi} from './MgrUi';
import {Language} from './Language';
import {Utils} from './Utils';
import { MgrUser } from './MgrUser';
import {AvatarCfg} from './AvatarCfg';
import {Tools} from './Tools';
import {keys, indexOf, each} from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('WinStreakView')
export class WinStreakView extends ListView {
    @property(Node)
    aniNode: Node = null!;

    @property(Label)
    leftTime: Label = null!;

    @property(Sprite)
    completeSprite: Sprite = null!;

    @property(SpriteFrame)
    jobFrame: SpriteFrame = null!;

    @property(SpriteFrame)
    endFrame: SpriteFrame = null!;

    @property(Node)
    completeBg: Node = null!;

    @property(Node)
    completeShain: Node = null!;

    @property(Button)
    endRewardBtn: Button = null!;

    @property(Node)
    endDot: Node = null!;

    @property(Node)
    endEarnNode: Node = null!;

    @property(ListView)
    list: ListView = null!;

    @property(Label)
    langLabel: Label = null!;

    @property(Label)
    streakLabel: Label = null!;

    @property(Sprite)
    userIcon: Sprite = null!;

    private _endCfg: any = null;
    private _userIconId: number = null!;

    onLoad() {
        this._endCfg = WinStreakCfg.Instance.getCfgByLevel(WinStreakCfg.Instance.getMaxNum());
        this.endRewardBtn.node.on('click', this.onEndBtn, this);
    }

    onEnable() {
        this.showUserIcon();
        MgrWinStreak.Instance.data.tip = true;
        this.onAnimTween();
        this.fixLangLabel();
        
        AppGame.topUI.addBackFunc(() => {
            this.onBackBtn();
            AppGame.topUI.showMain();
        });
        
        AppGame.topUI.show(BTN_BACK | VALUE_COIN);
        MgrWinStreak.Instance.checkResetData();
        MgrWinStreak.Instance.checkResetEarn();
        
        const levelList = WinStreakCfg.Instance.getLevelList();
        const maxNum = WinStreakCfg.Instance.getMaxNum();
        const filteredList = levelList.filter(lv => lv !== maxNum);
        
        this.setDataSet(filteredList);
        this.list.setAdapter(this);
        this.viewJump();
        this.showItem();
        this.showStreakLabel();
        this.showTime();
        this.schedule(this.showTime, 0.5);
        
        if (MgrWinStreak.Instance.isShowClear) {
            this.scheduleOnce(() => {
                this.showClear();
            }, 0.5);
        }
    }

    async showUserIcon() {
        if (this._userIconId !== MgrUser.Instance.userData.userHead) {
            this._userIconId = MgrUser.Instance.userData.userHead;
            this.userIcon.spriteFrame = await AvatarCfg.Instance.loadHeadSpriteframe(this._userIconId);
        }
    }

    fixLangLabel() {
        this.langLabel.overflow = Overflow.NONE;
        this.langLabel.string = Language.Instance.getLangByID('win_num');
        
        this.scheduleOnce(() => {
            if (this.langLabel.getComponent(UITransform).width > 450) {
                this.langLabel.overflow = Overflow.SHRINK;
                this.langLabel.getComponent(UITransform).width = 450;
                this.langLabel.enableWrapText = true;
            }
        }, 0.17);
    }

    showStreakLabel() {
        const streakTime = MgrWinStreak.Instance.getStreakTime();
        const maxNum = WinStreakCfg.Instance.getMaxNum();
        const displayNum = Math.min(streakTime, maxNum);
        this.streakLabel.string = '' + displayNum;
    }

    showClear() {
        let streakTime = MgrWinStreak.Instance.getStreakTime();
        if (streakTime > WinStreakCfg.Instance.getMaxNum() - 1) {
            streakTime = WinStreakCfg.Instance.getMaxNum() - 1;
        }
        
        if (streakTime > 0) {
            if (streakTime === 1) {
                MgrWinStreak.Instance.isShowClear = true;
            }
            
            const item = this.list.getMatchItem((node: Node) => {
                return node.getComponent(StreakItem).lv === streakTime;
            });
            
            if (item && item.isValid) {
                MgrWinStreak.Instance.deleteWinTime();
                item.getComponent(StreakItem).showClear(0.1, () => {
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
    }

    updateView(item: Node, index: number, data: any) {
        item.getComponent(StreakItem).show(data);
    }

    showItem() {
        const grayColor = new Color();
        const isCompleteAll = MgrWinStreak.Instance.isCompleteAll();
        const isMaxReached = MgrWinStreak.Instance.data.curTime >= WinStreakCfg.Instance.getMaxNum();
        
        this.completeBg.active = isMaxReached;
        this.checkShowShain(isMaxReached);
        this.completeSprite.spriteFrame = isCompleteAll ? this.endFrame : this.jobFrame;
        
        const isEarned = MgrWinStreak.Instance.getIsEarn(this._endCfg.winnum);
        this.endRewardBtn.interactable = !isEarned;
        this.endEarnNode.active = isEarned;
        
        const hasMaxRecord = MgrWinStreak.Instance.data.maxTime >= WinStreakCfg.Instance.getMaxNum();
        this.endDot.active = !isEarned && hasMaxRecord;
        this.checkShowEndBoxAnim(!isEarned && hasMaxRecord);
        this.boxStaticAnim(!hasMaxRecord);
        
        const sprites = this.endRewardBtn.node.getComponentsInChildren(Sprite);
        each(sprites, (sprite: Sprite) => {
            sprite.color = isEarned ? Color.fromHEX(grayColor, '#B4B4B4') : Color.WHITE;
            sprite.grayscale = isEarned;
        });
    }

    checkShowShain(show: boolean) {
        this.completeShain.active = false;
        if (show) {
            this.completeShain.active = true;
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
            tween(this.endRewardBtn.node)
                .to(0.2, { 
                    angle: -3, 
                    position: new Vec3(-1, 3, 0) 
                }, { easing: easing.cubicOut })
                .to(0.2, { 
                    angle: 0, 
                    position: new Vec3(0, 0, 0) 
                }, { easing: easing.quartIn })
                .to(0.2, { 
                    angle: 3, 
                    position: new Vec3(1, 3, 0) 
                }, { easing: easing.cubicOut })
                .to(0.2, { 
                    angle: 0, 
                    position: new Vec3(0, 0, 0) 
                }, { easing: easing.quartIn })
                .union()
                .repeatForever()
                .start();
        } else {
            this.stopEndBoxAnim();
        }
    }

    boxStaticAnim(show: boolean) {
        if (show) {
            Tween.stopAllByTarget(this.endRewardBtn.node);
            tween(this.endRewardBtn.node)
                .delay(4)
                .to(0.2, { 
                    scale: new Vec3(0.98, 1.04, 1), 
                    position: new Vec3(0, 4, 0) 
                })
                .to(0.2, { 
                    scale: new Vec3(1.02, 0.98, 1), 
                    position: new Vec3(0, -2, 0) 
                })
                .to(0.1, { 
                    scale: Vec3.ONE, 
                    position: new Vec3(0, 0, 0) 
                })
                .to(0.2, { 
                    scale: new Vec3(0.98, 1.04, 1), 
                    position: new Vec3(0, 4, 0) 
                })
                .to(0.2, { 
                    scale: new Vec3(1.02, 0.98, 1), 
                    position: new Vec3(0, -2, 0) 
                })
                .to(0.1, { 
                    scale: Vec3.ONE, 
                    position: new Vec3(0, 0, 0) 
                })
                .union()
                .repeatForever()
                .start();
        } else {
            this.stopEndBoxAnim();
        }
    }

    stopEndBoxAnim() {
        Tween.stopAllByTarget(this.endRewardBtn.node);
        this.endRewardBtn.node.angle = 0;
        this.endRewardBtn.node.setPosition(Vec3.ZERO);
        this.endRewardBtn.node.scale = Vec3.ONE;
    }

    onEndBtn() {
        if (MgrWinStreak.Instance.getIsUnlock(this._endCfg.winnum)) {
            this.stopEndBoxAnim();
            MgrUi.Instance.openViewAsync(UIPrefabs.StreakEarnView, {
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
                    target: this.endRewardBtn.node
                }
            });
        }
    }

    onBackBtn() {
        MgrWinStreak.Instance.isShowClear = true;
        this.node.getComponent(ViewAnimCtrl).onClose();
    }

    viewJump(duration: number = 0.5, offset: number = 3) {
        const streakTime = MgrWinStreak.Instance.getStreakTime();
        const levelList = WinStreakCfg.Instance.getLevelList();
        let targetIndex = indexOf(levelList, streakTime) - offset;
        
        if (streakTime === 0) {
            targetIndex = levelList.length;
        } else if (streakTime > WinStreakCfg.Instance.getMaxNum()) {
            targetIndex = 0;
        }
        
        this.list.scrollToPage(targetIndex, 1, duration);
    }

    showTime() {
        const timeText = Language.Instance.getLangByID('Pass_Time');
        const remainTime = MgrWinStreak.Instance.getRemainTime();
        const timeStr = Utils.timeConvertToHHMM(remainTime);
        
        this.leftTime.string = timeText + timeStr;
        
        if (remainTime <= 0) {
            this.unschedule(this.showTime);
            const rewards = MgrWinStreak.Instance.getAutoReward(true);
            
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
            
            MgrWinStreak.Instance.data.resetData(Tools.GetNowMoment().valueOf());
            this.onBackBtn();
            AppGame.topUI.backToUpper();
            MgrUi.Instance.closeView(UIPrefabs.StreakDetailView.url);
            MgrUi.Instance.closeView(UIPrefabs.StreakEarnView.url);
        }
    }

    onAnimTween() {
        const startPos = new Vec3(-100, -350, 0);
        const endPos = new Vec3(100, -176, 0);
        
        Tween.stopAllByTarget(this.aniNode);
        this.aniNode.setPosition(startPos);
        
        tween(this.aniNode)
            .to(8, { position: endPos })
            .call(() => {
                this.aniNode.setPosition(startPos);
            })
            .union()
            .repeatForever()
            .start();
    }
}