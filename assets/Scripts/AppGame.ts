import { _decorator, Node, Camera, Texture2D, Vec3, sys, find, director, Component, cclegacy } from 'cc';
import { Launder } from './Launder';
import { AsyncQueue } from './AsyncQueue';
import { MainUI } from './MainUI';
import { GameUI } from './GameUI';
import { AssetPool } from './AssetPool';
import { BUNDLE_NAMES } from './AssetRes';
import { GameAudios, UIPrefabs } from './Prefabs';
import { GameCtrl } from './GameCtrl';
import { TopUIView } from './TopUIView';
import { GameBg } from './GameBg';
import { MgrUi } from './MgrUi';
import { MgrGame, GameStatus } from './MgrGame';
import { MgrSkin } from './MgrSkin';
import { AudioPlayer } from './AudioPlayer';
import { IAPMgr } from './IAPMgr';
import { GameEvents } from './GameEvents';
import { MgrWeakGuide } from './MgrWeakGuide';
import { GlobalEvent } from './Events';
import { MgrPass } from './MgrPass';
import { MgrWinStreak } from './MgrWinStreak';
import { MgrWinStreakV2 } from './MgrWinStreakV2';
import { MgrGoldTournament } from './MgrGoldTournament';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import { MgrRace, RaceState } from './MgrRace';
import { RaceBtn } from './RaceBtn';
import { StreakBtn } from './StreakBtn';
import { StreakBtnV2 } from './StreakBtnV2';
import { NativeBridge } from './NativeBridge';
import { Alert } from './Alert';
import { Language } from './Language';
import { config } from './Config';
import { MgrService } from './MgrService';
import { Tools } from './Tools';
import { Loading } from './Loading';
import { MgrGoldTournamentV2 } from './MgrGoldTournamentV2';
import { LogicStatus } from './GameLogic';
import { SocialManager } from './SocialManager';

const { ccclass, property } = _decorator;

@ccclass('AppGame')
export class AppGame extends Component {
    private static _instance: AppGame = null;
    public static mainUI: MainUI = null;
    public static gameUI: GameUI = null;
    public static gameBg: GameBg = null;
    public static gameCtrl: GameCtrl = null;
    public static topUI: TopUIView = null;
    public static speedScale: number = 1;

    @property(Node)
    rootUI: Node = null;

    @property(Node)
    blackNode: Node = null;

    @property(Camera)
    uiCamera: Camera = null;

    @property(Camera)
    guideCamera: Camera = null;

    @property(Texture2D)
    share: Texture2D = null;

    @property(Texture2D)
    tournamentImg: Texture2D = null;

    private _switchQueus: AsyncQueue = null;
    private _autoPopQueus: AsyncQueue = null;
    private checkNeting: boolean = false;
    private checkLastTime: number = 0;

    public static get Ins(): AppGame {
        return AppGame._instance;
    }

    public static get inGame(): boolean {
        const gameState = AppGame.gameCtrl?.gameState || GameStatus.None;
        const logicStatus = AppGame.gameCtrl?.curLogic?.logicStatus || LogicStatus.None;
        return gameState === GameStatus.Playing && logicStatus >= LogicStatus.Enter && logicStatus <= LogicStatus.Auto;
    }

    onLoad() {
        AppGame._instance = this;
        this.node.on(Node.EventType.SIZE_CHANGED, this._onCanvasSizeChange, this);
        this.addComponent(GameEvents);
    }

    onEnable() {
        this._onCanvasSizeChange();
    }

    loadLazy() {
        const lazyQueue = Launder.Instance.getLazyAsyncQueue();
        lazyQueue.complete = function() {};
        lazyQueue.play();
    }

    onDisable() {
        if (this._switchQueus) {
            this._switchQueus.clear();
            this._switchQueus = null;
        }
    }

    private _onCanvasSizeChange() {
        this.scheduleOnce(() => {
            this.guideCamera.orthoHeight = this.uiCamera.orthoHeight;
        });
    }

    start() {
        IAPMgr.Instance.checkValidateShopInfos();
        this.blackNode.active = true;
        AudioPlayer.Instance.playMusic(GameAudios.Bgm.url);
        
        this._switchQueus = new AsyncQueue();
        this._switchQueus.push(async (next: Function) => {
            if (!AppGame.gameBg) {
                const gameBgNode = await AssetPool.Instance.createObjAsync(BUNDLE_NAMES.Game, UIPrefabs.GameBg.url);
                gameBgNode.name = 'gameBg';
                gameBgNode.parent = this.rootUI;
                gameBgNode.position = Vec3.ZERO;
                gameBgNode.setSiblingIndex(0);
                AppGame.gameBg = gameBgNode.getComponent(GameBg);
            }
            next();
        });

        this._switchQueus.push((next: Function) => {
            const skinId = MgrSkin.Instance.data.currSkinId;
            MgrSkin.Instance.loadThemeSprites(skinId, next);
        });

        this._switchQueus.push((next: Function) => {
            const language = config.defaultLanguage;
            MgrSkin.Instance.loadLanSprites(language, next);
        });

        this._switchQueus.push((next: Function) => {
            this.loadTopUI();
            this.loadMask();
            this.loadScrenShotCanvas();
            next();
        });

        this._switchQueus.complete = () => {
            this._switchQueus = null;
            if (MgrGame.Instance.gameData.maxLv === 1) {
                MgrGame.Instance.enterLevel(() => {
                    this.loadLazy();
                    this.closeBlack();
                });
            } else {
                this.switchToMain(() => {
                    this.loadLazy();
                    this.closeBlack();
                    this.autoRewardAndGuide();
                });
            }
        };

        this._switchQueus.play();
    }

    openBlack(callback?: Function) {
        this.blackNode.active = true;
        callback && callback();
    }

    closeBlack(callback?: Function) {
        this.blackNode.active = false;
        callback && callback();
    }

    switchToMain(callback?: Function) {
        if (!this._switchQueus) {
            this._switchQueus = new AsyncQueue();
            
            this._switchQueus.push(async (next: Function) => {
                this.openBlack();
                if (AppGame.gameUI && AppGame.gameUI.node.active) {
                    AppGame.gameUI.exit(next);
                } else {
                    next();
                }
            });

            this._switchQueus.push(async (next: Function) => {
                AppGame.topUI.registerAssetFly();
                next();
            });

            this._switchQueus.push(async (next: Function) => {
                if (!AppGame.mainUI) this.createMainUI();
                AppGame.mainUI.enter(next);
            });

            this._switchQueus.complete = () => {
                sys.garbageCollect();
                callback && callback();
                this.closeBlack();
                this._switchQueus.clear();
                this._switchQueus = null;
            };

            this._switchQueus.play();
        }
    }

    async loadMask() {
        const maskNode = await AssetPool.Instance.createObjAsync(BUNDLE_NAMES.Game, UIPrefabs.UIMask.url);
        maskNode.name = 'maskNode';
        maskNode.parent = MgrUi.root(5);
    }

    loadScrenShotCanvas() {
        const canvasNode = AssetPool.Instance.createObject(UIPrefabs.ScrenShotCanvas.url);
        canvasNode.parent = find('Canvas').parent;
        SocialManager.instance().init(this.share, this.tournamentImg);
    }

    loadTopUI() {
        if (!AppGame.topUI) {
            const topUINode = AssetPool.Instance.createObject(UIPrefabs.TopUI.url);
            AppGame.topUI = topUINode.getComponent(TopUIView);
            topUINode.name = 'topUI';
            topUINode.parent = MgrUi.root(2);
        }
    }

    createGameUI() {
        const gameUINode = AssetPool.Instance.createObject(UIPrefabs.GameUI.url);
        gameUINode.name = 'gameUI';
        gameUINode.parent = this.rootUI;
        gameUINode.position = Vec3.ZERO;
        gameUINode.setSiblingIndex(2);
        AppGame.gameUI = gameUINode.getComponent(GameUI);
        AppGame.gameCtrl = gameUINode.getComponent(GameCtrl);
    }

    createMainUI() {
        const mainUINode = AssetPool.Instance.createObject(UIPrefabs.MainUI.url);
        mainUINode.name = 'mainUI';
        mainUINode.parent = this.rootUI;
        mainUINode.position = Vec3.ZERO;
        mainUINode.setSiblingIndex(1);
        AppGame.mainUI = mainUINode.getComponent(MainUI);
    }

    switchToGame(level: any, callback: Function) {
        if (!this._switchQueus) {
            this._switchQueus = new AsyncQueue();
            
            this._switchQueus.push(async (next: Function) => {
                this.openBlack();
                if (AppGame.mainUI) {
                    AppGame.mainUI.exit(next);
                } else {
                    next();
                }
            });

            this._switchQueus.push(async (next: Function) => {
                AssetPool.Instance.clearPool(UIPrefabs.MapListTile.url);
                next();
            });

            this._switchQueus.push(async (next: Function) => {
                if (!AppGame.gameUI) this.createGameUI();
                AppGame.gameUI.enter(level, next);
            });

            this._switchQueus.complete = () => {
                sys.garbageCollect();
                this.closeBlack();
                this._switchQueus.clear();
                this._switchQueus = null;
                if (this._autoPopQueus) this._autoPopQueus.clear();
                callback();
            };

            this._switchQueus.play();
        }
    }

    createPopQueus() {
        this._autoPopQueus = new AsyncQueue();
    }

    autoRewardAndGuide(checkNetwork: boolean = true) {
        if (this._autoPopQueus) {
            this._autoPopQueus.clear();
        } else {
            this.createPopQueus();
        }

        this._autoPopQueus.push((next: Function) => {
            if (MgrWinStreak.Instance.isShowClearAnim()) {
                MgrUi.Instance.addViewAsyncQueue(UIPrefabs.WinStreakView, {
                    root: MgrUi.root(1),
                    callback: (view: any) => {
                        view.once(VIEW_ANIM_EVENT.Remove, () => {
                            AppGame.topUI.streakBtn.getComponent(StreakBtn).updateCount();
                            next();
                        });
                    }
                });
            } else {
                next();
            }
        });

        this._autoPopQueus.push((next: Function) => {
            if (MgrWinStreakV2.Instance.isShowClearAnim()) {
                MgrUi.Instance.addViewAsyncQueue(UIPrefabs.WinStreakViewV2, {
                    root: MgrUi.root(1),
                    callback: (view: any) => {
                        view.once(VIEW_ANIM_EVENT.Remove, () => {
                            AppGame.topUI.streakBtnV2.getComponent(StreakBtnV2).updateCount();
                            next();
                        });
                    }
                });
            } else {
                next();
            }
        });

        this._autoPopQueus.push((next: Function) => {
            MgrPass.Instance.tryAutoReward(next);
        });

        this._autoPopQueus.push((next: Function) => {
            MgrWinStreak.Instance.tryAutoReward(next);
        });

        this._autoPopQueus.push((next: Function) => {
            MgrWinStreakV2.Instance.tryAutoReward(next);
        });

        this._autoPopQueus.push((next: Function) => {
            MgrGoldTournament.Instance.tryAutoReward(next);
        });

        this._autoPopQueus.push((next: Function) => {
            MgrGoldTournamentV2.Instance.tryAutoReward(next);
        });

        if (checkNetwork) {
            this._autoPopQueus.push((next: Function) => {
                this.openBlack();
                this.scheduleOnce(() => {
                    this.closeBlack();
                    next();
                }, 0.5);
            });
        }

        this._autoPopQueus.push((next: Function) => {
            if (MgrRace.Instance.raceState === RaceState.TurnRace) {
                AppGame.topUI.raceBtn.getComponent(RaceBtn).checkStep(next);
            } else {
                next();
            }
        });

        MgrWeakGuide.Instance.createGuideQueus(this._autoPopQueus);

        this._autoPopQueus.complete = () => {
            director.emit(GlobalEvent.GameAutoPopComplete);
        };

        this._autoPopQueus.play();
    }

    checkAddAutoPop(): boolean {
        return AppGame.topUI.backListFunc.length === 0;
    }

    addAutoFlow(callback: Function) {
        if (!this._autoPopQueus) this.createPopQueus();
        
        this._autoPopQueus.push(callback);
        this._autoPopQueus.complete = () => {
            director.emit(GlobalEvent.GameAutoPopComplete);
        };
        this._autoPopQueus.play();
    }

    tipNetError() {
        const alert = Alert.open(Language.Instance.getLangByID('network_message'));
        alert.confirm(() => {
            NativeBridge.Instance.openWifiSetting();
        }, Language.Instance.getLangByID('network_set'));
        
        alert.cancel(() => {}, Language.Instance.getLangByID('network_skip'));
        
        alert.node.on(VIEW_ANIM_EVENT.Removed, () => {
            this.checkNeting = false;
        });
    }

    async checkNetwork(showLoading: boolean = true) {
        if (Tools.GetNowTime() - this.checkLastTime < 300000 || this.checkNeting) return;
        
        this.checkNeting = true;
        
        if (config.checkNetTime) {
            if (showLoading) Loading.open();
            
            const serverTime = await MgrService.Instance.getServerTime();
            if (serverTime) {
                Tools.serverTime = serverTime;
                Tools.runningTime = 0;
                this.checkNeting = false;
                this.checkLastTime = Tools.GetNowTime();
            } else {
                this.tipNetError();
            }
            
            if (showLoading) Loading.close();
        } else {
            if (NativeBridge.Instance.getNetworkType() < 0) {
                this.tipNetError();
            } else {
                this.checkNeting = false;
                this.checkLastTime = Tools.GetNowTime();
            }
        }
    }
}