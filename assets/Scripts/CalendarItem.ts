import { _decorator, Component, Node, Label, ProgressBar, Button, Color } from 'cc';
import { MgrChallenge } from './MgrChallenge';
import { Tools } from './Tools';
import * as momentModule from 'moment';
const moment = (momentModule as any).default || momentModule;

const { ccclass, property } = _decorator;

@ccclass('CalendarItem')
export class CalendarItem extends Component {
    @property(Label)
    dateLabel: Label | null = null;

    @property(Node)
    passTag: Node | null = null;

    @property(Node)
    progressBg: Node | null = null;

    @property(ProgressBar)
    levelProgress: ProgressBar | null = null;

    @property(Node)
    chooseTag: Node | null = null;

    @property(Node)
    passChooseTag: Node | null = null;

    public delegate: any = null;
    public time: any = null;
    public days: number | null = null;
    public lv: any = null;
    
    private _unlock: boolean = false;

    get unlock(): boolean {
        return this._unlock;
    }

    set unlock(value: boolean) {
        this._unlock = value;
    }

    onLoad() {
        this.node.on('click', this.onItemClick, this);
    }

    setData(days: number, time: any): boolean {
        this.days = days;
        this.time = time;
        this.dateLabel!.string = days ? '' + days : '';
        this.hideAllTags();
        this.showDateLabel();
        this.showNodeStatus();
        
        if (this.days && time) {
            const curTime = MgrChallenge.Instance.curTime;
            const currTime = this.getCurrTime();
            return moment(currTime).isSame(curTime, 'd');
        }
        return false;
    }

    hideAllTags() {
        this.passTag!.active = false;
        this.progressBg!.active = false;
        this.levelProgress!.node.active = false;
        this.chooseTag!.active = false;
        this.passChooseTag!.active = false;
        this.lv = null;
    }

    showDateLabel() {
        if (this.days) {
            const currTime = this.getCurrTime();
            const nowMoment = Tools.GetNowMoment();
            
            this.unlock = nowMoment.isAfter(currTime);
            this.node.getComponent(Button)!.interactable = this.unlock;
            this.lv = MgrChallenge.Instance.getLevelByDate(currTime);
            
            this.dateLabel!.color = this.unlock ? Color.WHITE : this.dateLabel!.color.fromHEX('#2e314966');
            this.dateLabel!.enableShadow = this.unlock;
        }
    }

    getCurrTime(): any {
        const daysOffset = this.days! - 1;
        return this.time!.startOf('month').startOf('day').add(daysOffset, 'days');
    }

    showNodeStatus() {
        if (this.lv) {
            const timeValue = this.getCurrTime().valueOf();
            const isPassed = MgrChallenge.Instance.getLevelPassEnable(timeValue);
            const progress = MgrChallenge.Instance.getLevelProgress(timeValue);
            
            this.dateLabel!.node.active = !isPassed;
            this.passTag!.active = isPassed;
            
            if (!isPassed) {
                this.progressBg!.active = progress > 0;
                this.levelProgress!.node.active = progress > 0;
                this.levelProgress!.progress = progress;
            }
        }
    }

    onItemClick() {
        if (this.days && this.lv) {
            MgrChallenge.Instance.curTime = moment(this.getCurrTime());
            this.delegate && this.delegate.onSelectCalendarItem(this);
            this.refreshChooseChange();
        }
    }

    refreshChooseChange() {
        if (this.days) {
            const curTime = MgrChallenge.Instance.curTime;
            if (curTime) {
                const currTime = this.getCurrTime();
                if (moment(currTime).isSame(curTime, 'd')) {
                    const timeValue = this.getCurrTime().valueOf();
                    const isPassed = MgrChallenge.Instance.getLevelPassEnable(timeValue);
                    
                    if (isPassed) {
                        this.passTag!.active = true;
                        this.progressBg!.active = false;
                    }
                    this.chooseTag!.active = !isPassed;
                    this.passChooseTag!.active = isPassed;
                } else {
                    this.hideChooseTag();
                    this.showNodeStatus();
                }
            } else {
                this.hideChooseTag();
            }
        } else {
            this.hideChooseTag();
        }
    }

    hideChooseTag() {
        this.chooseTag!.active = false;
        this.passChooseTag!.active = false;
    }
}