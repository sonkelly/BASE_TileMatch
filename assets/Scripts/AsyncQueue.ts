import { _decorator, warn, log } from 'cc';
const { ccclass, property } = _decorator;

export class AsyncQueue {
    private _runningAsyncTask: any = null;
    private _queues: any[] = [];
    private _isProcessingTaskUUID: number = 0;
    private _enable: boolean = true;
    public complete: Function | null = null;

    private static _$uuid_count: number = 1;

    public get queues(): any[] {
        return this._queues;
    }

    public get enable(): boolean {
        return this._enable;
    }

    public set enable(value: boolean) {
        if (this._enable !== value) {
            this._enable = value;
            if (value && this.size > 0) {
                this.play();
            }
        }
    }

    public get size(): number {
        return this._queues.length;
    }

    public get isProcessing(): boolean {
        return this._isProcessingTaskUUID > 0;
    }

    public get isStop(): boolean {
        return !(this._queues.length > 0) && !this.isProcessing;
    }

    public get runningParams(): any {
        return this._runningAsyncTask ? this._runningAsyncTask.params : null;
    }

    public push(callback: Function, params: any = null): number {
        const uuid = AsyncQueue._$uuid_count++;
        this._queues.push({
            uuid: uuid,
            callbacks: [callback],
            params: params
        });
        return uuid;
    }

    public pushMulti(params: any, ...callbacks: Function[]): number {
        const uuid = AsyncQueue._$uuid_count++;
        this._queues.push({
            uuid: uuid,
            callbacks: callbacks,
            params: params
        });
        return uuid;
    }

    public remove(uuid: number): void {
        if (this._runningAsyncTask?.uuid !== uuid) {
            for (let i = 0; i < this._queues.length; i++) {
                if (this._queues[i].uuid === uuid) {
                    this._queues.splice(i, 1);
                    break;
                }
            }
        } else {
            warn('正在执行的任务不可以移除');
        }
    }

    public clear(): void {
        this._queues = [];
        this._isProcessingTaskUUID = 0;
        this._runningAsyncTask = null;
        this.complete = null;
    }

    public step(): void {
        if (this.isProcessing) {
            this.next(this._isProcessingTaskUUID);
        }
    }

    public play(context: any = null): void {
        if (!this.isProcessing && this._enable) {
            const task = this._queues.shift();
            if (task) {
                this._runningAsyncTask = task;
                const uuid = task.uuid;
                this._isProcessingTaskUUID = uuid;
                const callbacks = task.callbacks;

                if (callbacks.length === 1) {
                    callbacks[0]((result: any = null) => {
                        this.next(uuid, result);
                    }, task.params, context);
                } else {
                    let length = callbacks.length;
                    const results: any[] = [];
                    const callback = (result: any = null) => {
                        results.push(result || null);
                        if (--length === 0) {
                            this.next(uuid, results);
                        }
                    };

                    for (let i = 0; i < callbacks.length; i++) {
                        callbacks[i](callback, task.params, context);
                    }
                }
            } else {
                this._isProcessingTaskUUID = 0;
                this._runningAsyncTask = null;
                if (this.complete) {
                    this.complete(context);
                }
            }
        }
    }

    public next(uuid: number, result: any = null): void {
        if (this._isProcessingTaskUUID === uuid) {
            this._isProcessingTaskUUID = 0;
            this._runningAsyncTask = null;
            this.play(result);
        } else if (this._runningAsyncTask) {
            log(this._runningAsyncTask);
        }
    }

    public static excuteTimes(count: number, callback: Function | null = null): Function {
        let remaining = count;
        return () => {
            if (--remaining === 0 && callback) {
                callback();
            }
        };
    }
}