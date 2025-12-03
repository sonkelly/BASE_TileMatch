import { _decorator, cclegacy } from 'cc';
import { ICfgParse } from './ICfgParse';
import { GameConst } from './GameConst';
import {each} from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('LevelChestCfg')
export class LevelChestCfg extends ICfgParse {
    private static _instance: LevelChestCfg;
    private chestCfgByLevel: Map<number, any> = null!;

    constructor() {
        super();
        this.jsonFileName = 'levelChest';
        this.chestCfgByLevel = null!;
    }

    public loaded(): void {
        this.initCfgByLevel();
    }

    public get(key: any): any {
        return this.cfg[key];
    }

    private initCfgByLevel(): void {
        this.chestCfgByLevel = new Map();
        const allCfgs = this.getAll();
        each(allCfgs, (cfg: any) => {
            this.chestCfgByLevel.set(cfg.levelId, cfg);
        });
    }

    public getCfgsByLevel(level: number): { cfg: any; gap: number; idx: number } {
        let baseLevel = 0;
        const levelKeys = Array.from(this.chestCfgByLevel.keys());
        const maxLevel = levelKeys[levelKeys.length - 1];
        let index = 0;

        if (level > maxLevel) {
            const repeatRange = maxLevel - levelKeys[GameConst.ChestRepeatStart];
            baseLevel = this.chestCfgByLevel.get(levelKeys[GameConst.ChestRepeatStart - 1]).levelId;
            index = GameConst.ChestRepeatStart;
            level = (level - maxLevel) % repeatRange;
        }

        for (; index < levelKeys.length; index++) {
            const cfg = this.chestCfgByLevel.get(levelKeys[index]);
            if (cfg.levelId >= level) {
                const gap = cfg.levelId - baseLevel;
                return {
                    cfg: cfg,
                    gap: gap,
                    idx: level >= gap ? (level - baseLevel) % gap : level
                };
            }
            baseLevel = cfg.levelId;
        }

        return { cfg: null, gap: 0, idx: 0 };
    }

    public static get Instance(): LevelChestCfg {
        if (!LevelChestCfg._instance) {
            LevelChestCfg._instance = new LevelChestCfg().load() as LevelChestCfg;
        }
        return LevelChestCfg._instance;
    }
}