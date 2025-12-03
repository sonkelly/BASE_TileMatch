import { _decorator, Component, Node, Vec3, UITransform, director, tween, Tween, easing, v3, error, warn, find, isValid, cclegacy } from 'cc';
import { ITEM } from './GameConst';
import {AssetsCfg} from './AssetsCfg';
import { AssetMgr } from './AssetMgr';
import { BUNDLE_NAMES } from './AssetRes';
import {UIIcon} from './UIIcon';
import { Utils } from './Utils';
import {FlyItemView} from './Prefabs';
import {MgrUi} from './MgrUi';
import { AssetPool } from './AssetPool';
import { GlobalEvent } from './Events';
import {isNil, toNumber} from 'lodash-es';

const { ccclass, menu } = _decorator;

export enum FlyItem {
    None = 0,
    Game_Coin = 1,
    Game_Star = 2,
    Prop_Back = 10,
    Prop_Hint = 11,
    Prop_Fresh = 12,
    Prop_Light = 20,
    Gold_Cube = 21,
    Coin_Tile = 22,
    Gold_Flower = 97,
    ChallengeStar = 98,
    PickAxe = 101
}

const AssetToFlyItemDefault = {
    [ITEM.Coin]: FlyItem.Game_Coin,
    [ITEM.Star]: FlyItem.Game_Star,
    [ITEM.Back]: FlyItem.Prop_Back,
    [ITEM.Hint]: FlyItem.Prop_Hint,
    [ITEM.Fresh]: FlyItem.Prop_Fresh,
    [ITEM.Light]: FlyItem.Prop_Light,
    [ITEM.GoldenTile]: FlyItem.Gold_Cube,
    [ITEM.TileCoin]: FlyItem.Coin_Tile,
    [ITEM.GoldFlower]: FlyItem.Gold_Flower,
    [ITEM.ChallengeStar]: FlyItem.ChallengeStar,
    [ITEM.PickAxe]: FlyItem.PickAxe
};

const FLY_DURATION = 0.25;
const FLY_INTERVAL = 0.08;
const RANDOM_RANGE = 120;

const tempScale = new Vec3();
const originScale = new Vec3();

class FlyTask {
    flyTask: any = null;
    flyCnt: number = 0;
    _runningTime: number = 0;

    setTask(task: any, cnt: number) {
        this.flyCnt = cnt;
        this.flyTask = task;
        this._runningTime = 0;
    }

    clear() {
        this.flyTask = null;
    }

    lateUpdate(dt: number) {
        this._runningTime += dt;
        if (this._runningTime >= FLY_INTERVAL) {
            this._runningTime -= FLY_INTERVAL;
            this.flyCnt--;
            this.play(this.flyTask);
        }
    }

    complete(): boolean {
        return this.flyCnt <= 0;
    }

    playTouchedIcon(icon: any) {
        if (icon && isValid(icon)) {
            const node = icon.node;
            const scale = node['__originScale__'] || (node['__originScale__'] = v3(node.scale));
            
            originScale.set(scale);
            tempScale.set(scale).multiplyScalar(1.2);
            
            Tween.stopAllByTag(1000, node);
            tween(node)
                .tag(1000)
                .to(0.04, { scale: tempScale })
                .to(0.03, { scale: originScale })
                .start();
        }
    }

    play(task: any) {
        const self = this;
        const { url, priority, localPosition, targetPosition, flyScale, icon } = task;
        
        const flyItem = AssetPool.Instance.createObject(FlyItemView.url);
        flyItem.parent = MgrUi.root(priority);
        flyItem.getComponentInChildren(UIIcon).loadSpriteFrame(url);
        
        Tween.stopAllByTarget(flyItem);
        flyItem.setScale(0, 0, 0);
        flyItem.position = localPosition;

        const randomX = localPosition.x + Utils.randomRange(-RANDOM_RANGE, RANDOM_RANGE);
        const randomY = localPosition.y + Utils.randomRange(-RANDOM_RANGE, RANDOM_RANGE);
        const scale = isNil(flyScale) ? 1 : flyScale;

        tween(flyItem)
            .to(FLY_DURATION, {
                scale: v3(1.2 * scale, 1.2 * scale, 1.2 * scale),
                position: v3(randomX, randomY, 0)
            }, { easing: easing.quadOut })
            .to(0.5, {
                worldPosition: targetPosition,
                scale: v3(scale, scale, scale)
            }, { easing: easing.quadIn })
            .call(() => {
                self.playTouchedIcon(icon);
            })
            .delay(0.02)
            .call(() => {
                AssetPool.Instance.put(flyItem);
            })
            .start();
    }
}

@ccclass('UIAssetFlyView')
@menu('Asset/UIAssetFlyView')
export class UIAssetFlyView extends Component {
    private static _instance: UIAssetFlyView = null;
    public static receiveNodes: Record<string, any> = {};

    private _pool: FlyTask[] = [];
    private flyTask: FlyTask[] = [];
    private _running: boolean = false;

    public static get Instance(): UIAssetFlyView {
        return this._instance;
    }

    getTaskPool(): FlyTask {
        return this._pool.length === 0 ? new FlyTask() : this._pool.pop()!;
    }

    putTaskPool(task: FlyTask) {
        this._pool.push(task);
    }

    onLoad() {
        UIAssetFlyView._instance = this;
        director.on(GlobalEvent.AssetsFlyPosChange, this.changeFlyPos, this);
        this.loadAsset();
    }

    async loadAsset() {
        const prefab = await AssetMgr.Instance.loadPrefabAsync(BUNDLE_NAMES.Game, FlyItemView.url);
        AssetPool.Instance.addPrefab(prefab, FlyItemView.url);
        this._running = true;
    }

    changeFlyPos(keys: string | string[], worldPos: Vec3) {
        if (Array.isArray(keys)) {
            for (const key of keys) {
                const node = UIAssetFlyView.receiveNodes[key];
                if (node) {
                    node.worldPosition = worldPos;
                }
            }
        } else {
            const node = UIAssetFlyView.receiveNodes[keys];
            if (node) {
                node.worldPosition = worldPos;
            }
        }
    }

    public static register(key: string | string[], worldPos: Vec3, label: any, icon: any) {
        if (Array.isArray(key)) {
            for (const k of key) {
                UIAssetFlyView.receiveNodes[k] = {
                    worldPosition: worldPos,
                    label: label,
                    icon: icon
                };
            }
        } else {
            UIAssetFlyView.receiveNodes[key] = {
                worldPosition: worldPos,
                label: label,
                icon: icon
            };
        }
    }

    public static unregister(key: string | string[]) {
        if (Array.isArray(key)) {
            for (const k of key) {
                const node = UIAssetFlyView.receiveNodes[k];
                if (node) {
                    AssetPool.Instance.putV3(node.worldPosition);
                    node.label = null;
                    node.icon = null;
                    node.worldPosition = null;
                }
                delete UIAssetFlyView.receiveNodes[k];
            }
        } else {
            const node = UIAssetFlyView.receiveNodes[key];
            if (node) {
                AssetPool.Instance.putV3(node.worldPosition);
                node.label = null;
                node.icon = null;
                node.worldPosition = null;
            }
            delete UIAssetFlyView.receiveNodes[key];
        }
    }

    public static getRegister(key: string): any {
        return UIAssetFlyView.receiveNodes[key];
    }

    addItemFlyTask(itemId: number, result: number, change: number, options: any, target: any) {
        const sourcePos = options.sourcePos;
        const priority = options.priority;
        const callback = options.callback;
        
        const label = target.label;
        const icon = target.icon;
        const worldPosition = target.worldPosition;

        if (isNil(sourcePos)) {
            error('sourcePos is nil !!请传入飞奖励的起点坐标');
            const canvas = find('Canvas')!;
            sourcePos = canvas.getComponent(UITransform)!.convertToWorldSpaceAR(Vec3.ZERO);
        }

        if (isNil(worldPosition)) {
            error('没有可以飞得目标');
            callback?.();
            return;
        }

        const assetCfg = AssetsCfg.Instance.get(itemId);
        const iconPath = Utils.IMAGE_ICON_PATH + '/' + assetCfg.icon;
        const flyCnt = isNil(options.flyCnt) ? Math.min(toNumber(change), 4) : options.flyCnt;

        const localPos = this.node.getComponent(UITransform)!.convertToNodeSpaceAR(sourcePos);
        const targetPos = worldPosition;

        const task = this.getTaskPool();
        const taskData = {
            url: iconPath,
            priority: priority,
            localPosition: localPos,
            targetPosition: targetPos,
            flyScale: options.flyScale,
            icon: icon
        };

        this.flyTask.push(task);
        task.setTask(taskData, flyCnt);

        this.scheduleOnce(() => {
            if (label && isValid(label) && label.node.activeInHierarchy) {
                label.playTo(result, 0.15);
            }
            callback?.();
        }, 0.75 + flyCnt * FLY_INTERVAL);
    }

    addFlyTask(task: any) {
        const { url, flyCnt, sourcePos, targetPos, callback } = task;
        
        const localPos = this.node.getComponent(UITransform)!.convertToNodeSpaceAR(sourcePos);
        const targetWorldPos = targetPos;
        this.node.getComponent(UITransform)!.convertToNodeSpaceAR(targetPos);

        const flyTask = this.getTaskPool();
        const taskData = {
            url: url,
            priority: task.priority,
            localPosition: localPos,
            targetPosition: targetWorldPos,
            flyScale: task.flyScale
        };

        this.flyTask.push(flyTask);
        flyTask.setTask(taskData, flyCnt);

        if (callback) {
            this.scheduleOnce(() => {
                callback();
            }, 0.75 + flyCnt * FLY_INTERVAL);
        }
    }

    public static addAsset(data: any, target?: any) {
        const { itemId, change, result, callback } = data;
        
        if (isNil(data.priority)) data.priority = 2;
        if (isNil(data.flyType)) data.flyType = AssetToFlyItemDefault[itemId];
        if (isNil(data.flyScale)) data.flyScale = 1;
        if (isNil(target)) target = UIAssetFlyView.receiveNodes[data.flyType];

        if (isNil(target)) {
            warn('no receiveNodes! asset:' + itemId);
            callback?.();
            return;
        }

        const instance = UIAssetFlyView.Instance;
        if (instance) {
            instance.addItemFlyTask(itemId, result, change, data, target);
        } else {
            callback?.();
        }
    }

    public static addFlyTask(task: any) {
        if (isNil(task.priority)) task.priority = 2;
        if (isNil(task.flyScale)) task.flyScale = 1;

        const instance = UIAssetFlyView.Instance;
        if (instance) {
            instance.addFlyTask(task);
        }
    }

    lateUpdate(dt: number) {
        if (this._running && this.flyTask.length > 0) {
            for (let i = this.flyTask.length - 1; i >= 0; i--) {
                const task = this.flyTask[i];
                task.lateUpdate(dt);
                
                if (task.complete()) {
                    task.clear();
                    this.flyTask.splice(i, 1);
                    this.putTaskPool(task);
                }
            }
        }
    }
}