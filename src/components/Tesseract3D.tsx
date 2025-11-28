"use client";

import React, { useEffect, useRef } from 'react';

class P4 {
    x: number;
    y: number;
    z: number;
    w: number;

    constructor(x: number, y: number, z: number, w: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }
}

const Tesseract3D = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = 120;
        let height = canvas.height = 120;

        // Tesseract Vertices
        const points: P4[] = [];
        for (let i = 0; i < 16; i++) {
            points.push(new P4(
                (i & 1) ? 1 : -1,
                (i & 2) ? 1 : -1,
                (i & 4) ? 1 : -1,
                (i & 8) ? 1 : -1
            ));
        }

        let angle = 0;

        const connect = (i: number, j: number, points2d: { x: number, y: number }[]) => {
            const a = points2d[i];
            const b = points2d[j];
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);

            // Neon gradient stroke
            const gradient = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            gradient.addColorStop(0, '#ff5315'); // Orange-Red
            gradient.addColorStop(1, '#ffa300'); // Amber

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            angle += 0.005;

            const projected3d: { x: number, y: number, z: number }[] = [];
            const projected2d: { x: number, y: number }[] = [];

            // Rotation Matrices
            // Rotate in ZW plane (The "inside-out" rotation)
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);

            // Rotate in XY plane (Spinning)
            const cos2 = Math.cos(angle * 0.5);
            const sin2 = Math.sin(angle * 0.5);

            // Rotate in XZ plane (3D rotation) - Adds more depth
            const cos3 = Math.cos(angle * 0.3);
            const sin3 = Math.sin(angle * 0.3);

            for (let i = 0; i < points.length; i++) {
                let p = points[i];

                // 4D Rotation (ZW)
                let z = p.z * cos - p.w * sin;
                let w = p.z * sin + p.w * cos;
                let x = p.x;
                let y = p.y;

                // 3D Rotation (XZ)
                let x_rot3 = x * cos3 - z * sin3;
                let z_rot3 = x * sin3 + z * cos3;
                x = x_rot3;
                z = z_rot3;

                // 2D Rotation (XY)
                let x_rot = x * cos2 - y * sin2;
                let y_rot = x * sin2 + y * cos2;
                x = x_rot;
                y = y_rot;

                // 4D to 3D Projection
                let distance = 3; // Camera distance from 4D object
                let w_inv = 1 / (distance - w);

                let p3 = {
                    x: x * w_inv,
                    y: y * w_inv,
                    z: z * w_inv
                };

                projected3d.push(p3);

                // 3D to 2D Projection
                let distance2 = 3; // Camera distance from 3D object
                let z_inv = 1 / (distance2 - p3.z);

                // Calculation for scale to match 80x80 canvas:
                // Max projected value (approx) at w=1, z=1 is ~0.2 units.
                // We want this to be ~36px (radius) to fill the 80px canvas with padding.
                // 0.2 * scale = 36 => scale = 180.
                let scale = 180;

                projected2d.push({
                    x: p3.x * z_inv * scale + width / 2,
                    y: p3.y * z_inv * scale + height / 2
                });
            }

            // Draw Edges
            for (let i = 0; i < 16; i++) {
                for (let j = i + 1; j < 16; j++) {
                    let diff = i ^ j;
                    if ((diff & (diff - 1)) === 0) {
                        connect(i, j, projected2d);
                    }
                }
            }

            requestAnimationFrame(animate);
        };

        animate();

    }, []);

    return (
        <div className="relative w-[80px] h-[80px] flex items-center justify-center">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-[#ff5315]/20 blur-xl rounded-full animate-pulse"></div>
            <canvas ref={canvasRef} width={120} height={120} className="relative z-10" />
        </div>
    );
};

export default Tesseract3D;
