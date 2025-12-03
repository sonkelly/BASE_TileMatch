import { _decorator, sys, director, Component } from 'cc';
import {HttpService} from './HttpService';
import md5 from 'md5';
import { config } from './Config';

const { ccclass, property } = _decorator;

@ccclass('MgrService')
export class MgrService extends Component {
    private static _instance: MgrService = null;
    
    private _appid: string = '3f9080dd46604ecfa115a7b62dda67b1'; //@todo edit
    private _uid: number = 0;
    private _token: string = '';
    private _openid: string = '';
    private _isLogin: boolean = false;

    public static get Instance(): MgrService {
        return MgrService._instance;
    }

    public get appid(): string {
        return this._appid;
    }

    public get uid(): number {
        return this._uid;
    }

    public set uid(value: number) {
        this._uid = value;
        sys.localStorage.setItem(config.gameName + '_uid', this._uid.toString());
        director.emit('transition-uid', value);
    }

    public get token(): string {
        return this._token;
    }

    public set token(value: string) {
        this._token = value;
        sys.localStorage.setItem(config.gameName + '_token', this._token);
    }

    public get openid(): string {
        return this._openid;
    }

    public set openid(value: string) {
        this._openid = value;
        sys.localStorage.setItem(config.gameName + '_openid', this._token);
    }

    public get isLogin(): boolean {
        return this._isLogin;
    }

    protected onLoad(): void {
        this._uid = Number(sys.localStorage.getItem(config.gameName + '_uid') || '0');
        this._token = sys.localStorage.getItem(config.gameName + '_token') || '';
        this._openid = sys.localStorage.getItem(config.gameName + '_openid') || '';
    }

    public initialize(): void {
        MgrService._instance = this;
    }

    protected onDestroy(): void {
        MgrService._instance = null;
    }

    public async login(_input : any): Promise<any> {
        const appid = this._appid;
        const token = this._token;
        
        const result = await HttpService.Instance.login(appid, token, '', '', '');
        if (!result) {
            return null;
        }

        const data = result.data;
        this.uid = data.uid;
        this.openid = data.openid;
        this.token = data.token;
        this._isLogin = true;

        return data;
    }

    public async getServerTime(): Promise<any> {
        const appid = this._appid;
        let retryCount = 0;

        const tryGetTime = async (): Promise<any> => {
            const result = await HttpService.Instance.getServerTime(appid);
            if (!result && retryCount < 3) {
                retryCount++;
                return tryGetTime();
            }
            return result;
        };

        return tryGetTime();
    }

    public async uploadRecord(record: any): Promise<any> {
        const appid = this._appid;
        const uid = this._uid;
        const hash = md5(record);

        return await HttpService.Instance.uploadRecord(appid, uid, record, hash);
    }
}