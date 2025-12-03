import { _decorator, Toggle, Node, Label, director, Widget, ScrollView, cclegacy } from 'cc';
import { ViewAnimCtrl } from './ViewAnimCtrl';
import { AppGame } from './AppGame';
import { BTN_BACK, VALUE_COIN } from './TopUIView';
import { MgrTask } from './MgrTask';
import { TaskItem } from './TaskItem';
import { GlobalEvent } from './Events';
import * as momentModule from 'moment';
const moment = (momentModule as any).default || momentModule;
import { Utils } from './Utils';
import { Language } from './Language';
import { UIPool } from './UIPool';
import { Tools } from './Tools';
import {values, each} from 'lodash-es';

const { ccclass, property } = _decorator;

enum TASK_TABS {
    YEAR,
    WEEK
}

@ccclass('UITaskView')
export class UITaskView extends UIPool {
    @property(Toggle)
    btnYearTab: Toggle = null!;

    @property(Node)
    rdYear: Node = null!;

    @property(Toggle)
    btnWeekTab: Toggle = null!;

    @property(Node)
    rdWeek: Node = null!;

    @property(Node)
    scroll: Node = null!;

    @property(Node)
    list: Node = null!;

    @property(Node)
    weekTipNode: Node = null!;

    @property(Label)
    timeLabel: Label = null!;

    private _chooseTab: TASK_TABS | null = null;
    private yearPaddingTop: number = 150;
    private weekPaddingTop: number = 250;
    private taskList: TaskItem[] = [];

    onLoad() {
        this.taskList = [];
        this.btnYearTab.node.on('click', this.onClickYear, this);
        this.btnWeekTab.node.on('click', this.onClickWeek, this);
    }

    onEnable() {
        director.on(GlobalEvent.TaskEarn, this.onRdChange, this);
        director.on(GlobalEvent.TaskComplete, this.onRdChange, this);
        
        AppGame.topUI.addBackFunc(() => {
            this.onBackBtn();
            AppGame.topUI.showMain();
        });
        
        AppGame.topUI.show(BTN_BACK | VALUE_COIN);
        this.onTabsInit();
        this.timeUpdate();
        this.schedule(this.timeUpdate, 1);
        this.onRdChange();
        MgrTask.Instance.data.checkResetWeek();
    }

    private onTabsInit() {
        if (!this._chooseTab) {
            const hasWeekRd = MgrTask.Instance.getWeekRd();
            const hasYearRd = MgrTask.Instance.getYearRd();
            this._chooseTab = hasWeekRd ? TASK_TABS.WEEK : TASK_TABS.YEAR;
            this._chooseTab = hasYearRd ? TASK_TABS.YEAR : this._chooseTab;
        }
        
        if (this._chooseTab === TASK_TABS.YEAR) {
            this.btnYearTab.isChecked = true;
        } else {
            this.btnWeekTab.isChecked = true;
        }
        this.onListChange();
    }

    onDisable() {
        this.unschedule(this.timeUpdate);
        director.targetOff(this);
    }

    private onClickYear() {
        if (this._chooseTab !== TASK_TABS.YEAR) {
            this._chooseTab = TASK_TABS.YEAR;
            this.onListChange();
        }
    }

    private onClickWeek() {
        if (this._chooseTab !== TASK_TABS.WEEK) {
            this._chooseTab = TASK_TABS.WEEK;
            this.onListChange();
        }
    }

    private onListChange() {
        const widget = this.scroll.getComponent(Widget)!;
        widget.top = this._chooseTab === TASK_TABS.YEAR ? this.yearPaddingTop : this.weekPaddingTop;
        this.weekTipNode.active = this._chooseTab === TASK_TABS.WEEK;

        const tasks = this._chooseTab === TASK_TABS.YEAR 
            ? values(MgrTask.Instance.getYearTask())
            : values(MgrTask.Instance.getWeekTask());

        each(tasks, (task, index) => {
            if (this.taskList[index]) {
                const item = this.taskList[index];
                item.taskId = task.id;
                item.node.active = true;
                item.delegate = this;
            } else {
                this.createItem(task);
            }
        });

        for (let i = tasks.length; i < this.taskList.length; i++) {
            const item = this.taskList[i];
            if (item && item.node) {
                item.taskId = null;
                item.node.active = false;
            }
        }

        const contentWidget = this.scroll.getComponent(ScrollView)!.content.parent!.getComponent(Widget);
        if (contentWidget) {
            contentWidget.updateAlignment();
        }
        this.scroll.getComponent(ScrollView)!.scrollToTop(0.2);
    }

    private createItem(task: any) {
        const node = this.get()!;
        this.list.addChild(node);
        const taskItem = node.getComponent(TaskItem)!;
        this.taskList.push(taskItem);
        taskItem.taskId = task.id;
        taskItem.delegate = this;
    }

    private onBackBtn() {
        this.node.getComponent(ViewAnimCtrl)!.onClose();
    }

    private timeUpdate() {
        if (this._chooseTab === TASK_TABS.WEEK) {
            if (MgrTask.Instance.data.checkResetWeek()) {
                this.onListChange();
                this.onRdChange();
            }
        }

        const timeText = Language.Instance.getLangByID('Task_Time');
        const nextWeekDate = MgrTask.Instance.data.getNextWeekDate();
        const diffMs = moment(nextWeekDate).diff(Tools.GetNowMoment(), 'millisecond');
        const timeParts = Utils.timeConvertToDDHH(diffMs).split('-');
        this.timeLabel.string = `${timeText} ${timeParts}`;
    }

    private onRdChange() {
        this.rdWeek.active = MgrTask.Instance.getWeekRd();
        this.rdYear.active = MgrTask.Instance.getYearRd();
    }

    onItemSelectRemove(item: TaskItem) {
        for (let i = 0; i < this.taskList.length; i++) {
            if (this.taskList[i].taskId === item.taskId) {
                this.taskList.splice(i, 1);
                this.put(item);
                break;
            }
        }
    }
}