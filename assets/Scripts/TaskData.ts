import { _decorator, director, cclegacy } from 'cc';
import {IDataObject} from './IDataObject';
import { TASK_STATUS } from './Const';
import {get, each, set, isNil} from 'lodash-es';
import * as momentModule from 'moment';
const moment = (momentModule as any).default || momentModule;
import {TaskCfg} from './TaskCfg';
import { GlobalEvent } from './Events';
import {Utils} from './Utils';
import {Tools} from './Tools';

const { ccclass, property } = _decorator;

@ccclass('TaskData')
export class TaskData extends IDataObject {
    private yearTaskData: Record<number, any> = {};
    private weekTaskData: Record<number, any> = {};
    private nextWeekDate: number | null = null;
    private taskData: Record<string, number> = {};
    
    @property
    private _goldTourIdx: number = 0;
    
    @property
    private _passTime: number = 0;
    
    @property
    private _winStreakTime: number = 0;
    
    @property
    private _raceInPeriod: number = 0;

    get goldTourIdx(): number {
        return this._goldTourIdx;
    }

    set goldTourIdx(value: number) {
        this._goldTourIdx = value;
        this.doDrity();
    }

    get passTime(): number {
        return this._passTime;
    }

    set passTime(value: number) {
        this._passTime = value;
        this.doDrity();
    }

    get winStreakTime(): number {
        return this._winStreakTime;
    }

    set winStreakTime(value: number) {
        this._winStreakTime = value;
        this.doDrity();
    }

    get raceInPeriod(): number {
        return this._raceInPeriod;
    }

    set raceInPeriod(value: number) {
        this._raceInPeriod = value;
        this.doDrity();
    }

    getYearTask(): Record<number, any> {
        return this.yearTaskData;
    }

    getYearTaskById(id: number): any {
        return get(this.yearTaskData, id);
    }

    freshYearTask(): void {
        let hasComplete = false;
        each(this.yearTaskData, (task) => {
            if (task.status === TASK_STATUS.Job && this.taskData[task.type]) {
                task.cur = this.taskData[task.type];
                if (task.cur >= task.max) {
                    task.status = TASK_STATUS.Complete;
                    hasComplete = true;
                }
            }
        });
        if (hasComplete) {
            director.emit(GlobalEvent.TaskComplete);
        }
    }

    getWeekTask(): Record<number, any> {
        return this.weekTaskData;
    }

    getWeekTaskById(id: number): any {
        return get(this.weekTaskData, id);
    }

    getTaskData(): Record<string, number> {
        return this.taskData;
    }

    getTaskDataByType(type: string): number {
        return get(this.taskData, type);
    }

    addTaskData(type: string, value: number): void {
        let hasComplete = false;
        each(this.weekTaskData, (task) => {
            if (task.type === type) {
                task.cur += value;
                if (task.cur >= task.max && task.status === TASK_STATUS.Job) {
                    task.status = TASK_STATUS.Complete;
                    hasComplete = true;
                }
            }
        });
        if (hasComplete) {
            director.emit(GlobalEvent.TaskComplete);
        }
        this.taskData[type] = (this.taskData[type] || 0) + value;
        this.freshYearTask();
        this.doDrity();
    }

    setTaskData(type: string, value: number): void {
        let hasComplete = false;
        const diff = value - (this.taskData[type] || 0);
        each(this.weekTaskData, (task) => {
            if (task.type === type) {
                task.cur = diff;
                if (task.cur >= task.max && task.status === TASK_STATUS.Job) {
                    task.status = TASK_STATUS.Complete;
                    hasComplete = true;
                }
            }
        });
        if (hasComplete) {
            director.emit(GlobalEvent.TaskComplete);
        }
        this.taskData[type] = value;
        this.freshYearTask();
        this.doDrity();
    }

    earnTask(id: number): void {
        const config = TaskCfg.Instance.get(id);
        if (config.time === 0) {
            const task = this.getYearTaskById(id);
            task.status = TASK_STATUS.Finish;
            set(this.yearTaskData, id, task);
        } else if (config.time === 1) {
            const task = this.getWeekTaskById(id);
            task.status = TASK_STATUS.Finish;
            set(this.weekTaskData, id, task);
        }
        this.doDrity();
    }

    getNextWeekDate(): number | null {
        return this.nextWeekDate;
    }

    checkResetWeek(): boolean {
        const nextWeekMoment = moment(this.nextWeekDate);
        if (Tools.GetNowMoment().isAfter(nextWeekMoment, 'millisecond')) {
            each(this.weekTaskData, (task) => {
                task.cur = 0;
                task.status = TASK_STATUS.Job;
            });
            this.nextWeekDate = Utils.getNextMondayTimeStamp(Tools.GetNowMoment().valueOf());
            this.doDrity();
            return true;
        }
        return false;
    }

    createWeekData(config: any): void {
        const taskData = {
            id: config.id,
            type: config.taskType,
            cur: 0,
            max: config.proress,
            status: TASK_STATUS.Job
        };
        set(this.weekTaskData, config.id, taskData);
    }

    createYearData(config: any): void {
        const taskData = {
            id: config.id,
            type: config.taskType,
            cur: 0,
            max: config.proress,
            status: TASK_STATUS.Job
        };
        set(this.yearTaskData, config.id, taskData);
    }

    deserialized(data: any): void {
        this.nextWeekDate = get(data, 'weekDate') || Utils.getNextMondayTimeStamp(Tools.GetNowMoment().valueOf());
        this._goldTourIdx = get(data, 'goldTourIdx', 0);
        this._passTime = get(data, 'passTime', 0);
        this._winStreakTime = get(data, 'winStreakTime', 0);
        this._raceInPeriod = get(data, 'raceInPeriod', 0);
        
        this.yearTaskData = {};
        const yearTasks = get(data, 'yearTask') || [];
        if (yearTasks.length === 0) {
            const yearConfigs = TaskCfg.Instance.getYearTaskData();
            each(yearConfigs, (config) => {
                if (config.time === 0) {
                    this.createYearData(config);
                }
            });
        } else {
            each(yearTasks, (task) => {
                if (task.findIndex) {
                    set(this.yearTaskData, task[0], {
                        id: task[0],
                        type: task[1],
                        cur: task[2],
                        max: task[3],
                        status: task[4],
                        ad: task[5]
                    });
                } else {
                    set(this.yearTaskData, task.id, task);
                }
            });
        }
        
        this.weekTaskData = {};
        const weekTasks = get(data, 'weekTask') || [];
        if (weekTasks.length === 0) {
            const weekConfigs = TaskCfg.Instance.getWeekTaskData();
            each(weekConfigs, (config) => {
                if (config.time === 1) {
                    this.createWeekData(config);
                }
            });
        } else {
            each(weekTasks, (task) => {
                if (task.findIndex) {
                    set(this.weekTaskData, task[0], {
                        id: task[0],
                        type: task[1],
                        cur: task[2],
                        max: task[3],
                        status: task[4],
                        ad: task[5]
                    });
                } else {
                    set(this.weekTaskData, task.id, task);
                }
            });
        }
        
        this.taskData = get(data, 'taskData') || {};
        this.checkResetWeek();
        
        const weekConfigs = TaskCfg.Instance.getWeekTaskData();
        each(weekConfigs, (config) => {
            const task = this.weekTaskData[config.id];
            if (isNil(task) && config.time === 1) {
                this.createWeekData(config);
            }
        });
        
        const yearConfigs = TaskCfg.Instance.getYearTaskData();
        each(yearConfigs, (config) => {
            const task = this.yearTaskData[config.id];
            if (isNil(task) && config.time === 0) {
                this.createYearData(config);
            }
        });
        
        this.doDrity();
    }

    serializeInfo(): any {
        const result: any = {};
        const yearTasks: any[] = [];
        
        Object.keys(this.yearTaskData).forEach((key) => {
            const task = this.yearTaskData[Number(key)];
            yearTasks.push(task.ad ? 
                [task.id, task.type, task.cur, task.max, task.status, task.ad] : 
                [task.id, task.type, task.cur, task.max, task.status]
            );
        });
        set(result, 'yearTask', yearTasks);
        
        const weekTasks: any[] = [];
        Object.keys(this.weekTaskData).forEach((key) => {
            const task = this.weekTaskData[Number(key)];
            weekTasks.push(task.ad ? 
                [task.id, task.type, task.cur, task.max, task.status, task.ad] : 
                [task.id, task.type, task.cur, task.max, task.status]
            );
        });
        set(result, 'weekTask', weekTasks);
        
        set(result, 'weekDate', this.nextWeekDate);
        set(result, 'taskData', this.taskData);
        set(result, 'goldTourIdx', this._goldTourIdx);
        set(result, 'passTime', this._passTime);
        set(result, 'winStreakTime', this._winStreakTime);
        set(result, 'raceInPeriod', this._raceInPeriod);
        
        return result;
    }
}