import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Sequence, Audio, Video, staticFile, } from 'remotion';
import { scenes, videoConfig } from './scenes-data';
import { SceneRenderer } from './SceneRenderer';
export const CyberWireframe = ({ audioPath, bgVideo, bgOpacity, bgOverlayColor }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const currentTime = frame / fps;
    // Use prop values if provided, otherwise fall back to videoConfig
    const finalAudioPath = audioPath || videoConfig.audioPath;
    const finalBgVideo = bgVideo || videoConfig.bgVideo;
    const finalBgOpacity = bgOpacity !== undefined ? bgOpacity : (videoConfig.bgOpacity ?? 0.3);
    const finalBgOverlayColor = bgOverlayColor || videoConfig.bgOverlayColor || 'rgba(10, 10, 15, 0.6)';
    return (_jsxs(AbsoluteFill, { style: {
            backgroundColor: '#0A0A0F', // Dark background (fallback)
            fontFamily: 'Arial, sans-serif',
        }, children: [finalBgVideo && (_jsx(Video, { src: staticFile(finalBgVideo), style: {
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: finalBgOpacity,
                }, volume: 0, loop: true })), finalBgVideo && (_jsx(AbsoluteFill, { style: { backgroundColor: finalBgOverlayColor } })), finalAudioPath && (_jsx(Audio, { src: staticFile(finalAudioPath) })), scenes.map((scene, index) => {
                const startFrame = Math.round(scene.start * fps);
                const durationInFrames = Math.round((scene.end - scene.start) * fps);
                return (_jsx(Sequence, { from: startFrame, durationInFrames: durationInFrames, children: _jsx(SceneRenderer, { scene: scene }) }, index));
            }), _jsxs("div", { style: {
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    color: 'rgba(255, 255, 255, 0.3)',
                    fontSize: 14,
                }, children: [currentTime.toFixed(2), "s"] })] }));
};
