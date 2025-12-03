import { _decorator, Color } from 'cc';
const { ccclass, property } = _decorator;

export const Guide_Layer = 1 << 19;
export const UI_2D_Layer = 1 << 25;
export const COLOR_RED = Color.RED;
export const COLOR_WHITE = Color.WHITE;
export const COLOR_GRAY = Color.GRAY;
export const COLOR_GREEN = Color.GREEN;
export const COLOR_BLACK = Color.BLACK;
export const COLOR_YELLOW = Color.YELLOW;

export const DAY_MINUTES = 1440;
export const HOUR_SECONDS = 3600;
export const DAY_SECONDS = 60 * DAY_MINUTES;
export const WEEK_SECONDS = 7 * DAY_SECONDS;
export const HOUR_MILLISECOND = 1000 * HOUR_SECONDS;
export const PremultipliedAlpha = false;
export const SkinBreviaryPath = 'UI/Images/UI/SkinBreviary/';
export const BgPath = 'UI/Images/Background/';
export const TaskIconPath = 'UI/Images/UI/TaskIcon/';
export const ChallengeModelPath = 'UI/Images/UI/Medals/';
export const Challenge_Bg = 'bg2';
export const TILE_SIZE = 88;
export const VIBRATE_ONESHOT = 0.012;
export const Challenge_Multiplex = [2, 3, 4, 5, 4, 3, 2];
export const DAY_MILLISECOND = 86400000;
export const SECOND_MILLISECOND = 60000;

export enum Direction {
    LEFT = 0,
    RIGHT = 1,
    TOP = 2,
    BOTTOM = 3
}

export enum MenuPageId {
    Shop = 0,
    Home = 1,
    Setting = 2
}

export enum ACTIVITY_ID {
    WIN_STREAK = 1,
    WIN_STREAK2 = 2,
    TOY_RACE = 3,
    STAR_LEAGUE = 4,
    PASS = 5,
    GOLD_RACE = 6,
    GOLD_RACE2 = 7,
    Race = 8,
    Mine = 9
}

export enum ITEM_TYPE {
    Asset = 1
}

export enum CYCLE_TYPE {
    None = 0,
    Daily = 1,
    Weekly = 2,
    Month = 3,
    Forever = 4
}

export enum TASK_STATUS {
    Close = 0,
    Job = 1,
    InAD = 2,
    Complete = 3,
    Finish = 4
}

export enum AvatarUnlockType {
    None = 0,
    Default = 1,
    Level = 2,
    RewardAd = 3,
    Coin = 4
}

export enum PushNotificationType {
    None = 0,
    DailyTimeNoEnter = 1,
    DailyTime = 2
}

export enum ShopPackageType {
    Limited = 1,
    PushGift = 2,
    Currency = 4,
    Turn = 7
}

export enum ShopPackagePrefabType {
    ShopItemLimited = 1,
    ShopItemNormal = 2,
    ShopItemCoin = 3,
    ShopAdItem = 4
}

export enum IAPTYPE {
    OneTimeConsumable = 1,
    OneTimeNoConsumable = 2,
    Subscription = 3
}

export enum ShopCurrency {
    Cash = 0,
    Coin = 1,
    Ad = 99
}

export enum LevelMode {
    Clear = 1,
    Time = 2
}

export enum GameMode {
    Challenge = 1,
    Level = 2,
    Bonus = 3,
    Hard = 4
}

export enum FAILED_REASON {
    Full = 0,
    TimeOut = 1
}

export enum TASK_TYPE {
    LEVEL = 1,
    MATCH = 2,
    UNDO = 3,
    WAND = 4,
    FRESH = 5,
    DAILY_CHALLENGE = 6,
    DAILY_REWARD = 7,
    GROUP_LEVEL = 8,
    MONTH_CHALLENGE = 9,
    SKIN = 10,
    USE_COIN = 11,
    USE_PROP = 12,
    MATCH_GOLD_TILE = 13,
    JOIN_GOLDTOUR = 14,
    GOLDTOUR_FIRST = 15,
    CHANGE_HEAD = 16,
    CHANGE_NICK = 17,
    JOIN_PASS = 18,
    RECEIVE_PASS_REWARD = 19,
    JOINWINSTREAK = 20,
    RECEIVE_JOINWINSTREAK_REWARD = 21,
    JOIN_RACE = 22,
    RECEIVE_RACE_REWARD = 23
}

export enum GIFT_PUSH_POS {
    NON_ACTIVE_POP = 0,
    USE_PROP = 1,
    HOME_PAGE = 2,
    SETTLE_COMPLETE = 3,
    ENTER_LEVEL = 4
}

export enum GIFT_TYPE {
    RemoveAd = 1,
    Normall = 2
}

export enum GIFT_STATE {
    Idle = 0,
    Active = 1,
    Cd = 2
}

export enum COMPARE_TYPE {
    Equal = 0,
    Less = 1,
    LessEqual = 2,
    Greater = 3,
    GreaterEqual = 4
}

export const GUIDE_PROP_UNDO = 1;
export const GUIDE_PROP_WAND = 2;
export const GUIDE_PROP_SHUFFLE = 4;
export const GUIDE_PROP_BONUS_WAND = 8;

export enum GIFT_TRIGGER_ID {
    UseUndo = 1,
    UseHint = 2,
    UseFresh = 3,
    GoldBuyUndo = 4,
    GoldBuyHint = 5,
    GoldBuyFresh = 6,
    AdGetUndo = 7,
    AdGetHint = 8,
    AdGetFrtesh = 9,
    FinalUndoCount = 10,
    FinalHintCount = 11,
    FinalFreshCount = 12,
    GoldConsume = 13,
    ReviveCount = 14,
    InterstitialCount = 15,
    BillingCount = 16,
    BillingGold = 17,
    PassLevelCount = 18,
    UsePropCount = 19,
    GoldBuyPropCount = 20,
    FinalGoldCount = 21,
    DailyPassLevelCount = 22,
    PreUseUndoMax = 23,
    PreUseHintMax = 24,
    PreUseFreshMax = 25,
    PreUseGold = 26,
    ReviveGoldLess = 27,
    DailyLevelFailCnt = 28,
    DailyLevelFailTotal = 29
}

export const GIFT_DAILY_RESET_TRIGGERS = [
    GIFT_TRIGGER_ID.UseUndo,
    GIFT_TRIGGER_ID.UseHint,
    GIFT_TRIGGER_ID.UseFresh,
    GIFT_TRIGGER_ID.GoldBuyUndo,
    GIFT_TRIGGER_ID.GoldBuyHint,
    GIFT_TRIGGER_ID.GoldBuyFresh,
    GIFT_TRIGGER_ID.AdGetUndo,
    GIFT_TRIGGER_ID.AdGetHint,
    GIFT_TRIGGER_ID.AdGetFrtesh,
    GIFT_TRIGGER_ID.GoldConsume,
    GIFT_TRIGGER_ID.ReviveCount,
    GIFT_TRIGGER_ID.InterstitialCount,
    GIFT_TRIGGER_ID.UsePropCount,
    GIFT_TRIGGER_ID.GoldBuyPropCount,
    GIFT_TRIGGER_ID.DailyPassLevelCount,
    GIFT_TRIGGER_ID.PreUseUndoMax,
    GIFT_TRIGGER_ID.PreUseHintMax,
    GIFT_TRIGGER_ID.PreUseFreshMax,
    GIFT_TRIGGER_ID.PreUseGold,
    GIFT_TRIGGER_ID.ReviveGoldLess,
    GIFT_TRIGGER_ID.DailyLevelFailCnt,
    GIFT_TRIGGER_ID.DailyLevelFailTotal
];

export enum ACTIVE_STATUS {
    LOCK = 0,
    ACTIVE = 1,
    GAP = 2
}