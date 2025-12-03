import { _decorator, Component, Node, Label, sp, Sprite, SpriteFrame, Button, Tween, v3, tween, easing, UITransform, Vec3, Color } from 'cc';
import { GameConst } from './GameConst';
import { UIPrefabs } from './Prefabs';
import {AvatarCfg} from './AvatarCfg';
import {RankNameCfg} from './RankNameCfg';
import {ToyRaceCfg} from './ToyRaceCfg';
import { RaceRewardIdx } from './MgrToyRace';
import {MgrUi} from './MgrUi';
import {MgrUser} from './MgrUser';

const { ccclass, property } = _decorator;

const ZERO_VEC = new Vec3();
const COLOR_SELF = new Color().fromHEX('#3A5EBB');
const COLOR_OTHER = new Color().fromHEX('#AE5A37');
const COLOR_OUTLINE = new Color().fromHEX('#2354BF');
const GIFT_ANIMATIONS = ['box3', 'box2', 'box1'];

@ccclass('ToyRaceViewItem')
export class ToyRaceViewItem extends Component {
    @property(Node)
    nameBgSelf: Node = null!;

    @property(Node)
    nameBgOther: Node = null!;

    @property(Node)
    playerRoot: Node = null!;

    @property(Node)
    waitMatchRoot: Node = null!;

    @property(Label)
    playerNameLabel: Label = null!;

    @property(Label)
    levelsLabel: Label = null!;

    @property(Node)
    car: Node = null!;

    @property(sp.Skeleton)
    carSpine: sp.Skeleton = null!;

    @property(Node)
    roadNode: Node = null!;

    @property(Sprite)
    rankIdSprite: Sprite = null!;

    @property(Node)
    rankBgNode: Node = null!;

    @property(Label)
    rankLabel: Label = null!;

    @property([SpriteFrame])
    rankBgSpriteFrames: SpriteFrame[] = [];

    @property(Node)
    giftNode: Node = null!;

    @property(Sprite)
    giftRankId: Sprite = null!;

    @property(sp.Skeleton)
    giftIcon: sp.Skeleton = null!;

    @property(Sprite)
    head: Sprite = null!;

    private _stepWidth: number = -1;
    private raceInfo: any = null;
    private itemIndex: number = -1;

    get stepWidth(): number {
        if (this._stepWidth < 0) {
            this._stepWidth = this.roadNode.getComponent(UITransform)!.width / GameConst.ToyRaceMaxProgress;
        }
        return this._stepWidth;
    }

    onLoad() {
        this.giftNode.on(Button.EventType.CLICK, this.onClickGift, this);
        this.rankIdSprite.node.on(Button.EventType.CLICK, this.onClickGift, this);
    }

    private onClickGift(event: any) {
        const rewardCfg = ToyRaceCfg.Instance.get(this.raceInfo.rank);
        if (rewardCfg) {
            const rewards = rewardCfg.rewards;
            MgrUi.Instance.openViewAsync(UIPrefabs.UIPopAssetList, {
                priority: 2,
                data: {
                    assets: rewards,
                    target: event.target
                }
            });
        }
    }

    refreshRank(level: number, rank: number) {
        if (rank > RaceRewardIdx) {
            this.giftNode.active = false;
            this.rankIdSprite.node.active = false;
            this.rankBgNode.active = level > 0 && level !== GameConst.ToyRaceMaxProgress;
            this.rankLabel.string = '' + rank;
            return;
        }

        this.giftNode.active = level === GameConst.ToyRaceMaxProgress;
        this.rankIdSprite.node.active = level > 0 && level !== GameConst.ToyRaceMaxProgress;
        this.rankBgNode.active = false;
    }

    playRankGift(rank: number, callback?: Function) {
        this.giftNode.active = true;
        this.rankIdSprite.node.active = false;
        this.rankBgNode.active = false;

        Tween.stopAllByTarget(this.giftIcon);
        this.giftIcon.node.scale = Vec3.ZERO;

        Tween.stopAllByTarget(this.giftNode);
        this.giftNode.setPosition(v3(160, 0, 0));

        tween(this.giftNode)
            .to(0.2, { position: v3(-65, 0, 0) }, { easing: easing.quadInOut })
            .call(() => this.playRankGiftOpen(rank, callback))
            .start();
    }

    private async loadHead() {
        this.head.spriteFrame = null;
        if (this.raceInfo.me) {
            this.head.spriteFrame = await AvatarCfg.Instance.loadHeadSpriteframe(MgrUser.Instance.userData.userHead);
        } else {
            this.head.spriteFrame = await AvatarCfg.Instance.loadHeadSpriteframe(this.raceInfo.head);
        }
    }

    setName(name: string, isMe: boolean) {
        this.playerNameLabel.string = name;
        if (isMe) {
            this.playerNameLabel.enableOutline = true;
            this.playerNameLabel.outlineColor = COLOR_OTHER;
            this.levelsLabel.color = COLOR_OTHER;
        } else {
            this.playerNameLabel.enableOutline = false;
            this.playerNameLabel.outlineColor = COLOR_OUTLINE;
            this.levelsLabel.color = COLOR_SELF;
        }
    }

    setRace(info: any) {
        const pos = ZERO_VEC.clone();
        const level = info.levels;

        if (level < GameConst.ToyRaceMaxProgress) {
            pos.x = level * this.stepWidth;
        } else {
            pos.x = 1000;
        }

        this.car.setPosition(pos);
        this.levelsLabel.string = '' + level;
        this.refreshRank(level, info.rank);
        this.playCarIdle(info.me === 1);

        const rank = info.rank;
        if (rank <= RaceRewardIdx) {
            this.rankIdSprite.spriteFrame = this.rankBgSpriteFrames[rank - 1];
            this.giftRankId.spriteFrame = this.rankBgSpriteFrames[rank - 1];
            if (level === GameConst.ToyRaceMaxProgress) {
                this.playRankGiftIdle(rank);
            }
        }
    }

    playMatched(info: any, callback?: Function) {
        const level = info.levels;
        const isMe = info.me === 1;

        Tween.stopAllByTarget(this.car);
        this.giftNode.active = false;
        this.rankIdSprite.node.active = false;
        this.rankBgNode.active = false;

        const pos = ZERO_VEC.clone();
        pos.x = -280;
        this.car.setPosition(pos);
        this.levelsLabel.string = '' + level;
        this.giftNode.active = false;

        this.playCarRun(isMe);

        tween(this.car)
            .to(0.7, { position: Vec3.ZERO }, { easing: easing.quadOut })
            .call(() => {
                this.playCarBreka(isMe);
                callback && callback();
            })
            .start();
    }

    playRace(info: any, callback?: Function) {
        const cacheLevel = info.cacheLvs;
        const currentLevel = info.levels;
        const rank = info.rank;
        const isMe = info.me === 1;

        Tween.stopAllByTarget(this.car);

        const startPos = ZERO_VEC.clone();
        startPos.x = cacheLevel * this.stepWidth;
        this.car.setPosition(startPos);
        this.levelsLabel.string = '' + cacheLevel;
        this.giftNode.active = false;
        this.rankIdSprite.node.active = currentLevel > 0;

        this.refreshRank(cacheLevel, rank);
        this.playCarRun(isMe);

        let duration = 0.3;
        const tweens: any[] = [];

        if (currentLevel - cacheLevel > 0) {
            const targetPos = ZERO_VEC.clone();
            targetPos.x = currentLevel * this.stepWidth;
            duration = 0.7;

            if (currentLevel === GameConst.ToyRaceMaxProgress) {
                tweens.push(tween(this.car).to(duration, { position: targetPos }, { easing: easing.quadIn }));
            } else {
                tweens.push(tween(this.car).to(duration, { position: targetPos }, { easing: easing.quadInOut }));
            }
        }

        if (currentLevel === GameConst.ToyRaceMaxProgress) {
            const finalPos = ZERO_VEC.clone();
            finalPos.x = 700;
            duration = 0.4;
            tweens.push(tween(this.car).to(duration, { position: finalPos }, { easing: easing.quadOut }));
        }

        const sequence = tween(this.car).sequence(...tweens);
        sequence.call(() => {
            this.levelsLabel.string = '' + currentLevel;
            this.playCarBreka(isMe);
            this.refreshRank(currentLevel, rank);

            if (rank <= RaceRewardIdx) {
                this.rankIdSprite.spriteFrame = this.rankBgSpriteFrames[rank - 1];
                this.giftRankId.spriteFrame = this.rankBgSpriteFrames[rank - 1];
                if (currentLevel === GameConst.ToyRaceMaxProgress) {
                    this.playRankGift(rank, callback);
                } else {
                    callback && callback();
                }
            } else {
                callback && callback();
            }
        }).start();
    }

    showPlayer(info: any) {
        this.raceInfo = info;
        this.playerRoot.active = true;
        this.waitMatchRoot.active = false;

        if (info.me) {
            this.setName(MgrUser.Instance.userData.userName, true);
        } else {
            const nameCfg = RankNameCfg.Instance.get(info.id);
            this.setName(nameCfg.name, false);
        }

        this.loadHead();
        this.nameBgOther.active = !info.me;
        this.nameBgSelf.active = !!info.me;
    }

    showWaitMatch() {
        this.playerRoot.active = false;
        this.waitMatchRoot.active = true;

        Tween.stopAllByTarget(this.waitMatchRoot);
        tween(this.waitMatchRoot)
            .by(3, { angle: -90 })
            .repeatForever()
            .start();
    }

    playCarIdle(isMe: boolean) {
        if (isMe) {
            this.carSpine.setAnimation(0, 'car_yellow_loop', true);
        } else {
            this.carSpine.setAnimation(0, 'car_blue_loop', true);
        }
    }

    playCarRun(isMe: boolean) {
        if (isMe) {
            this.carSpine.setAnimation(0, 'car_yellow_run', true);
        } else {
            this.carSpine.setAnimation(0, 'car_blue_run', true);
        }
    }

    playCarBreka(isMe: boolean) {
        if (isMe) {
            this.carSpine.setAnimation(0, 'car_yellow_brake', false);
        } else {
            this.carSpine.setAnimation(0, 'car_blue_brake', false);
        }

        this.carSpine.setCompleteListener(() => {
            this.carSpine.setCompleteListener(null);
            this.playCarIdle(isMe);
        });
    }

    private playRankGiftOpen(rank: number, callback?: Function) {
        tween(this.giftIcon.node)
            .to(0.2, { scale: v3(0.2, 0.2, 0.2) }, { easing: easing.backOut })
            .call(() => {
                this.giftIcon.setAnimation(0, GIFT_ANIMATIONS[rank - 1] + '_open', false);
                this.giftIcon.setCompleteListener(() => {
                    this.playRankGiftIdle(rank);
                    callback && callback();
                    this.giftIcon.setCompleteListener(null);
                });
            })
            .start();
    }

    playRankGiftIdle(rank: number) {
        this.giftIcon.setAnimation(0, GIFT_ANIMATIONS[rank - 1] + '_open_idle', true);
    }
}