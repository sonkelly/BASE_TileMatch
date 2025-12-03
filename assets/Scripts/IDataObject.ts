import { _decorator, Component, director, Director } from 'cc';
import {StorageProxy} from './StorageProxy';

const { ccclass, property } = _decorator;

@ccclass('IDataObject')
export class IDataObject extends Component {
    private _drity: boolean = false;
    public serializeKey: string = '';

    constructor(serializeKey: string) {
        super();
        this.serializeKey = serializeKey;
    }

    protected onLoad(): void {
        this._addEventListeners();
    }

    protected onDestroy(): void {
        this._removeEventListeners();
    }

    private _addEventListeners(): void {
        director.on(Director.EVENT_AFTER_UPDATE, this.lateUpdate, this);
    }

    private _removeEventListeners(): void {
        director.off(Director.EVENT_AFTER_UPDATE, this.lateUpdate, this);
    }

    protected lateUpdate(): void {
        if (this._drity) {
            this.save();
            this._drity = false;
        }
    }

    public async load(): Promise<void> {
        const item = this._getItem();
        this.deserialized(item);
        this._addEventListeners();
    }

    //@todo check
    /*public destroy(): boolean {
        super.destroy();
        this._drity = true;
        this._removeEventListeners();
        return true
    }*/

    public doDrity(): void {
        this._drity = true;
    }

    public save(): void {
        const info = this.serializeInfo();
        this._setItem(info);
    }

    private _getItem(): any {
        return StorageProxy.getItem(this.serializeKey);
    }

    private _setItem(data: any): void {
        StorageProxy.setItem(this.serializeKey, data);
    }

    protected deserialized(data: any): void {
        // To be implemented by subclass
    }

    protected serializeInfo(): any {
        // To be implemented by subclass
        return {};
    }
}