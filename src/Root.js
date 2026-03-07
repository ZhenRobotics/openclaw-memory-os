import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Composition } from 'remotion';
import { CyberWireframe } from './CyberWireframe';
import { videoConfig } from './scenes-data';
export const RemotionRoot = () => {
    return (_jsx(_Fragment, { children: _jsx(Composition, { id: "Main", component: CyberWireframe, durationInFrames: videoConfig.durationInFrames, fps: videoConfig.fps, width: videoConfig.width, height: videoConfig.height, defaultProps: {} }) }));
};
