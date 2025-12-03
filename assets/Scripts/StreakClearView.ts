import { _decorator, Button, Label, Node, SpriteFrame, ProgressBar, Sprite, isValid, Vec3, UITransform, Component, cclegacy } from 'cc';
import { ViewAnimCtrl, VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import { MgrWinStreak } from './MgrWinStreak';
import {WinStreakCfg} from './WinStreakCfg';
import { AdsManager } from './AdsManager';
import {Toast} from './Toast';
import {Language} from './Language';
import {AvatarCfg} from './AvatarCfg';
import { GameConst, ITEM } from './GameConst';
import { SdkBridge } from './SdkBridge';
import { MgrChallenge } from './MgrChallenge';
import { MgrGame } from './MgrGame';
import { MgrUser } from './MgrUser';
import { UIPrefabs } from './Prefabs';
import {MgrUi} from './MgrUi';
import { MgrAnalytics } from './MgrAnalytics';
import { AnalyticsManager } from './AnalyticsManager';
import { LevelReviveType } from './ReportEventEnum';
import { GameFailed } from './GameFailed';
import { MgrWinStreakV2 } from './MgrWinStreakV2';
import WinStreakV2Cfg from './WinStreakV2Cfg';
import { AppGame } from './AppGame';
import {HardLevelCfg} from './HardLevelCfg';
import { GameMode } from './Const';
import {indexOf, each} from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('StreakClearView')
export class StreakClearView extends Component {
    @property(Button)
    closeBtn: Button | null = null;

    @property(Button)
    giveUpBtn: Button | null = null;

    @property(Button)
    continueVideoBtn: Button | null = null;

    @property(Button)
    continueGoldBtn: Button | null = null;

    @property(Label)
    coinLabel: Label | null = null;

    @property(Node)
    pointNode: Node | null = null;

    @property(Node)
    listNode: Node | null = null;

    @property([SpriteFrame])
    lvFrame: SpriteFrame[] = [];

    @property([SpriteFrame])
    lvFrame2: SpriteFrame[] = [];

    @property(ProgressBar)
    streakProgress: ProgressBar | null = null;

    @property(Sprite)
    userIcon: Sprite | null = null;

    private _confirmCall: (() => void) | null = null;
    private _continueCall: (() => void) | null = null;
    private _lvList: number[] = [];
    private _progress: number = 0;
    private _userIconId: number | null = null;

    reuse(data: { confirmCall: () => void; continueCall: () => void }) {
        this._confirmCall = data.confirmCall;
        this._continueCall = data.continueCall;
    }

    onLoad() {
        this.closeBtn!.node.on('click', this.onClose, this);
        this.continueVideoBtn!.node.on('click', this.onAdContinue, this);
        this.continueGoldBtn!.node.on('click', this.onCoinContinue, this);
        this.giveUpBtn!.node.on('click', this.onGiveUp, this);
    }

    onEnable() {
        this.showUserIcon();
        this.showList();
        this.refreshRevive();
        this.giveUpBtn!.node.active = false;
        this.scheduleOnce(() => {
            if (isValid(this.giveUpBtn!.node)) {
                this.giveUpBtn!.node.active = true;
            }
        }, GameConst.AdNext_Delay_Time);
    }

    refreshRevive() {
        const isAdAvailable = SdkBridge.isRewardVideoAvailable();
        const reviveCnt = this.getReviveCnt();
        this.continueVideoBtn!.node.active = reviveCnt === 0 && isAdAvailable;
        this.continueGoldBtn!.node.active = reviveCnt === 0 && !isAdAvailable;
        this.coinLabel!.string = '' + GameConst.REVIVE_COIN_COUNT;
    }

    getReviveCnt(): number {
        return AppGame.gameCtrl.currMode === GameMode.Challenge 
            ? MgrChallenge.Instance.getReviveTime() 
            : MgrGame.Instance.gameData.reviveCnt;
    }

    showList() {
        this._lvList = [];
        let streakTime = MgrWinStreak.Instance.getStreakTime();
        
        if (MgrWinStreakV2.Instance.checkInWinStreak()) {
            streakTime = MgrWinStreakV2.Instance.getStreakTime();
        }

        if (streakTime <= 0) {
            this._confirmCall?.();
            this.onClose();
            return;
        }

        this.getShowList(streakTime);
        
        let frameList = this.lvFrame;
        if (MgrWinStreakV2.Instance.checkInWinStreak()) {
            frameList = this.lvFrame2;
        }

        this.streakProgress!.progress = this._progress;
        
        each(this.listNode!.children, (node, index) => {
            const sprite = node.getComponent(Sprite)!;
            const level = this._lvList[index];
            node.getChildByName('lv')!.getComponent(Label)!.string = '' + level;
            
            const isLocked = level > streakTime;
            sprite.spriteFrame = isLocked ? frameList[1] : frameList[0];
            
            let cfg = WinStreakCfg.Instance.getCfgByLevel(level);
            if (MgrWinStreakV2.Instance.checkInWinStreak()) {
                cfg = WinStreakV2Cfg.Instance.getCfgByLevel(level);
            }
            
            node.scale = cfg ? new Vec3(1.4, 1.4, 1) : Vec3.ONE;
        });
    }

    async showUserIcon() {
        if (this._userIconId !== MgrUser.Instance.userData.userHead) {
            this._userIconId = MgrUser.Instance.userData.userHead;
            this.userIcon!.spriteFrame = await AvatarCfg.Instance.loadHeadSpriteframe(this._userIconId);
        }
    }

    getShowList(currentLevel: number) {
        let startLevel = 1;
        let maxLevel = WinStreakCfg.Instance.getMaxNum();
        
        if (MgrWinStreakV2.Instance.checkInWinStreak()) {
            maxLevel = WinStreakV2Cfg.Instance.getMaxNum();
        }
        
        if (currentLevel > maxLevel) {
            currentLevel = maxLevel;
        }

        switch (currentLevel) {
            case 1:
            case 2:
                startLevel = 1;
                break;
            case maxLevel:
            case maxLevel - 1:
                startLevel = maxLevel - 3;
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

        this.showAngle(indexOf(this._lvList, currentLevel));
    }

    showAngle(index: number) {
        const worldPos = this.listNode!.children[index].getWorldPosition();
        const nodePos = this.pointNode!.parent!.getComponent(UITransform)!
            .convertToNodeSpaceAR(new Vec3(worldPos.x, worldPos.y + 50, worldPos.z));
        this.pointNode!.setPosition(nodePos);
    }

    onClose() {
        this.node.getComponent(ViewAnimCtrl)!.onClose();
    }

    onAdContinue() {
        AdsManager.getInstance().showRewardedVideo({
            OpenUi: 'StreakClearView',
            AdsType: 'AdWinRevive',
            onSucceed: () => {
                this._continueCall?.();
                this.reportLevelRevive(LevelReviveType.Ad);
                this.onClose();
            },
            onFail: () => {
                Toast.tip(Language.Instance.getLangByID('ad_not_ready'));
            }
        });
    }

    onCoinContinue() {
        this.onClose();
        MgrUi.Instance.closeView(UIPrefabs.GameFailed.url);
        
        if (MgrUser.Instance.userData.subItem(ITEM.Coin, GameConst.REVIVE_COIN_COUNT, { type: 'Revive' })) {
            this._continueCall?.();
            this.reportLevelRevive(LevelReviveType.Coin);
            this.onClose();
        } else {
            MgrUi.Instance.openViewAsync(UIPrefabs.ShopView, {
                root: MgrUi.root(1),
                callback: (view) => {
                    view.once(VIEW_ANIM_EVENT.Removed, () => {
                        MgrUi.Instance.openViewAsync(UIPrefabs.GameFailed, {
                            root: MgrUi.root(2),
                            callback: (failedView) => {
                                failedView.once(VIEW_ANIM_EVENT.InDone, () => {
                                    failedView.getComponent(GameFailed)!.onClickReplay();
                                });
                            }
                        });
                        MgrUi.Instance.openViewAsync(UIPrefabs.CollectFreeGold);
                    });
                }
            });
        }
    }

    onGiveUp() {
        this._confirmCall?.();
        this.onClose();
    }

    reportLevelRevive(reviveType: LevelReviveType) {
        const currentLevel = MgrGame.Instance.gameData.curLv;
        let levelMode = 'Normal';
        
        if (HardLevelCfg.Instance.get(currentLevel)) {
            levelMode = 'Hard';
        } else if (HardLevelCfg.Instance.get(currentLevel - 1)) {
            levelMode = 'Reward';
        }

        const data = {
            Level_Id: currentLevel,
            Level_Mode: levelMode,
            ReviveType: reviveType,
            FailTimes: MgrAnalytics.Instance.data.getLossTime(currentLevel)
        };
        
        AnalyticsManager.getInstance().reportLevelRevive(data);
    }
}