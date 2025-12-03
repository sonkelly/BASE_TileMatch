import { _decorator, Component, Node, Label, director } from 'cc';
import { MgrPass } from './MgrPass';
import { Utils } from './Utils';
import { AppGame } from './AppGame';
import { UIPrefabs } from './Prefabs';
import { MgrUi } from './MgrUi';
import { TopUIItem } from './TopUIItem';
import { GlobalEvent } from './Events';

const { ccclass, property } = _decorator;

@ccclass('PassBtn')
export class PassBtn extends Component {
    @property(TopUIItem)
    passBtn: TopUIItem = null!;

    @property(Label)
    timeLabel: Label = null!;

    @property(Node)
    rdDot: Node = null!;

    protected onLoad(): void {
        this.node.on('click', this.onPassBtn, this);
    }

    protected onEnable(): void {
        this.checkRedDot();
        this.refreshTime();
        director.on(GlobalEvent.GameAutoPopComplete, this.onAutoComplete, this);
    }

    protected onDisable(): void {
        this.removeRegister();
    }

    private addRegister(): void {
        this.timer();
        this.schedule(this.timer, 1);
    }

    private removeRegister(): void {
        this.unschedule(this.timer);
        director.targetOff(this);
    }

    private onAutoComplete(): void {
        this.addRegister();
    }

    private timer(): void {
        const remainTime = MgrPass.Instance.getRemainTime();
        if (remainTime <= 0) {
            this.removeRegister();
            AppGame.Ins.addAutoFlow((callback: Function) => {
                this.passBtn.hide();
                MgrPass.Instance.tryAutoReward(callback);
                MgrPass.Instance.checkResetData();
            });
        }
        this.refreshTime();
    }

    private refreshTime(): void {
        const remainTime = MgrPass.Instance.getRemainTime();
        const timeStr = Utils.timeConvertToHHMM(remainTime);
        this.timeLabel.string = timeStr;
    }

    private checkRedDot(): void {
        this.rdDot.active = MgrPass.Instance.getRdEnable();
    }

    private async onPassBtn(): Promise<void> {
        await MgrUi.Instance.addViewAsyncQueue(UIPrefabs.UIPassView, {
            root: MgrUi.root(1)
        });
    }
}