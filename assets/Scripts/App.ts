import { _decorator, sys, log, macro, game, Input, director, Game, assetManager, Director, Component, cclegacy } from 'cc';
import { GlobalEvent } from './Events';
import { config } from './Config';
import { NativeBridge } from './NativeBridge';
import { Transition }from './Transition';
import { Launder } from './Launder';
import { Tools } from './Tools';
import { MgrTargets } from './MgrTargets';
import { Adapter } from './Adapter';
import { MgrService } from './MgrService';
import { Alert } from './Alert';
import {Language} from './Language';
import {CustomLoadMgr} from './CustomLoadMgr';
import { screenInput } from './ScreenInput';
import { ReporterBridge } from './ReporterBridge';
import { channelManager, getChannelType } from './ChannelManager';
import { AnalyticsManager } from './AnalyticsManager';
import { isSameUtcDate, getNowTime } from './TimeUtil';

import { SdkBridge } from './SdkBridge';
import { StorageProxy } from './StorageProxy';
import { MgrUser } from './MgrUser';
import { GameConst, ITEM } from './GameConst';
import { MgrGame } from './MgrGame';
import { NotificationMgr } from './NotificationMgr';
import { IAPMgr } from './IAPMgr';
import { AdsManager } from './AdsManager';
import { AppsFlyer } from './AppsFlyer';
import { MgrSkin } from './MgrSkin';
import { LeaderboardManager } from './LeaderboardManager';
import { LeaderboardNameEnum } from './LeaderboardNameEnum';
import { Mgrs } from './Mgrs';
import {toNumber} from "lodash-es";

const { ccclass, property } = _decorator;

@ccclass('App')
export class App extends Component {
    private _isNewPlayer: boolean | null = null;
    private startTime: number = 0;
    private _loginFinish: boolean = false;
    private _loadFinish: boolean = false;
    private _isInAd: boolean = false;
    
    public static MyApp: App | null = null;

    private reportNewDay() {
        const playDays = sys.localStorage.getItem(config.gameName + '_playDays') || '0';
        const loginDay = sys.localStorage.getItem(config.gameName + '_loginDay') || '0';
        
        if (loginDay === '0' || !Tools.GetNowMoment().isSame(Number(loginDay), 'days')) {
            const newPlayDays = toNumber(playDays) + 1;
            sys.localStorage.setItem(config.gameName + '_playDays', newPlayDays.toString());
            AnalyticsManager.getInstance().incUserProperty({ CK_PlayDays: 1 });
        }
        
        sys.localStorage.setItem(config.gameName + '_loginDay', Tools.GetNowTime().toString());
    }

    public printLoadTime(tag: string) {
        log(tag + ':', Date.now() - this.startTime);
    }

    onLoad() {
        App.MyApp = this;
        macro.ENABLE_MULTI_TOUCH = false;
        this.startTime = Date.now();
        this.openNum++;
        this._loginFinish = false;
        this._loadFinish = false;
        this.init();
        this.run();
    }

    private init() {
        Adapter.setKeepScreenOn(true);
        this.initFrameRate();
        this.registerScreenListeners();
        this.registerGlobalListeners();
        this.ccEx();
    }

    private initFrameRate() {
        let lowBattery = sys.localStorage.getItem('low-battery');
        if (!lowBattery) {
            lowBattery = NativeBridge.Instance.checkIsLowPhone() ? 'true' : 'false';
        }
        config.frameRate = lowBattery === 'true' ? 30 : 60;
        game.frameRate = config.frameRate;
    }

    private registerScreenListeners() {
        screenInput.on(Input.EventType.TOUCH_START, (event) => {
            const location = event.getUILocation();
            director.emit(GlobalEvent.TouchScreenBegin, location);
        });

        screenInput.on(Input.EventType.TOUCH_END, (event) => {
            const location = event.getUILocation();
            event.getLocation();
            director.emit(GlobalEvent.TouchScreenEnded, location);
        });
    }

    private registerGlobalListeners() {
        const self = this;

        game.on(Game.EVENT_SHOW, async ()=> {
            SdkBridge.checkShareResult(2000);
            const gameTime = AnalyticsManager.gameTime;
            
            game.emit(GlobalEvent.GamePause);
            await self._sycServerTime();
            game.emit(GlobalEvent.GameResume);
            
            if (self._isInAd) {
                self._isInAd = false;
            } else if (Tools.GetNowTime() - gameTime >= 1000 * GameConst.INTERSTITIAL_CD_S) {
                NativeBridge.Instance.showInterstitialIfCooldown({ OpenUi: 'BackGame' });
            }
        });

        game.on(Game.EVENT_HIDE, () => {
            self._isInAd = AdsManager.getInstance().isInAdReward || AdsManager.getInstance().isInAdInterstitial;
            const duration = Tools.GetNowTime() - AnalyticsManager.gameTime;
            const gameData = {
                Game_Duration: duration / 1000,
                Duration: duration / 1000
            };
            
            AnalyticsManager.getInstance().reportLevelGame(gameData);
            AnalyticsManager.gameTime = Tools.GetNowTime();
        });
    }

    private ccEx() {
        assetManager.downloader.register('.cer', assetManager.downloader.downloadAsset);
        assetManager.downloader.maxConcurrency = 100;
        assetManager.downloader.maxRequestsPerFrame = 100;
    }

    private initAnalytics() {
        const self = this;
        
        ReporterBridge.init(getChannelType());
        
        class GameDataQuerier {
            isNew(): boolean {
                const createTime = self.createTime;
                return isSameUtcDate(Number(createTime));
            }

            curLv(): number {
                return MgrGame.Instance.gameData.curLv;
            }

            stars(): number {
                return MgrUser.Instance.userData.stars;
            }

            coins(): number {
                return MgrUser.Instance.userData.coins;
            }

            backs(): number {
                return MgrUser.Instance.userData.getItem(ITEM.Back);
            }

            hints(): number {
                return MgrUser.Instance.userData.getItem(ITEM.Hint);
            }

            fresh(): number {
                return MgrUser.Instance.userData.getItem(ITEM.Fresh);
            }

            light(): number {
                return MgrUser.Instance.userData.getItem(ITEM.Light);
            }

            skin(): number {
                return MgrSkin.Instance.data.currSkinId;
            }
        }

        AnalyticsManager.getInstance().reportDebug = config.reportDebug;
        AnalyticsManager.gameTime = Tools.GetNowTime();
        AnalyticsManager.setGameDataQuerier(new GameDataQuerier());
        AnalyticsManager.setVersion(config.version);
        AnalyticsManager.getInstance().setCommonProperties();
        AnalyticsManager.getInstance().setOnceUserProperty({ CK_LogOnTime: getNowTime() });
        AnalyticsManager.getInstance().setUserProperty({ CK_OpenNum: this.openNum });
        AnalyticsManager.getInstance().setUserProperty({ CK_last_game_start_time: getNowTime() });
        
        this.reportNewDay();
        
        const loginData = {
            IsNew: AnalyticsManager.gameDataQuerier.isNew(),
            FirstBegin: this.isNewPlayer
        };
        
        AnalyticsManager.getInstance().reportStartLogin(loginData);
        AppsFlyer.reportStartLogin(this.createTime);
    }

    private initSdk() {
        SdkBridge.initSdk();
    }

    private async run() {
        const self = this;
        
        self.addComponent(Mgrs).loadMgrs(MgrTargets.MGR_NAMES);
        self.addComponent(MgrService).initialize();
        channelManager.init();
        await self._sycServerTime();
        self.initSdk();
        config.initVersion();
        self.initAnalytics();
        self.sdkLogin();
        
        const loadingData = { FirstBegin: self.isNewPlayer };
        AnalyticsManager.getInstance().reportLoadingStart(loadingData);
        
        LeaderboardManager.getInstance().init({
            leaderboardPrefix: LeaderboardNameEnum.wisdom,
            storageKey: 'CK_LeaderBoardPlayers'
        });
        
        CustomLoadMgr.LoadCustomRes(Launder.Instance.getLoadFuncs(), () => {
            const loadingTime = Tools.GetNowTime() - self.startTime;
            const finishData = {
                FirstBegin: self.isNewPlayer,
                Loading_Duration: loadingTime
            };
            
            AnalyticsManager.getInstance().reportLoadingFinish(finishData);
            self._loadFinish = true;
            self._checkEnter();
        });
    }

    private sdkLogin() {
        const self = this;
        const callback = {
            onSucceed: (data: any) => {
                self._onSdkLoginSucc(data);
            },
            onFail: (error: any) => {
                Alert.open(Language.Instance.getLangByID('tip_login_error')).confirm(() => {
                    game.end();
                });
            }
        };
        
        SdkBridge.login(callback);
    }

    private _onSdkLoginSucc(data: any) {
        const self = this;
        this._login(data, (record: any) => {
            self._loginSucc(record);
        });
    }

    private _login(data: any, callback: Function) {
        const self = this;
        
        if (config.useServerData) {
            let retryCount = 0;
            let delay = 0.1;
            
            const tryLogin = async function () {
                const result = await MgrService.Instance.login(data);
                
                if (result) {
                    Tools.serverTime = result.nowTime;
                    Tools.runningTime = 0;
                    AnalyticsManager.gameTime = Tools.GetNowTime();
                    callback && callback(result.record);
                } else if (++retryCount <= 2) {
                    delay *= 2;
                    self.scheduleOnce(() => {
                        tryLogin();
                    }, delay);
                } else {
                    Alert.open(Language.Instance.getLangByID('tip_login_error')).confirm(() => {
                        game.end();
                    });
                }
            };
            
            tryLogin();
        } else {
            callback && callback();
        }
    }

    private async _loginSucc(record: any) {
        const self = this;
        StorageProxy.initialize(self);
        const parsedData = await StorageProxy.parseData(record);
        
        if (parsedData) {
            StorageProxy.loadData(parsedData);
            self._loginFinish = true;
            self._checkEnter();
        } else {
            Alert.open(Language.Instance.getLangByID('tip_parseData_error')).confirm(() => {
                self.restart();
            });
        }
    }

    private restart() {
        if (location && location.reload) {
            location.reload();
        } else if (history && history.go) {
            history.go(0);
        }
        
        this.scheduleOnce(() => {
            director.once(Director.EVENT_AFTER_DRAW, () => {
                Alert.open(Language.Instance.getLangByID('tip_parseData_error')).confirm(() => {
                    game.end();
                });
            });
        }, 1);
    }

    onDisable() {
        this.unscheduleAllCallbacks();
    }

    private async _checkEnter() {
        const self = this;
        
        if (self._loadFinish && self._loginFinish) {
            await Mgrs.Instance.load();
            self.printLoadTime('Mgrs.Instance.load');
            await Mgrs.Instance.initialize();
            self.printLoadTime('Mgrs.Instance.initialize');
            await Launder.Instance.loadCurrUi();
            NotificationMgr.Instance.init();
            IAPMgr.Instance.init();
            self.enterGame();
        }
    }

    private _storageStartRun() {
        StorageProxy.startRunning();
    }

    private enterGame() {
        const self = this;
        this.printLoadTime('app enter game ');
        Transition.enterGame(() => {
            self._storageStartRun();
            self.printLoadTime('load complete!');
        });
    }

    lateUpdate(dt: number) {
        Tools.runningTime += 1000 * dt;
    }

    private async _sycServerTime() {
        if (config.checkNetTime) {
            const serverTime = await MgrService.Instance.getServerTime();
            if (serverTime) {
                Tools.serverTime = serverTime;
                Tools.runningTime = 0;
            } else {
                Tools.serverTime = new Date().getTime();
                Tools.runningTime = 0;
            }
        } else {
            Tools.serverTime = new Date().getTime();
            Tools.runningTime = 0;
        }
        
        AnalyticsManager.gameTime = Tools.GetNowTime();
    }

    get isNewPlayer(): boolean {
        if (this._isNewPlayer === null) {
            const firstBegin = sys.localStorage.getItem(config.gameName + '_firstBegin') || null;
            this._isNewPlayer = firstBegin === null || firstBegin === 'true';
            sys.localStorage.setItem(config.gameName + '_firstBegin', 'false');
        }
        return this._isNewPlayer;
    }

    get createTime(): number {
        let createTime = sys.localStorage.getItem(config.gameName + '_createTime') || '0';
        if (createTime === '0') {
            createTime = Tools.GetNowTime().toString();
            sys.localStorage.setItem(config.gameName + '_createTime', createTime);
        }
        return toNumber(createTime);
    }

    get openNum(): number {
        return toNumber(sys.localStorage.getItem(config.gameName + '_openNum') || '0');
    }

    set openNum(value: number) {
        sys.localStorage.setItem(config.gameName + '_openNum', value.toString());
    }
}
