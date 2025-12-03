import { _decorator, Component, error, sys } from 'cc';
import { IStorage } from './IStorage';
import {isEmpty} from 'lodash-es';
import { Tools } from './Tools';
import { config } from './Config';
import { MgrService } from './MgrService';

const { ccclass, property } = _decorator;

@ccclass('CloudStorage')
export class CloudStorage extends IStorage {
    private _localStorageKey: string = config.gameName + '_cloudStorage_';
    private storageTable: any = {};
    private beFlush: boolean = false;
    private lastSaveTime: number = 0;
    private beCloudFlush: boolean = false;
    private lastCloudSaveTime: number = 0;

    constructor() {
        super();
    }

    private async parseData(data: string): Promise<any> {
        let cloudData: any = {};
        let localData: any = {};
        const uid = MgrService.Instance.uid;

        try {
            cloudData = isEmpty(data) ? {} : JSON.parse(data);
        } catch (err) {
            error('parseCloudStorage err! ', err);
            cloudData = null;
        }

        try {
            const localStorageKey = this._localStorageKey + uid;
            const localDataStr = sys.localStorage.getItem(localStorageKey);
            localData = isEmpty(localDataStr) ? {} : JSON.parse(localDataStr);
        } catch (err) {
            error('parseLocalStorage err!', err);
            localData = null;
        }

        return cloudData || localData ? 
            ((cloudData?.saveTimeStamp || 0) > (localData?.saveTimeStamp || 0) ? cloudData : localData) : 
            null;
    }

    private async saveStorage(): Promise<void> {
        this.storageTable.saveTimeStamp = Tools.GetNowTime();
        const uid = MgrService.Instance.uid;
        const localStorageKey = this._localStorageKey + uid;

        try {
            const dataStr = JSON.stringify(this.storageTable);
            sys.localStorage.setItem(localStorageKey, dataStr);
        } catch (err) {
            error('saveCloudLocalStorage failed! ', err);
        }
    }

    private async saveCloudStorage(): Promise<void> {
        const self = this;
        let retryCount = 1;
        let delay = 0.1;

        const tryUpload = async (): Promise<void> => {
            self.storageTable.saveTimeStamp = Tools.GetNowTime();
            const dataStr = JSON.stringify(self.storageTable);
            
            const success = await MgrService.Instance.uploadRecord(dataStr);
            if (!success) {
                if (retryCount <= 3) {
                    retryCount++;
                    delay *= 2;
                    this.scheduleOnce(tryUpload, delay);
                } else {
                    error('saveCloudStorage failed ' + retryCount + ' times!');
                }
            }
        };

        tryUpload();
    }

    private async clearStorage(): Promise<void> {
        this.storageTable = {};
        this.storageTable.saveTimeStamp = Tools.GetNowTime();
        
        const uid = MgrService.Instance.uid;
        const localStorageKey = this._localStorageKey + uid;
        const dataStr = JSON.stringify(this.storageTable);
        
        sys.localStorage.setItem(localStorageKey, dataStr);
        await MgrService.Instance.uploadRecord(dataStr);
    }

    public flush(immediate: boolean): void {
        if (immediate) {
            this.beFlush = false;
            this.lastSaveTime = Tools.GetNowTime();
            this.saveStorage();
            
            this.beCloudFlush = false;
            this.lastCloudSaveTime = Tools.GetNowTime();
            this.saveCloudStorage();
            return;
        }

        if (this.beFlush) {
            const currentTime = Tools.GetNowTime();
            if (Math.abs(currentTime - this.lastSaveTime) > 500) {
                this.beFlush = false;
                this.lastSaveTime = Tools.GetNowTime();
                this.saveStorage();
            }
        }

        if (this.beCloudFlush) {
            const currentTime = Tools.GetNowTime();
            if (Math.abs(currentTime - this.lastCloudSaveTime) > 10000) {
                this.beCloudFlush = false;
                this.lastCloudSaveTime = Tools.GetNowTime();
                this.saveCloudStorage();
            }
        }
    }
}