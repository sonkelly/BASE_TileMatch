import { _decorator, sys, native } from 'cc';

const { ccclass } = _decorator;

const eventAdRewardMap: { [key: number]: string } = {
    1: 'ul6v8y',
    2: 'fo589w',
    3: 'kh22gx',
    4: 'q4khdx',
    5: 'n7kjul',
    6: '7t9pqd',
    7: 'vhfqs1',
    8: '8ce4x4',
    9: 'mpwphx',
    10: 'u1bh0y',
    11: 'fudmhi',
    12: 'd2kxte',
    13: '99896i',
    14: 'esoziv',
    15: 'tnzx0l',
    16: 'mn5b3c',
    17: 'o87gf0',
    18: '7fkbos',
    19: 'hiwdur',
    20: '8mu2lq',
    25: '4zwg9w',
    30: '3g7kzv',
    40: '2zczrh',
    50: 'wo16dt',
    60: 'dhhem8',
    70: 'g75n84',
    80: 'n8ak2u',
    90: 'ue210v',
    100: 'tp9tgw'
};

const eventLevelSuccessMap: { [key: number]: string } = {
    1: 'fj7qa9',
    2: 'rdpzdj',
    3: 'toxbo6',
    4: 'tt21kg',
    5: 'fg3rp1',
    6: '68ee5i',
    7: '64kk2n',
    8: 'v96tno',
    9: 'dtwg6r',
    10: 'u98fou',
    11: 'ljysuv',
    12: '45ahld',
    13: '1i54hd',
    14: '80og77',
    15: 'ocgmqx',
    16: '6k60tt',
    17: '89pmpr',
    18: 'bn51gd',
    19: '5et399',
    20: 'w2feqk',
    25: 'ulpboc',
    30: '6n9rn8',
    35: 'tskamh',
    40: 'skfvil',
    45: 'szdkld',
    50: 'eyz1wd',
    55: '8fnlv2',
    60: 'afmslm',
    65: 'e38dv7',
    70: '2ztv9s',
    75: 'ymkk2i',
    80: 'ggvv4m',
    85: 'b6jq61',
    90: 'rytuc8',
    95: 'fryfyv',
    100: '8y1uas'
};

@ccclass('Adjust')
export class Adjust {
    public static sendEventAdRewardAD(id: number): void {
        let eventId: string = '';
        if (eventAdRewardMap.hasOwnProperty(id)) {
            eventId = eventAdRewardMap[id];
        }
        if (eventId) {
            Adjust.sendEvent(eventId);
        }
    }

    public static sendEventLevelSuccess(level: number): void {
        let eventId: string = '';
        if (eventLevelSuccessMap.hasOwnProperty(level)) {
            eventId = eventLevelSuccessMap[level];
        }
        if (eventId) {
            Adjust.sendEvent(eventId);
        }
    }

    public static sendEvent(eventId: string): void {
        if (sys.isNative && native?.reflection?.callStaticMethod) {
            native.reflection.callStaticMethod(
                'com/cocos/game/SdkBrigde', 
                'AdjustReportEvent', 
                '(Ljava/lang/String;)V', 
                eventId
            );
        }
    }
}