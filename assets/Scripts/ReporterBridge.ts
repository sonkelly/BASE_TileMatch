import { _decorator, cclegacy } from 'cc';
import { ChannelType } from './ChannelManager';
import { AFDot } from './AFDot';
import { AggregatedReporter } from './AggregatedReporter';
import { TestReporter } from './TestReporter';
import { ThinkingH5Reporter } from './ThinkingH5Reporter';

const { ccclass } = _decorator;

@ccclass('ReporterBridge')
export class ReporterBridge {
    private static sReporter: AggregatedReporter | null = null;

    public static init(chT: ChannelType): void {
        if (this.sReporter === null) {
            switch (chT) {
                case ChannelType.Test:
                    const testReporter = new AggregatedReporter();
                    testReporter.setReporters([new TestReporter()]);
                    this.sReporter = testReporter;
                    break;
                case ChannelType.WeChat:
                    const wechatReporter = new AggregatedReporter();
                    wechatReporter.setReporters([new ThinkingH5Reporter()]);
                    this.sReporter = wechatReporter;
                    break;
                case ChannelType.TT:
                    const ttReporter = new AggregatedReporter();
                    ttReporter.setReporters([new ThinkingH5Reporter()]);
                    this.sReporter = ttReporter;
                    break;
                case ChannelType.FaceBook:
                    const fbReporter = new AggregatedReporter();
                    fbReporter.setReporters([new ThinkingH5Reporter()]);
                    this.sReporter = fbReporter;
                    break;
                case ChannelType.Android:
                    const androidReporter = new AggregatedReporter();
                    androidReporter.setReporters([new ThinkingH5Reporter()]);
                    this.sReporter = androidReporter;
                    break;
            }
        }
        this.sReporter?.init();
    }

    public static reportEvent(chN: string, chP: any): void {
        this.sReporter?.reportEvent(chN, chP);
        AFDot.sendEvent(chN, chP);
    }

    public static setUserProperty(chM: any): void {
        this.sReporter?.setUserProperty(chM);
    }

    public static setOnceUserProperty(chM: any): void {
        this.sReporter?.setOnceUserProperty(chM);
    }

    public static incUserProperty(chM: any): void {
        this.sReporter?.incUserProperty(chM);
    }

    public static beginEventTime(chM: string): void {
        this.sReporter?.beginTimeEvent(chM);
    }
}