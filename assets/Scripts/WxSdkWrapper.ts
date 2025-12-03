import { _decorator, Component, Node, cclegacy, error, log } from 'cc';
import { WxAdWrapper } from './WxAdWrapper';
import {Tools} from './Tools';

const { ccclass, property } = _decorator;

@ccclass('WxSdkWrapper')
export class WxSdkWrapper extends Component {
    private static _instance: WxSdkWrapper;
    public static get instance(): WxSdkWrapper {
        return WxSdkWrapper._instance;
    }

    private adMgr: WxAdWrapper | null = null;
    private _systemInfo: any = null;
    private _userInfo: any = null;
    private startShareTime: number | null = null;
    private shareTicket: boolean = true;
    private shareParam: any = null;

    public init(): void {
        this.adMgr = new WxAdWrapper();
        this.adMgr.init();
        this._setKeepScreenOn();
        this._requestSystemInfoSync();
        this._showRightUpShare();
    }

    private _setKeepScreenOn(): void {
        if (typeof wx !== 'undefined') {
            wx.setKeepScreenOn({
                keepScreenOn: true
            });
        }
    }

    private _requestSystemInfoSync(): void {
        if (typeof wx !== 'undefined') {
            try {
                const systemInfo = wx.getSystemInfoSync();
                this._systemInfo = systemInfo;
            } catch (err) {
                error('wx getSystemInfoSync err: ', err);
            }
        }
    }

    private _showRightUpShare(): void {
        if (typeof wx !== 'undefined') {
            try {
                wx.showShareMenu({
                    withShareTicket: true,
                    menus: ['shareAppMessage', 'shareTimeline'],
                    success: () => {},
                    fail: () => {},
                    complete: () => {}
                });

                wx.onShareAppMessage(() => {
                    return {
                        success: () => {
                            log('分享成功!');
                        },
                        fail: (err: any) => {
                            log('分享失败!', err);
                        }
                    };
                });
            } catch (err) {
                log('右上角分享开启失败!');
            }
        }
    }

    private _getUserInfo(): void {
        if (typeof wx !== 'undefined') {
            wx.getSetting({
                success: (res: any) => {
                    if (res.authSetting['scope.userInfo']) {
                        wx.getUserInfo({
                            success: (userInfo: any) => {
                                this._userInfo = userInfo.userInfo;
                            }
                        });
                    } else {
                        const button = wx.createUserInfoButton({
                            type: 'text',
                            text: '获取用户信息',
                            style: {
                                left: 10,
                                top: 76,
                                width: 200,
                                height: 40,
                                lineHeight: 40,
                                backgroundColor: '#ff0000',
                                color: '#ffffff',
                                textAlign: 'center',
                                fontSize: 16,
                                borderRadius: 4
                            }
                        });
                        button.onTap((userInfo: any) => {
                            this._userInfo = userInfo.userInfo;
                        });
                    }
                }
            });
        }
    }

    public login(params: { onSucceed?: (code: string) => void, onFail?: (errMsg: string) => void }): void {
        if (typeof wx !== 'undefined') {
            wx.login({
                success: (res: any) => {
                    if (res.code) {
                        console.log('login success!');
                        params.onSucceed?.(res.code);
                    } else {
                        console.log('login failed!');
                        params.onFail?.(res.errMsg);
                    }
                },
                complete: () => {
                    console.log('login complete!');
                }
            });
        }
    }

    public async inviteAsync(params: any): Promise<void> {
        return Promise.resolve();
    }

    public async shareAsync(params: { onSucceed?: () => void, onFail?: () => void }): Promise<void> {
        if (typeof wx !== 'undefined') {
            wx.shareAppMessage({});
            this.startShareTime = Tools.GetNowTime();
            this.shareTicket = false;
            this.shareParam = {
                fail: params.onFail,
                success: params.onSucceed
            };
        }
        return Promise.resolve();
    }

    public checkShareResult(timeout: number): void {
        if (this.shareTicket && this.startShareTime) {
            if (Tools.GetNowTime() - this.startShareTime >= timeout) {
                this.shareParam?.success?.();
            } else {
                this.shareParam?.fail?.();
            }
            this.shareTicket = true;
            this.shareParam = null;
        }
    }

    public async getIsNetConnect(): Promise<boolean> {
        if (typeof wx !== 'undefined') {
            return new Promise((resolve) => {
                wx.getNetworkType({
                    success: (res: any) => {
                        resolve(res.networkType !== 'none');
                    },
                    fail: () => {
                        resolve(false);
                    }
                });
            });
        }
        return Promise.resolve(false);
    }

    public jumpToProgram(appId: string): void {
        if (typeof wx !== 'undefined') {
            wx.navigateToMiniProgram({
                appId: appId,
                extraData: {},
                envVersion: 'release',
                success: (res: any) => {
                    log('jumpToProgram success! res:' + JSON.stringify(res));
                },
                fail: (err: any) => {
                    log('jumpToProgram fail! err:' + JSON.stringify(err));
                },
                complete: () => {
                    log('jumpToProgram complete');
                }
            });
        }
    }

    public reportEvent(eventName: string, data: any): void {
        if (typeof wx !== 'undefined') {
            wx.reportEvent(eventName, data);
        }
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

    public showVideo(params: any): Promise<boolean> {
        return this.adMgr?.showVideo(params) || Promise.resolve(false);
    }

    public isInterstitialAvailable(): boolean {
        return this.adMgr?.isInterstitialAvailable() || false;
    }

    public showInterstitial(params: any): void {
        this.adMgr?.showInterstitial(params);
    }

    public showBanner(params: any): void {
        this.adMgr?.showBanner(params);
    }

    public hideBanner(): void {
        this.adMgr?.hideBanner();
    }

    public getSupportedAPIs(): string[] {
        return [];
    }

    public getEntryPointData(): any {
        return {};
    }

    public getPlatform(): string {
        return '';
    }

    public get systemInfo(): any {
        return this._systemInfo;
    }

    public get userInfo(): any {
        return this._userInfo;
    }

    protected onLoad(): void {
        if (!WxSdkWrapper._instance) {
            WxSdkWrapper._instance = this;
        }
    }
}