import { _decorator, Button, Node, Label, sp, director, Vec3, tween, easing, Tween } from 'cc';
import { ViewBase } from './ViewBase';
import {MgrUi} from './MgrUi';
import { GMViews, UIPrefabs } from './Prefabs';
import { GlobalEvent } from './Events';
import { MgrUser } from './MgrUser';
import { ITEM, GameConst } from './GameConst';
import { InviteReportPoint } from './ReportEventEnum';
import { MgrAnalytics } from './MgrAnalytics';
import { AnalyticsManager } from './AnalyticsManager';
import { MgrChallenge } from './MgrChallenge';
import { MgrTask } from './MgrTask';
import { AppGame } from './AppGame';
import {Language, LanguageEvent} from './Language';
import { GmMgr } from './GMManager';
import { NativeBridge } from './NativeBridge';
import {Tools} from './Tools';
import {HardLevelCfg} from './HardLevelCfg';
import { MgrRace } from './MgrRace';
import {LevelCfg} from './LevelCfg';
import { MgrGame } from './MgrGame';
import { SocialManager, SocialMgr } from './SocialManager';
import { MgrBattleLevel } from './MgrBattleLevel';

const { ccclass, property } = _decorator;

@ccclass('MainUI')
export class MainUI extends ViewBase {
    @property(Button)
    public btnLevelStart: Button | null = null;

    @property(Button)
    public btnChallenge: Button | null = null;

    @property(Node)
    public challengeDot: Node | null = null;

    @property(Label)
    public currLevelLabel: Label | null = null;

    @property(Label)
    public wisdomLabel: Label | null = null;

    @property(Node)
    public wisdomShain: Node | null = null;

    @property(Node)
    public sunNode: Node | null = null;

    @property(Node)
    public hardTipNode: Node | null = null;

    @property(Node)
    public raceMustNode: Node | null = null;

    @property(Node)
    public bounsTipNode: Node | null = null;

    @property(Node)
    public battleTipNode: Node | null = null;

    @property(Node)
    public battleTip1: Node | null = null;

    @property(Node)
    public battleTip2: Node | null = null;

    @property(sp.Skeleton)
    public levelSpine: sp.Skeleton | null = null;

    onLoad() {
        this.btnLevelStart?.node.on('click', this.onClickLevelStart, this);
        this.btnChallenge?.node.on('click', this.onClickChallenge, this);
        MgrTask.Instance.getYearTask();
    }

    onEnable() {
        director.on(GlobalEvent.ChangeLevel, this.onChangeLevel, this);
        director.on(LanguageEvent.CHANGE, this.syncLevel, this);
        director.on(GlobalEvent.SettementRaceTurn, this.refreshRaceMustNode, this);
        director.on(GlobalEvent.changeRaceState, this.refreshRaceMustNode, this);

        if (GmMgr.getInGameGm() && !MgrUi.Instance.hasView(GMViews.GMMainBtn.url)) {
            MgrUi.Instance.openViewAsync(GMViews.GMMainBtn, { priority: 1 });
        }

        const curLv = MgrGame.Instance.gameData.curLv;
        const cfg = LevelCfg.Instance.getCfg(curLv);
        const lvlBg = LevelCfg.Instance.getLevelBg(curLv);

        if (cfg?.sp && cfg.bg === lvlBg) {
            if (this.levelSpine) {
                this.levelSpine.node.active = true;
                this.levelSpine.setAnimation(0, cfg.sp, true);
            }
        } else {
            if (this.levelSpine) this.levelSpine.node.active = false;
        }

        AppGame.Ins.checkNetwork();
    }

    start() {
        this.scheduleOnce(() => {
            MgrUser.Instance.checkBack();
        }, 1);
    }

    onDisable() {
        director.targetOff(this);
        if (MgrUi.Instance.hasView(GMViews.GMMainBtn.url)) {
            MgrUi.Instance.closeView(GMViews.GMMainBtn.url);
        }
    }

    async enter(cb: Function) {
        this.node.active = true;
        if (!MgrGame.Instance.gameData.levelData) {
            MgrGame.Instance.gameData.curLv = MgrGame.Instance.gameData.maxLv;
        }
        this.syncLevel();
        this.freshWisdom();
        this.wisdomTween();
        this.playEnter();
        cb && cb();
        this.reportStartGame();
        if (this.btnChallenge) {
            this.btnChallenge.node.active = MgrGame.Instance.gameData.maxLv > GameConst.CHALLENGE_OPEN_LEVEL;
        }
        if (this.challengeDot) {
            this.challengeDot.active = MgrChallenge.Instance.getRedDotEnable();
        }
        AppGame.gameBg.tryChange(() => {});
    }

    exit(cb: Function) {
        this.node.active = false;
        director.targetOff(this);
        Tween.stopAllByTarget(this.wisdomShain ?? undefined);
        cb && cb();
    }

    playEnter() {
        Tween.stopAllByTarget(this.sunNode ?? undefined);
        Tween.stopAllByTarget(this.btnLevelStart?.node.parent ?? undefined);

        if (this.sunNode) this.sunNode.scale = Vec3.ZERO;
        if (this.btnLevelStart && this.btnLevelStart.node.parent) this.btnLevelStart.node.parent.scale = Vec3.ZERO;

        if (this.sunNode) {
            tween(this.sunNode).to(0.3, { scale: Vec3.ONE }, { easing: easing.backOut }).start();
        }
        if (this.btnLevelStart && this.btnLevelStart.node.parent) {
            tween(this.btnLevelStart.node.parent).delay(0.21).to(0.3, { scale: Vec3.ONE }, { easing: easing.backOut }).start();
        }
    }

    onClickLevelStart = async () => {
        const enterLevelAction = () => {
            AppGame.topUI.lightningItem.hide();
            MgrGame.Instance.enterLevel(null);
            NativeBridge.Instance.showInterstitialIfCooldown({ OpenUi: 'MainLevel' });
        };

        const curLv = MgrGame.Instance.gameData.curLv;
        if (MgrBattleLevel.Instance.checkIsBattleLevel(curLv)) {
            enterLevelAction();
        } else {
            const zj = (curLv - GameConst.FriendListOpenLevel) % (GameConst.FriendListIntervalLevel + 1) !== 0;
            if (curLv > GameConst.FriendListOpenLevel && zj) {
                if (SocialManager.shareNums % 2 === 0) {
                    await SocialMgr.showShcialPop(async () => {
                        enterLevelAction();
                    });
                } else {
                    await SocialMgr.showSocialList(async () => {
                        enterLevelAction();
                    }, null, InviteReportPoint.LevelStart);
                }
            } else {
                enterLevelAction();
            }
        }
    };

    onClickChallenge = async () => {
        AppGame.topUI.lightningItem.hide();
        const now = Tools.GetNowMoment();
        const lv = MgrChallenge.Instance.getLevelByDate(now);
        const dayStart = now.startOf('day').valueOf();

        if (MgrChallenge.Instance.getLevelPassEnable(dayStart)) {
            this.btnChallenge && (this.btnChallenge.interactable = false);
            await MgrUi.Instance.openViewAsync(UIPrefabs.ChallengeView, {
                root: MgrUi.root(1),
                callback: () => {
                    if (this.btnChallenge) this.btnChallenge.interactable = true;
                }
            });
        } else {
            MgrChallenge.Instance.curLv = lv;
            MgrChallenge.Instance.curTime = now;
            MgrChallenge.Instance.addPlayTime();
            MgrChallenge.Instance.enterChallenge();
            NativeBridge.Instance.showInterstitialIfCooldown({ OpenUi: 'ChallengeLevel' });
        }
    };

    onChangeLevel() {
        this.syncLevel();
    }

    syncLevel() {
        const lv = MgrGame.Instance.gameData.curLv;
        this.setLevel(lv);
    }

    setLevel(lv: number) {
        if (this.currLevelLabel) {
            const lang = Language.Instance.getLangByID('Language1') || '{0}';
            this.currLevelLabel.string = lang.replace('{0}', '' + lv);
        }
        if (this.bounsTipNode) this.bounsTipNode.active = false;

        const isHard = !!HardLevelCfg.Instance.get(lv);
        if (this.hardTipNode) this.hardTipNode.active = isHard;

        const raceMust = MgrRace.Instance.isRaceMust(lv);
        const raceOpen = MgrRace.Instance.checkRaceOpen();
        const showRaceMust = raceMust && raceOpen;
        if (this.raceMustNode) this.raceMustNode.active = showRaceMust;

        if (MgrBattleLevel.Instance.checkIsBattleLevel(lv)) {
            if (this.battleTipNode) this.battleTipNode.active = true;
            if (this.battleTip1) this.battleTip1.active = !isHard;
            if (this.battleTip2) this.battleTip2.active = isHard;
        } else {
            if (this.battleTipNode) this.battleTipNode.active = false;
        }
    }

    freshWisdom() {
        if (this.wisdomLabel) {
            this.wisdomLabel.string = '' + MgrUser.Instance.userData.getItem(ITEM.Wisdom);
        }
    }

    wisdomTween() {
        Tween.stopAllByTarget(this.wisdomShain ?? undefined);
        if (this.wisdomShain) {
            tween(this.wisdomShain).by(1, { angle: -30 }).repeatForever().start();
        }
    }

    reportStartGame() {
        const lv = MgrGame.Instance.gameData.curLv;
        const payload = {
            In_Times: MgrAnalytics.Instance.data.getPlayTime(lv),
            FailTimes: MgrAnalytics.Instance.data.getLossTime(lv)
        };
        AnalyticsManager.getInstance().reportStartGame(payload);
    }

    refreshRaceMustNode() {
        const isRaceMust = MgrRace.Instance.isRaceMust(MgrGame.Instance.gameData.curLv);
        const raceOpen = MgrRace.Instance.checkRaceOpen();
        if (this.raceMustNode) this.raceMustNode.active = isRaceMust && raceOpen;
    }
}