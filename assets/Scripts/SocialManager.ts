import { _decorator, Component } from 'cc';
import { ScreenShot } from './ScreenShot';
import { MgrAnalytics } from './MgrAnalytics';
import { AnalyticsManager } from './AnalyticsManager';
import { channelManager, ChannelType } from './ChannelManager';
import { InviteType } from './ReportEventEnum';
import { SdkBridge } from './SdkBridge';

const { ccclass, property } = _decorator;

@ccclass('SocialManager')
export class SocialManager extends Component {
    private static _instance: SocialManager;
    public static shareNums: number = 0;
    
    @property
    private shareImg: string = '';
    
    @property
    private tournamentImg: string = '';

    public static instance(): SocialManager {
        if (!SocialManager._instance) {
            SocialManager._instance = new SocialManager();
        }
        return SocialManager._instance;
    }

    public init(shareTexture: any, tournamentTexture: any): void {
        this.shareImg = ScreenShot.base64OfTexture(shareTexture);
        this.tournamentImg = ScreenShot.base64OfTexture(tournamentTexture);
        this._updateAsync();
    }

    public async showShcialPop(callback?: Function): Promise<void> {
        SocialManager.shareNums++;
        try {
            const players = await SdkBridge.getConnectedPlayersAsync();
            if (!players || !players.length) {
                callback?.();
                return;
            }

            const friends = this._findFriends(players);
            if (friends.length === 0) {
                callback?.();
                return;
            }

            const randomFriend = friends[Math.floor(Math.random() * friends.length)];
            SdkBridge.createContextAsync(randomFriend.getID())
                .then(async () => {
                    await this._updateAsync();
                    callback?.();
                })
                .catch(() => {
                    callback?.();
                });
        } catch (error) {
            console.log('showSocialPopup err:', error);
            callback?.();
        }
    }

    public async showSocialList(callback?: Function, successCallback?: Function, inviteType: string = 'Rank'): Promise<void> {
        SocialManager.shareNums++;
        MgrAnalytics.Instance.data.addInviteLongShowTime(InviteType.Long);
        this.reportInviteLongShow(inviteType);

        SdkBridge.chooseContextAsync()
            .then(() => {
                MgrAnalytics.Instance.data.addInviteLongClickNums(InviteType.Long);
                this.reportInviteLongClick(inviteType);
                this._updateAsync();
                callback?.();
                successCallback?.();
            })
            .catch((error) => {
                console.log('showSocialList:', error);
                callback?.();
            });
    }

    public async battleLevelSocial(callback: Function): Promise<void> {
        if (ChannelType.FaceBook === channelManager.getChannelType()) {
            let selectedFriend: any = null;
            try {
                const players = await SdkBridge.getConnectedPlayersAsync();
                const friends = this._findFriends(players);
                
                if (friends.length <= 0) {
                    await SdkBridge.chooseContextAsync();
                    await this._updateAsync();
                    callback();
                    return;
                }

                selectedFriend = friends[Math.floor(Math.random() * friends.length)];
                await SdkBridge.createContextAsync(selectedFriend.getID());
                await this._updateAsync();
                
                callback({
                    id: selectedFriend.getID(),
                    name: selectedFriend.getName(),
                    head: selectedFriend.getPhoto()
                });
            } catch (error) {
                console.log('battleLevelSocial inviteAsync or createAsync err:', error);
                if (selectedFriend) {
                    callback({
                        id: selectedFriend.getID(),
                        name: selectedFriend.getName(),
                        head: selectedFriend.getPhoto()
                    });
                } else {
                    callback();
                }
            }
        } else {
            callback();
        }
    }

    public async battleLevelSocialPlayer(callback: Function, playerId: string): Promise<void> {
        if (ChannelType.FaceBook === channelManager.getChannelType()) {
            try {
                await SdkBridge.createContextAsync(playerId);
                await this._updateAsync();
                callback();
            } catch (error) {
                console.warn('battleLevelSocialPlayer createAsync err:', error);
                callback();
            }
        } else {
            callback?.();
        }
    }

    private _findFriends(players: any[]): any[] {
        const currentPlayerId = SdkBridge.getPlayerId();
        return players.filter(player => player.getID() !== currentPlayerId);
    }

    private async _updateAsync(): Promise<void> {
        /*const randomIndex = Math.floor(Math.random() * crM.length);
        try {
            await SdkBridge.updateCustomAsync({
                cta: 'Play',
                action: 'CUSTOM',
                image: this.shareImg,
                text: {
                    default: '',
                    localizations: {
                        default: crM[randomIndex],
                        localizations: {
                            en_US: crM[randomIndex],
                            zh_CN: crN[randomIndex]
                        }
                    }
                },
                template: 'VILLAGE_INVASION',
                strategy: 'IMMEDIATE',
                notification: 'NO_PUSH'
            });
        } catch (error) {
            console.warn('updateAsync Error ', error.toString());
        }*/
    }

    private reportInviteLongShow(inviteType: string): void {
        const popNum = MgrAnalytics.Instance.data.getInviteLongShowTime(InviteType.Long);
        AnalyticsManager.getInstance().reportInviteLongShow({
            Pop_Num: popNum,
            Invite_Type: inviteType
        });
    }

    private reportInviteLongClick(inviteType: string): void {
        const clickNum = MgrAnalytics.Instance.data.getInviteLongClickNums(InviteType.Long);
        const popNum = MgrAnalytics.Instance.data.getInviteLongShowTime(InviteType.Long);
        AnalyticsManager.getInstance().reportInviteLongClick({
            Long_Click_Num: clickNum,
            Long_Pop_Num: popNum,
            Invite_Type: inviteType
        });
    }
}

const SocialMgr = SocialManager.instance();
export {SocialMgr}