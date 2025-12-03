import { _decorator, Component } from 'cc';
const { ccclass } = _decorator;

@ccclass('ThinkingH5Reporter')
export class ThinkingH5Reporter extends Component {
    private ta: any = null;

    public init(): void {
        this.ta = window.ta;
    }

    public reportEvent(eventName: string, properties: any): void {
        this.ta && this.ta.track(eventName, properties);
    }

    public beginTimeEvent(eventName: string): void {
        this.ta && this.ta.timeEvent(eventName);
    }

    public setUserProperty(properties: any): void {
        this.ta && this.ta.userSet(properties);
    }

    public setOnceUserProperty(properties: any): void {
        this.ta && this.ta.userSetOnce(properties);
    }

    public incUserProperty(properties: any): void {
        this.ta && this.ta.userAdd(properties);
    }
}