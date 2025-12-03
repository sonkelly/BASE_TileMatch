import { _decorator, cclegacy } from 'cc';
import {MgrBase} from './MgrBase';
import { TaskData } from './TaskData';
import {TaskCfg} from './TaskCfg';
import { TASK_STATUS } from './Const';
import {sortBy, set, each, values} from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('MgrTask')
export class MgrTask extends MgrBase {
    private _data: TaskData = null;

    onLoad() {
        this._data = new TaskData('TaskData');
    }

    load() {
        this._data.load();
    }

    initLoadData() {}

    getWeekTask() {
        const result = {};
        const weekTasks = this.data.getWeekTask();
        
        each(weekTasks, (task) => {
            if (task.status === TASK_STATUS.Complete || task.status === TASK_STATUS.Job) {
                set(result, task.id, task);
            }
        });

        return sortBy(result, (task) => {
            return 10000 * -task.status + task.id;
        });
    }

    getYearTask() {
        const yearTypeLists = TaskCfg.Instance.getYearTypeLists();
        const result = {};

        each(yearTypeLists, (yearList) => {
            for (let i = 0; i < yearList.length; i++) {
                const taskId = yearList[i];
                const task = this.data.getYearTaskById(taskId);
                
                if (task.status !== TASK_STATUS.Complete) {
                    if (task.status === TASK_STATUS.Job) {
                        set(result, taskId, task);
                        break;
                    }
                } else {
                    set(result, taskId, task);
                }
            }
        });

        return sortBy(result, (task) => {
            return 10000 * -task.status + task.id;
        });
    }

    getWeekRd(): boolean {
        const weekTasks = this.getWeekTask();
        const taskValues = values(weekTasks);
        
        for (let i = 0; i < taskValues.length; i++) {
            if (taskValues[i].status === TASK_STATUS.Complete) {
                return true;
            }
        }
        return false;
    }

    getYearRd(): boolean {
        const yearTasks = this.getYearTask();
        const taskValues = values(yearTasks);
        
        for (let i = 0; i < taskValues.length; i++) {
            if (taskValues[i].status === TASK_STATUS.Complete) {
                return true;
            }
        }
        return false;
    }

    get data(): TaskData {
        return this._data;
    }

    static get Instance(): MgrTask {
        return MgrTask._instance;
    }

    private static _instance: MgrTask;
}