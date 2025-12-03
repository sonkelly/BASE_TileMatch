import { _decorator, sys, error, cclegacy } from 'cc';
import { config } from './Config';
import { Tools } from './Tools';
import { channelManager, ChannelType } from './ChannelManager';
import { SdkBridge } from './SdkBridge';
import { IStorage } from './IStorage';
import { isEmpty } from 'lodash-es';

const { ccclass } = _decorator;

@ccclass('LocalStorage')
export class LocalStorage extends IStorage {
    private _storageKey: string = config.gameName + '_storage';
    private lastSaveTime: number = 0;
    private beFlush: boolean = false;
    public storageTable: any = {};

    constructor() {
        super();
    }

    async parseData(): Promise<any> {
        const result = {};
        const localData = this._loadFromLocalStorage();
        
        try {
            const cloudData = await SdkBridge.getDataAsync([this._storageKey]);
            
            if (channelManager.getChannelType() === ChannelType.FaceBook) {
                if (isEmpty(cloudData)) {
                    this.storageTable = {};
                    this._clearLocalStorage();
                    return {};
                }
                
                const facebookData = cloudData[this._storageKey];
                return facebookData && Object.keys(facebookData).length > 0 
                    ? { ...result, ...localData, ...facebookData } 
                    : (this.storageTable = {}, this._clearLocalStorage(), {});
            }
            
            return { ...result, ...localData };
        } catch (error) {
            return null;
        }
    }

    private _loadFromLocalStorage(): any {
        try {
            const data = sys.localStorage.getItem(this._storageKey);
            return isEmpty(data) ? {} : JSON.parse(data);
        } catch (err) {
            error('LocalStorage parse err:', err);
            return null;
        }
    }

    saveStorage(): void {
        this._saveLocalStorage();
        this._saveCloudStorage();
    }

    private _saveLocalStorage(): void {
        try {
            const data = JSON.stringify(this.storageTable);
            sys.localStorage.setItem(this._storageKey, data);
        } catch (err) {
            error('saveLocalStorage failed! ', err);
        }
    }

    private _saveCloudStorage(): void {
        try {
            const data = { [this._storageKey]: this.storageTable };
            SdkBridge.setDataAsync(data);
        } catch (err) {
            const errorMsg = err.name + ':' + err.message;
            error('存档异常:', errorMsg);
        }
    }

    async clearStorage(): Promise<void> {
        Object.keys(this.storageTable).forEach(key => {
            SdkBridge.clearDataAsync({}[key]);
        });
        
        this.storageTable = {};
        const data = { [this._storageKey]: this.storageTable };
        
        await SdkBridge.clearDataAsync(data);
        this._clearLocalStorage();
    }

    private _clearLocalStorage(): void {
        sys.localStorage.clear();
    }

    flush(immediate: boolean): void {
        if (immediate) {
            this.lastSaveTime = Tools.GetNowTime();
            this.saveStorage();
            return;
        }
        
        if (this.beFlush) {
            const currentTime = Tools.GetNowTime();
            if (Math.abs(currentTime - this.lastSaveTime) > 500) {
                this.beFlush = true;
                this.lastSaveTime = Tools.GetNowTime();
                this.beFlush = true;
                this.saveStorage();
            }
        }
    }
}