import { _decorator, Component, Node, director, cclegacy } from 'cc';
import { MgrTask } from './MgrTask';
import { GlobalEvent } from './Events';
import { UIPrefabs } from './Prefabs';
import { MgrUi } from './MgrUi';

const { ccclass, property } = _decorator;

@ccclass('TaskBtn')
export class TaskBtn extends Component {
    @property(Node)
    rdDot: Node = null!;

    onLoad() {
        this.node.on('click', this.onTaskBtn, this);
    }

    onEnable() {
        this.checkRedDot();
        director.on(GlobalEvent.DailyRewardEarn, this.checkRedDot, this);
    }

    onDisable() {
        director.targetOff(this);
    }

    checkRedDot() {
        this.rdDot.active = MgrTask.Instance.getWeekRd() || MgrTask.Instance.getYearRd();
    }

    async onTaskBtn() {
        await MgrUi.Instance.openViewAsync(UIPrefabs.UITaskView, {
            root: MgrUi.root(1)
        });
    }
}