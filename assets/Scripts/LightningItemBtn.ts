import { _decorator, Component, Label, CCInteger } from 'cc';
import { TopUIItem } from './TopUIItem';

const { ccclass, property } = _decorator;

@ccclass('LightningItemBtn')
export class LightningItemBtn extends TopUIItem {
    @property(Label)
    lightningCount: Label | null = null;

    public showLightningItem(count: number, callback?: Function): void {
        this.setLightningCount(count);
        this.show(0.4, callback);
    }

    public setLightningCount(count: number): void {
        if (this.lightningCount) {
            this.lightningCount.string = count.toString();
        }
    }
}