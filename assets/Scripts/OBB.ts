import { _decorator, Component, Vec2, Size, cclegacy } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('OBB')
export class OBB {
    private _center: Vec2 = new Vec2();
    private _extents: number[] = [];
    private _axes: Vec2[] = [];
    private _width: number = 0;
    private _height: number = 0;
    private _rotation: number = 0;

    constructor(center?: Vec2, width?: number, height?: number, rotation?: number) {
        width = width || 0;
        height = height || 0;
        rotation = rotation || 0;
        
        this.center = center || new Vec2(0, 0);
        this._extents = [0.5 * width, 0.5 * height];
        this._axes = [
            new Vec2(Math.cos(rotation), Math.sin(rotation)),
            new Vec2(-Math.sin(rotation), Math.cos(rotation))
        ];
        this._width = width;
        this._height = height;
        this._rotation = rotation;
    }

    public getProjection(axis: Vec2): number {
        return this._extents[0] * Math.abs(axis.dot(this._axes[0])) + 
               this._extents[1] * Math.abs(axis.dot(this._axes[1]));
    }

    public intersects(other: OBB): boolean {
        const diff = new Vec2();
        Vec2.subtract(diff, this.center, other.center);
        
        const axis0 = this._axes[0];
        if (this.getProjection(axis0) + other.getProjection(axis0) <= Math.abs(diff.dot(axis0))) {
            return false;
        }

        const axis1 = this._axes[1];
        if (this.getProjection(axis1) + other.getProjection(axis1) <= Math.abs(diff.dot(axis1))) {
            return false;
        }

        const otherAxis0 = other._axes[0];
        if (this.getProjection(otherAxis0) + other.getProjection(otherAxis0) <= Math.abs(diff.dot(otherAxis0))) {
            return false;
        }

        const otherAxis1 = other._axes[1];
        if (this.getProjection(otherAxis1) + other.getProjection(otherAxis1) <= Math.abs(diff.dot(otherAxis1))) {
            return false;
        }

        return true;
    }

    public static intersects(a: OBB, b: OBB): boolean {
        return a.intersects(b);
    }

    public contains(point: Vec2): boolean {
        const relativePoint = new Vec2();
        Vec2.subtract(relativePoint, point, this.center);
        relativePoint.rotate(-this.rotation);
        
        return this.center.x - 0.5 * this._width <= relativePoint.x &&
               this.center.x + 0.5 * this._width >= relativePoint.x &&
               this.center.y - 0.5 * this._height <= relativePoint.y &&
               this.center.y + 0.5 * this._height >= relativePoint.y;
    }

    public get center(): Vec2 {
        return this._center;
    }

    public set center(value: Vec2) {
        this._center = value;
    }

    public get width(): number {
        return this._width;
    }

    public set width(value: number) {
        this._width = value;
        this._extents[0] = 0.5 * value;
    }

    public get height(): number {
        return this._height;
    }

    public set height(value: number) {
        this._height = value;
        this._extents[1] = 0.5 * value;
    }

    public get size(): Size {
        return new Size(this._width, this._height);
    }

    public set size(value: Size) {
        this._width = value.width;
        this._height = value.height;
        this._extents = [0.5 * value.width, 0.5 * value.height];
    }

    public get rotation(): number {
        return this._rotation;
    }

    public set rotation(value: number) {
        this._rotation = value;
        this._axes = [
            new Vec2(Math.cos(value), Math.sin(value)),
            new Vec2(-Math.sin(value), Math.cos(value))
        ];
    }
}