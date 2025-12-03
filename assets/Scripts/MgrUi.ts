import { _decorator, Component, director, error, find, cclegacy } from 'cc';
import { GlobalEvent } from './Events';
import { AssetPool } from './AssetPool';
import { BUNDLE_NAMES } from './AssetRes';
import {MgrBase} from './MgrBase';
import { VIEW_ANIM_EVENT } from './ViewAnimCtrl';
import {each, findIndex, pullAt, find as ldFind, isNil} from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('MgrUi')
export class MgrUi extends MgrBase {
    private viewQueus: any[] = [];
    private queueComplete: (() => void) | null = null;
    private viewList: any[] = [];
    private _loadViewUrl: string | null = null;
    private beChangeQueue: boolean = false;
    private hasQueueView: boolean = false;

    private static _instance: MgrUi;
    public static get Instance(): MgrUi {
        return MgrUi._instance;
    }

    public load(): void {}

    public initLoadData(): void {}

    public onDestroy(): void {
        director.targetOff(this);
    }

    public closeAll(): void {
        each(this.viewList, (view: any) => {
            this._removeView(view);
        });
        this.viewList.length = 0;
        director.emit(GlobalEvent.CloseAllView);
    }

    private _removeView(view: any): void {
        view.emit(VIEW_ANIM_EVENT.Removed, view);
        view.targetOff(this);
        AssetPool.Instance.put(view);
    }

    private _addView(url: string, view: any, parent?: any, priority?: number): any {
        view.parent = parent || MgrUi.root(priority);
        view.active = true;
        view.__url__ = url;
        this.viewList.push(view);

        view.once(VIEW_ANIM_EVENT.Remove, (target: any) => {
            if (target) {
                if (target instanceof Component) {
                    target = target.node;
                }
                const index = findIndex(this.viewList, target);
                if (index >= 0) {
                    pullAt(this.viewList, [index]);
                }
                this._removeView(target);
            } else {
                error('remove target is null');
            }
        });
        console.log(view);
        return view;
    }

    public getView(url: string): any {
        return ldFind(this.viewList, (view: any) => view.__url__ === url);
    }

    public getViewList(): any[] {
        return this.viewList;
    }

    public hasView(url: string): boolean {
        return !!this.getView(url) || this._loadViewUrl === url || 
               !!ldFind(this.viewQueus, (queue: any) => queue.resInfo.url === url);
    }

    public hasViewQueus(url: string): boolean {
        return !!ldFind(this.viewQueus, (queue: any) => queue.resInfo.url === url);
    }

    public static root(priority: number = 2): any {
        let node = find(`Canvas/priority${priority}`);
        if (isNil(node)) {
            node = find('Canvas');
        }
        return node;
    }

    public addViewAsyncQueue(resInfo: any, options?: any): void {
        this.viewQueus.push({
            resInfo: resInfo,
            options: options
        });
        this.beChangeQueue = true;
    }

    public addViewAsyncQueueCallback(resInfo: any, callback: any): boolean {
        const queue = ldFind(this.viewQueus, (q: any) => q.resInfo.url === resInfo.url);
        if (!queue) return false;

        if (!queue.options) {
            queue.options = { callback: callback };
            return true;
        }

        if (!queue.options.callback) {
            queue.options.callback = callback;
            return true;
        }

        let callbacks = queue.options.callback;
        if (!Array.isArray(callbacks)) {
            callbacks = queue.options.callback = [callbacks];
        }
        callbacks.push(callback);
        return true;
    }

    private async startQueus(): Promise<void> {
        this.beChangeQueue = false;
        const queue = this.viewQueus.shift();
        const resInfo = queue.resInfo;
        const options = queue.options;

        this.hasQueueView = true;
        const view = resInfo.lazy ? await this.openViewAsync(resInfo, options) : this.openView(resInfo, options);
        
        view.once(VIEW_ANIM_EVENT.Removed, () => {
            this.beChangeQueue = true;
            this.hasQueueView = false;
            if (this.viewQueus.length === 0 && this.queueComplete) {
                this.queueComplete();
                this.queueComplete = null;
            }
        });
    }

    protected lateUpdate(dt: number): void {
        if (this.beChangeQueue && !this.hasQueueView && this.viewQueus.length > 0) {
            this.startQueus();
        }
    }

    public setViewAsyncComplete(callback: () => void): void {
        if (this.viewQueus.length > 0) {
            this.queueComplete = callback;
        } else {
            callback && callback();
        }
    }

    public openView(resInfo: any, options?: any): any {
        const url = resInfo.url;
        const viewComp = resInfo.viewComp || options?.viewComp;
        const data = options?.data;
        const root = options?.root;
        const priority = options?.priority;
        const callback = options?.callback;

        let pool = AssetPool.Instance.getPool(url);
        if (!pool) {
            AssetPool.Instance.createPool(url, viewComp);
        }

        let view = AssetPool.Instance.get(url, data);
        if (!view) {
            view = AssetPool.Instance.createObject(url);
            if (!view) {
                error(`无法创建资源。资源未提前加载：${url}`);
                return;
            }

            const handlerComp = pool?.poolHandlerComp;
            if (handlerComp) {
                const handler = view.getComponent(handlerComp);
                if (handler && handler.reuse) {
                    handler.reuse(data);
                }
            }
        }

        this._addView(url, view, root, priority);
        
        if (callback) {
            if (Array.isArray(callback)) {
                callback.forEach((cb: any) => cb(view));
            } else {
                callback(view);
            }
        }

        return view;
    }

    public closeView(view: any): void {
        if (typeof view === 'string') {
            const indices: number[] = [];
            each(this.viewList, (v: any, index: number) => {
                if (v.__url__ === view) {
                    this._removeView(v);
                    indices.push(index);
                }
            });
            pullAt(this.viewList, indices);
        } else {
            let target = view;
            if (target instanceof Component) {
                target = target.node;
            }
            target.emit(VIEW_ANIM_EVENT.Remove, target);
            
            const index = findIndex(this.viewList, target);
            if (index >= 0) {
                pullAt(this.viewList, [index]);
            }
        }
    }

    public async openViewAsync(resInfo: any, options?: any): Promise<any> {
        const url = resInfo.url;
        const viewComp = resInfo.viewComp || options?.viewComp;
        const data = options?.data;
        const root = options?.root;
        const priority = options?.priority;
        const callback = options?.callback;
        const bundle = options?.bundle || BUNDLE_NAMES.Game;

        this._loadViewUrl = resInfo.url;

        return new Promise(async (resolve, reject) => {
            try {
                let view = AssetPool.Instance.get(url, data, viewComp);
                if (!view) {
                    view = await AssetPool.Instance.createObjAsync(bundle, url, viewComp);
                    if (viewComp) {
                        const comp = view.getComponent(viewComp);
                        if (comp && comp.reuse) {
                            comp.reuse(data);
                        }
                    }
                }

                this._addView(url, view, root, priority);
                this._loadViewUrl = null;
                if (callback) {
                    if (Array.isArray(callback)) {
                        callback.forEach((cb: any) => cb(view));
                    } else {
                        callback(view);
                    }
                }

                resolve(view);
            } catch (error) {
                reject(error);
            }
        });
    }
}