import { _decorator, error, cclegacy } from 'cc';
import {ICfgParse} from './ICfgParse';
import lodash from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('TaskCfg')
export class TaskCfg extends ICfgParse {
    private static _instance: TaskCfg = null;
    public jsonFileName: string = 'task';
    public yearTaskCfgs: any[] = [];
    public weekTaskCfgs: any[] = [];
    public yearTaskTypeLists: { [key: string]: any[] } = {};

    constructor(...args: any[]) {
        super(...args);
    }

    public loaded(): void {
        this.yearTaskCfgs = [];
        this.weekTaskCfgs = [];
        
        const allCfgs = this.getAll();
        
        lodash.each(allCfgs, (cfg: any) => {
            if (cfg.time === 0) {
                this.yearTaskCfgs.push(cfg);
            } else if (cfg.time === 1) {
                this.weekTaskCfgs.push(cfg);
            } else {
                error('任务列表类型异常: ', cfg);
            }
        });

        lodash.each(this.yearTaskCfgs, (cfg: any) => {
            const taskType = cfg.taskType;
            if (lodash.isNil(this.yearTaskTypeLists[taskType])) {
                lodash.set(this.yearTaskTypeLists, taskType, [cfg.id]);
            } else {
                const typeList = lodash.get(this.yearTaskTypeLists, taskType);
                typeList.push(cfg.id);
                lodash.set(this.yearTaskTypeLists, taskType, typeList);
            }
        });
    }

    public get(id: any): any {
        return this.cfg[id];
    }

    public getYearTaskData(): any[] {
        return this.yearTaskCfgs;
    }

    public getWeekTaskData(): any[] {
        return this.weekTaskCfgs;
    }

    public getYearTypeLists(): { [key: string]: any[] } {
        return this.yearTaskTypeLists;
    }

    public static get Instance(): TaskCfg {
        if (!TaskCfg._instance) {
            TaskCfg._instance = new TaskCfg().load();
        }
        return TaskCfg._instance;
    }
}