// Prefabs.ts
// Cocos Creator 3.8 - dùng để quản lý đường dẫn prefab, ảnh, âm thanh, ...

export const IMAGE_ICON_PATH = "UI/Images/UI/Icon";
export const IMAGE_THEME_PATH = "UI/Images/Game";
export const IMAGE_BG_PATH = "UI/Images/Background";
export const IMAGE_FBHEAD_PATH = "UI/Images/FBHead";
export const IMAGE_HEAD_PATH = "UI/Images/Head";
export const IMAGE_HEAD_FRAME_PATH = "UI/Images/UI/AvatarFrame";
export const IMAGE_HEAD_FRAME2_PATH = "UI/Images/UI/AvatarFrame2";
export const IMAGE_MONTH_TILE = "UI/Images/UI/MonthTile";

export const IMAGE_SHOP_ICON = "UI/Images/UI/ShopIcon";
export const ITEM_GOLD_CUBE_PATH = "UI/Images/Game/21_gold";
export const ITEM_COIN_PATH = "UI/Images/Game/22_coin";
export const MINE_GEM_PATH = "UI/Images/UI/MineGem";
export const MINE_WALL_PATH = "UI/Images/UI/MineWall";
export const MINE_BOX_PATH = "UI/Images/UI/MineBox";
export const MAP_GROUP_PATH = "UI/Images/UI/MapGroup";

export const IMAGE_PATHS = [IMAGE_ICON_PATH, IMAGE_MONTH_TILE, IMAGE_SHOP_ICON, MINE_GEM_PATH, MINE_WALL_PATH, MINE_BOX_PATH]                
export const GamePrefabs = {
    GameTile: { url: "UI/Prefabs/Game/Tile", lazy: false, count: 30 },
    EffectMerge: { url: "UI/Prefabs/Game/mergeEft", lazy: false, count: 3 },
    EffectTile: { url: "UI/Prefabs/Game/tileEft", lazy: false, count: 3 },
    EffectLight: { url: "UI/Prefabs/Game/LightningEft", lazy: false, count: 4 },
    WandEliminateOpen: { url: "UI/Prefabs/Game/WandEliminateOpen", lazy: false, count: 1 },
    WandEliminateSuper: { url: "UI/Prefabs/Game/WandEliminateSuper", lazy: false, count: 1 },
    WandLight: { url: "UI/Prefabs/Game/WandEliminateLight", lazy: false, count: 4 },
    WandEliminateTile: { url: "UI/Prefabs/Game/WandEliminateTile", lazy: false, count: 6 },
};

export const UIPrefabs = {
    MainUI: { url: "UI/Prefabs/MainUI", lazy: false },
    GameUI: { url: "UI/Prefabs/Game/GameUI", lazy: false },
    GameBg: { url: "UI/Prefabs/Game/GameBg", lazy: false },
    UIMask: { url: "UI/Prefabs/Common/UIMask", lazy: true },
    ScrenShotCanvas: { url: "UI/Prefabs/Common/ScrenShotCanvas", lazy: false },
    GameLevelType: { url: "UI/Prefabs/Game/GameLevelType", lazy: true, viewComp: "GameLevelType" },
    LevelBoxView: { url: "UI/Prefabs/Game/LevelBoxView", lazy: true },
    ChallengeVictory: { url: "UI/Prefabs/Challenge/ChallengeVictory", lazy: true, viewComp: "UIChallengeVictory" },
    GameVictory: { url: "UI/Prefabs/Game/GameVictory", lazy: true, viewComp: "GameVictory" },
    GameFailed: { url: "UI/Prefabs/Game/GameFailed", lazy: true },
    GameClearView: { url: "UI/Prefabs/Game/GameClearView", lazy: true, viewComp: "GameClearView" },
    GameSkin: { url: "UI/Prefabs/Skin/GameSkinView", lazy: true },
    BonusDoubleView: { url: "UI/Prefabs/Bonus/BonusDoubleView", lazy: true, viewComp: "BonusDoubleView" },
    UISkinUnlock: { url: "UI/Prefabs/Skin/UISkinUnlock", lazy: true, viewComp: "UISkinUnlock" },
    TopUI: { url: "UI/Prefabs/UI/TopUIView", lazy: false },
    ShopView: { url: "UI/Prefabs/ShopView/UIShopView", lazy: true, viewComp: "UIShopView" },
    PushGiftView: { url: "UI/Prefabs/ShopView/UIPushGiftView", lazy: true, viewComp: "UIGiftPushView" },
    ShopItemLimited: { url: "UI/Prefabs/ShopView/ShopItemLimited", lazy: true },
    ShopItemGiftPush: { url: "UI/Prefabs/ShopView/ShopItemPushGift", lazy: true },
    ShopItemNormal: { url: "UI/Prefabs/ShopView/ShopItemNormal", lazy: true },
    ShopItemCoin: { url: "UI/Prefabs/ShopView/ShopItemCoin", lazy: true },
    ShopAdItem: { url: "UI/Prefabs/ShopView/ShopAdItem", lazy: true },
    CollectFreeGold: { url: "UI/Prefabs/ShopView/CollectFreeGold", lazy: true },
    RemoveAdTip: { url: "UI/Prefabs/ShopView/RemoveAdTip", lazy: true },
    RemoveAdView: { url: "UI/Prefabs/ShopView/RemoveAdView", lazy: true },
    UITaskView: { url: "UI/Prefabs/Task/UITaskView", lazy: true },
    UIPassView: { url: "UI/Prefabs/Pass/UIPassView", lazy: true },
    WinStreakView: { url: "UI/Prefabs/WinStreak/WinStreakView", lazy: true },
    WinStreakViewV2: { url: "UI/Prefabs/WinStreak/WinStreakViewV2", lazy: true },
    StreakDetailView: { url: "UI/Prefabs/WinStreak/StreakDetailView", lazy: true, viewComp: "StreakDetailView" },
    StreakEarnView: {
        ['url']: 'UI/Prefabs/WinStreak/StreakEarnView',
        ['lazy']: !0x0,
        ['viewComp']: 'StreakEarnView'
    },
    StreakEarnViewV2: {
        ['url']: 'UI/Prefabs/WinStreak/StreakEarnViewV2',
        ['lazy']: !0x0,
        ['viewComp']: 'StreakEarnViewV2'
    },
    StreakClearView: {
        ['url']: 'UI/Prefabs/WinStreak/StreakClearView',
        ['lazy']: !0x0,
        ['viewComp']: 'StreakClearView'
    },
    SetView: {
        ['url']: 'UI/Prefabs/Setting/UISettingView',
        ['lazy']: !0x0
    },
    ClearArchiveView: {
        ['url']: 'UI/Prefabs/Setting/UIClearArchiveView',
        ['lazy']: !0x0
    },
    ChangeLanguage: {
        ['url']: 'UI/Prefabs/Setting/UIChangeLanguage',
        ['lazy']: !0x0
    },
    DaliyRewardView: {
        ['url']: 'UI/Prefabs/DailyReward/DailyRewardView',
        ['lazy']: !0x0
    },
    MapView: {
        ['url']: 'UI/Prefabs/Map/UIMapGroupView',
        ['lazy']: !0x0
    },
    MapList: {
        ['url']: 'UI/Prefabs/Map/UIMapListView',
        ['lazy']: !0x0,
        ['viewComp']: 'MapListView'
    },
    MapListTile: {
        ['url']: 'UI/Prefabs/Map/UIMapListTile',
        ['lazy']: !0x0
    },
    ChallengeView: {
        ['url']: 'UI/Prefabs/Challenge/UIChallengeView',
        ['lazy']: !0x0
    },
    ['UserDetailView']: {
        ['url']: 'UI/Prefabs/UserDetail/UserDetailView',
        ['viewComp']: 'UserDetailView',
        ['lazy']: !0x0
    },
    ['UserDetailEditView']: {
        ['url']: 'UI/Prefabs/UserDetail/UserDetailEditView',
        ['lazy']: !0x0
    },
    ['UserHeadAlert']: {
        ['url']: 'UI/Prefabs/UserDetail/UserHeadAlert',
        ['viewComp']: 'UserHeadAlert',
        ['lazy']: !0x0
    },
    ['CommonRewardView']: {
        ['url']: 'UI/Prefabs/Common/CommonRewardView',
        ['lazy']: !0x0,
        ['viewComp']: 'CommonRewardView'
    },
    ['CommonDoubleView']: {
        ['url']: 'UI/Prefabs/Common/CommonDoubleView',
        ['lazy']: !0x0,
        ['viewComp']: 'CommonDoubleView'
    },
    ['EvaluateView']: {
        ['url']: 'UI/Prefabs/Evaluate/EvaluateView',
        ['lazy']: !0x0,
        ['viewComp']: 'EvaluateView'
    },
    ['RankView']: {
        ['url']: 'UI/Prefabs/Rank/RankView',
        ['lazy']: !0x0
    },
    ['UIShareSelf']: {
        ['url']: 'UI/Prefabs/Rank/UIShareSelf',
        ['lazy']: !0x0,
        ['viewComp']: 'UIShareSelf'
    },
    ['UIShareList']: {
        ['url']: 'UI/Prefabs/Rank/UIShareList',
        ['lazy']: !0x0,
        ['viewComp']: 'UIShareList'
    },
    ['GoldTournamentView']: {
        ['url']: 'UI/Prefabs/GoldTournament/GoldTournamentView',
        ['lazy']: !0x0
    },
    ['GoldTournamentRewardView']: {
        ['url']: 'UI/Prefabs/GoldTournament/GoldTournamentRewardView',
        ['lazy']: !0x0
    },
    ['GoldTournamentDoubleView']: {
        ['url']: 'UI/Prefabs/GoldTournament/GoldTournamentDoubleView',
        ['lazy']: !0x0,
        ['viewComp']: 'GoldTournamentDoubleView'
    },
    ['GoldTournamentV2View']: {
        ['url']: 'UI/Prefabs/GoldTournamentV2/GoldTournamentV2View',
        ['lazy']: !0x0
    },
    ['GoldTournamentV2RewardView']: {
        ['url']: 'UI/Prefabs/GoldTournamentV2/GoldTournamentV2RewardView',
        ['lazy']: !0x0
    },
    ['GoldTournamentV2DoubleView']: {
        ['url']: 'UI/Prefabs/GoldTournamentV2/GoldTournamentV2DoubleView',
        ['lazy']: !0x0,
        ['viewComp']: 'GoldTournamentV2DoubleView'
    },
    ['PigBankView']: {
        ['url']: 'UI/Prefabs/Pig/PigBankView',
        ['lazy']: !0x0
    },
    ['LuckWheelView']: {
        ['url']: 'UI/Prefabs/LuckWheel/LuckWheelView',
        ['lazy']: !0x0
    },
    ['RaceView']: {
        ['url']: 'UI/Prefabs/Race/RaceView',
        ['lazy']: !0x0,
        ['viewComp']: 'RaceView'
    },
    ['RaceMatchView']: {
        ['url']: 'UI/Prefabs/Race/RaceMatchView',
        ['lazy']: !0x0,
        ['viewComp']: 'RaceMatchView'
    },
    ['RaceHelpView']: {
        ['url']: 'UI/Prefabs/Race/RaceHelpView',
        ['lazy']: !0x0
    },
    ['RaceSuccess']: {
        ['url']: 'UI/Prefabs/Race/RaceSuccess',
        ['lazy']: !0x0,
        ['viewComp']: 'RaceSuccess'
    },
    ['RaceFailed']: {
        ['url']: 'UI/Prefabs/Race/RaceFailed',
        ['lazy']: !0x0,
        ['viewComp']: 'RaceFailed'
    },
    ['StarEagueHelpView']: {
        ['url']: 'UI/Prefabs/StarLeague/StarEagueHelpView',
        ['lazy']: !0x0,
        ['viewComp']: 'StarEagueHelpView'
    },
    ['StarEagueView']: {
        ['url']: 'UI/Prefabs/StarLeague/StarEagueView',
        ['lazy']: !0x0,
        ['viewComp']: 'StarEagueView'
    },
    ['StarEagueStartView']: {
        ['url']: 'UI/Prefabs/StarLeague/StarEagueStartView',
        ['lazy']: !0x0,
        ['viewComp']: 'StarEagueStartView'
    },
    ['StarEagueStageView']: {
        ['url']: 'UI/Prefabs/StarLeague/StarEagueStageView',
        ['lazy']: !0x0,
        ['viewComp']: 'StarEagueStageView'
    },
    ['StarEagueRewardView']: {
        ['url']: 'UI/Prefabs/StarLeague/StarEagueRewardView',
        ['lazy']: !0x0,
        ['viewComp']: 'StarEagueRewardView'
    },
    ['StarEagueResultView']: {
        ['url']: 'UI/Prefabs/StarLeague/StarEagueResultView',
        ['lazy']: !0x0,
        ['viewComp']: 'StarEagueResultView'
    },
    ['UIPopAssetList']: {
        ['url']: 'UI/Prefabs/StarLeague/UIPopAssetList',
        ['lazy']: !0x0,
        ['viewComp']: 'UIPopAssetList'
    },
    ['ToyRaceNextTip']: {
        ['url']: 'UI/Prefabs/ToyRace/ToyRaceNextTip',
        ['lazy']: !0x0,
        ['viewComp']: 'ToyRaceNextTip'
    },
    ['ToyRacePrepare']: {
        ['url']: 'UI/Prefabs/ToyRace/ToyRacePrepare',
        ['lazy']: !0x0,
        ['viewComp']: 'ToyRacePrepare'
    },
    ['ToyRaceRule']: {
        ['url']: 'UI/Prefabs/ToyRace/ToyRaceRule',
        ['lazy']: !0x0,
        ['viewComp']: 'ToyRaceRule'
    },
    ['ToyRaceView']: {
        ['url']: 'UI/Prefabs/ToyRace/ToyRaceView',
        ['lazy']: !0x0,
        ['viewComp']: 'ToyRaceView'
    },
    ['ToyRaceViewItem']: {
        ['url']: 'UI/Prefabs/ToyRace/ToyRaceViewItem',
        ['lazy']: !0x0,
        ['viewComp']: 'ToyRaceViewItem'
    },
    ['BonusWandView']: {
        ['url']: 'UI/Prefabs/BonusWand/BonusWandView',
        ['lazy']: !0x0
    },
    ['BonusWandRule']: {
        ['url']: 'UI/Prefabs/BonusWand/BonusWandRule',
        ['lazy']: !0x0
    },
    ['UIActivePreviewView']: {
        ['url']: 'UI/Prefabs/ActivePreview/UIActivePreviewView',
        ['lazy']: !0x0,
        ['viewComp']: 'UIActivePreviewView'
    },
    ['MineView']: {
        ['url']: 'UI/Prefabs/Mine/MineView',
        ['lazy']: !0x0
    },
    ['MineViewDoubleView']: {
        ['url']: 'UI/Prefabs/Mine/MineViewDoubleView',
        ['lazy']: !0x0,
        ['viewComp']: 'MineViewDoubleView'
    },
    MineRewardView: {
        ['url']: 'UI/Prefabs/Mine/MineRewardView',
        ['lazy']: !0x0,
        ['viewComp']: 'MineRewardView'
    },
    MineHelpView: {
        ['url']: 'UI/Prefabs/Mine/MineHelpView',
        ['lazy']: !0x0
    },
    MineBoxDetailView: {
        ['url']: 'UI/Prefabs/Mine/MineBoxDetailView',
        ['lazy']: !0x0,
        ['viewComp']: 'MineBoxDetailView'
    },
    MineNotEnableTipView: {
        ['url']: 'UI/Prefabs/Mine/MineNotEnableTipView',
        ['lazy']: !0x0
    },
    BattleLevelStartView: {
        ['url']: 'UI/Prefabs/BattleLevel/BattleLevelStartView',
        ['lazy']: !0x0,
        ['viewComp']: 'BattleLevelStartView'
    },
    BattleLevelPKView: {
        ['url']: 'UI/Prefabs/BattleLevel/BattleLevelPKView',
        ['lazy']: !0x0,
        ['viewComp']: 'BattleLevelPKView'
    },
    BattleLevelWinView: {
        ['url']: 'UI/Prefabs/BattleLevel/BattleLevelWinView',
        ['lazy']: !0x0,
        ['viewComp']: 'BattleLevelWinView'
    }
};

export const FlyItemView = {
    url: "UI/Prefabs/Common/AssetFlyItem",
    count: 10,
    lazy: true,
};

export const GuidesViews = {
    GameMethodView: { url: "UI/Prefabs/Guide/GameMethodView", lazy: true },
    WeakGuide: { url: "UI/Prefabs/Guide/GuideView", lazy: true, viewComp: "WeakGuide" },
    PropGuide: { url: "UI/Prefabs/Guide/GuideView", lazy: true, viewComp: "WeakGuide" },
    GuideFinger: { url: "UI/Prefabs/Guide/GuideFinger", lazy: true },
};

export const GMViews = {
    GMOptions: { url: "UI/Prefabs/GM/GMOptions" },
    GMMainBtn: { url: "UI/Prefabs/GM/GMMainBtn" },
    GMView: { url: "UI/Prefabs/GM/GMView" },
};

export const GameAudios = {
    Bgm: { url: "Audio/Game_bgm", lazy: true },
    Button1: { url: "Audio/eff_common_btn_01", lazy: true },
    Button2: { url: "Audio/eff_common_btn_02", lazy: true },
    OpenBox: { url: "Audio/eff_common_openbox", lazy: true },
    TilePop: { url: "Audio/eff_tile_bop", lazy: true },
    Move: { url: "Audio/eff_connect_move", lazy: true },
    MergeClick: { url: "Audio/eff_merge_click", lazy: true },
    ShootComp: { url: "Audio/eff_shoot_comp", lazy: true },
    Fail: { url: "Audio/eff_fail", lazy: true },
    Win: { url: "Audio/eff_win", lazy: true },
    SuperHint: { url: "Audio/super_hint", lazy: true },
    Mine_break: { url: "Audio/mine_break", lazy: true },
};
