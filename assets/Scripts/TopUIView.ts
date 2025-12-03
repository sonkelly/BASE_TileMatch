import { _decorator, Component, Node, Button, tween, Tween, director, KeyCode } from 'cc';
import {MgrStar} from './MgrStar';
import {MgrToyRace} from './MgrToyRace';
import {MgrUi} from './MgrUi';
import { UIPrefabs, GMViews } from './Prefabs';
import { GameConst, ITEM } from './GameConst';
import { GlobalEvent } from './Events';
import {TopUIItem} from './TopUIItem';
import {AppGame} from './AppGame';
import { MgrGame, GameStatus } from './MgrGame';
import {MgrDailyReward} from './MgrDailyReward';
import {MgrPass} from './MgrPass';
import {MgrWinStreak} from './MgrWinStreak';
import {StreakBtn} from './StreakBtn';
import {MgrWinStreakV2} from './MgrWinStreakV2';
import {StreakBtnV2} from './StreakBtnV2';
import {MgrRank} from './MgrRank';
import {MgrGoldTournament } from './MgrGoldTournament';
import {TournamentStatus } from './GoldTournamentData';
import {GoldTourBtn} from './GoldTourBtn';
import {MgrShop} from './MgrShop';
import {MgrPig} from './MgrPig';
import {PigBankBtn} from './PigBankBtn';
import {MgrLuckWheel} from './MgrLuckWheel';
import {GoldCubeBtn} from './GoldCubeBtn';
import {LightningItemBtn} from './LightningItemBtn';
import {ChallengeStar} from './ChallengeStar';
import {MgrRace} from './MgrRace';
import {MgrGoldTournamentV2} from './MgrGoldTournamentV2';
import {GoldTourV2Btn} from './GoldTourV2Btn';
import {MgrMine} from './MgrMine';
import {NormalMine} from './NormalMine';
import {TileCoinBtn} from './TileCoinBtn';
import {MgrBonusWand} from './MgrBonusWand';
import { GameMode } from './Const';
import {GmMgr} from './GMManager';
import {SdkBridge} from './SdkBridge';
import {UIAssetFlyItem} from './UIAssetFlyItem';
import {BattleLevelTop} from './BattleLevelTop';

const { ccclass, property } = _decorator;
export const BTN_BACK = 0x1;
export const BTN_SHOP = 0x2;
export const BTN_SET = 0x4;
export const BTN_DETAIL = 0x8;
export const VALUE_COIN = 0x80;
export const BTN_PREVIEW = 0x1 << 25; // original large bit; used in decompiled code as cXA
export const BTN_SKIN = 0x10;
export const BTN_MAP = 0x40;
export const BTN_TASK = 0x100;
export const BTN_PASS = 0x200;
export const BTN_STREAK = 0x400;
export const BTN_STREAK_V2 = 0x1 << 19;
export const BTN_RANK = 0x800;
export const BTN_STAR = 0x1 << 23;
export const BTN_TOY = 0x1 << 24;
export const BTN_GOLDMOVIE = 0x1000;
export const BTN_GOLDTOUR = 0x2000;
export const BTN_GOLDTOUR_V2 = 0x1 << 26;
export const BTN_LIGHTNING = 0x4000; // grouped with other
export const BTN_PIG = 0x1 << 17;
export const BTN_LUCKWHEEL = 0x1 << 18;
export const BTN_NOADS = 0x1 << 21;
export const BTN_RACE = 0x1 << 22;
export const BTN_MINE = 0x1 << 27;
export const BTN_BONUS_WAND = 0x1 << 30;
export const BTN_CHALLENGE_STAR = 0x1 << 20;
export const BTN_NORMAL_MINE = 0x1 << 28;
export const BTN_TILE_COIN = 0x1 << 29;
export const GOLD_CUBE = 0x10000;

@ccclass('TopUIView')
export class TopUIView extends Component {
    @property(TopUIItem)
    public backBtn: TopUIItem | null = null;

    @property(TopUIItem)
    public setBtn: TopUIItem | null = null;

    @property(TopUIItem)
    public detailBtn: TopUIItem | null = null;

    @property(TopUIItem)
    public mapBtn: TopUIItem | null = null;

    @property(TopUIItem)
    public taskBtn: TopUIItem | null = null;

    @property(TopUIItem)
    public coinValue: TopUIItem | null = null;

    @property(TopUIItem)
    public shopBtn: TopUIItem | null = null;

    @property(Node)
    public shopBadge: Node | null = null;

    @property(TopUIItem)
    public dailyBtn: TopUIItem | null = null;

    @property(TopUIItem)
    public passBtn: TopUIItem | null = null;

    @property(TopUIItem)
    public streakBtn: TopUIItem | null = null;

    @property(TopUIItem)
    public streakBtnV2: TopUIItem | null = null;

    @property(TopUIItem)
    public goldMovieBtn: TopUIItem | null = null;

    @property(TopUIItem)
    public skinBtn: TopUIItem | null = null;

    @property(TopUIItem)
    public rankBtn: TopUIItem | null = null;

    @property(TopUIItem)
    public starBtn: TopUIItem | null = null;

    @property(TopUIItem)
    public goldTourBtn: TopUIItem | null = null;

    @property(TopUIItem)
    public goldTourBtnV2: TopUIItem | null = null;

    @property(LightningItemBtn)
    public lightningItem: LightningItemBtn | null = null;

    @property(GoldCubeBtn)
    public goldCubeBtn: GoldCubeBtn | null = null;

    @property(TileCoinBtn)
    public tileCoinBtn: TileCoinBtn | null = null;

    @property(TopUIItem)
    public lightingBtn: TopUIItem | null = null;

    @property(TopUIItem)
    public pigBtn: TopUIItem | null = null;

    @property(TopUIItem)
    public luckWheelBtn: TopUIItem | null = null;

    @property(TopUIItem)
    public noAdsIcon: TopUIItem | null = null;

    @property(TopUIItem)
    public raceBtn: TopUIItem | null = null;

    @property(TopUIItem)
    public toyRaceBtn: TopUIItem | null = null;

    @property(ChallengeStar)
    public challengeStar: ChallengeStar | null = null;

    @property(NormalMine)
    public normalMine: NormalMine | null = null;

    @property(TopUIItem)
    public previewBtn: TopUIItem | null = null;

    @property(TopUIItem)
    public mineBtn: TopUIItem | null = null;

    @property(TopUIItem)
    public bonusWandBtn: TopUIItem | null = null;

    @property(Node)
    public propReceiveNode: Node | null = null;

    @property(BattleLevelTop)
    public battleLevelTop: BattleLevelTop | null = null;

    public canClick: boolean = true;
    private _backListFunc: Array<() => Promise<any> | (() => any)> = [];
    private _showGoldCubeFlyCnt: number = 0;
    private _showFlyCoinCnt: number = 0;

    // ------------ lifecycle ------------
    onLoad() {
        this.unscheduleAllCallbacks();

        this.backBtn?.node.on('click', this.backToUpper, this);
        this.shopBtn?.node.on('click', this.onShopBtn, this);
        this.setBtn?.node.on('click', this.onSetBtn, this);
        this.mapBtn?.node.on('click', this.onMapBtn, this);
        this.pigBtn?.node.on('click', this.onPigBtn, this);
        this.noAdsIcon?.node.on('click', this.onNoAdsBtn, this);
        this.previewBtn?.node.on('click', this.onPreviewBtn, this);

        this.initItems();

        if (this.previewBtn) {
            this.previewBtn.isVisible = true;
            this.previewBtn.show();
        }

        director.on(GlobalEvent.DailyRewardEarn, this.checkShowDaily, this);
    }

    initItems() {
        this.backBtn?.init();
        this.coinValue?.init();
        this.shopBtn?.init();
        this.detailBtn?.init();
        this.setBtn?.init();
        this.mapBtn?.init();
        this.dailyBtn?.init();
        this.skinBtn?.init();
        this.taskBtn?.init();
        this.passBtn?.init();
        this.streakBtn?.init();
        this.streakBtnV2?.init();
        this.rankBtn?.init();
        this.starBtn?.init();
        this.toyRaceBtn?.init();
        this.goldMovieBtn?.init();
        this.goldTourBtn?.init();
        this.goldTourBtnV2?.init();
        this.lightningItem?.init();
        this.lightingBtn?.init();
        this.pigBtn?.init();
        this.luckWheelBtn?.init();
        this.challengeStar?.init();
        this.normalMine?.init();
        this.noAdsIcon?.init();
        this.raceBtn?.init();
        this.previewBtn?.init();
        this.mineBtn?.init();
        this.bonusWandBtn?.init();

        this.goldCubeBtn?.hide();
        this.challengeStar?.hide();
        this.normalMine?.hide();
        this.tileCoinBtn?.hide();

        if (this.backBtn) {
            this.backBtn.node.active = false;
            this.backBtn.isVisible = false;
        }

        this.showBtnByGameLv();
        this.showBtnByStatus();

        this.coinValue?.show();

        if (this.lightningItem) {
            this.lightningItem.node.active = false;
        }

        if (MgrShop.Instance.checkShopOpen()) {
            this.showShopIcon();
        } else {
            this.shopBtn?.hide();
        }
    }

    showBtnByGameLv() {
        const maxLv = MgrGame.Instance.gameData.maxLv;
        const skinShow = maxLv >= GameConst.SkinShowLv;

        if (this.skinBtn) {
            this.skinBtn.node.active = skinShow;
            if (skinShow) this.skinBtn.show();
        }

        if (this.mapBtn) {
            this.mapBtn.isVisible ? this.mapBtn.show() : this.mapBtn.hide();
        }

        if (this.taskBtn) {
            if (this.taskBtn.isVisible && maxLv >= GameConst.TASK_OPEN_LEVEL) this.taskBtn.show();
            else this.taskBtn.hide();
        }

        if (this.pigBtn) {
            if (this.pigBtn.isVisible && MgrPig.Instance.isGoldBankOpen()) this._showPigBtn();
            else this.pigBtn.hide();
        }

        this._refreshLuckWheelShow();
        this._refreshNoAdsIconState();
        this._refreshRaceState();
        this._checkShowRank();
        this._checkShowStarBtn();
        this._checkShowToyRaceBtn();
        this._checkShowDetailBtn();
        this.checkShowPass();
        this.checkShowStreak1(true);
        this.checkShowStreak2(true);
        this.checkShowGoldTour();
        this.checkShowGoldTourV2();
        this.checkShowBonusWand();
        this._refreshMineStatus();
    }

    showBtnByStatus() {
        this.checkShowDaily();
    }

    async onShopBtn() {
        await MgrUi.Instance.openViewAsync(UIPrefabs.ShopView, {
            root: MgrUi.root(1),
            data: { fromUrl: UIPrefabs.TopUI.url }
        });
    }

    async onSetBtn() {
        await MgrUi.Instance.openViewAsync(UIPrefabs.SetView, { root: MgrUi.root(1) });
        if (GmMgr.getInGameGm()) {
            if (MgrUi.Instance.hasView(GMViews.GMOptions.url)) {
                MgrUi.Instance.closeView(GMViews.GMOptions.url);
            } else {
                await MgrUi.Instance.openViewAsync(GMViews.GMOptions, { priority: 1 });
            }
        }
    }

    async onMapBtn() {
        await MgrUi.Instance.openViewAsync(UIPrefabs.MapView, { root: MgrUi.root(1) });
    }

    async backToUpper() {
        const fn = this._backListFunc.pop();
        this.switchBackEnable(this._backListFunc.length > 0);
        if (fn) {
            await fn();
        }
        this.updataBtns();
    }

    addBackFunc(func: () => Promise<any> | (() => any), updateNow = false) {
        this._backListFunc.push(func);
        this.switchBackEnable(this._backListFunc.length > 0);
        if (updateNow) this.updataBtns();
    }

    clearBackFunc() {
        this._backListFunc.length = 0;
        this.switchBackEnable(false);
        this.updataBtns();
    }

    onEnable() {
        director.on(GlobalEvent.refreshGoldTourStatus, this._changeGoldTourStatus, this);
        director.on(GlobalEvent.refreshGoldTourStatusV2, this._changeGoldTourV2Status, this);
        director.on(GlobalEvent.luckWheelRefreshData, this._refreshLuckWheelShow, this);
        director.on(GlobalEvent.refreshRemoveAdState, this._refreshNoAdsIconState, this);
        director.on(GlobalEvent.changeRaceState, this._refreshRaceState, this);
        director.on(GlobalEvent.SettementRaceTurn, this._refreshRaceState, this);
        director.on(GlobalEvent.MineStateChange, this._refreshMineStatus, this);
    }

    onDisable() {
        director.targetOff(this);
    }

    setBtnEventEnable(node: Node, enable: boolean) {
        const btn = node.getComponent(Button);
        if (btn) btn.interactable = enable;
    }

    swicthShopEnable(v: boolean) { if (this.shopBtn) this.shopBtn.isVisible = v; }
    swicthPreviewEnable(v: boolean) { if (this.previewBtn) this.previewBtn.isVisible = v; }
    switchCoinValueEnable(v: boolean) { if (this.coinValue) this.coinValue.isVisible = v; }
    switchSettingEnable(v: boolean) { if (this.setBtn) this.setBtn.isVisible = v; }
    switchDetailEnable(v: boolean) { if (this.detailBtn) this.detailBtn.isVisible = v; }
    switchMapEnable(v: boolean) { if (this.mapBtn) this.mapBtn.isVisible = v; }
    switchBackEnable(v: boolean) { if (this.backBtn) this.backBtn.isVisible = v; }
    switchSkinEnable(v: boolean) { if (this.skinBtn) this.skinBtn.isVisible = v; }
    switchRankEnable(v: boolean) { if (this.rankBtn) this.rankBtn.isVisible = v; }
    switchStarEnable(v: boolean) { if (this.starBtn) this.starBtn.isVisible = v; }
    switchToyRaceEnable(v: boolean) { if (this.toyRaceBtn) this.toyRaceBtn.isVisible = v; }
    switchDailyEnable(v: boolean) { if (this.dailyBtn) this.dailyBtn.isVisible = v; }
    switchTaskEnable(v: boolean) { if (this.taskBtn) this.taskBtn.isVisible = v; }
    switchPassEnable(v: boolean) { if (this.passBtn) this.passBtn.isVisible = !!SdkBridge.checkCanPayment() && v; }
    switchStreakEnable(v: boolean) { if (this.streakBtn) this.streakBtn.isVisible = v; }
    switchStreakV2Enable(v: boolean) { if (this.streakBtnV2) this.streakBtnV2.isVisible = v; }
    switchGoldMovieEnable(v: boolean) { if (this.goldMovieBtn) this.goldMovieBtn.isVisible = v; }
    switchGoldTourEnable(v: boolean) { if (this.goldTourBtn) this.goldTourBtn.isVisible = v; }
    switchGoldTourV2Enable(v: boolean) { if (this.goldTourBtnV2) this.goldTourBtnV2.isVisible = v; }
    switchLightingEnable(v: boolean) { if (this.lightingBtn) this.lightingBtn.isVisible = v; }
    switchPigEnable(v: boolean) { if (this.pigBtn) this.pigBtn.isVisible = !!SdkBridge.checkCanPayment() && v; }
    switchLuckWheelEnable(v: boolean) { if (this.luckWheelBtn) this.luckWheelBtn.isVisible = v; }
    switchNoAdsIconEnable(v: boolean) { if (this.noAdsIcon) this.noAdsIcon.isVisible = !!SdkBridge.checkCanPayment() && v; }
    switchRaceEnable(v: boolean) { if (this.raceBtn) this.raceBtn.isVisible = v; }
    switchMineEnable(v: boolean) { if (this.mineBtn) this.mineBtn.isVisible = v; }
    switchBonusWandEnable(v: boolean) { if (this.bonusWandBtn) this.bonusWandBtn.isVisible = v; }

    hideAnim(delayTime: number) {
        return new Promise<void>((resolve) => {
            Tween.stopAllByTarget(this.node);
            tween(this.node)
                .call(() => {
                    this.backBtn?.hide();
                    this.setBtn?.hide();
                })
                .delay(delayTime)
                .call(() => {
                    resolve();
                })
                .start();
        });
    }

    updataBtns() {
        const maxLv = MgrGame.Instance.gameData.maxLv;
        if (this.backBtn) this.backBtn.isVisible ? this.backBtn.show() : this.backBtn.hide();
        if (this.coinValue) this.coinValue.isVisible ? this.coinValue.show() : this.coinValue.hide();
        if (this.setBtn) this.setBtn.isVisible ? this.setBtn.show() : this.setBtn.hide();

        if (this.detailBtn) {
            if (this.detailBtn.isVisible && MgrRank.Instance.rankData.tip) this.detailBtn.show();
            else this.detailBtn.hide();
        }

        if (this.shopBtn) {
            if (this.shopBtn.isVisible && MgrShop.Instance.checkShopOpen()) this.showShopIcon();
            else this.shopBtn.hide();
        }

        if (this.previewBtn) this.previewBtn.isVisible ? this.previewBtn.show() : this.previewBtn.hide();
        if (this.mapBtn) this.mapBtn.isVisible ? this.mapBtn.show() : this.mapBtn.hide();

        if (this.taskBtn) {
            if (this.taskBtn.isVisible && maxLv >= GameConst.TASK_OPEN_LEVEL) this.taskBtn.show();
            else this.taskBtn.hide();
        }

        if (this.passBtn) this.passBtn.isVisible ? this.checkShowPass() : this.passBtn.hide();
        if (this.streakBtn) this.streakBtn.isVisible ? this.checkShowStreak1() : this.streakBtn.hide();
        if (this.streakBtnV2) this.streakBtnV2.isVisible ? this.checkShowStreak2() : this.streakBtnV2.hide();

        if (this.goldMovieBtn) this.goldMovieBtn.isVisible ? this.checkShowVictoryGold() : this.goldMovieBtn.hide();

        if (this.skinBtn) {
            if (this.skinBtn.isVisible && maxLv >= GameConst.SkinShowLv) this.skinBtn.show();
            else this.skinBtn.hide();
        }

        if (this.rankBtn) {
            if (this.rankBtn.isVisible && MgrRank.Instance.canShowRank()) this.rankBtn.show();
            else this.rankBtn.hide();
        }

        if (this.starBtn) {
            if (this.starBtn.isVisible && MgrStar.Instance.showMenu()) this.starBtn.show();
            else this.starBtn.hide();
        }

        if (this.toyRaceBtn) {
            if (this.toyRaceBtn.isVisible && MgrToyRace.Instance.isVisible()) this.toyRaceBtn.show();
            else this.toyRaceBtn.hide();
        }

        if (this.pigBtn) {
            if (this.pigBtn.isVisible && MgrPig.Instance.isGoldBankOpen()) this._showPigBtn();
            else this.pigBtn.hide();
        }

        this._refreshLuckWheelShow();
        this._refreshNoAdsIconState();
        this._refreshRaceState();
        this.checkShowGoldTour();
        this.checkShowGoldTourV2();
        this.checkShowBonusWand();
        this._refreshMineStatus();

        if (this.dailyBtn) this.dailyBtn.isVisible ? this.dailyBtn.show() : this.dailyBtn.hide();

        this.checkShowLighting(this.dailyBtn ? this.dailyBtn.isVisible : false);
    }

    showMain(showAutoFlow = true) {
        AppGame.topUI.switchSettingEnable(true);
        AppGame.topUI.swicthShopEnable(true);

        const hasBack = this._backListFunc.length > 0;
        AppGame.topUI.switchBackEnable(hasBack);
        if (this.detailBtn) this.detailBtn.isBlock = hasBack;

        AppGame.topUI.switchMapEnable(!hasBack);
        AppGame.topUI.switchDetailEnable(!hasBack);
        AppGame.topUI.switchSkinEnable(!hasBack);
        AppGame.topUI.switchTaskEnable(!hasBack);
        AppGame.topUI.swicthPreviewEnable(!hasBack);
        AppGame.topUI.switchPassEnable(!hasBack);
        AppGame.topUI.switchRankEnable(!hasBack);
        AppGame.topUI.switchStarEnable(!hasBack);
        AppGame.topUI.switchToyRaceEnable(!hasBack);
        AppGame.topUI.switchStreakEnable(!hasBack);
        AppGame.topUI.switchStreakV2Enable(!hasBack);
        AppGame.topUI.switchGoldMovieEnable(!hasBack);
        AppGame.topUI.switchLightingEnable(!hasBack);
        AppGame.topUI.switchGoldTourEnable(!hasBack);
        AppGame.topUI.switchGoldTourV2Enable(!hasBack);
        AppGame.topUI.switchPigEnable(!hasBack);
        AppGame.topUI.switchLuckWheelEnable(!hasBack);
        AppGame.topUI.switchNoAdsIconEnable(!hasBack);
        AppGame.topUI.switchRaceEnable(!hasBack);
        AppGame.topUI.switchMineEnable(!hasBack);
        AppGame.topUI.switchBonusWandEnable(!hasBack);
        AppGame.topUI.switchCoinValueEnable(true);

        const newDay = MgrDailyReward.Instance.isNewDay();
        this.switchDailyEnable(newDay && !hasBack);

        this.updataBtns();

        if (hasBack) {
            this.checkShowGoldCube();
            this.checkShowTileCoin();
        }

        if (showAutoFlow && !hasBack) {
            AppGame.Ins.autoRewardAndGuide();
        }

        if (hasBack) {
            this.checkShowChallengeStar();
            this.checkShowNormalMine();
        }

        AppGame.Ins.addAutoFlow((cbParam: any) => {
            MgrStar.Instance.tryHomePopViews(cbParam);
        });

        this.canClick = true;
    }

    checkShowGoldCube() {
        const goldTourOpen = MgrGoldTournament.Instance.checkGoldTourOpen() || MgrGoldTournamentV2.Instance.checkGoldTourOpen();
        if (goldTourOpen && AppGame.gameCtrl.currMode !== GameMode.Bonus) {
            const tileList = AppGame.gameCtrl?.gameMap?.tileList || [];
            let hasGolden = false;
            for (let i = 0; i < tileList.length; i++) {
                if (tileList[i].tIdx === ITEM.GoldenTile) {
                    hasGolden = true;
                    break;
                }
            }
            const collectGoldCube = AppGame.gameCtrl?.curLogic?.collectGoldCube || 0;
            if ((hasGolden || collectGoldCube > 0) && this.goldCubeBtn) {
                this.goldCubeBtn.showGoldCube(collectGoldCube);
            }
        }
    }

    checkShowTileCoin() {
        if (AppGame.gameCtrl.currMode === GameMode.Bonus) {
            const collected = AppGame.gameCtrl?.curLogic?.collectedAttachs?.[ITEM.TileCoin] || 0;
            this.tileCoinBtn?.showTileCoins(collected);
        }
    }

    checkShowChallengeStar() {
        if (AppGame.gameCtrl.currMode === GameMode.Challenge && AppGame.gameCtrl.gameState != GameStatus.Ended) {
            this.challengeStar?.show();
        }
    }

    checkShowNormalMine() {
        const notChallenge = AppGame.gameCtrl.currMode !== GameMode.Challenge;
        const notEnded = AppGame.gameCtrl.gameState != GameStatus.Ended;
        const open = MgrMine.Instance.isOpen();
        const finished = MgrMine.Instance.isFinish();
        if (notChallenge && notEnded && open && !finished) this.normalMine?.show();
    }

    showOnlyBack() {
        this.show(1);
    }

    show(mask = 0, noBack = false) {
        // Mask bit checks based on original flags (only used semantics)
        // Setting visibility according to mask bits
        // bit mapping from original code:
        // BTN_SET = 4, BTN_DETAIL = 8, VALUE_COIN = 128, BTN_SHOP = 2, BTN_PREVIEW = 2^25? (we just check provided mask)
        // For our usage, we simply check bitwise as in original.

        this.switchSettingEnable((mask & BTN_SET) > 0);
        this.switchDetailEnable((mask & BTN_DETAIL) > 0);
        this.switchCoinValueEnable((mask & VALUE_COIN) > 0);
        this.swicthShopEnable((mask & BTN_SHOP) > 0);
        this.swicthPreviewEnable((mask & BTN_PREVIEW) > 0);
        this.switchSkinEnable((mask & BTN_SKIN) > 0);
        this.switchMapEnable((mask & BTN_MAP) > 0);
        this.switchTaskEnable((mask & BTN_TASK) > 0);
        this.switchPassEnable((mask & BTN_PASS) > 0);
        this.switchStreakEnable((mask & BTN_STREAK) > 0);
        this.switchStreakV2Enable((mask & BTN_STREAK_V2) > 0);
        this.switchRankEnable((mask & BTN_RANK) > 0);
        this.switchStarEnable((mask & BTN_STAR) > 0);
        this.switchToyRaceEnable((mask & BTN_TOY) > 0);
        this.switchGoldMovieEnable((mask & BTN_GOLDMOVIE) > 0);
        this.switchGoldTourEnable((mask & BTN_GOLDTOUR) > 0);
        this.switchGoldTourV2Enable((mask & BTN_GOLDTOUR_V2) > 0);
        this.switchLightingEnable((mask & BTN_LIGHTNING) > 0);
        this.switchPigEnable((mask & BTN_PIG) > 0);
        this.switchLuckWheelEnable((mask & BTN_LUCKWHEEL) > 0);
        this.switchNoAdsIconEnable((mask & BTN_NOADS) > 0);
        this.switchRaceEnable((mask & BTN_RACE) > 0);
        this.switchMineEnable((mask & BTN_MINE) > 0);
        this.switchBonusWandEnable((mask & BTN_BONUS_WAND) > 0);

        const hasBack = !noBack && this._backListFunc.length > 0;
        this.switchBackEnable(hasBack);

        const dailyCondition = (mask & 0x20) > 0 && MgrDailyReward.Instance.isNewDay();
        this.switchDailyEnable(dailyCondition);

        const goldTourOpen = MgrGoldTournament.Instance.checkGoldTourOpen() || MgrGoldTournamentV2.Instance.checkGoldTourOpen();
        if (!((mask & GOLD_CUBE) > 0) || !goldTourOpen) {
            this.goldCubeBtn?.hideGoldCube();
        }

        if ((mask & BTN_TILE_COIN) <= 0) this.tileCoinBtn?.hideTileCoins();
        if ((mask & BTN_CHALLENGE_STAR) <= 0 && this.challengeStar?.node.active) this.challengeStar.hide();
        if ((mask & BTN_NORMAL_MINE) <= 0 && this.normalMine?.node.active) this.normalMine.hide();

        this.updataBtns();
    }

    checkShowDaily() {
        if (MgrDailyReward.Instance.isNewDay()) this.dailyBtn?.show();
        else this.dailyBtn?.hide();

        this.checkShowLighting(this.dailyBtn ? this.dailyBtn.isVisible : false);
    }

    checkShowLighting(dailyVisible: boolean) {
        if (!dailyVisible && MgrGame.Instance.goldLighting) {
            if ((MgrGoldTournament.Instance.checkGoldTourOpen() || MgrGoldTournamentV2.Instance.checkGoldTourOpen()) && this.lightingBtn?.isVisible) {
                this.lightingBtn.show();
            } else {
                this.lightingBtn?.hide();
            }
        } else {
            this.lightingBtn?.hide();
        }
    }

    checkShowPass() {
        if (SdkBridge.checkCanPayment()) {
            if (MgrGame.Instance.gameData.maxLv >= GameConst.PASS_OPEN_LEVEL && MgrPass.Instance.checkInPass()) {
                MgrPass.Instance.checkResetData();
                this.passBtn?.show();
            } else {
                this.passBtn?.hide();
            }
        }
    }

    checkShowStreak1(forceUpdate = false) {
        if (MgrGame.Instance.gameData.maxLv >= GameConst.WINSTREAK_OPEN_LEVEL && MgrWinStreak.Instance.checkInWinStreak()) {
            MgrWinStreak.Instance.checkResetData();
            this.streakBtn?.show(undefined, () => {
                if (forceUpdate) this.streakBtn?.getComponent(StreakBtn)?.updateCount();
            });
        } else {
            this.streakBtn?.hide();
        }
    }

    checkShowStreak2(forceUpdate = false) {
        if (MgrGame.Instance.gameData.maxLv >= GameConst.WINSTREAK_V2_OPEN_LEVEL && MgrWinStreakV2.Instance.checkInWinStreak()) {
            MgrWinStreakV2.Instance.checkResetData();
            this.streakBtnV2?.show(undefined, () => {
                if (forceUpdate) this.streakBtnV2?.getComponent(StreakBtnV2)?.updateCount();
            });
        } else {
            this.streakBtnV2?.hide();
        }
    }

    checkShowVictoryGold() {
        const cond = MgrGame.Instance.gameData.maxLv >= GameConst.AdCoinShowLv;
        const hasVictoryGold = MgrGame.Instance.victoryGold;
        if (cond) {
            if (hasVictoryGold) this.goldMovieBtn?.show();
            else this.goldMovieBtn?.hide();
        } else {
            MgrGame.Instance.victoryGold = false;
        }
    }

    onEditorKeyDown(event: any) {
        switch (event.keyCode) {
            case KeyCode.KEY_A:
            case KeyCode.KEY_S:
            case KeyCode.KEY_D:
            case KeyCode.KEY_F:
                break;
            case KeyCode.KEY_W:
                AppGame.gameCtrl.victory();
                break;
        }
    }

    _checkShowRank() {
        const can = MgrRank.Instance.canShowRank();
        if (this.rankBtn) {
            this.rankBtn.node.active = can;
            if (can) this.rankBtn.show();
        }
    }

    _checkShowStarBtn() {
        const can = MgrStar.Instance.showMenu();
        if (this.starBtn) {
            this.starBtn.node.active = can;
            if (can) this.starBtn.show();
        }
    }

    _checkShowToyRaceBtn() {
        const can = MgrToyRace.Instance.isVisible();
        if (this.toyRaceBtn) {
            this.toyRaceBtn.node.active = can;
            if (can) this.toyRaceBtn.show();
        }
    }

    _checkShowDetailBtn() {
        const tip = MgrRank.Instance.rankData.tip;
        if (this.detailBtn) {
            this.detailBtn.node.active = tip;
            if (tip) this.detailBtn.show();
        }
    }

    _changeGoldTourStatus() {
        if (this.goldTourBtn?.isVisible && MgrGoldTournament.Instance.checkGoldTourOpen()) {
            // remain visible
        } else {
            this.goldTourBtn?.hide();
        }

        if (MgrGoldTournament.Instance.data.tourStatus === TournamentStatus.WaitReward) {
            if (!AppGame.Ins.checkAddAutoPop()) return;
            AppGame.Ins.addAutoFlow((cbParam: any) => {
                MgrGoldTournament.Instance.tryAutoReward(cbParam);
            });
        }
    }

    _changeGoldTourV2Status() {
        if (this.goldTourBtnV2?.isVisible && MgrGoldTournamentV2.Instance.checkGoldTourOpen()) {
            // remain
        } else {
            this.goldTourBtnV2?.hide();
        }

        if (MgrGoldTournamentV2.Instance.data.tourStatus === TournamentStatus.WaitReward) {
            if (!AppGame.Ins.checkAddAutoPop()) return;
            AppGame.Ins.addAutoFlow((cbParam: any) => {
                MgrGoldTournamentV2.Instance.tryAutoReward(cbParam);
            });
        }
    }

    checkShowGoldTour() {
        if (this.goldTourBtn?.isVisible && MgrGoldTournament.Instance.checkGoldTourOpen()) {
            this.goldTourBtn.show(undefined, () => {
                if (this._showGoldCubeFlyCnt) {
                    this.goldTourBtn!.node.getComponent(GoldTourBtn)!.showGoldCubeFly(this._showGoldCubeFlyCnt);
                    this._showGoldCubeFlyCnt = 0;
                } else {
                    this.goldCubeBtn?.hideGoldCube();
                    this.goldTourBtn!.node.getComponent(GoldTourBtn)!.refreshRankIndex();
                }
            });
        } else {
            this.goldTourBtn?.hide();
        }
    }

    checkShowFlyTileCoins() {
        if (this._showFlyCoinCnt > 0) {
            this.scheduleOnce(() => {
                this._showFlyCoinCnt = 0;
                this.tileCoinBtn?.showCoinFly(this._showFlyCoinCnt);
            }, 0.4);
        } else {
            this.tileCoinBtn?.hideTileCoins();
        }
    }

    checkShowGoldTourV2() {
        if (this.goldTourBtnV2?.isVisible && MgrGoldTournamentV2.Instance.checkGoldTourOpen()) {
            this.goldTourBtnV2.show(undefined, () => {
                if (this._showGoldCubeFlyCnt) {
                    this.goldTourBtnV2!.node.getComponent(GoldTourV2Btn)!.showGoldCubeFly(this._showGoldCubeFlyCnt);
                    this._showGoldCubeFlyCnt = 0;
                } else {
                    this.goldCubeBtn?.hideGoldCube();
                    this.goldTourBtnV2!.node.getComponent(GoldTourV2Btn)!.refreshRankIndex();
                }
            });
        } else {
            this.goldTourBtnV2?.hide();
        }
    }

    checkShowBonusWand() {
        if (this.bonusWandBtn?.isVisible && MgrBonusWand.Instance.checkOpen()) {
            this.bonusWandBtn.show(undefined, () => {});
        } else {
            this.bonusWandBtn?.hide();
        }
    }

    setShowGoldCubeCnt(cnt: number) {
        this._showGoldCubeFlyCnt = cnt;
    }

    hideLightningItem() {
        this.lightningItem?.hide();
    }

    setShowFlyCoins(cnt: number) {
        this._showFlyCoinCnt = cnt;
        this.checkShowFlyTileCoins();
    }

    showShopIcon() {
        this.shopBtn?.show(0.4);
        if (this.shopBadge) this.shopBadge.active = MgrShop.Instance.checkLimitedPackageAvailable();
    }

    async onPigBtn() {
        await MgrUi.Instance.openViewAsync(UIPrefabs.PigBankView, { root: MgrUi.root(2) });
    }

    _showPigBtn() {
        if (!SdkBridge.checkCanPayment()) return;
        this.pigBtn?.show(undefined, () => {
            if (MgrPig.Instance.dirtyAnim) {
                MgrPig.Instance.playCoinAnima();
                this.pigBtn!.getComponent(PigBankBtn)!.pigGoldAnim();
            }
            MgrPig.Instance.checkPop();
        });
    }

    _refreshLuckWheelShow() {
        if (this.luckWheelBtn?.isVisible && MgrLuckWheel.Instance.isOpen() && MgrLuckWheel.Instance.canSpin()) {
            this.luckWheelBtn.show();
        } else {
            this.luckWheelBtn?.hide();
        }
    }

    _refreshNoAdsIconState() {
        if (SdkBridge.checkCanPayment()) {
            const bought = MgrShop.Instance.isBuyNoAd();
            const showed = MgrShop.Instance.getShowedNoAdsTip();
            if (this.noAdsIcon?.isVisible && !bought && showed) this.noAdsIcon.show();
            else this.noAdsIcon?.hide();
        }
    }

    onNoAdsBtn() {
        MgrUi.Instance.openViewAsync(UIPrefabs.RemoveAdView);
    }

    onPreviewBtn = async () => {
        if (!this.canClick) return;
        MgrUi.Instance.openViewAsync(UIPrefabs.UIActivePreviewView);
        this.canClick = false;
        this.scheduleOnce(() => {
            this.canClick = true;
        }, 0.5);
    };

    _refreshRaceState() {
        const rOpen = MgrRace.Instance.checkRaceOpen();
        if (this.raceBtn?.isVisible && rOpen) this.raceBtn.show();
        else this.raceBtn?.hide();
    }

    _refreshMineStatus() {
        const open = MgrMine.Instance.isOpen();
        if (this.mineBtn?.isVisible && open) this.mineBtn.show();
        else this.mineBtn?.hide();
    }

    registerAssetFly() {
        const comps = this.propReceiveNode?.getComponents(UIAssetFlyItem) || [];
        comps.forEach(c => c.register());
    }

    battleLevelTophide() {
        this.switchBackEnable(false);
        this.switchSettingEnable(false);
        this.swicthShopEnable(false);
        this.switchCoinValueEnable(false);

        if (this.backBtn) this.backBtn.isVisible ? this.backBtn.show() : this.backBtn.hide();
        if (this.setBtn) this.setBtn.isVisible ? this.setBtn.show() : this.setBtn.hide();
        if (this.shopBtn) {
            if (this.shopBtn.isVisible && MgrShop.Instance.checkShopOpen()) this.showShopIcon();
            else this.shopBtn.hide();
        }
        if (this.coinValue) this.coinValue.isVisible ? this.coinValue.show() : this.coinValue.hide();
    }

    // getter for back list
    get backListFunc() {
        return this._backListFunc;
    }
}