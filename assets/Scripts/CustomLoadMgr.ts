import { _decorator, director } from 'cc';
import { BundleMgr } from './BundleMgr';
import { BUNDLE_NAMES } from './AssetRes';

const { ccclass } = _decorator;

@ccclass('CustomLoadMgr')
export class CustomLoadMgr {
    private static _instance: CustomLoadMgr | null = null;
    private _customLoadTask: (() => Promise<void>)[] | undefined;
    private _finishCall: ((success: boolean) => void) | undefined;

    private constructor() {
        this._customLoadTask = undefined;
        this._finishCall = undefined;
    }

    private _loadCustomTask(progressCallback: (current: number, total: number) => void, finishCallback: () => void) {
        const tasks = this._customLoadTask;
        if (tasks && tasks.length > 0) {
            const totalTasks = tasks.length;
            let completedTasks = 0;
            let currentTaskIndex = 0;

            const executeTasks = () => {
                while (currentTaskIndex < tasks.length) {
                    executeTask();
                    currentTaskIndex++;
                }
            };

            const executeTask = async () => {
                const task = tasks[currentTaskIndex];
                if (task) {
                    await task();
                    completedTasks++;
                    progressCallback(completedTasks, totalTasks);
                    if (completedTasks === totalTasks) {
                        finishCallback();
                    } else {
                        executeTasks();
                    }
                }
            };

            executeTasks();
        } else {
            finishCallback();
        }
    }

    private _onBundleLoaded() {
        this._loadCustomTask(
            (current, total) => {
                director.emit('transition-progress', current, total + 1);
            },
            () => {
                if (this._finishCall) {
                    this._finishCall(true);
                }
            }
        );
    }

    private _load(tasks: (() => Promise<void>)[], finishCallback: (success: boolean) => void) {
        this._customLoadTask = tasks;
        this._finishCall = finishCallback;
        BundleMgr.Instance.loadBundle(BUNDLE_NAMES.Game, (success) => {
            if (success) {
                this._onBundleLoaded();
            }
        });
    }

    public static LoadCustomRes(tasks: (() => Promise<void>)[], finishCallback: (success: boolean) => void) {
        CustomLoadMgr.Instance._load(tasks, finishCallback);
    }

    public static get Instance(): CustomLoadMgr {
        if (!CustomLoadMgr._instance) {
            CustomLoadMgr._instance = new CustomLoadMgr();
        }
        return CustomLoadMgr._instance;
    }
}