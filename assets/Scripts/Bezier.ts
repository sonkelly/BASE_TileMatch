import { _decorator, Vec3 } from 'cc';

export class BezierSegment {
    private mLength: number = 0;
    private A: number = 0;
    private B: number = 0;
    private C: number = 0;
    private m0: number = 0;
    private m1: number = 0;
    private m2: number = 0;
    private m3: number = 0;
    private p0: Vec3 = new Vec3();
    private p1: Vec3 = new Vec3();
    private p2: Vec3 = new Vec3();

    constructor(p0: Vec3, p1: Vec3, p2: Vec3) {
        const qx = p0.x - 2 * p1.x + p2.x;
        const qy = p0.y - 2 * p1.y + p2.y;
        const sx = 2 * (p1.x - p0.x);
        const sy = 2 * (p1.y - p0.y);
        
        const A = 4 * (qx * qx + qy * qy);
        const B = 4 * (qx * sx + qy * sy);
        const C = sx * sx + sy * sy;
        
        const sqrtC = Math.sqrt(C);
        const denominator = 8 * Math.pow(A, 1.5);
        const m0 = (B * B - 4 * A * C) / denominator;
        const m1 = 2 * Math.sqrt(A);
        const m2 = m1 / denominator;
        
        const temp1 = B + m1 * sqrtC;
        const m3 = m0 * Math.log(temp1 <= 0 ? 1e-7 : temp1) - B * m2 * sqrtC;
        
        const temp2 = A + B;
        const temp3 = A + temp2;
        const temp4 = C + temp2;
        const sqrtTemp4 = Math.sqrt(temp4 < 0 ? 0 : temp4);
        const temp5 = temp3 + m1 * sqrtTemp4;
        
        this.mLength = m3 - m0 * Math.log(temp5 <= 0 ? 1e-7 : temp5) + m2 * temp3 * sqrtTemp4;
        this.A = A;
        this.B = B;
        this.C = C;
        this.m0 = m0;
        this.m1 = m1;
        this.m2 = m2;
        this.m3 = m3;
        Vec3.copy(this.p0, p0);
        Vec3.copy(this.p1, p1);
        Vec3.copy(this.p2, p2);
    }

    getLength(): number {
        return this.mLength;
    }

    getPoint(t: number, out?: Vec3): Vec3 {
        let currentT = t;
        const targetLength = this.m3 - t * this.mLength;
        
        for (let i = 0; i < 7; ++i) {
            const tempA = this.A * currentT;
            const tempB = this.B + tempA;
            const tempC = tempB + tempA;
            const tempD = this.C + currentT * tempB;
            const sqrtTempD = Math.sqrt(tempD < 0 ? 0 : tempD);
            
            const tempE = tempC + this.m1 * sqrtTempD;
            const logTempE = Math.log(tempE <= 0 ? 1e-7 : tempE);
            const derivative = (targetLength - this.m0 * logTempE) / sqrtTempD + this.m2 * tempC;
            
            currentT -= derivative;
            if (Math.abs(derivative) < 0.01) {
                break;
            }
        }

        const t2 = currentT * currentT;
        const basis0 = 1 - 2 * currentT + t2;
        const basis1 = 2 * currentT - 2 * t2;
        const basis2 = t2;

        const x = basis0 * this.p0.x + basis1 * this.p1.x + basis2 * this.p2.x;
        const y = basis0 * this.p0.y + basis1 * this.p1.y + basis2 * this.p2.y;

        if (out) {
            return out.set(x, y, 0);
        }
        return new Vec3(x, y, 0);
    }
}

export class Bezier {
    private mMap: Array<{ first: number, second: BezierSegment }> = [];
    private mLength: number = 0;

    constructor(points: Vec3[]) {
        if (points.length < 3) {
            throw new Error('Bezier 曲线至少需要包含3个点!');
        }

        let totalLength = 0;
        let currentPoint = points[0];
        const segments: Array<{ first: number, second: BezierSegment }> = [];

        for (let i = 1; i < points.length - 2; i++) {
            const midPoint = new Vec3(
                (points[i].x + points[i + 1].x) / 2,
                (points[i].y + points[i + 1].y) / 2,
                0
            );

            const segment = new BezierSegment(currentPoint, points[i], midPoint);
            segments.push({
                first: totalLength,
                second: segment
            });

            totalLength += segment.getLength();
            currentPoint = midPoint;
        }

        const lastSegment = new BezierSegment(
            currentPoint, 
            points[points.length - 2], 
            points[points.length - 1]
        );
        
        segments.push({
            first: totalLength,
            second: lastSegment
        });
        
        totalLength += lastSegment.getLength();
        segments.sort(this.sortCmd);

        this.mMap = segments;
        this.mLength = totalLength;
    }

    private sortCmd(a: { first: number }, b: { first: number }): number {
        return a.first - b.first;
    }

    getLength(): number {
        return this.mLength;
    }

    getPoint(t: number, out?: Vec3): Vec3 {
        const targetLength = t * this.mLength;
        const index = Math.max(0, this.upperBound(targetLength) - 1);
        const segmentData = this.mMap[index];
        const segmentT = (targetLength - segmentData.first) / segmentData.second.getLength();
        
        return segmentData.second.getPoint(segmentT, out);
    }

    private upperBound(target: number): number {
        for (let i = 0; i < this.mMap.length; i++) {
            if (this.mMap[i].first > target) {
                return i;
            }
        }
        return this.mMap.length;
    }
}