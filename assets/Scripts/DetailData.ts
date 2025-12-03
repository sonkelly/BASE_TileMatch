import { _decorator, cclegacy } from 'cc';
import { IDataObject } from './IDataObject';
import { get, set } from 'lodash-es';

const { ccclass, property } = _decorator;

@ccclass('DetailData')
export class DetailData extends IDataObject {
    private _playTime: number = null;
    private _challengeTime: number = null;

    public get playTime(): number {
        return this._playTime;
    }

    public set playTime(value: number) {
        this._playTime = value;
        this.doDrity();
    }

    public get challengeTime(): number {
        return this._challengeTime;
    }

    public set challengeTime(value: number) {
        this._challengeTime = value;
        this.doDrity();
    }

    public addPlayTime(value: number = 1): void {
        this.playTime = this.playTime + value;
    }

    public addChallengeTime(value: number = 1): void {
        this.challengeTime = this.challengeTime + value;
    }

    public deserialized(data: any): void {
        this.playTime = get(data, 'playTime') || 0;
        this.challengeTime = get(data, 'challengeVictory') || 0;
        this.doDrity();
    }

    public serializeInfo(): any {
        const result = {};
        set(result, 'playTime', this.playTime);
        set(result, 'challengeVictory', this.challengeTime);
        return result;
    }
}