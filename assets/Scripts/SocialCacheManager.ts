import { sys } from 'cc';
import { BasicSocialPlayer } from './BasicSocialPlayer';
import { FbInstantJudge } from './FbInstantJudge';
import { SdkBridge } from './SdkBridge';

class StorageUtil {
    static getItem<T>(key: string, defaultValue: T): T {
        const raw = sys.localStorage.getItem(key);
        return raw ? JSON.parse(raw) as T : defaultValue;
    }

    static setItem<T>(key: string, value: T): void {
        const raw = JSON.stringify(value);
        sys.localStorage.setItem(key, raw);
    }
}

export class PlayerCacheManager {
    players: Map<string, BasicSocialPlayer> = new Map();

    async initPlayers() {
        if (FbInstantJudge.isFacebookInstantGame()) {
            try {
                const data = await SdkBridge.getDataAsync(['LeaderboardPlayers']);
                if (data == null) {
                    this.players = new Map();
                } else {
                    const arr = data['LeaderboardPlayers'];
                    if (arr && arr.length) {
                        for (let i = 0; i < arr.length; i++) {
                            const p = arr[i];
                            this.players.set(p.id, p);
                        }
                    }
                }
            } catch (e) {
                console.error('error cache player =======>', e);
            }
        }
    }

    upsertPlayer(player: any) {
        const existing = this.findPlayer(player.getID());
        if (existing) {
            existing.name = player.getName();
            existing.photo = player.getPhoto();
        } else {
            const np = new BasicSocialPlayer();
            np.id = player.getID();
            np.name = player.getName();
            np.photo = player.getPhoto();
            this.players.set(np.id, np);
        }
    }

    savePlayers() {
        const arr: BasicSocialPlayer[] = [];
        this.players.forEach((v) => arr.push(v));
        const payload: any = {};
        payload['LeaderboardPlayers'] = arr;
        // intentionally not awaiting
        SdkBridge.setDataAsync(payload);
    }

    upsertPlayers(players: Iterable<any>) {
        for (const p of players) {
            this.upsertPlayer(p);
        }
    }

    findPlayer(id: string) {
        return this.players.get(id);
    }

    getAllSocialPlayers(): BasicSocialPlayer[] {
        return Array.from(this.players.values());
    }

    getPlayersExcept(exceptIds: string[]): BasicSocialPlayer[] {
        const res: BasicSocialPlayer[] = [];
        this.players.forEach((p) => {
            if (!exceptIds.includes(p.id)) {
                res.push(p);
            }
        });
        return res;
    }
}

export interface LeaderboardMember {
    id: string;
    score: number;
}

export class CachedLeaderboard {
    name: string = '';
    members: LeaderboardMember[] = [];
}

function upsertMember(board: CachedLeaderboard, playerId: string, score: number) {
    const found = board.members.find(m => m.id === playerId) || null;
    if (found) {
        found.score = score;
    } else {
        board.members.push({ id: playerId, score });
    }
    // keep only top 50 (0x32 = 50)
    if (board.members.length > 0x32) {
        board.members.pop();
    }
}

function sortLeaderboard(board: CachedLeaderboard) {
    board.members.sort((a, b) => b.score - a.score);
}

export class LeaderboardCacheManager {
    static storageKey: string = '';
    boards: Record<string, CachedLeaderboard> = {};

    static setStorageKey(key: string) {
        LeaderboardCacheManager.storageKey = key;
    }

    static getStorageKey() {
        return LeaderboardCacheManager.storageKey;
    }

    async saveToCloudAsync() {
        const payload: any = {};
        payload[LeaderboardCacheManager.storageKey] = this.boards;
        await SdkBridge.setDataAsync(payload);
    }

    async getFromCloudAsync() {
        const data = await SdkBridge.getDataAsync([LeaderboardCacheManager.storageKey]);
        const remote = data ? data[LeaderboardCacheManager.storageKey] : {};
        this.boards = Object.assign({}, this.boards, remote);
    }

    findLeaderboard(name: string): CachedLeaderboard | null {
        return this.boards ? this.boards[name] : null;
    }

    upsertScore(leaderboardName: string, playerId: string, score: number) {
        const board = this.findLeaderboard(leaderboardName);
        if (board) {
            upsertMember(board, playerId, score);
            sortLeaderboard(board);
        }
    }

    static trunkOfLeaderboardName(name: string) {
        const idx = name.lastIndexOf('.');
        return idx < 0 ? name : name.slice(0, idx);
    }

    async updateAccordLeaderboard(leaderboard: any) {
        const entries = (await leaderboard.getEntriesAsync(0x64, 0x0)) || [];
        return this.updateAccordLeaderboardEntries(leaderboard.getName(), entries);
    }

    updateAccordLeaderboardEntries(name: string, entries: any[]) {
        const trunk = LeaderboardCacheManager.trunkOfLeaderboardName(name);
        let cached = this.findLeaderboard(trunk);
        if (!cached) {
            cached = new CachedLeaderboard();
            cached.name = trunk;
            this.boards[trunk] = cached;
        }
        if (entries && entries.length) {
            for (const e of entries) {
                upsertMember(cached, e.getPlayer().getID(), e.getScore());
            }
        }
        sortLeaderboard(cached);
        this.writeToStorage();
    }

    writeToStorage() {
        StorageUtil.setItem(LeaderboardCacheManager.storageKey, this.boards);
    }

    readFromStorage() {
        this.boards = StorageUtil.getItem<Record<string, CachedLeaderboard>>(LeaderboardCacheManager.storageKey, {});
    }
}

export class SocialCacheManager {
    private leaderboardMgr: LeaderboardCacheManager = new LeaderboardCacheManager();
    private playerMgr: PlayerCacheManager = new PlayerCacheManager();

    static _instance: SocialCacheManager = new SocialCacheManager();

    static get I() {
        return SocialCacheManager._instance;
    }

    getLeaderboardManager() {
        return this.leaderboardMgr;
    }

    getPlayerManager() {
        return this.playerMgr;
    }

    writeToStorage() {
        this.leaderboardMgr.writeToStorage();
    }

    readFromStorage() {
        this.leaderboardMgr.readFromStorage();
    }

    static getInstance(){
        return SocialCacheManager._instance;
    }
}