import { _decorator, Component, Node } from 'cc';
import { BasicSocialPlayer } from './BasicSocialPlayer';
import { channelManager, ChannelType } from './ChannelManager';
import { SdkBridge } from './SdkBridge';
import { SocialCacheManager, LeaderboardCacheManager } from './SocialCacheManager';

const { ccclass, property } = _decorator;

export class LeaderboardPlayer extends BasicSocialPlayer {
    public score: number = 0;

    constructor(...args: any[]) {
        super(...args);
        this.score = 0;
    }

    public getScore(): number {
        return this.score;
    }
}

export class RankData {
    public id?: string;
    public iconUrl?: string;
    public name: string = '';
    public star: number = 0;
    public rank: number = 0;
    public isSelf: boolean = false;

    constructor(data: { name: string; star: number }) {
        this.name = data.name;
        this.star = data.star;
    }

    public getIcon(): string | undefined {
        return this.iconUrl;
    }

    public setIcon(url: string): void {
        this.iconUrl = url;
    }

    public getName(): string {
        return this.name;
    }

    public getStar(): number {
        return this.star;
    }

    public setStar(star: number): void {
        this.star = star;
    }

    public getRank(): number {
        return this.rank;
    }

    public setRank(rank: number): void {
        this.rank = rank;
    }

    public getIsSelf(): boolean {
        return this.isSelf;
    }

    public setIsSelf(isSelf: boolean): void {
        this.isSelf = isSelf;
    }
}

@ccclass('LeaderboardManager')
export class LeaderboardManager{
    private static _instance: LeaderboardManager = new LeaderboardManager();
    private leaderboardPrefix: string = '';
    private myScore: number = 0;
    private isInit: boolean = false;

    public static getInstance(): LeaderboardManager {
        return LeaderboardManager._instance;
    }

    public async init(config: { leaderboardPrefix: string; storageKey: string }): Promise<void> {
        if (this.isInit || channelManager.getChannelType() !== ChannelType.FaceBook) return;

        this.isInit = true;
        this.leaderboardPrefix = config.leaderboardPrefix;
        LeaderboardCacheManager.setStorageKey(config.storageKey);

        await SocialCacheManager.getInstance().getPlayerManager().initPlayers();
        await this.fetchConnectedPlayer();
        await this.getFromCloudAsync();
    }

    private async fetchConnectedPlayer(): Promise<void> {
        const connectedPlayers = await SdkBridge.getConnectedPlayersAsync();
        if (connectedPlayers) {
            SocialCacheManager.getInstance().getPlayerManager().upsertPlayers(connectedPlayers);
        }
    }

    public getFromCloudAsync(): Promise<any> {
        return SocialCacheManager.getInstance().getLeaderboardManager().getFromCloudAsync();
    }

    public async setLeaderboardScoreAsync(score: number): Promise<any> {
        this.setMyScore(score);
        try {
            return await SdkBridge.setLeaderboardScoreAsync(this.leaderboardPrefix, score).catch(() => null);
        } catch (error) {
            console.log('setLeaderboardScoreAsync error fail: =======>', error);
        }
    }

    public getMyPlayerInfo(): LeaderboardPlayer {
        let name = '';
        const player = SocialCacheManager.getInstance().getPlayerManager().findPlayer(SdkBridge.getPlayerId());
        name = player?.name || SdkBridge.getPlayerName();

        const playerInfo = new LeaderboardPlayer();
        playerInfo.id = SdkBridge.getPlayerId();
        playerInfo.score = this.myScore;
        playerInfo.name = name;
        playerInfo.photo = SdkBridge.getPlayerPhotoUrl();

        return playerInfo;
    }

    public getMyBasePlayerInfo(score: number): LeaderboardPlayer {
        let name = '';
        const player = SocialCacheManager.getInstance().getPlayerManager().findPlayer(SdkBridge.getPlayerId());
        name = player?.name || SdkBridge.getPlayerName();

        const playerInfo = new LeaderboardPlayer();
        playerInfo.id = SdkBridge.getPlayerId();
        playerInfo.score = score;
        playerInfo.name = name;
        playerInfo.photo = SdkBridge.getPlayerPhotoUrl();

        return playerInfo;
    }

    public setMyScore(score: number): void {
        this.myScore = score;
    }

    public async getMyRank(): Promise<number> {
        const list = await this.getListAsync();
        for (let i = 0; i < list.length; i++) {
            if (list[i].id === this.getMyPlayerInfo().id) {
                return i + 1;
            }
        }
        return -1;
    }

    public async getListAsync(): Promise<LeaderboardPlayer[]> {
        const leaderboardPlayers: LeaderboardPlayer[] = [];
        const prefix = this.getLeaderboardPrefix();
        const entries = (await SdkBridge.getLeaderboardEntriesAsync(prefix)) || [];

        if (entries && entries.length) {
            SocialCacheManager.getInstance().getLeaderboardManager().updateAccordLeaderboardEntries(prefix, entries);
            await SocialCacheManager.getInstance().getLeaderboardManager().saveToCloudAsync();

            for (const entry of entries) {
                SocialCacheManager.getInstance().getPlayerManager().upsertPlayer(entry.getPlayer());
            }
            SocialCacheManager.getInstance().getPlayerManager().savePlayers();
        }

        const leaderboard = SocialCacheManager.getInstance().getLeaderboardManager().findLeaderboard(prefix);
        const members = leaderboard?.members;

        if (members && members.length) {
            leaderboardPlayers.push(...LeaderboardManager.createLeaderboardPlayers(members));
        }

        let foundSelf = false;
        for (const player of leaderboardPlayers) {
            if (player.id === SdkBridge.getPlayerId()) {
                player.score = this.myScore;
                foundSelf = true;
                break;
            }
        }

        if (!foundSelf) {
            leaderboardPlayers.push(this.getMyPlayerInfo());
        }

        return leaderboardPlayers.sort((a, b) => b.getScore() - a.getScore());
    }

    private static createLeaderboardPlayers(members: any[]): LeaderboardPlayer[] {
        const players: LeaderboardPlayer[] = [];
        for (const member of members) {
            const player = SocialCacheManager.getInstance().getPlayerManager().findPlayer(member.id);
            if (player) {
                players.push(LeaderboardManager.createLeaderboardPlayer(player, member.score));
            }
        }
        return players;
    }

    private static createLeaderboardPlayer(player: any, score: number): LeaderboardPlayer {
        const leaderboardPlayer = new LeaderboardPlayer();
        leaderboardPlayer.id = player.id;
        leaderboardPlayer.name = player.name;
        leaderboardPlayer.photo = player.photo;
        leaderboardPlayer.score = score;
        return leaderboardPlayer;
    }

    public getLeaderboardPrefix(): string {
        return this.leaderboardPrefix;
    }

    protected onLoad(): void {
        LeaderboardManager._instance = this;
    }
}