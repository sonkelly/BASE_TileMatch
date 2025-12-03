import { _decorator, Button, Node, Sprite, Label, SpriteFrame, ProgressBar, UITransform, UIOpacity, Tween, tween, v3, Vec3, easing, Component, isValid, cclegacy } from 'cc';
import { MgrUser } from './MgrUser';
import {AvatarCfg} from './AvatarCfg';
import { SdkBridge } from './SdkBridge';
import { MgrGame } from './MgrGame';
import { GameConst, ITEM } from './GameConst';
import { MgrWinStreak } from './MgrWinStreak';
import { MgrWinStreakV2 } from './MgrWinStreakV2';
import {WinStreakCfg} from './WinStreakCfg';
import WinStreakV2Cfg from './WinStreakV2Cfg';
import { ViewAnimCtrl, VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import { AdsManager } from './AdsManager';
import { LevelReviveType } from './ReportEventEnum';
import {Language} from './Language';
import {Toast} from './Toast';
import {MgrUi} from './MgrUi';
import { UIPrefabs } from './Prefabs';
import { GameFailed } from './GameFailed';
import { AppGame } from './AppGame';
import { MgrBonusWand } from './MgrBonusWand';
import {indexOf, each} from 'lodash-es';

const { ccclass, property } = _decorator;

enum TipType {
    WinStreak = 1,
    Race = 2,
    GoldTour = 3,
    Mine = 5,
    BonusWand = 6
}

enum TipPriority {
    WinStreak = 1,
    Race = 2,
    GoldTour = 3,
    Mine = 5,
    BonusWand = 6
}

@ccclass('GameClearView')
export class GameClearView extends Component {
    @property(Button)
    giveUpBtn: Button = null!;

    @property(Button)
    continueVideoBtn: Button = null!;

    @property(Button)
    continueGoldBtn: Button = null!;

    @property(Node)
    winStreakNode: Node = null!;

    @property(Sprite)
    userIcon: Sprite = null!;

    @property(Label)
    reviveCoinLabel: Label = null!;

    @property(Node)
    pointNode: Node = null!;

    @property(Node)
    listNode: Node = null!;

    @property([SpriteFrame])
    lvFrame: SpriteFrame[] = [];

    @property([SpriteFrame])
    lvFrame2: SpriteFrame[] = [];

    @property(ProgressBar)
    streakProgress: ProgressBar = null!;

    @property(Node)
    raceNode: Node = null!;

    @property(Node)
    goldTourNode: Node = null!;

    @property(Label)
    goldTourCount: Label = null!;

    @property(Node)
    mineNode: Node = null!;

    @property(Label)
    mineLabel: Label = null!;

    @property(Node)
    bonusWandNode: Node = null!;

    @property(UITransform)
    bonusWandProgressSprite: UITransform = null!;

    @property(Label)
    bonusWandProgressLabel: Label = null!;

    @property(Sprite)
    bonusWandGressBarSp: Sprite = null!;

    @property(SpriteFrame)
    bonusWandOrangegress: SpriteFrame = null!;

    @property(SpriteFrame)
    bonusWandGreengress: SpriteFrame = null!;

    private _originBonusWandProgressWidth: number = 0;
    private _cancelCall: Function = null!;
    private _continueCall: Function = null!;
    private _hasWinStreak1: boolean = false;
    private _hasWinStreak2: boolean = false;
    private _isRaceMust: boolean = false;
    private _hasGoldCube: boolean = false;
    private _hasMine: boolean = false;
    private _hasBonusWand: boolean = false;
    private _lvList: number[] = [];
    private _progress: number = 0;
    private _tipArray: TipType[] = [];
    private _tipIndex: number = 0;
    private _prevTargetNode: Node = null!;
    private _curTargetNode: Node = null!;

    onLoad() {
        this.giveUpBtn.node.on('click', this._onGiveUp, this);
        this.continueVideoBtn.node.on('click', this._onAdContinue, this);
        this.continueGoldBtn.node.on('click', this._onCoinContinue, this);
        this._originBonusWandProgressWidth = this.bonusWandProgressSprite.width;
    }

    reuse(data: any) {
        this._hasWinStreak1 = data.hasWinStreak1;
        this._hasWinStreak2 = data.hasWinStreak2;
        this._isRaceMust = data.isRaceMust;
        this._hasGoldCube = data.hasGoldCube;
        this._hasMine = data.hasMine;
        this._hasBonusWand = data.activeBonusWand;
        this._cancelCall = data.confirmCall;
        this._continueCall = data.continueCall;
    }

    onEnable() {
        this._refreshRevive();
        this._delayShowGiveUp();
        this._initWinStreak();
        this._initRaceMust();
        this._initGoldCube();
        this._initMine();
        this._initBonusWand();
        this._initShowTip();
        this._showTip();
    }

    onDisable() {
        this.unscheduleAllCallbacks();
    }

    private _refreshRevive() {
        const isAdAvailable = SdkBridge.isRewardVideoAvailable();
        const reviveCnt = MgrGame.Instance.getReviveCnt();
        this.continueVideoBtn.node.active = reviveCnt === 0 && isAdAvailable;
        this.continueGoldBtn.node.active = reviveCnt === 0 && !isAdAvailable;
        this.reviveCoinLabel.string = '' + GameConst.REVIVE_COIN_COUNT;
    }

    private _delayShowGiveUp() {
        this.giveUpBtn.node.active = false;
        const opacityComp = this.giveUpBtn.getComponent(UIOpacity) || this.giveUpBtn.addComponent(UIOpacity);
        opacityComp.opacity = 0;
        Tween.stopAllByTarget(opacityComp);
        this.scheduleOnce(() => {
            if (isValid(this.giveUpBtn.node)) {
                this.giveUpBtn.node.active = true;
                tween(opacityComp)
                    .to(0.1, { opacity: 255 })
                    .start();
            }
        }, GameConst.AdNext_Delay_Time);
    }

    private async updateHead(headId: string) {
        this.userIcon.spriteFrame = await AvatarCfg.Instance.loadHeadSpriteframe(headId);
    }

    private _initWinStreak() {
        if (this._hasWinStreak1 || this._hasWinStreak2) {
            this.winStreakNode.active = true;
            this.winStreakNode.position = v3(800, 0, 0);
            this.updateHead(MgrUser.Instance.userData.userHead);
            this._lvList = [];

            let streakTime = MgrWinStreak.Instance.getStreakTime();
            if (MgrWinStreakV2.Instance.checkInWinStreak()) {
                streakTime = MgrWinStreakV2.Instance.getStreakTime();
            }
            this.getShowList(streakTime);

            let frame = this.lvFrame;
            if (MgrWinStreakV2.Instance.checkInWinStreak()) {
                frame = this.lvFrame2;
            }
            this.streakProgress.progress = this._progress;

            each(this.listNode.children, (child, index) => {
                const sprite = child.getComponent(Sprite);
                const level = this._lvList[index];
                child.getChildByName('lv').getComponent(Label).string = '' + level;

                const isLocked = level > streakTime;
                sprite.spriteFrame = isLocked ? frame[1] : frame[0];

                let cfg = WinStreakCfg.Instance.getCfgByLevel(level);
                if (MgrWinStreakV2.Instance.checkInWinStreak()) {
                    cfg = WinStreakV2Cfg.Instance.getCfgByLevel(level);
                }
                child.scale = cfg ? new Vec3(1.4, 1.4, 1) : Vec3.ONE;
            });
        } else {
            this.winStreakNode.active = false;
        }
    }

    private getShowList(currentLevel: number) {
        let startLevel = 1;
        let maxNum = WinStreakCfg.Instance.getMaxNum();
        if (MgrWinStreakV2.Instance.checkInWinStreak()) {
            maxNum = WinStreakV2Cfg.Instance.getMaxNum();
        }
        if (currentLevel > maxNum) {
            currentLevel = maxNum;
        }

        switch (currentLevel) {
            case 1:
            case 2:
                startLevel = 1;
                break;
            case maxNum:
            case maxNum - 1:
                startLevel = maxNum - 3;
                break;
            default:
                startLevel = currentLevel - 1;
        }

        for (let i = 0; i < 4; i++) {
            const level = startLevel + i;
            this._lvList.push(level);
            if (level === currentLevel) {
                this._progress = (0.5 + i) / 3;
            }
        }
        this._showAngle(indexOf(this._lvList, currentLevel));
    }

    private _showAngle(index: number) {
        const worldPos = this.listNode.children[index].getWorldPosition();
        const localPos = this.pointNode.parent.getComponent(UITransform).convertToNodeSpaceAR(
            new Vec3(worldPos.x, worldPos.y + 50, worldPos.z)
        );
        this.pointNode.setPosition(localPos);
    }

    private _initRaceMust() {
        this.raceNode.active = this._isRaceMust;
        this.raceNode.position = v3(800, 0, 0);
    }

    private _initGoldCube() {
        this.goldTourNode.active = this._hasGoldCube;
        this.goldTourNode.position = v3(800, 0, 0);
        const goldCubeCount = AppGame.gameCtrl?.curLogic?.collectGoldCube || 0;
        this.goldTourCount.string = '' + goldCubeCount;
    }

    private _initMine() {
        this.mineNode.active = this._hasMine;
        this.mineNode.position = v3(800, 0, 0);
        const mineCount = AppGame.gameCtrl?.curLogic?.collectedAttachs?.[ITEM.PickAxe] || 0;
        this.mineLabel.string = '' + mineCount;
    }

    private _initBonusWand() {
        this.bonusWandNode.active = this._hasBonusWand;
        this.bonusWandNode.position = v3(800, 0, 0);
        const winCount = MgrBonusWand.Instance.dirtyWinCount;
        const maxWinCount = GameConst.BONUS_WAND_WINCOUNT;

        this.bonusWandProgressSprite.width = this._originBonusWandProgressWidth * winCount / maxWinCount;
        
        if (winCount >= maxWinCount) {
            this.bonusWandProgressLabel.string = Language.Instance.getLangByID('super_activated_hint_tip');
            this.bonusWandGressBarSp.spriteFrame = this.bonusWandGreengress;
        } else {
            this.bonusWandProgressLabel.string = winCount + '/' + maxWinCount;
            this.bonusWandGressBarSp.spriteFrame = this.bonusWandOrangegress;
        }
    }

    private _initShowTip() {
        const tips = [
            { type: TipType.WinStreak, priority: TipPriority.WinStreak },
            { type: TipType.Race, priority: TipPriority.Race },
            { type: TipType.GoldTour, priority: TipPriority.GoldTour },
            { type: TipType.Mine, priority: TipPriority.Mine },
            { type: TipType.BonusWand, priority: TipPriority.BonusWand }
        ];

        tips.sort((a, b) => a.priority - b.priority);
        this._tipArray.length = 0;
        this._tipIndex = 0;

        for (const tip of tips) {
            switch (tip.type) {
                case TipType.WinStreak:
                    if (this._hasWinStreak1 || this._hasWinStreak2) {
                        this._tipArray.push(tip.type);
                    }
                    break;
                case TipType.Race:
                    if (this._isRaceMust) {
                        this._tipArray.push(tip.type);
                    }
                    break;
                case TipType.GoldTour:
                    if (this._hasGoldCube) {
                        this._tipArray.push(tip.type);
                    }
                    break;
                case TipType.Mine:
                    if (this._hasMine) {
                        this._tipArray.push(tip.type);
                    }
                    break;
                case TipType.BonusWand:
                    if (this._hasBonusWand) {
                        this._tipArray.push(tip.type);
                    }
                    break;
            }
        }
    }

    private _showTip() {
        if (this._tipArray.length <= 0) {
            console.error('err! tipArray is Empty!');
            return;
        }

        const tipType = this._tipArray[this._tipIndex];
        const targetNode = this._getTipNodeByType(tipType);
        
        if (!targetNode) {
            console.error('err! targetNode is null!');
            return;
        }

        this._prevTargetNode = this._curTargetNode;
        this._curTargetNode = targetNode;

        if (this._tipIndex === 0) {
            targetNode.active = true;
            targetNode.position = v3(0, 0, 0);
        } else {
            if (this._prevTargetNode) {
                Tween.stopAllByTarget(this._prevTargetNode);
                tween(this._prevTargetNode)
                    .set({ position: v3(0, 0, 0) })
                    .to(0.64, { position: v3(-800, 0, 0) }, { easing: easing.smooth })
                    .start();
            }

            if (this._curTargetNode) {
                Tween.stopAllByTarget(this._curTargetNode);
                tween(this._curTargetNode)
                    .set({ position: v3(800, 0, 0) })
                    .to(0.64, { position: v3(0, 0, 0) }, { easing: easing.smooth })
                    .start();
            }
        }
    }

    private _getTipNodeByType(type: TipType): Node | null {
        switch (type) {
            case TipType.WinStreak:
                return this.winStreakNode;
            case TipType.Race:
                return this.raceNode;
            case TipType.GoldTour:
                return this.goldTourNode;
            case TipType.Mine:
                return this.mineNode;
            case TipType.BonusWand:
                return this.bonusWandNode;
            default:
                return null;
        }
    }

    private _onClose() {
        this.node.getComponent(ViewAnimCtrl).onClose();
    }

    private _onGiveUp() {
        this._tipIndex++;
        if (this._tipIndex >= this._tipArray.length) {
            this._cancelCall();
            this._onClose();
        } else {
            this._showTip();
        }
    }

    private _onAdContinue() {
        AdsManager.getInstance().showRewardedVideo({
            OpenUi: 'GameClearView',
            AdsType: 'AdWinRevive',
            onSucceed: () => {
                if (this._continueCall) {
                    this._continueCall(LevelReviveType.Ad);
                }
                this._onClose();
            },
            onFail: () => {
                Toast.tip(Language.Instance.getLangByID('ad_not_ready'));
            }
        });
    }

    private _onCoinContinue() {
        MgrUi.Instance.closeView(UIPrefabs.GameFailed.url);
        
        if (MgrUser.Instance.userData.subItem(ITEM.Coin, GameConst.REVIVE_COIN_COUNT, { type: 'Revive' })) {
            if (this._continueCall) {
                this._continueCall(LevelReviveType.Coin);
            }
        } else {
            MgrUi.Instance.openViewAsync(UIPrefabs.ShopView, {
                root: MgrUi.root(1),
                callback: (view) => {
                    view.once(VIEW_ANIM_EVENT.Removed, () => {
                        MgrUi.Instance.openViewAsync(UIPrefabs.GameFailed, {
                            root: MgrUi.root(2),
                            callback: (failedView) => {
                                failedView.once(VIEW_ANIM_EVENT.InDone, () => {
                                    failedView.getComponent(GameFailed).onClickReplay();
                                });
                            }
                        });
                        MgrUi.Instance.openViewAsync(UIPrefabs.CollectFreeGold);
                    });
                }
            });
        }
        this._onClose();
    }
}