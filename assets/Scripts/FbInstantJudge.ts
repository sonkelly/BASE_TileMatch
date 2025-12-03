import { _decorator, cclegacy } from 'cc';

export class FbInstantJudge {
    public static isFacebookInstantGame(): boolean {
        return typeof FBInstant !== 'undefined';
    }
}