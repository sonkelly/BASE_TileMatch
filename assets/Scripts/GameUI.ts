import { _decorator, Label, sp, Button, director, tween, Tween, easing, Vec3 } from 'cc';
import {ViewBase} from './ViewBase';
import {MgrGame, GameStatus } from './MgrGame';
import {AppGame} from './AppGame';
import { BTN_SET, BTN_SHOP, VALUE_COIN } from './TopUIView';
import {MgrUi} from './MgrUi';
import { GMViews, UIPrefabs, GuidesViews } from './Prefabs';
import { GlobalEvent } from './Events';
import {GuideUI} from './GuideUI';
import {AdsManager} from './AdsManager';
import { LanguageEvent, Language } from './Language';
import {MgrChallenge} from './MgrChallenge';
import {GmMgr} from './GMManager';
import {NativeBridge} from './NativeBridge';
import { ITEM, GameConst } from './GameConst';
import {MgrUser} from './MgrUser';
import {Toast} from './Toast';
import { LogicStatus } from './GameLogic';
import { GameMode } from './Const';

const { ccclass, property } = _decorator;

enum AdBoxStatus {
    Wait = 0,
    Hide = 1,
    Show = 2,
    Finish = 3
}

@ccclass('GameUI')
export class GameUI extends ViewBase {
    @property(Label)
    public levelLabel: Label | null = null;

    @property(Label)
    public dataLebel: Label | null = null;

    @property(sp.Skeleton)
    public levelBoxSpine: sp.Skeleton | null = null;

    @property(Button)
    public levelBoxBtn: Button | null = null;

    private _adBoxStepTime: number = 0;
    private _adBoxStatus: AdBoxStatus = AdBoxStatus.Wait;

    private static readonly _ANIM_HIDE_X = 0x24e; // 590
    private static readonly _ANIM_SHOW_X = 0x122; // 290
    private static readonly _TMP_VEC = new Vec3(0, 0, 0);
    private static readonly _NEED_ITEMS = [ITEM.Back, ITEM.Hint, ITEM.Fresh];

    onLoad() {
        this.levelBoxBtn?.node.on('click', this._onClickLevelBox, this);
    }

    onEnable() {
        director.on(GlobalEvent.ChangeLevel, this.onChangeLevel, this);
        director.on(LanguageEvent.CHANGE, this.freshLevelLabel2, this);
        director.on(GlobalEvent.ChangeGameStatus, this._onChangeGameStatus, this);
        director.on(GlobalEvent.ChangeGameLogicStatus, this._onChangeGameStatus, this);
        director.on(GlobalEvent.GameReplay, this._resetAdBox, this);

        if (MgrGame.Instance.gameData.curLv <= 2) {
            director.on(GlobalEvent.CreateComplete, this.onCreateComplete, this);
        }

        this._resetAdBox();
    }

    onDisable() {
        this._hideAdBoxStrict();
        director.targetOff(this);
    }

    update(dt: number) {
        if (this._adBoxStatus === AdBoxStatus.Finish) return;

        if (this._adBoxStatus === AdBoxStatus.Wait) {
            this._adBoxStepTime += dt;
            if (this._adBoxStepTime >= GameConst.AdBox_Level_Time) {
                this._checkAdBoxHitLevel();
            }
        } else if (this._adBoxStatus === AdBoxStatus.Show) {
            this._adBoxStepTime += dt;
            if (this._adBoxStepTime >= GameConst.AdBox_delay_Time) {
                this._setAdBoxHide();
            }
        } else if (this._adBoxStatus === AdBoxStatus.Hide) {
            this._adBoxStepTime += dt;
            if (this._adBoxStepTime >= GameConst.AdBox_interval_Time) {
                this._setAdBoxShow();
            }
        }
    }

    onChangeLevel() {
        this.freshLevelLabel(AppGame.gameCtrl.currMode);
    }

    freshLevelLabel(mode: GameMode) {
        if (mode === GameMode.Challenge) {
            if (this.levelLabel) this.levelLabel.string = Language.Instance.getLangByID('daily_challenge_btn');
            if (this.dataLebel) this.dataLebel.node.active = true;
            const curTime = MgrChallenge.Instance.curTime;
            const month = Language.Instance.getLangByID('Month' + (curTime.month() + 1));
            if (this.dataLebel) this.dataLebel.string = month + ' ' + curTime.format('D.YYYY');
        } else {
            const lv = MgrGame.Instance.gameData.curLv;
            if (this.levelLabel) this.levelLabel.string = Language.Instance.getLangByID('Language1').replace('{0}', '' + lv);
            if (this.dataLebel) this.dataLebel.node.active = false;
        }
    }

    freshLevelLabel2() {
        if (AppGame.gameCtrl.currMode === GameMode.Challenge) {
            if (this.levelLabel) this.levelLabel.string = Language.Instance.getLangByID('daily_challenge_btn');
            if (this.dataLebel) this.dataLebel.node.active = true;
            const curTime = MgrChallenge.Instance.curTime;
            const month = Language.Instance.getLangByID('Month' + (curTime.month() + 1));
            if (this.dataLebel) this.dataLebel.string = month + ' ' + curTime.format('D.YYYY');
        } else {
            const lv = MgrGame.Instance.gameData.curLv;
            if (this.levelLabel) this.levelLabel.string = Language.Instance.getLangByID('Language1').replace('{0}', '' + lv);
            if (this.dataLebel) this.dataLebel.node.active = false;
        }
    }

    async enter(level: number, callback?: Function) {
        MgrGame.Instance.orientation = 0;
        this.node.active = true;
        this.freshLevelLabel(level);

        AppGame.topUI.addBackFunc(async () => {
            AppGame.Ins.switchToMain(() => {
                director.emit(GlobalEvent.GameBackHome);
            });
            await AppGame.topUI.hideAnim(0.8);
            AppGame.topUI.goldCubeBtn.hideGoldCube();
            AppGame.topUI.tileCoinBtn.hideTileCoins();
            AppGame.topUI.normalMine.hide();
            await AppGame.topUI.showMain();
        });

        AppGame.topUI.show(BTN_SET | BTN_SHOP | VALUE_COIN);

        AppGame.gameCtrl.enter(level, () => {
            if (callback) callback();
            NativeBridge.Instance.showBanner({ OpenUi: 'MainGame' });
            if (GmMgr.getInGameGm() && !MgrUi.Instance.hasView(GMViews.GMOptions.url)) {
                MgrUi.Instance.openViewAsync(GMViews.GMOptions, { priority: 1 });
            }
        });
    }

    exit(done?: Function) {
        AppGame.gameCtrl.exit(async () => {
            NativeBridge.Instance.hideBanner();
            this.node.active = false;
            if (done) done();
        });
        if (MgrUi.Instance.hasView(GMViews.GMOptions.url)) {
            MgrUi.Instance.closeView(GMViews.GMOptions.url);
        }
    }

    clearLevelInfo() {
        if (this.levelLabel) this.levelLabel.string = '';
        if (this.dataLebel) this.dataLebel.string = '';
    }

    onCreateComplete() {
        this.checkGuideView();
    }

    async checkGuideView() {
        if (MgrGame.Instance.gameData.curLv === 1) {
            const tiles = AppGame.gameCtrl.gameMap.getMergeTiles();
            if (tiles.length === 3) {
                const last = tiles.pop()!;
                const mid = tiles.pop()!;
                AppGame.gameCtrl.collector.collect(last);
                AppGame.gameCtrl.collector.collect(mid);
                const first = tiles.pop()!;
                await MgrUi.Instance.openViewAsync(GuidesViews.GuideFinger, {
                    priority: 2,
                    callback: (viewNode: any) => {
                        viewNode.getComponent(GuideUI).showHand(first.node);
                    }
                });
            }
            await MgrUi.Instance.openViewAsync(GuidesViews.GameMethodView, { priority: 2 });
        }
    }

    _onChangeGameStatus() {
        if (AppGame.inGame) {
            this._resetAdBox();
        } else {
            this._adBoxStatus = AdBoxStatus.Finish;
            this._hideAdBoxStrict();
        }

        const gameState = AppGame.gameCtrl.gameState;
        const logicStatus = AppGame.gameCtrl.curLogic?.logicStatus || LogicStatus.None;
        const enableBack = gameState === GameStatus.Playing && (logicStatus === LogicStatus.Idle || logicStatus === LogicStatus.Victory || logicStatus === LogicStatus.Exit);
        AppGame.topUI.setBtnEventEnable(AppGame.topUI.backBtn.node, enableBack);
    }

    _checkAdBoxHitLevel() {
        if (AppGame.gameCtrl.currMode !== GameMode.Challenge) {
            if (AppGame.inGame) {
                const curLv = MgrGame.Instance.gameData.curLv;
                const isBeforeOrEqual80 = curLv <= 0x50; // 80
                if (isBeforeOrEqual80) {
                    if (!GameConst.AdBox_80_Level_Before.includes(curLv)) {
                        this._adBoxStatus = AdBoxStatus.Finish;
                        return;
                    }
                } else {
                    if (!((curLv - 0x50) % (GameConst.AdBox_80_Level_After + 1) === 0)) {
                        this._adBoxStatus = AdBoxStatus.Finish;
                        return;
                    }
                }

                let needShow = false;
                for (let i = 0; i < GameUI._NEED_ITEMS.length; i++) {
                    const it = GameUI._NEED_ITEMS[i];
                    const num = MgrUser.Instance.userData.getItem(it);
                    if (num < (isBeforeOrEqual80 ? GameConst.AdBox_Player_Prop_Num1 : GameConst.AdBox_Player_Prop_Num2)) {
                        needShow = true;
                        break;
                    }
                }

                if (needShow) {
                    this._triggerLevelBox();
                } else {
                    this._adBoxStatus = AdBoxStatus.Finish;
                }
            } else {
                this._adBoxStatus = AdBoxStatus.Finish;
            }
        } else {
            this._adBoxStatus = AdBoxStatus.Finish;
        }
    }

    _triggerLevelBox() {
        if (!this.levelBoxSpine) return;
        this.levelBoxSpine.premultipliedAlpha = false;
        this.levelBoxSpine.loop = true;
        // @ts-ignore enableBatch may not exist on type
        (this.levelBoxSpine as any).enableBatch = false;
        this._setAnimationCollection();
        this._setAdBoxShow();
    }

    _setAnimationCollection() {
        if (!this.levelBoxSpine) return;
        this.levelBoxSpine.setAnimation(0, 'box_collection', false);
        this.levelBoxSpine.setCompleteListener(null);
        this.levelBoxSpine.setCompleteListener(() => {
            this._setAnimationLoop();
        });
    }

    _setAnimationLoop() {
        if (!this.levelBoxSpine) return;
        this.levelBoxSpine.setAnimation(0, 'box_loop', false);
        this.levelBoxSpine.setCompleteListener(null);
        this.levelBoxSpine.setCompleteListener(() => {
            this._setAnimationCollection();
        });
    }

    _resetAdBox() {
        this._adBoxStepTime = 0;
        this._adBoxStatus = AdBoxStatus.Wait;
        if (!this.levelBoxBtn) return;
        GameUI._TMP_VEC.set(GameUI._ANIM_HIDE_X, this.levelBoxBtn.node.position.y, this.levelBoxBtn.node.position.z);
        this.levelBoxBtn.node.position = GameUI._TMP_VEC;
    }

    _setAdBoxShow() {
        if (!this.levelBoxBtn) return;
        this._adBoxStepTime = 0;
        this._adBoxStatus = AdBoxStatus.Show;
        GameUI._TMP_VEC.set(GameUI._ANIM_SHOW_X, this.levelBoxBtn.node.position.y, this.levelBoxBtn.node.position.z);
        Tween.stopAllByTarget(this.levelBoxBtn.node);
        tween(this.levelBoxBtn.node).to(0.4, { position: GameUI._TMP_VEC }, { easing: easing.backOut }).start();
    }

    _setAdBoxHide() {
        if (!this.levelBoxBtn) return;
        this._adBoxStepTime = 0;
        this._adBoxStatus = AdBoxStatus.Hide;
        GameUI._TMP_VEC.set(GameUI._ANIM_HIDE_X, this.levelBoxBtn.node.position.y, this.levelBoxBtn.node.position.z);
        Tween.stopAllByTarget(this.levelBoxBtn.node);
        tween(this.levelBoxBtn.node).to(0.4, { position: GameUI._TMP_VEC }, { easing: easing.backOut }).start();
    }

    _hideAdBoxStrict() {
        if (!this.levelBoxBtn) return;
        Tween.stopAllByTarget(this.levelBoxBtn.node);
        GameUI._TMP_VEC.set(GameUI._ANIM_HIDE_X, this.levelBoxBtn.node.position.y, this.levelBoxBtn.node.position.z);
        this.levelBoxBtn.node.position = GameUI._TMP_VEC;
    }

    _onClickLevelBox() {
        if (!AppGame.inGame) return;
        AdsManager.getInstance().showRewardedVideo({
            OpenUi: 'GameUI',
            AdsType: 'LevelAdBox',
            onSucceed: () => {
                this._openLevelBox();
            },
            onFail: () => {
                Toast.tip(Language.Instance.getLangByID('ad_not_ready'));
            }
        });
    }

    _openLevelBox() {
        if (!this.levelBoxSpine || !this.levelBoxBtn) return;
        this.levelBoxSpine.setAnimation(0, 'box_open', false);
        this.levelBoxSpine.setCompleteListener(() => {
            this.levelBoxSpine?.setCompleteListener(null);
            GameUI._TMP_VEC.set(GameUI._ANIM_HIDE_X, this.levelBoxBtn.node.position.y, this.levelBoxBtn.node.position.z);
            Tween.stopAllByTarget(this.levelBoxBtn.node);
            this.levelBoxBtn.node.position = GameUI._TMP_VEC;
            this._adBoxStatus = AdBoxStatus.Finish;
            this._adBoxStepTime = 0;
            MgrUi.Instance.openViewAsync(UIPrefabs.LevelBoxView, { priority: 2 });
        });
    }
}