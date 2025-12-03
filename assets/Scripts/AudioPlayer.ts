import { _decorator, Component, AudioSource, AudioClip, Node, director, sys } from 'cc';
import { BUNDLE_NAMES } from './AssetRes';
import { AssetMgr } from './AssetMgr';
import {AsyncQueue} from './AsyncQueue';
import { GameConst } from './GameConst';
import { config } from './Config';

const { ccclass } = _decorator;

const STORAGE_KEY_SUFFIX = 'game_audio_data';
const MAX_PENDING = 10;

type PendingSound = {
    audioClip?: AudioClip | null;
    loop?: boolean;
};

@ccclass('AudioPlayer')
export class AudioPlayer extends Component {
    private static _instance: AudioPlayer | null = null;

    private _musicAudioSource: AudioSource | null = null;
    private _audios: Record<string, AudioClip> = {};
    private _audioSources: Map<string, AudioSource> = new Map();

    private _masterVolume: number = 1;
    private _musicVolume: number = 1;
    private _effectVolume: number = 1;
    private _musicSwitch: boolean = true;
    private _soundSwitch: boolean = true;
    private _vibrationSwitch: boolean = false;

    private head_: number = 0;
    private tail_: number = 0;
    private soundPending_: PendingSound[] = new Array(MAX_PENDING).fill(null).map(() => ({ audioClip: undefined, loop: false }));

    // ---------- Helpers ----------
    private static isNil<T>(v: T | null | undefined): v is null | undefined {
        return v === null || v === undefined;
    }

    private getAudioKey(clip: AudioClip) {
        return clip.nativeUrl;
    }

    public getAudioSource(clip: AudioClip): AudioSource | undefined {
        const key = this.getAudioKey(clip);
        return this._audioSources.get(key);
    }

    public getAndCreateAudioSource(clip: AudioClip): AudioSource {
        const key = this.getAudioKey(clip);
        let src = this._audioSources.get(key);
        if (AudioPlayer.isNil(src)) {
            src = this.node.addComponent(AudioSource);
            this._audioSources.set(key, src);
        }
        src.clip = clip;
        return src;
    }

    // ---------- Persistence ----------
    public load() {
        const raw = sys.localStorage.getItem(config.gameName + '_' + STORAGE_KEY_SUFFIX);
        if (raw) {
            let data: any = raw;
            if (typeof raw === 'string') {
                try {
                    data = JSON.parse(raw);
                } catch {
                    data = null;
                }
            }
            if (data) {
                this.setMasterVolume(data.volume_master);
                this.setMusicSwitch(1 == data.switch_music);
                this.setSoundSwitch(1 == data.switch_effect);
                this.setVibration(1 == data.switch_vibration);
                return;
            }
        }

        // defaults
        this.setMasterVolume(1);
        this.setMusicSwitch(true);
        this.setSoundSwitch(true);
        this.setVibration(false);
    }

    public setVibration(v: boolean) {
        this._vibrationSwitch = v;
        this.save();
    }

    public setMasterVolume(v: number) {
        if (v < 0) v = 0;
        else if (v > 1) v = 1;
        this._masterVolume = v;
        if (this._musicAudioSource) {
            this._musicAudioSource.volume = this._masterVolume * this._musicVolume * GameConst.BgmVolume;
        }
        this.save();
    }

    public setMusicSwitch(on: boolean) {
        this._musicSwitch = on;
        this._musicVolume = on ? 1 : 0;
        if (this._musicAudioSource) {
            this._musicAudioSource.volume = this._masterVolume * this._musicVolume * GameConst.BgmVolume;
        }
        this.save();
    }

    public setSoundSwitch(on: boolean) {
        this._soundSwitch = on;
        if (!on) {
            this.stopAllEffect();
            this._effectVolume = 0;
        } else {
            this._effectVolume = 1;
        }
        this.save();
    }

    public save() {
        const data = {
            volume_master: this.masterVolume,
            switch_music: this.musicSwitch,
            switch_effect: this.soundSwitch,
            switch_vibration: this.vibrationSwitch,
        };
        sys.localStorage.setItem(config.gameName + '_' + STORAGE_KEY_SUFFIX, JSON.stringify(data));
    }

    // ---------- Music ----------
    public async playMusic(target: string | AudioClip, bundleName: string = BUNDLE_NAMES.Game) {
        let clip: AudioClip | undefined;
        if (typeof target === 'string') {
            const res = await AssetMgr.Instance.loadAsync(bundleName, target, AudioClip);
            clip = res?.assets;
        } else {
            clip = target;
        }
        if (!clip || !this._musicAudioSource) return;
        this._musicAudioSource.stop();
        this._musicAudioSource.clip = clip;
        this._musicAudioSource.loop = true;
        this._musicAudioSource.play();
    }

    public async playMusicOnce(target: string | AudioClip, cb: (() => void) = () => {}, bundleName: string = BUNDLE_NAMES.Game) {
        let clip: AudioClip | undefined;
        if (typeof target === 'string') {
            const res = await AssetMgr.Instance.loadAsync(bundleName, target, AudioClip);
            clip = res?.assets;
        } else {
            clip = target;
        }
        if (!clip || !this._musicAudioSource) {
            cb && cb();
            return;
        }
        this._musicAudioSource.stop();
        this._musicAudioSource.clip = clip;
        this._musicAudioSource.loop = false;
        this._musicAudioSource.play();
        this._musicAudioSource.node.once(AudioSource.EventType.ENDED, () => {
            cb && cb();
        }, this);
    }

    public stopMusic() {
        this._musicAudioSource && this._musicAudioSource.stop();
    }

    public pauseMusic() {
        this._musicAudioSource && this._musicAudioSource.pause();
    }

    public resumeMusic() {
        this._musicAudioSource && this._musicAudioSource.play();
    }

    // ---------- Effects ----------
    public isPlaying(target: string | AudioClip): boolean {
        let clip: AudioClip | undefined | null;
        if (typeof target === 'string') {
            clip = this._audios[target];
        } else {
            clip = target;
        }
        if (AudioPlayer.isNil(clip)) return false;

        for (let i = this.head_; i !== this.tail_; i = (i + 1) % MAX_PENDING) {
            const pending = this.soundPending_[i];
            if (pending && pending.audioClip === clip) {
                return true;
            }
        }
        return false;
    }

    public playUniqueEffect(key: string, loop: boolean = false, bundleName: string = BUNDLE_NAMES.Game) {
        if (!this.isPlaying(key)) {
            this.playEffect(key, loop, bundleName);
        }
    }

    public async playEffect(key: string, loop: boolean = false, bundleName: string = BUNDLE_NAMES.Game) {
        if (!this.soundSwitch) return;
        const res = await AssetMgr.Instance.loadAsync(bundleName, key, AudioClip);
        const clip = res?.assets;
        if (clip) {
            this._audios[key] = clip;
            this._addSoundToPending(clip, loop);
        }
    }

    public playQueueEffect(list: string[], bundleName: string = BUNDLE_NAMES.Game) {
        if (!this.soundSwitch) return;
        if (!list || list.length === 0) return;

        const q = new AsyncQueue();
        for (const item of list) {
            q.push(async (done: () => void) => {
                const res = await AssetMgr.Instance.loadAsync(bundleName, item, AudioClip);
                const clip = res?.assets;
                if (clip) {
                    this._audios[item] = clip;
                    this._addSoundToPending(clip, false);
                    // wait clip duration, then continue
                    this.scheduleOnce(() => {
                        done();
                    }, clip.getDuration());
                } else {
                    done();
                }
            });
        }
        q.complete = () => {};
        q.play();
    }

    public playAudio(clip: AudioClip, loop: boolean = false) {
        if (!this.soundSwitch) return;
        this._addSoundToPending(clip, loop);
    }

    public stopAllEffect() {
        this.head_ = this.tail_;
    }

    public stopEffect(target: string | AudioClip) {
        let clip: AudioClip | undefined | null;
        if (typeof target === 'string') {
            clip = this._audios[target];
        } else {
            clip = target;
        }
        if (clip) {
            this._stopSound(clip);
        }
    }

    private _addSoundToPending(clip: AudioClip, loop: boolean) {
        if ((this.tail_ + 1) % MAX_PENDING !== this.head_) {
            // avoid duplicate pending
            for (let i = this.head_; i !== this.tail_; i = (i + 1) % MAX_PENDING) {
                const p = this.soundPending_[i];
                if (p && p.audioClip === clip) {
                    return;
                }
            }
            this.soundPending_[this.tail_] = { audioClip: clip, loop };
            this.tail_ = (this.tail_ + 1) % MAX_PENDING;
        }
    }

    private _startSound(clip: AudioClip, loop: boolean | undefined) {
        let vol = this._masterVolume * this._effectVolume * GameConst.SoundVolume;
        if (!this._soundSwitch) vol = 0;
        const src = this.getAndCreateAudioSource(clip);
        src.volume = vol;
        src.loop = !!loop;
        src.play();
    }

    private _stopSound(clip: AudioClip) {
        const src = this.getAudioSource(clip);
        if (src) src.stop();

        for (let i = this.head_; i !== this.tail_; i = (i + 1) % MAX_PENDING) {
            const p = this.soundPending_[i];
            if (p && p.audioClip === clip) {
                // move last pending into this slot and shrink tail
                const lastIndex = (this.tail_ + MAX_PENDING - 1) % MAX_PENDING;
                this.soundPending_[i] = this.soundPending_[lastIndex];
                this.soundPending_[lastIndex] = { audioClip: undefined, loop: false };
                this.tail_ = lastIndex;
                break;
            }
        }
    }

    lateUpdate(dt: number) {
        while (this.head_ !== this.tail_) {
            const pending = this.soundPending_[this.head_];
            if (pending && pending.audioClip) {
                this._startSound(pending.audioClip, pending.loop);
            }
            this.head_ = (this.head_ + 1) % MAX_PENDING;
        }
    }

    // ---------- Getters ----------
    get masterVolume() {
        return this._masterVolume;
    }

    get musicVolume() {
        return this._musicVolume;
    }

    get effectVolume() {
        return this._effectVolume;
    }

    get musicSwitch() {
        return this._musicSwitch;
    }

    get soundSwitch() {
        return this._soundSwitch;
    }

    get vibrationSwitch() {
        return this._vibrationSwitch;
    }

    // ---------- Singleton ----------
    public static get Instance(): AudioPlayer {
        if (this._instance == null) {
            const node = new Node('AudioManager');
            director.addPersistRootNode(node);
            this._instance = node.addComponent(AudioPlayer);
            this._instance._musicAudioSource = node.addComponent(AudioSource);
            this._instance.load();
        }
        return this._instance!;
    }
}