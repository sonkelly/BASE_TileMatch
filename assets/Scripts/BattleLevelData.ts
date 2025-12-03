import { _decorator, cclegacy } from 'cc';
import { IDataObject } from './IDataObject';
import { Tools } from './Tools';
import { FbHeadCfg } from './FbHeadCfg';
import { BattleNameCfg } from './BattleNameCfg';
import { get } from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('BattleLevelData')
export class BattleLevelData extends IDataObject {
    private _battleIndex: number = 0;
    private _battleLevelInfo: any = null;
    private _battleCompetitor: any = null;
    private _battleLevelAI: any = null;

    constructor(...args: any[]) {
        super(...args);
        this._battleIndex = 0;
        this._battleLevelInfo = null;
        this._battleCompetitor = null;
        this._battleLevelAI = null;
    }

    public refreshBattleInfo(level: number): void {
        if (!this._battleLevelInfo || this._battleLevelInfo.level !== level) {
            this._battleIndex++;
            this._battleLevelInfo = {
                level: level,
                tileCnt: 0
            };
            this._battleCompetitor = null;
            this._battleLevelAI = {
                collectTileCnt: 0,
                lastCollectTime: Tools.GetNowTime()
            };
            this.doDrity();
        }
    }

    public clearBattleInfo(): void {
        this._battleLevelInfo = null;
        this._battleCompetitor = null;
        this._battleLevelAI = {
            collectTileCnt: 0,
            lastCollectTime: Tools.GetNowTime()
        };
        this.doDrity();
    }

    public setBattleInfoTileCnt(level: number, tileCnt: number): void {
        if (this._battleLevelInfo && this._battleLevelInfo.level === level) {
            this._battleLevelInfo.tileCnt = tileCnt;
            this.doDrity();
        } else {
            console.error(`error! level:${level}, battleLevelInfo:${this._battleLevelInfo}`);
        }
    }

    public setBattleCompetitor(competitor: any): void {
        if (competitor) {
            this._battleCompetitor = {
                id: competitor.id,
                name: competitor.name,
                head: competitor.head
            };
        } else {
            if (!this._battleCompetitor) {
                const name = BattleNameCfg.Instance.getRandomName();
                const head = FbHeadCfg.Instance.getRandomHead();
                this._battleCompetitor = {
                    id: '',
                    name: name,
                    head: head
                };
            }
        }
        this.doDrity();
    }

    public getBattleCompetitorId(): string {
        return this._battleCompetitor?.id || '';
    }

    public aiCollectTile(count: number): void {
        const newCount = this._battleLevelAI.collectTileCnt + count;
        this._battleLevelAI.collectTileCnt = Math.min(newCount, this._battleLevelInfo.tileCnt);
        this._battleLevelAI.lastCollectTime = Tools.GetNowTime();
        this.doDrity();
    }

    public deserialized(data: any): void {
        this._battleIndex = get(data, 0) || 0;
        this._battleLevelInfo = get(data, 1) || null;
        this._battleCompetitor = get(data, 2) || null;
        this._battleLevelAI = get(data, 3) || null;
        this.doDrity();
    }

    public serializeInfo(): any {
        return {
            0: this._battleIndex,
            1: this._battleLevelInfo,
            2: this._battleCompetitor,
            3: this._battleLevelAI
        };
    }

    public get battleIndex(): number {
        return this._battleIndex;
    }

    public get battleLevelInfo(): any {
        return this._battleLevelInfo;
    }

    public get battleCompetitor(): any {
        return this._battleCompetitor;
    }

    public get battleLevelAI(): any {
        return this._battleLevelAI;
    }
}