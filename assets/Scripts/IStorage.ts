import { _decorator, Component } from 'cc';
const { ccclass } = _decorator;

@ccclass('IStorage')
export class IStorage extends Component {
    private storageTable: any = null;
    private beFlush: boolean = false;
    private beCloudFlush: boolean = false;
    private lastSaveTime: number = 0;
    private lastCloudSaveTime: number = 0;
    private running: boolean = true;

    public startRunning(): void {
        this.running = true;
    }

    public stopRuning(): void {
        this.running = false;
    }

    public loadStorage(storageTable: any): void {
        this.storageTable = storageTable;
    }

    public get(key: string, defaultValue: any): any {
        const value = this.storageTable[key];
        return value !== null && value !== undefined ? value : defaultValue;
    }

    public set(key: string, value: any): void {
        if (this.storageTable[key] !== value) {
            this.storageTable[key] = value;
            this.beFlush = true;
            this.beCloudFlush = true;
        }
    }

    public remove(key: string): void {
        delete this.storageTable[key];
        this.beFlush = true;
        this.beCloudFlush = true;
    }

    protected lateUpdate(): void {
        if (this.running) {
            this.flush();
        }
    }

    private flush(): void {
        // Flush implementation
    }
}