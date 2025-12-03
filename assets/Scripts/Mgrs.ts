import { _decorator, Component, Node, js } from 'cc';
import {keys, each} from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('Mgrs')
export class Mgrs extends Component {
    private _mgrs: Record<string, any> = {};
    private static _instance: Mgrs | null = null;

    constructor() {
        super();
        this._mgrs = {};
    }

    public addMgr(mgrName: string): void {
        const mgr = this.node.addComponent(mgrName);
        mgr.name = mgrName;
        this._mgrs[mgrName] = mgr;

        const mgrClass = js.getClassByName(mgrName);
        Object.defineProperty(mgrClass, '_instance', {
            value: mgr,
            writable: true
        });
    }

    protected onLoad(): void {
        Mgrs._instance = this;
    }

    public loadMgrs(mgrNames: string[]): void {
        for (let i = 0; i < mgrNames.length; i++) {
            this.addMgr(mgrNames[i]);
        }
    }

    public async load(){
        let self = this;
        const _keys = keys(self._mgrs);
        for (let i = 0; i < _keys.length; i++) {
            const mgr = self._mgrs[_keys[i]];
            await mgr.loadData();
        }
    }

    public initialize(): void {
        each(this._mgrs, (mgr: any) => {
            mgr.initLoadData();
        });
    }

    protected onDestroy(): void {
        director.targetOff(this);
        each(this._mgrs, (mgr: any) => {
            mgr.destroy();
        });
        this._mgrs = null;
    }

    public static get Instance(): Mgrs {
        return this._instance!;
    }
}