import { _decorator, Component, Label, Node, Button, Tween, Vec3, tween, easing, cclegacy } from 'cc';
import { Language } from './Language';
import { MgrGame, MAX_ROW, MIN_ROW } from './MgrGame';
import { MapListTile } from './MapListTile';
import { AssetPool } from './AssetPool';
import { UIPrefabs } from './Prefabs';
import { AsyncQueue } from './AsyncQueue';
import { BUNDLE_NAMES } from './AssetRes';
import { GameConst } from './GameConst';

const { ccclass, property } = _decorator;

@ccclass('MapListItem')
export class MapListItem extends Component {
    @property(Label)
    levelLabel: Label = null!;

    @property(Node)
    root: Node = null!;

    @property(Node)
    lockNode: Node = null!;

    public delegate: any = null;
    private _level: number = 0;
    private _tiles: MapListTile[] = [];
    private _buildQuery: AsyncQueue = new AsyncQueue();

    onLoad() {
        this.node.on('click', this.onClickLevelItem, this);
    }

    setLevel(level: number) {
        this._level = level;
        this.lockNode.active = level > MgrGame.Instance.gameData.maxLv;
        this.levelLabel.string = Language.Instance.getLangByID('Language1').replace('{0}', '' + level);
        this.getComponent(Button)!.interactable = level <= MgrGame.Instance.gameData.maxLv;
    }

    onClickLevelItem() {
        this.delegate && this.delegate.selectLevelEvent(this._level);
    }

    playEnter() {
        Tween.stopAllByTarget(this.node);
        this.node.scale = Vec3.ZERO;
        tween(this.node)
            .to(0.5, { scale: Vec3.ONE }, { easing: easing.backOut })
            .start();
    }

    private async _loadConfig(): Promise<any> {
        const levelName = 'Level_' + (1 + (this._level - 1) % GameConst.MAX_LEVEL_CFG);
        const levelCfg = await MgrGame.Instance.loadLevelCfg(levelName);
        
        const layerPoints: any[] = [];
        let minX = 0, maxX = 0, minY = 0, maxY = 0;

        for (const layer of levelCfg) {
            const points: any[] = [];
            for (const point of layer) {
                const x = point.x;
                const y = -point.y;
                points.push({ x, y });
                minX = Math.min(x, minX);
                maxX = Math.max(x, maxX);
                minY = Math.min(y, minY);
                maxY = Math.max(y, maxY);
            }
            points.sort((a, b) => {
                const diffY = b.y - a.y;
                return diffY === 0 ? a.x - b.x : diffY;
            });
            layerPoints.push(points);
        }

        const width = Math.ceil(Math.abs(maxX - minX) + 0.5);
        const height = Math.ceil(Math.abs(maxY - minY) + 0.5);
        const maxSize = Math.max(width, height);

        return {
            layerPoints,
            dx: Math.max(MIN_ROW, maxSize)
        };
    }

    private async createTile(pos: any, scale: number = 1): Promise<MapListTile> {
        const node = await AssetPool.Instance.createObjAsync(BUNDLE_NAMES.Game, UIPrefabs.MapListTile.url);
        const tile = node.getComponent(MapListTile)!;
        tile.tilePos = pos;
        tile.setViewScale(scale);
        node.parent = this.root;
        return tile;
    }

    build() {
        if (this._level > MgrGame.Instance.gameData.maxLv) return;

        this._buildQuery.clear();
        this._buildQuery.push(async (next: Function) => {
            const config = await this._loadConfig();
            const layerPoints = config.layerPoints;
            const dx = config.dx;
            const scale = MAX_ROW / dx;

            for (const layer of layerPoints) {
                this._buildQuery.push(async (nextLayer: Function) => {
                    for (const point of layer) {
                        const tile = await this.createTile(point, scale);
                        this._tiles.push(tile);
                    }
                    nextLayer();
                });
            }
            next();
        });
        this._buildQuery.play();
    }

    onEnable() {}

    onDisable() {
        this._buildQuery.clear();
        this._tiles.forEach(tile => {
            AssetPool.Instance.put(tile);
        });
        this._tiles.length = 0;
    }
}