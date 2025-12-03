import { _decorator, cclegacy } from 'cc';
import {ICfgParse} from './ICfgParse';

const { ccclass, property } = _decorator;

@ccclass('LevelAlgorithmCfg')
export default class LevelAlgorithmCfg extends ICfgParse {
    private static _instance: LevelAlgorithmCfg | null = null;
    
    constructor(...args: any[]) {
        super(...args);
        this.jsonFileName = 'LevelAlgorithm';
    }

    public get(key: string): any {
        return this.cfg[key];
    }

    public static get Instance(): LevelAlgorithmCfg {
        if (!LevelAlgorithmCfg._instance) {
            LevelAlgorithmCfg._instance = new LevelAlgorithmCfg().load();
        }
        return LevelAlgorithmCfg._instance;
    }
}