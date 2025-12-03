import { _decorator, Component } from 'cc';
import { config } from './Config';
import { CloudStorage } from './CloudStorage';
import { LocalStorage } from './LocalStorage';

const { ccclass } = _decorator;

@ccclass('StorageProxy')
export class StorageProxy {
    private static storage: Component | null = null;

    public static initialize(node: any): void {
        if (config.useServerData) {
            StorageProxy.storage = node.addComponent(CloudStorage);
        } else {
            StorageProxy.storage = node.addComponent(LocalStorage);
        }
    }

    public static async parseData(data: any): Promise<any> {
        return StorageProxy.storage?.['parseData']?.(data);
    }

    public static loadData(data: any): void {
        StorageProxy.storage?.['loadStorage']?.(data);
    }

    public static startRunning(): void {
        StorageProxy.storage?.['startRunning']?.();
    }

    public static stopRuning(): void {
        StorageProxy.storage?.['stopRuning']?.();
    }

    public static async clearStorage(): Promise<void> {
        this.stopRuning();
        await StorageProxy.storage?.['clearStorage']?.();
    }

    public static getItem(key: string, defaultValue?: any): any {
        return StorageProxy.storage?.['get']?.(key, defaultValue);
    }

    public static setItem(key: string, value: any): void {
        StorageProxy.storage?.['set']?.(key, value);
    }

    public static removeItem(key: string): void {
        StorageProxy.storage?.['remove']?.(key);
    }

    public static flush(data: any): void {
        StorageProxy.storage?.['flush']?.(data);
    }
}