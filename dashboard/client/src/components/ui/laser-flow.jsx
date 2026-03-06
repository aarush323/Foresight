import React, { useRef, useEffect } from 'react';

/**
 * LaserFlow Background Component
 * Animated wispy laser beam background effect with fog.
 * Compatible with the React Bits LaserFlow API.
 */
export default function LaserFlow({
    color = '#ffffff',
    wispDensity = 1.5,
    flowSpeed = 0.35,
    verticalSizing = 2.7,
    horizontalSizing = 3,
    fogIntensity = 0.45,
    fogScale = 0.3,
    wispSpeed = 15,
    wispIntensity = 5,
    flowStrength = 0.6,
    decay = 1.1,
    horizontalBeamOffset = 0,
}) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId;
        let width, height;
        let time = 0;

        const resize = () => {
            width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
            height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
        };

        window.addEventListener('resize', resize);
        resize();

        // Parse color to RGB
        const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16),
            } : { r: 255, g: 255, b: 255 };
        };

        const rgb = hexToRgb(color);
        const beamCount = Math.floor(8 * wispDensity);
        const wispCount = Math.floor(20 * wispDensity);

        // Generate beams
        const beams = Array.from({ length: beamCount }, (_, i) => ({
            y: (i / beamCount) * height,
            width: Math.random() * 3 + 1,
            speed: (Math.random() * 0.5 + 0.5) * flowSpeed,
            opacity: (Math.random() * 0.3 + 0.1) * wispIntensity * 0.1,
            phase: Math.random() * Math.PI * 2,
            amplitude: (Math.random() * 40 + 20) * verticalSizing * 0.3,
            offset: horizontalBeamOffset * width,
        }));

        // Generate wisps (floating particles)
        const wisps = Array.from({ length: wispCount }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 60 + 30,
            speedX: (Math.random() - 0.5) * wispSpeed * 0.1,
            speedY: (Math.random() - 0.5) * wispSpeed * 0.05,
            opacity: Math.random() * 0.08 * fogIntensity,
            phase: Math.random() * Math.PI * 2,
        }));

        const render = () => {
            time += 0.005 * flowSpeed;

            // Fade trail / clear
            ctx.fillStyle = `rgba(0, 0, 0, ${0.15 * decay})`;
            ctx.fillRect(0, 0, width, height);

            // Draw fog layer
            wisps.forEach((w) => {
                w.x += w.speedX;
                w.y += w.speedY;
                w.phase += 0.005;

                // Wrap around
                if (w.x < -w.size) w.x = width + w.size;
                if (w.x > width + w.size) w.x = -w.size;
                if (w.y < -w.size) w.y = height + w.size;
                if (w.y > height + w.size) w.y = -w.size;

                const fogAlpha = w.opacity * (0.7 + 0.3 * Math.sin(w.phase));
                const grad = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, w.size * fogScale * 3);
                grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${fogAlpha})`);
                grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
                ctx.fillStyle = grad;
                ctx.fillRect(w.x - w.size, w.y - w.size, w.size * 2, w.size * 2);
            });

            // Draw laser beams
            beams.forEach((beam) => {
                beam.phase += beam.speed * 0.02;
                const yBase = beam.y + beam.offset;

                ctx.beginPath();
                ctx.moveTo(0, yBase + Math.sin(beam.phase) * beam.amplitude);

                const segments = 60;
                for (let i = 1; i <= segments; i++) {
                    const px = (i / segments) * width;
                    const py = yBase +
                        Math.sin(beam.phase + (i / segments) * Math.PI * horizontalSizing) * beam.amplitude * flowStrength +
                        Math.cos(beam.phase * 1.5 + (i / segments) * Math.PI * 2) * beam.amplitude * 0.3;
                    ctx.lineTo(px, py);
                }

                // Glow effect
                ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${beam.opacity * 0.3})`;
                ctx.lineWidth = beam.width * 8;
                ctx.stroke();

                ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${beam.opacity * 0.6})`;
                ctx.lineWidth = beam.width * 3;
                ctx.stroke();

                ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${beam.opacity})`;
                ctx.lineWidth = beam.width;
                ctx.stroke();
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [color, wispDensity, flowSpeed, verticalSizing, horizontalSizing, fogIntensity, fogScale, wispSpeed, wispIntensity, flowStrength, decay, horizontalBeamOffset]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
            }}
        />
    );
}
