import { _decorator, error, log } from 'cc';
import { TtAdWrapper } from './TtAdWrapper';

const { ccclass, property } = _decorator;

enum RECORD_STATE {
    CLOSE = 1,
    START,
    PAUSE,
    END
}

@ccclass('TtSdkWrapper')
export class TtSdkWrapper {
    private static instance: TtSdkWrapper = new TtSdkWrapper();
    private adMgr: TtAdWrapper | null = null;
    private _systemInfo: any = null;
    private _userInfo: any = null;
    private _appName: string | null = null;
    private isShareEnd: boolean = true;
    private _gameRecorder: any = null;
    private _videoPath: string | null = null;
    private _totalRecord: number = 15;
    private _recordTime: number = 0;
    private _recordTimer: any = null;
    private _videoHasEnd: boolean = false;
    private _videoState: RECORD_STATE = RECORD_STATE.CLOSE;

    public static getInstance(): TtSdkWrapper {
        return TtSdkWrapper.instance;
    }

    public init(): void {
        this.adMgr = new TtAdWrapper();
        this.adMgr.init();
        this._setKeepScreenOn();
        this._requestSystemInfoSync();
        this._showRightUpShare();
        this._getUserInfo();
    }

    private _setKeepScreenOn(): void {
        tt.setKeepScreenOn({
            keepScreenOn: true
        });
    }

    private _requestSystemInfoSync(): void {
        try {
            const systemInfo = tt.getSystemInfoSync();
            this._systemInfo = systemInfo;
            this._appName = systemInfo.appName;
        } catch (e) {
            error('tt getSystemInfoSync err: ', e);
        }
        log('requestSystemInfoSync appName:' + this._appName);
    }

    private _showRightUpShare(): void {
        try {
            tt.showShareMenu({
                success: () => {
                    log('成功显示转发按钮!');
                },
                fail: (e) => {
                    log('showShareMenu 调用失败!', e.errMsg);
                },
                complete: () => {
                    log('showShareMenu 调用完成!');
                }
            });

            tt.onShareAppMessage(() => ({
                success: () => {
                    log('分享成功.');
                },
                fail: (e) => {
                    log('分享失败.', e);
                },
                complete: () => {
                    log('分享完成.');
                }
            }));
        } catch (e) {
            log('右上角分享开启失败!');
        }
    }

    private _getUserInfo(): void {
        tt.getSetting({
            success: (res) => {
                if (res.authSetting['scope.userInfo']) {
                    this._loginAndGetUserInfo();
                } else {
                    tt.authorize({
                        scope: 'scope.userInfo',
                        success: () => {
                            this._loginAndGetUserInfo();
                        },
                        fail: (e) => {
                            log('authorize errNo:' + e.errNo + ', errMsg: ' + e.errMsg);
                        }
                    });
                }
            },
            fail: (e) => {
                log('getSetting 调用失败', e);
            }
        });
    }

    private _loginAndGetUserInfo(): void {
        tt.login({
            success: () => {
                tt.getUserInfo({
                    success: (res) => {
                        this._userInfo = res.userInfo;
                    },
                    fail: (e) => {
                        log('getUserInfo 调用失败', e.errMsg);
                    }
                });
            }
        });
    }

    public inviteAsync(): Promise<void> {
        return new Promise((resolve) => {
            resolve();
        });
    }

    public isSupportShare(): boolean {
        return this._appName === 'Toutiao' || this._appName === 'Douyin' || this._appName === 'douyin_lite';
    }

    public shareAsync(options: any): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.isShareEnd) {
                let channel = '';
                if (this._appName === 'Douyin' || this._appName === 'douyin_lite') {
                    channel = 'invite';
                } else if (this._appName === 'Toutiao') {
                    channel = 'article';
                }

                this.isShareEnd = false;
                tt.shareAppMessage({
                    channel: channel,
                    success: () => {
                        options.onSucceed && options.onSucceed();
                    },
                    fail: () => {
                        options.onFail && options.onFail();
                    },
                    complete: () => {
                        this.isShareEnd = true;
                    }
                });
            }
        });
    }

    public startRecord(callback?: () => void): void {
        if (tt) {
            if (!this._gameRecorder) {
                this._gameRecorder = tt.getGameRecorderManager();
            }

            this._gameRecorder.onStart(() => {
                this._recordTime = 0;
                this._recordTimer = setInterval(() => {
                    this._recordTime++;
                }, 1000);
                callback && callback();
                this._videoState = RECORD_STATE.START;
            });

            this._gameRecorder.onPause(() => {
                clearInterval(this._recordTimer);
                this._videoState = RECORD_STATE.PAUSE;
            });

            this._gameRecorder.onResume(() => {
                this._recordTimer = setInterval(() => {
                    this._recordTime++;
                }, 1000);
                this._videoState = RECORD_STATE.START;
            });

            this._gameRecorder.onStop((res) => {
                this._videoHasEnd = true;
                this._videoPath = res.videoPath;
                clearInterval(this._recordTimer);
                this._recordTime = 0;
                this._videoState = RECORD_STATE.END;
            });

            this._gameRecorder.onError((e) => {
                error('record error:', e.errMsg);
            });

            this._videoHasEnd = false;
            this._videoPath = null;
            this._gameRecorder.start({
                duration: this._totalRecord
            });
        } else {
            callback && callback();
        }
    }

    public pauseRecord(callback?: () => void): void {
        if (tt) {
            if (this._gameRecorder) {
                this._gameRecorder.pause();
                callback && callback();
            } else {
                error('gameRecorder is null, pauseRecord fail!');
            }
        } else {
            callback && callback();
        }
    }

    public resumeRecord(callback?: () => void): void {
        if (tt) {
            if (this._gameRecorder) {
                this._gameRecorder.resume();
                callback && callback();
            } else {
                error('gameRecorder is null, resumeRecord fail!');
            }
        } else {
            callback && callback();
        }
    }

    public stopRecord(callback?: () => void): void {
        if (tt) {
            if (this._gameRecorder) {
                this._gameRecorder.stop();
                callback && callback();
            } else {
                error('gameRecorder is null, stopRecord fail!');
            }
        } else {
            callback && callback();
        }
    }

    public getVideoPath(): string | null {
        return this._videoPath;
    }

    public clearVideoPath(): void {
        this._videoPath = null;
    }

    public getVideoState(): RECORD_STATE {
        return this._videoState;
    }

    public getRecordTime(): number {
        return this._recordTime;
    }

    public shareRecordVideo(onSuccess?: () => void, onFail?: () => void): void {
        tt.shareAppMessage({
            channel: 'video',
            extra: {
                videoTopics: ['视频话题'],
                hashtag_list: ['视频话题'],
                videoPath: this.getVideoPath(),
                withVideoId: true
            },
            success: () => {
                onSuccess && onSuccess();
                this.clearVideoPath();
            },
            fail: () => {
                onFail && onFail();
                this.clearVideoPath();
            }
        });
    }

    public onClickRecord(): void {
        if (this.getVideoState() === RECORD_STATE.CLOSE || this.getVideoState() === RECORD_STATE.END) {
            this.startRecord(() => {});
        } else if (this.getVideoState() === RECORD_STATE.START && this.getRecordTime() > 4) {
            this.stopRecord(() => {
                this.shareRecordVideo(() => {}, () => {});
            });
        } else if (this.getVideoState() === RECORD_STATE.START && this.getRecordTime()) {
            // Do nothing
        }
    }

    public addShortcut(): void {
        if (this._systemInfo.appName !== 'Douyin' && this._systemInfo.appName !== 'douyin_lite') {
            return;
        }

        tt.addShortcut({
            success: () => {
                log('添加桌面成功');
            },
            fail: (e) => {
                log('添加桌面失败', e.errMsg);
            }
        });
    }

    public getIsNetConnect(): Promise<boolean> {
        return new Promise((resolve) => {
            tt.getNetworkType({
                success: (res) => {
                    resolve(res.networkType !== 'none');
                },
                fail: () => {
                    resolve(false);
                }
            });
        });
    }

    public getPlayerId(): string {
        return '';
    }

    public getPlayerName(): string {
        return this._userInfo?.nickName || '';
    }

    public getPlayerPhotoUrl(): string {
        return this._userInfo?.avatarUrl || '';
    }

    public preloadVideo(): void {}

    public preloadInterstitial(): void {}

    public isVideoAvailable(): boolean {
        return this.adMgr?.isVideoAvailable() || false;
    }

    public showVideo(callback: any): void {
        this.adMgr?.showVideo(callback);
    }

    public isInterstitialAvailable(): boolean {
        return this.adMgr?.isInterstitialAvailable() || false;
    }

    public showInterstitial(callback: any): void {
        this.adMgr?.showInterstitial(callback);
    }

    public showBanner(callback: any): void {
        this.adMgr?.showBanner(callback);
    }

    public hideBanner(): void {
        this.adMgr?.hideBanner();
    }

    public getSupportedAPIs(): string[] {
        return [];
    }

    public getEntryPointData(): object {
        return {};
    }

    public getPlatform(): string {
        return '';
    }

    get systemInfo(): any {
        return this._systemInfo;
    }

    get userInfo(): any {
        return this._userInfo;
    }
}