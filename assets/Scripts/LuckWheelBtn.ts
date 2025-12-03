import { _decorator, Component, Node, Vec3, director } from 'cc';
import { Utils } from './Utils';
import { MgrLuckWheel } from './MgrLuckWheel';
import { MgrUi } from './MgrUi';
import { UIPrefabs } from './Prefabs';
import { GlobalEvent } from './Events';

const { ccclass, property } = _decorator;

@ccclass('LuckWheelBtn')
export class LuckWheelBtn extends Component {
    @property(Node)
    circleNode: Node = null!;

    @property(Node)
    pointNode: Node = null!;

    @property(Node)
    isNew: Node = null!;

    @property(Node)
    hasFree: Node = null!;

    private _intervalTime: number = 0;
    private _execTime: number = 0;
    private _isRuning: boolean = false;
    private _angle: number = 0;
    private static tempVec1: Vec3 = new Vec3();
    private static tempVec2: Vec3 = new Vec3();
    private static tempAngle: number = 0;

    onLoad() {
        this.node.on('click', this._onClickBtn, this);
    }

    onEnable() {
        director.on(GlobalEvent.luckWheelGetReward, this._refreshHasFree, this);
        this._refreshIsNew();
        this._refreshHasFree();
    }

    onDisable() {
        director.targetOff(this);
        this._isRuning = false;
        this._resetAction();
    }

    update(dt: number) {
        if (this._isRuning) {
            this._runActiton(dt);
        } else {
            this._intervalTime += dt;
            if (this._intervalTime >= 5) {
                this._intervalTime = 0;
                this._isRuning = true;
                this._resetAction();
            }
        }
    }

    private _resetAction() {
        LuckWheelBtn.tempVec1.set(0, 0, this.circleNode.eulerAngles.z % 360);
        this.circleNode.eulerAngles = LuckWheelBtn.tempVec1;
        this._execTime = 0;
        this._angle = 0;
        LuckWheelBtn.tempVec2.set(0, 0, 0);
        this.pointNode.eulerAngles = LuckWheelBtn.tempVec2;
    }

    private _runActiton(dt: number) {
        this._execTime += dt;
        
        if (this._execTime <= 0.25) {
            this._angle += 1.5;
            LuckWheelBtn.tempVec1.set(0, 0, LuckWheelBtn.tempVec1.z + this._angle);
            this.circleNode.eulerAngles = LuckWheelBtn.tempVec1;
            
            if (Math.abs(LuckWheelBtn.tempVec2.z) < 30) {
                LuckWheelBtn.tempAngle = Math.abs(LuckWheelBtn.tempVec2.z);
                LuckWheelBtn.tempAngle = Math.min(LuckWheelBtn.tempAngle + 2, 30);
                LuckWheelBtn.tempVec2.set(0, 0, -LuckWheelBtn.tempAngle);
                this.pointNode.eulerAngles = LuckWheelBtn.tempVec2;
            }
            return;
        }

        if (this._execTime <= 1.25) {
            LuckWheelBtn.tempVec1.set(0, 0, LuckWheelBtn.tempVec1.z + this._angle);
            this.circleNode.eulerAngles = LuckWheelBtn.tempVec1;
            
            const randomAngle = Utils.randomRange(-4, 4);
            LuckWheelBtn.tempVec2.set(0, 0, -LuckWheelBtn.tempAngle + randomAngle);
            this.pointNode.eulerAngles = LuckWheelBtn.tempVec2;
            return;
        }

        this._angle -= 1.5;
        this._angle = Math.max(this._angle, 0);
        LuckWheelBtn.tempVec1.set(0, 0, LuckWheelBtn.tempVec1.z + this._angle);
        this.circleNode.eulerAngles = LuckWheelBtn.tempVec1;

        if (Math.abs(LuckWheelBtn.tempVec2.z) > 0) {
            LuckWheelBtn.tempAngle = Math.abs(LuckWheelBtn.tempVec2.z);
            LuckWheelBtn.tempAngle = Math.max(LuckWheelBtn.tempAngle - 2, 0);
            LuckWheelBtn.tempVec2.set(0, 0, -LuckWheelBtn.tempAngle);
            this.pointNode.eulerAngles = LuckWheelBtn.tempVec2;
        }

        if (this._angle <= 0) {
            LuckWheelBtn.tempVec2.set(0, 0, 0);
            this.pointNode.eulerAngles = LuckWheelBtn.tempVec2;
            this._isRuning = false;
        }
    }

    private _refreshIsNew() {
        this.isNew.active = MgrLuckWheel.Instance.data.isNew;
    }

    private _refreshHasFree() {
        this.hasFree.active = MgrLuckWheel.Instance.getGroupUseTime() <= 0;
    }

    private async _onClickBtn() {
        await MgrUi.Instance.openViewAsync(UIPrefabs.LuckWheelView, {
            root: MgrUi.root(1)
        });
    }
}