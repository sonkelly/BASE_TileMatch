import { _decorator, Component } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TestAdWrapper')
export class TestAdWrapper extends Component {
    
    private videoEnable: boolean = false;

    protected init(): void {}

    public isVideoAvailable(): boolean {
        return false;
    }

    public async showVideo(callback?: {
        onBegin?: () => void;
        onSucceed?: () => void;
    }): Promise<void> {
        callback?.onBegin?.();
        callback?.onSucceed?.();
        return Promise.resolve();
    }

    public isInterstitialAvailable(): boolean {
        return false;
    }

    public showInterstitial(callback?: {
        showCallback?: () => void;
        closeCallback?: () => void;
    }): void {
        callback?.showCallback?.();
        callback?.closeCallback?.();
    }

    public showBanner(callback?: {
        showCallback?: () => void;
    }): void {
        callback?.showCallback?.();
    }

    public hideBanner(): void {}
}