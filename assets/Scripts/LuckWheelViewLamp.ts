import { _decorator, Component, UIOpacity, Tween, tween } from 'cc';
const { ccclass, property } = _decorator;

enum LampStatus {
    Wait = 0,
    Spin = 1,
    Win = 2
}

@ccclass('LuckWheelViewLamp')
export class LuckWheelViewLamp extends Component {
    @property([UIOpacity])
    lightItems: UIOpacity[] = [];

    private _lampStatus: LampStatus = LampStatus.Wait;
    private _runTime: number = 0;
    private _switchIdx: number = 0;
    private _spinLampIdx: number = 0;

    onDisable() {
        this.lightItems.forEach((item) => {
            Tween.stopAllByTarget(item);
        });
    }

    onEnable() {
        this.showWait();
    }

    update(dt: number) {
        if (this._lampStatus === LampStatus.Wait) {
            this._runTime += dt;
            if (this._runTime >= 0.4) {
                this._runTime = 0;
                this._switchIdx = this._switchIdx === 0 ? 1 : 0;
                this.lightItems.forEach((item, index) => {
                    const shouldShow = index % 2 === this._switchIdx;
                    item.node.active = shouldShow;
                });
            }
            return;
        }

        if (this._lampStatus === LampStatus.Spin) {
            this._runTime += dt;
            if (this._runTime >= 0.03) {
                this._runTime = 0;
                const currentItem = this.lightItems[this._spinLampIdx];
                Tween.stopAllByTarget(currentItem);
                tween(currentItem)
                    .set({ opacity: 255 })
                    .to(0.48, { opacity: 0 })
                    .start();
                this._spinLampIdx++;
                this._spinLampIdx = this._spinLampIdx % this.lightItems.length;
            }
            return;
        }

        if (this._lampStatus === LampStatus.Win) {
            this._runTime += dt;
            if (this._runTime >= 0.15) {
                this._runTime = 0;
                this._switchIdx = this._switchIdx === 0 ? 1 : 0;
                this.lightItems.forEach((item) => {
                    const shouldShow = this._switchIdx === 1;
                    item.node.active = shouldShow;
                });
            }
        }
    }

    showWait() {
        this._lampStatus = LampStatus.Wait;
        this._runTime = 0;
        this.lightItems.forEach((item) => {
            Tween.stopAllByTarget(item);
            item.opacity = 255;
        });
    }

    showSpin() {
        this._lampStatus = LampStatus.Spin;
        this._runTime = 0;
        this._spinLampIdx = 0;
        this.lightItems.forEach((item) => {
            item.opacity = 0;
            item.node.active = true;
        });
    }

    showWin() {
        this._lampStatus = LampStatus.Win;
        this._runTime = 0;
        this.lightItems.forEach((item) => {
            Tween.stopAllByTarget(item);
            item.opacity = 255;
        });
    }
}