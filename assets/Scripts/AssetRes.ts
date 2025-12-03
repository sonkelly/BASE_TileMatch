import { _decorator, Component, Node, isValid, cclegacy } from 'cc';
const { ccclass, property } = _decorator;

export enum ResourceType {
    Local = 0,
    Remote = 1
}

export const BUNDLE_NAMES = {
    Main: 'Main',
    Game: 'Game',
    GameLevels: 'GameLevels'
};

export enum CacheStatus {
    NONE = 0,
    Loading = 1,
    Loaded = 2,
    WAITTING_FOR_RELEASE = 3
}

export class ResInfo {
    url: string = '';
    type: string = '';
    bundle: string = '';
    resourceType: ResourceType = ResourceType.Local;
}

@ccclass('CacheInfo')
export class CacheInfo {
    isLoaded: boolean = false;
    resInfo: ResInfo = new ResInfo();
    retain: boolean = true;
    assets: any = null;
    status: CacheStatus = CacheStatus.NONE;
    handlers: Function[] = [];

    setResInfo(url: string, type?: string, bundle?: string): void {
        this.resInfo.url = url;
        if (type) this.resInfo.type = type;
        if (bundle) this.resInfo.bundle = bundle;
    }

    doHanlder(): void {
        for (let i = 0; i < this.handlers.length; i++) {
            const handler = this.handlers[i];
            handler && handler(this);
        }
        this.handlers = [];
    }

    get isInValid(): boolean {
        return this.status === CacheStatus.Loaded && this.assets && !isValid(this.assets);
    }
}