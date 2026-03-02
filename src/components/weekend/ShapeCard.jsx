import React from 'react';

// ── Shape configurations ──────────────────────────────────────────────────────
export const SHAPES = [
    { id: 'rectangle', label: 'Rectangle', icon: 'crop_landscape' },
    { id: 'square', label: 'Square', icon: 'crop_square' },
    { id: 'circle', label: 'Circle', icon: 'circle' },
    { id: 'rounded', label: 'Rounded', icon: 'rounded_corner' },
    { id: 'hexagon', label: 'Hexagon', icon: 'hexagon' },
    { id: 'diamond', label: 'Diamond', icon: 'diamond' },
    { id: 'triangle', label: 'Triangle', icon: 'change_history' },
    { id: 'pentagon', label: 'Pentagon', icon: 'pentagon' },
    { id: 'trapezoid', label: 'Trapezoid', icon: 'tab' },
    { id: 'star', label: 'Star', icon: 'star' },
    { id: 'parallelogram', label: 'Parallelogram', icon: 'recommend' },
];

// Shape styles that depend on clip-path need extra padding so clips don't swallow text.
// We separate "layout" shapes (flexible height) from "geometric" shapes (intrinsic ratio but padded).
const SHAPE_CLASSES = {
    rectangle: { className: 'rounded-2xl', padding: 'px-6 py-5' },
    square: { className: 'rounded-2xl', padding: 'px-6 py-6', square: true },
    circle: { className: 'rounded-full', padding: 'px-8 py-8', square: true },
    rounded: { className: 'rounded-[3rem]', padding: 'px-8 py-7' },
    hexagon: { clipPath: 'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)', padding: 'px-12 py-10', square: true },
    diamond: { clipPath: 'polygon(50% 5%, 97% 50%, 50% 95%, 3% 50%)', padding: 'px-10 py-12', square: true },
    triangle: { clipPath: 'polygon(50% 5%, 97% 95%, 3% 95%)', padding: 'px-10 pt-16 pb-6', square: true },
    pentagon: { clipPath: 'polygon(50% 3%, 97% 37%, 79% 97%, 21% 97%, 3% 37%)', padding: 'px-10 py-12', square: true },
    trapezoid: { clipPath: 'polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%)', padding: 'px-8 pt-4 pb-6' },
    star: { clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)', padding: 'px-12 py-14', square: true },
    parallelogram: { clipPath: 'polygon(12% 0%, 100% 0%, 88% 100%, 0% 100%)', padding: 'px-10 py-6' },
};

// ── Animation configs ──────────────────────────────────────────────────────────
export const ANIMATIONS = [
    { id: 'float', label: 'Float', icon: 'air' },
    { id: 'pulse', label: 'Pulse', icon: 'favorite' },
    { id: 'glow', label: 'Glow', icon: 'wb_sunny' },
    { id: 'spin-slow', label: 'Spin', icon: 'rotate_right' },
    { id: 'bounce', label: 'Bounce', icon: 'sports_basketball' },
    { id: 'flip', label: 'Flip', icon: 'flip' },
    { id: 'shake', label: 'Shake', icon: 'vibration' },
    { id: 'shimmer', label: 'Shimmer', icon: 'auto_awesome' },
    { id: 'none', label: 'None', icon: 'block' },
];

// ── Color gradients ────────────────────────────────────────────────────────────
export const GRADIENTS = [
    { id: 'from-amber-500 to-orange-600', label: 'Amber', preview: 'linear-gradient(135deg, #f59e0b, #ea580c)' },
    { id: 'from-rose-500 to-pink-600', label: 'Rose', preview: 'linear-gradient(135deg, #f43f5e, #db2777)' },
    { id: 'from-emerald-500 to-teal-600', label: 'Emerald', preview: 'linear-gradient(135deg, #10b981, #0d9488)' },
    { id: 'from-blue-500 to-indigo-600', label: 'Ocean', preview: 'linear-gradient(135deg, #3b82f6, #4f46e5)' },
    { id: 'from-purple-500 to-violet-600', label: 'Purple', preview: 'linear-gradient(135deg, #a855f7, #7c3aed)' },
    { id: 'from-[#3c1e0e] to-[#4B3832]', label: 'Coffee', preview: 'linear-gradient(135deg, #3c1e0e, #4B3832)' },
    { id: 'from-slate-700 to-slate-900', label: 'Dark', preview: 'linear-gradient(135deg, #334155, #0f172a)' },
    { id: 'from-lime-400 to-green-600', label: 'Lime', preview: 'linear-gradient(135deg, #a3e635, #16a34a)' },
];

// ── CSS keyframe animations ───────────────────────────────────────────────────
const ANIMATION_CSS = `
@keyframes shape-float {
  0%,100% { transform: translateY(0); }
  50%      { transform: translateY(-10px); }
}
@keyframes shape-glow {
  0%,100% { box-shadow: 0 0 18px rgba(251,146,60,.35); }
  50%      { box-shadow: 0 0 40px rgba(251,146,60,.7); }
}
@keyframes shape-spin-slow {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
@keyframes shape-shake {
  0%,100% { transform:rotate(0deg); }
  20%      { transform:rotate(-4deg); }
  40%      { transform:rotate(4deg); }
  60%      { transform:rotate(-2deg); }
  80%      { transform:rotate(2deg); }
}
@keyframes shape-flip {
  0%   { transform: rotateY(0deg); }
  50%  { transform: rotateY(180deg); }
  100% { transform: rotateY(360deg); }
}
@keyframes shape-shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
`;

const ANIM_STYLE = {
    float: { animation: 'shape-float 3s ease-in-out infinite' },
    pulse: { animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' },
    glow: { animation: 'shape-glow 2.5s ease-in-out infinite' },
    'spin-slow': { animation: 'shape-spin-slow 9s linear infinite' },
    bounce: { animation: 'bounce 1.5s infinite' },
    flip: { animation: 'shape-flip 5s ease-in-out infinite', transformStyle: 'preserve-3d' },
    shake: { animation: 'shape-shake 2.5s ease-in-out infinite' },
    shimmer: { backgroundSize: '200% auto', animation: 'shape-shimmer 2.5s linear infinite' },
    none: {},
};

// ── ShapeCard ─────────────────────────────────────────────────────────────────
export function ShapeCard({ card, isLocked = false, size = 'normal' }) {
    const {
        shape = 'rectangle',
        animation = 'float',
        color = 'from-amber-500 to-orange-600',
        title = '',
        body = '',
        imageUrl = '',
        type = 'text',
    } = card;

    const cfg = SHAPE_CLASSES[shape] || SHAPE_CLASSES.rectangle;
    const animStyle = ANIM_STYLE[animation] || {};

    // Font sizes by card size
    const titleSize = size === 'small' ? 'text-xs' : size === 'large' ? 'text-xl' : 'text-sm';
    const bodySize = size === 'small' ? 'text-[10px]' : size === 'large' ? 'text-base' : 'text-xs';

    // "Square" shapes: force equal width/height by wrapping in an aspect-square container
    // "Layout" shapes: just flow naturally
    const isGeometric = !!cfg.square;

    const inner = (
        <div
            className={`relative w-full bg-gradient-to-br ${color} text-white flex flex-col items-center justify-center overflow-hidden transition-all duration-500
                ${cfg.className || ''}
                ${cfg.padding}
                ${isLocked ? 'grayscale opacity-40' : ''}`}
            style={{
                ...(cfg.clipPath ? { clipPath: cfg.clipPath } : {}),
                ...animStyle,
            }}
        >
            {/* Decorative orb */}
            <div className="absolute top-[-20%] right-[-10%] w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />

            {/* Background image */}
            {type === 'text+image' && imageUrl && !isLocked && (
                <div className="absolute inset-0">
                    <img src={imageUrl} alt={title} className="w-full h-full object-cover opacity-25"
                        onError={e => { e.target.style.display = 'none'; }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
            )}

            {/* Lock */}
            {isLocked && (
                <span className="material-symbols-outlined text-4xl opacity-50 relative z-10">lock</span>
            )}

            {/* Content */}
            {!isLocked && (
                <div className="relative z-10 text-center space-y-2 w-full">
                    {title && (
                        <h3 className={`font-serif font-black uppercase tracking-tight leading-tight drop-shadow ${titleSize}`}>
                            {title}
                        </h3>
                    )}
                    {body && (
                        <p className={`font-medium opacity-90 leading-snug drop-shadow ${bodySize}`}>
                            {body}
                        </p>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: ANIMATION_CSS }} />
            {/* For geometric (square-ratio) shapes, wrap in an aspect-square so clip looks correct */}
            {isGeometric ? (
                <div className="aspect-square w-full max-w-[280px] mx-auto">
                    {React.cloneElement(inner, { className: inner.props.className + ' h-full w-full' })}
                </div>
            ) : (
                <div className="w-full">
                    {inner}
                </div>
            )}
        </>
    );
}
