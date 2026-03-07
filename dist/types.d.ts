export interface SceneData {
    start: number;
    end: number;
    type: SceneType;
    title: string;
    subtitle?: string;
    number?: string;
    highlight?: string;
    xiaomo?: XiaomoAction;
    color?: string;
    bgVideo?: string;
    bgOpacity?: number;
}
export type SceneType = 'title' | 'emphasis' | 'pain' | 'circle' | 'content' | 'end';
export type XiaomoAction = 'peek' | 'lie' | 'point' | 'circle' | 'think' | 'wave';
export interface VideoConfig {
    fps: number;
    width: number;
    height: number;
    durationInFrames: number;
    audioPath?: string;
    bgVideo?: string;
    bgOpacity?: number;
    bgOverlayColor?: string;
}
//# sourceMappingURL=types.d.ts.map