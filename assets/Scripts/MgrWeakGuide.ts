import { _decorator, cclegacy } from 'cc';
import { MgrBase } from './MgrBase';
import { GameConst } from './GameConst';
import { MgrGoldTournament } from './MgrGoldTournament';
import { MgrPass } from './MgrPass';
import { MgrStar } from './MgrStar';
import { MgrToyRace } from './MgrToyRace';
import { MgrWinStreak } from './MgrWinStreak';
import { MgrWinStreakV2 } from './MgrWinStreakV2';
import { MgrRace } from './MgrRace';
import { MgrUi } from './MgrUi';
import { GuidesViews } from './Prefabs';
import { MgrGoldTournamentV2 } from './MgrGoldTournamentV2';
import { MgrMine } from './MgrMine';
import { MgrBonusWand } from './MgrBonusWand';

const { ccclass, property } = _decorator;

@ccclass('MgrWeakGuide')
export class MgrWeakGuide extends MgrBase {
    private _guideData: Array<{ priority: number, mgr: any }> = [
        { priority: GameConst.PASS_OPEN_ORDER, mgr: MgrPass.Instance },
        { priority: GameConst.WINSTREAK_OPEN_ORDER, mgr: MgrWinStreak.Instance },
        { priority: GameConst.WINSTREAK_V2_OPEN_ORDER, mgr: MgrWinStreakV2.Instance },
        { priority: GameConst.GOLDTOURNAMENT_OPEN_ORDER, mgr: MgrGoldTournament.Instance },
        { priority: GameConst.GOLDTOURNAMENT_V2_OPEN_ORDER, mgr: MgrGoldTournamentV2.Instance },
        { priority: GameConst.RACE_OPEN_ORDER, mgr: MgrRace.Instance },
        { priority: GameConst.STARLEAGUE_OPEN_ORDER, mgr: MgrStar.Instance },
        { priority: GameConst.TOYRACE_OPEN_ORDER, mgr: MgrToyRace.Instance },
        { priority: GameConst.MINE_OPEN_ORDER, mgr: MgrMine.Instance },
        { priority: GameConst.MINE_OPEN_ORDER + 1, mgr: MgrBonusWand.Instance }
    ];

    private static _instance: MgrWeakGuide;
    public static get Instance(): MgrWeakGuide {
        return this._instance;
    }

    public load(): void {
        // Implementation
    }

    public initLoadData(): void {
        this._guideData.sort((a, b) => a.priority - b.priority);
    }

    public createGuideQueus(handler: Function): void {
        for (let i = 0; i < this._guideData.length; i++) {
            const mgr = this._guideData[i].mgr;
            if (mgr.checkNeedGuide()) {
                handler((callback: Function) => {
                    mgr.guide(callback);
                });
            }
        }
    }

    public openWeakGuide(data: any): void {
        MgrUi.Instance.openViewAsync(GuidesViews.WeakGuide, {
            priority: 2,
            data: data
        });
    }
}