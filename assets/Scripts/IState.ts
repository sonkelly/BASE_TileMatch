import { _decorator, Component } from 'cc';
import { findIndex, each, pullAt } from 'lodash-es';

export default class IState {
    public id: string | null = null;
    private __interval_callbacks: Array<{
        id: number;
        callback: Function;
        target: any;
        interval?: number;
        delay?: number;
        duration: number;
    }> = [];
    private interval_id: number = 0;

    constructor(id: string) {
        this.id = id;
    }

    public clearIntervals(): void {
        this.__interval_callbacks.length = 0;
    }

    public setInterval(interval: number, callback: Function, target: any): number {
        const id = ++this.interval_id;
        this.__interval_callbacks.push({
            id,
            callback,
            target,
            interval,
            duration: 0
        });
        return id;
    }

    public clearInterval(id: number): void {
        const index = findIndex(this.__interval_callbacks, (item) => item.id === id);
        if (index >= 0) {
            this.__interval_callbacks.splice(index, 1);
        }
    }

    public setTimeout(delay: number, callback: Function, target: any): number {
        const id = ++this.interval_id;
        this.__interval_callbacks.push({
            id,
            callback,
            target,
            delay,
            duration: 0
        });
        return id;
    }

    public clearTimeout(id: number): void {
        this.clearInterval(id);
    }

    public invokeIntervals(deltaTime: number): void {
        const toRemove: number[] = [];
        
        each(this.__interval_callbacks, (item, index) => {
            item.duration += deltaTime;
            
            if (item.interval) {
                if (item.duration >= item.interval) {
                    item.duration = 0;
                    item.callback.call(item.target);
                }
            } else if (item.delay) {
                if (item.duration >= item.delay) {
                    item.callback.call(item.target);
                    toRemove.push(index);
                }
            }
        });

        if (toRemove.length > 0) {
            pullAt(this.__interval_callbacks, toRemove);
        }
    }
}