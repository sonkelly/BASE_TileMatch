import { _decorator, cclegacy } from 'cc';
const { ccclass } = _decorator;

@ccclass('MgrTargets')
export class MgrTargets {
    public static readonly MGR_NAMES = [
        'MgrUi', 'MgrCfg', 'MgrUser', 'MgrGame', 'MgrDailyReward', 
        'MgrSkin', 'MgrDetail', 'MgrLevelChest', 'MgrAnalytics', 
        'MgrChallengeStorage', 'MgrChallenge', 'MgrTask', 'MgrPass', 
        'MgrWinStreakBase', 'MgrWinStreak', 'MgrWinStreakV2', 'MgrRank', 
        'MgrGoldTournament', 'MgrGoldTournamentV2', 'MgrMonthTile', 
        'MgrShop', 'MgrGiftPush', 'MgrPig', 'MgrLuckWheel', 'MgrRace', 
        'MgrStar', 'MgrToyRace', 'MgrMine', 'MgrBonusWand', 'MgrWeakGuide', 
        'MgrFBAnalytics', 'MgrBattleLevel'
    ];
}