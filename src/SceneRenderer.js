import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Video, staticFile } from 'remotion';
export const SceneRenderer = ({ scene }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    // Animation logic based on scene type
    const getAnimation = () => {
        switch (scene.type) {
            case 'title':
                return getTitleAnimation(frame, fps);
            case 'emphasis':
                return getEmphasisAnimation(frame, fps);
            case 'pain':
                return getPainAnimation(frame, fps);
            case 'circle':
                return getCircleAnimation(frame, fps);
            case 'end':
                return getEndAnimation(frame, fps);
            default:
                return getContentAnimation(frame, fps);
        }
    };
    const animation = getAnimation();
    return (_jsxs(AbsoluteFill, { style: { justifyContent: 'center', alignItems: 'center' }, children: [scene.bgVideo && (_jsxs(_Fragment, { children: [_jsx(Video, { src: staticFile(scene.bgVideo), style: {
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: scene.bgOpacity ?? 0.3,
                            zIndex: 0,
                        }, volume: 0, loop: true }), _jsx(AbsoluteFill, { style: { backgroundColor: 'rgba(10, 10, 15, 0.6)', zIndex: 1 } })] })), _jsx("div", { style: {
                    fontSize: 80,
                    fontWeight: 'bold',
                    color: scene.color || '#FFFFFF',
                    textAlign: 'center',
                    whiteSpace: 'pre-line',
                    transform: `scale(${animation.scale}) translateY(${animation.translateY}px)`,
                    opacity: animation.opacity,
                    textShadow: scene.type === 'title' ? animation.glitch : '0 4px 8px rgba(0,0,0,0.5)',
                    position: 'relative',
                    zIndex: 2,
                }, children: highlightText(scene.title, scene.highlight) }), scene.subtitle && (_jsx("div", { style: {
                    fontSize: 40,
                    color: '#888888',
                    textAlign: 'center',
                    whiteSpace: 'pre-line',
                    marginTop: 40,
                    opacity: interpolate(frame, [5, 15], [0, 1], { extrapolateRight: 'clamp' }),
                    position: 'relative',
                    zIndex: 2,
                }, children: highlightText(scene.subtitle, scene.highlight) })), scene.number && (_jsx("div", { style: {
                    fontSize: 120,
                    fontWeight: 'bold',
                    color: '#FFD700',
                    position: 'absolute',
                    top: '40%',
                    transform: `scale(${spring({ frame, fps, from: 0, to: 1 })})`,
                    zIndex: 2,
                }, children: scene.number })), scene.xiaomo && (_jsx("div", { style: {
                    position: 'absolute',
                    bottom: 100,
                    right: 100,
                    fontSize: 60,
                    zIndex: 2,
                }, children: getXiaomoEmoji(scene.xiaomo) }))] }));
};
// Animation functions
function getTitleAnimation(frame, fps) {
    const glitchAmount = Math.sin(frame * 0.5) * 3;
    return {
        scale: spring({ frame, fps, from: 0.8, to: 1 }),
        translateY: 0,
        opacity: 1,
        glitch: `${glitchAmount}px 0 0 rgba(255, 0, 0, 0.7), ${-glitchAmount}px 0 0 rgba(0, 255, 255, 0.7)`,
    };
}
function getEmphasisAnimation(frame, fps) {
    return {
        scale: spring({ frame, fps, from: 1.5, to: 1, config: { damping: 10 } }),
        translateY: 0,
        opacity: 1,
        glitch: '',
    };
}
function getPainAnimation(frame, fps) {
    return {
        scale: 1,
        translateY: interpolate(frame, [0, 10], [-50, 0], { extrapolateRight: 'clamp' }),
        opacity: interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' }),
        glitch: '',
    };
}
function getCircleAnimation(frame, fps) {
    return {
        scale: 1,
        translateY: 0,
        opacity: 1,
        glitch: '',
    };
}
function getContentAnimation(frame, fps) {
    return {
        scale: 1,
        translateY: 0,
        opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' }),
        glitch: '',
    };
}
function getEndAnimation(frame, fps) {
    return {
        scale: spring({ frame, fps, from: 0.5, to: 1 }),
        translateY: 0,
        opacity: 1,
        glitch: '',
    };
}
// Helper function to highlight specific text
function highlightText(text, highlight) {
    if (!highlight)
        return text;
    const parts = text.split(highlight);
    return (_jsx(_Fragment, { children: parts.map((part, index) => (_jsxs(React.Fragment, { children: [part, index < parts.length - 1 && (_jsx("span", { style: { color: '#00FFFF' }, children: highlight }))] }, index))) }));
}
// Placeholder mascot emojis (will be replaced with SVG later)
function getXiaomoEmoji(action) {
    const emojis = {
        peek: '👀',
        lie: '😺',
        point: '👉',
        circle: '⭕',
        think: '🤔',
        wave: '👋',
    };
    return emojis[action] || '🐱';
}
