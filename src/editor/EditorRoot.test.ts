import { describe, expect, it } from "vitest";
import { buildTransitionOptionMarkup, transitionOptions } from "../renderer/transitions";
import {
  clamp,
  computeSceneSeekTime,
  formatTime,
  formatPlaybackTimeRange,
  clampPlaylistViewportStart,
  getClipPercent,
  getMinimumClipWidthPercent,
  buildPlaylistClipTitle,
  getVisibleClipRange,
  normalizeLoopRange,
  buildEditorTimelineTracks,
  getSceneTimelineClips,
  getPlaylistScrollbarMetrics,
  getMainSlotSelection,
  applyMainSlotSelection,
  getNewSceneTimeRange,
  getNextNewSectionName,
  getRandomEffectParams,
  getRandomEffectSelection,
  getScenePlayingAtTime,
  isWithinSceneStartThreshold,
  layoutPlaylistTracks,
  panPlaylistViewport,
  stripSceneEnds,
  zoomPlaylistViewport,
  isEditorParamToggleChecked,
  clampEditorNumberParam,
  stepEditorNumberParam,
  parseEditorParamInputValue,
  splitCueWords,
  generateWordTextCues,
  sortScenesForEditorList,
  ensureAutomationPoints,
  buildAutomationTrackPolyline,
  zoomPlaylistTrackHeight,
  getPlaylistClipTop,
  getCueMarkerTopOffset,
  getCueDurationBarTop,
  resizePlaylistTrackHeightFromScrollbar,
  roundTimelineSeconds,
  hasTimelineTimeChanged,
  getResizePreviewOffset,
  updateInspectorAccordionState,
  textCueFontOptions,
  clampWorkspaceTopRatio,
  getWorkspaceTopRatioFromPointer,
  getWorkspaceTopHeightPx,
  getNormalizedPreviewPoint,
  getPreviewSurfaceSize
} from "./EditorRoot";

describe("formatTime", () => {
  it("formats seconds to mm:ss.t", () => {
    expect(formatTime(0)).toBe("00:00.0");
    expect(formatTime(65.34)).toBe("01:05.3");
  });

  it("clamps invalid or negative values to zero", () => {
    expect(formatTime(-2)).toBe("00:00.0");
    expect(formatTime(Number.NaN)).toBe("00:00.0");
  });
});

describe("formatPlaybackTimeRange", () => {
  it("formats current and total time into a single transport label", () => {
    expect(formatPlaybackTimeRange(229.7, 382.9)).toBe("03:49.7 / 06:22.9");
  });
});

describe("getPreviewSurfaceSize", () => {
  it("shrinks preview to fit available height while preserving 16:9 ratio", () => {
    const size = getPreviewSurfaceSize(900, 200);
    expect(size.width).toBeCloseTo(355.56, 2);
    expect(size.height).toBe(200);
  });

  it("caps preview width at 720 and returns zero size for invalid input", () => {
    expect(getPreviewSurfaceSize(2000, 900)).toEqual({ width: 720, height: 405 });
    expect(getPreviewSurfaceSize(0, 500)).toEqual({ width: 0, height: 0 });
  });
});

describe("getClipPercent", () => {
  it("returns clip left and width percentage from start/end/duration", () => {
    expect(getClipPercent(10, 30, 100)).toEqual({ left: 10, width: 20 });
  });

  it("clamps overflow values to timeline bounds", () => {
    expect(getClipPercent(-5, 140, 100)).toEqual({ left: 0, width: 100 });
  });
});

describe("getMinimumClipWidthPercent", () => {
  it("converts pixel minimum width to a percent of the timeline width", () => {
    expect(getMinimumClipWidthPercent(45, 800, 2)).toBeCloseTo(0.25);
  });

  it("returns zero for invalid dimensions", () => {
    expect(getMinimumClipWidthPercent(0, 800)).toBe(0);
    expect(getMinimumClipWidthPercent(45, 0)).toBe(0);
  });
});

describe("buildPlaylistClipTitle", () => {
  it("builds a multiline tooltip with scene, effect, and time range", () => {
    expect(buildPlaylistClipTitle("Scene 7", "rain", 65.1, 70.4)).toBe(
      "Scene: Scene 7\nEffect: rain\nTime: 01:05.1 → 01:10.4"
    );
  });
});

describe("getVisibleClipRange", () => {
  it("clips ranges to the viewport bounds", () => {
    expect(getVisibleClipRange(10, 20, 12, 18)).toEqual({ start: 12, end: 18 });
  });

  it("returns null when clip is fully outside viewport", () => {
    expect(getVisibleClipRange(1, 2, 3, 4)).toBeNull();
    expect(getVisibleClipRange(6, 7, 3, 4)).toBeNull();
  });
});

describe("normalizeLoopRange", () => {
  it("orders start and end timestamps from any drag direction", () => {
    expect(normalizeLoopRange(22, 10)).toEqual({ start: 10, end: 22 });
  });

  it("returns null for tiny or invalid ranges", () => {
    expect(normalizeLoopRange(3, 3.01)).toBeNull();
    expect(normalizeLoopRange(Number.NaN, 3)).toBeNull();
  });
});

describe("clamp", () => {
  it("prevents values below min and above max", () => {
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
    expect(clamp(4, 0, 10)).toBe(4);
  });
});

describe("workspace splitter helpers", () => {
  it("clamps workspace top ratio into allowed bounds", () => {
    expect(clampWorkspaceTopRatio(-1)).toBe(0.2);
    expect(clampWorkspaceTopRatio(1.5)).toBe(0.8);
    expect(clampWorkspaceTopRatio(0.42)).toBe(0.42);
    expect(clampWorkspaceTopRatio(Number.NaN)).toBe(0.5);
  });

  it("computes workspace top ratio from pointer position", () => {
    const rect = { top: 100, height: 400 } as DOMRect;
    expect(getWorkspaceTopRatioFromPointer(300, rect)).toBe(0.5);
    expect(getWorkspaceTopRatioFromPointer(50, rect)).toBe(0.2);
    expect(getWorkspaceTopRatioFromPointer(600, rect)).toBe(0.8);
  });

  it("computes a constrained pixel height for the top workspace row", () => {
    expect(getWorkspaceTopHeightPx(900, 0.5)).toBe(450);
    expect(getWorkspaceTopHeightPx(400, 0.9)).toBe(180);
    expect(getWorkspaceTopHeightPx(1200, 0.95)).toBe(940);
  });
});

describe("getNormalizedPreviewPoint", () => {
  const previewRect = { left: 100, top: 50 } as DOMRect;
  const drawRect = { x: 20, y: 10, width: 200, height: 100 };

  it("maps pointer coordinates to normalized cue coordinates", () => {
    expect(getNormalizedPreviewPoint(220, 110, previewRect, drawRect)).toEqual({ x: 0.5, y: 0.5 });
  });

  it("returns null when pointer is outside the rendered preview frame", () => {
    expect(getNormalizedPreviewPoint(100, 110, previewRect, drawRect)).toBeNull();
    expect(getNormalizedPreviewPoint(220, 40, previewRect, drawRect)).toBeNull();
  });
});

describe("timeline rounding helpers", () => {
  it("rounds seconds to millisecond precision", () => {
    expect(roundTimelineSeconds(1.23456)).toBe(1.235);
    expect(roundTimelineSeconds(2.0004)).toBe(2);
  });

  it("only reports meaningful timeline changes after millisecond rounding", () => {
    expect(hasTimelineTimeChanged(12.3454, 12.34549)).toBe(false);
    expect(hasTimelineTimeChanged(12.3454, 12.3462)).toBe(true);
  });
});

describe("getResizePreviewOffset", () => {
  it("normalizes a timeline time into viewport ratio", () => {
    expect(getResizePreviewOffset(15, 10, 20)).toBe(0.25);
  });

  it("clamps offsets to the visible viewport", () => {
    expect(getResizePreviewOffset(5, 10, 20)).toBe(0);
    expect(getResizePreviewOffset(35, 10, 20)).toBe(1);
  });
});

describe("updateInspectorAccordionState", () => {
  it("updates only the requested accordion panel key", () => {
    const next = updateInspectorAccordionState(
      { basic: false, "main-slots": true, transition: false },
      "transition",
      true
    );
    expect(next).toEqual({ basic: false, "main-slots": true, transition: true });
  });
});

describe("getPlaylistClipTop", () => {
  it("returns a track-index based top offset expression", () => {
    expect(getPlaylistClipTop(0)).toBe("calc(0 * var(--editor-playlist-track-height) + 0.25rem)");
    expect(getPlaylistClipTop(3)).toBe("calc(3 * var(--editor-playlist-track-height) + 0.25rem)");
  });
});

describe("getCueMarkerTopOffset", () => {
  it("cycles cue markers across sub-rows", () => {
    expect(getCueMarkerTopOffset(0, 3)).toBe("calc(0.08695652173913045 * var(--editor-playlist-track-height))");
    expect(getCueMarkerTopOffset(1, 3)).toBe("calc(0.32608695652173914 * var(--editor-playlist-track-height))");
    expect(getCueMarkerTopOffset(2, 3)).toBe("calc(0.5652173913043479 * var(--editor-playlist-track-height))");
    expect(getCueMarkerTopOffset(3, 3)).toBe("calc(0.08695652173913045 * var(--editor-playlist-track-height))");
  });
});

describe("getCueDurationBarTop", () => {
  it("aligns duration bars to the marker rows for each cue", () => {
    expect(getCueDurationBarTop(0)).toBe("calc(0.1565217391304348 * var(--editor-playlist-track-height))");
    expect(getCueDurationBarTop(1)).toBe("calc(0.3956521739130435 * var(--editor-playlist-track-height))");
    expect(getCueDurationBarTop(2)).toBe("calc(0.6347826086956522 * var(--editor-playlist-track-height))");
  });
});

describe("buildEditorTimelineTracks", () => {
  it("creates scene, layer, and automation tracks for the selected scene", () => {
    const tracks = buildEditorTimelineTracks(
      {
        id: "scene-a",
        start: 10,
        effect: "starfield",
        layers: [{ effect: "feedback" }, { effect: "rain" }],
        automation: [{ param: "speed", from: 0.2, to: 1, start: 10.5, end: 12.5, ease: "linear" }]
      },
      14,
      true
    );

    expect(tracks.map((track) => track.kind)).toEqual(["text-cues", "scene", "layer", "layer", "automation"]);
    expect(tracks[1]).toMatchObject({ start: 10, end: 14 });
    expect(tracks[4]).toMatchObject({ start: 10.5, end: 12.5 });
  });

  it("returns an empty list when no scene is selected", () => {
    expect(buildEditorTimelineTracks(null, 0, false)).toEqual([]);
  });

  it("shows a global text cue track even without scene selection", () => {
    expect(buildEditorTimelineTracks(null, 0, true)).toEqual([
      { id: "text-cues:global", label: "Text Cues", kind: "text-cues", start: 0, end: 0 }
    ]);
  });
});

describe("getSceneTimelineClips", () => {
  it("returns sorted scene clips with computed end values", () => {
    const clips = getSceneTimelineClips(
      [
        { id: "b", start: 20, effect: "rain" },
        { id: "a", start: 10, effect: "starfield" }
      ],
      (scene) => (scene.id === "a" ? 18 : 25)
    );

    expect(clips).toEqual([
      { sceneId: "a", start: 10, end: 18 },
      { sceneId: "b", start: 20, end: 25 }
    ]);
  });
});

describe("sortScenesForEditorList", () => {
  const scenes = [
    { id: "Scene Z", start: 20, effect: "rain" },
    { id: "Scene A", start: 10, effect: "plasma" },
    { id: "Scene M", start: 15, effect: "starfield" }
  ];

  it("keeps timeline.json ordering when mode is timeline", () => {
    expect(sortScenesForEditorList(scenes, "timeline").map((scene) => scene.id)).toEqual([
      "Scene Z",
      "Scene A",
      "Scene M"
    ]);
  });

  it("sorts scenes alphabetically by id", () => {
    expect(sortScenesForEditorList(scenes, "alphabetical").map((scene) => scene.id)).toEqual([
      "Scene A",
      "Scene M",
      "Scene Z"
    ]);
  });

  it("sorts scenes by start time", () => {
    expect(sortScenesForEditorList(scenes, "start-time").map((scene) => scene.id)).toEqual([
      "Scene A",
      "Scene M",
      "Scene Z"
    ]);
  });
});

describe("computeSceneSeekTime", () => {
  it("subtracts audio offset from the scene start", () => {
    expect(computeSceneSeekTime(18.5, 2)).toBe(16.5);
  });

  it("clamps to zero when offset exceeds scene start", () => {
    expect(computeSceneSeekTime(1, 4)).toBe(0);
  });

  it("accepts scene start values provided as timeline strings", () => {
    expect(computeSceneSeekTime("00:12.5", 2.5)).toBe(10);
  });
});

describe("ensureAutomationPoints", () => {
  it("derives default two-point clip data from legacy from/to and t0/t1 values", () => {
    const next = ensureAutomationPoints({
      param: "speed",
      from: 0.2,
      to: 0.8,
      t0: "00:10.0",
      t1: "00:12.0"
    });
    expect(next.points).toEqual([
      { time: 10, value: 0.2 },
      { time: 12, value: 0.8 }
    ]);
    expect(next.segmentMeta).toEqual([{ curveType: "Linear", tension: 0 }]);
  });
});

describe("buildAutomationTrackPolyline", () => {
  it("maps point time/value pairs into SVG polyline coordinates", () => {
    const polyline = buildAutomationTrackPolyline(
      [
        { time: 10, value: 0 },
        { time: 15, value: 0.5 },
        { time: 20, value: 1 }
      ],
      { start: 10, end: 20 },
      100,
      50
    );
    expect(polyline).toBe("0,50 50,25 100,0");
  });
});

describe("zoomPlaylistTrackHeight", () => {
  it("zooms and clamps vertical track height", () => {
    expect(zoomPlaylistTrackHeight(3.5, 1.2)).toBeCloseTo(4.2);
    expect(zoomPlaylistTrackHeight(3.5, 0.5)).toBeCloseTo(1.75);
    expect(zoomPlaylistTrackHeight(7.5, 2)).toBe(12);
    expect(zoomPlaylistTrackHeight(1.7, 0.1)).toBe(1.2);
  });
});

describe("resizePlaylistTrackHeightFromScrollbar", () => {
  it("matches horizontal-scrollbar style edge semantics for vertical zoom", () => {
    expect(resizePlaylistTrackHeightFromScrollbar(3.5, "end", 0.1)).toBeLessThan(3.5);
    expect(resizePlaylistTrackHeightFromScrollbar(3.5, "end", -0.1)).toBeGreaterThan(3.5);
    expect(resizePlaylistTrackHeightFromScrollbar(3.5, "start", 0.1)).toBeGreaterThan(3.5);
    expect(resizePlaylistTrackHeightFromScrollbar(3.5, "start", -0.1)).toBeLessThan(3.5);
  });

  it("clamps resized track height to configured zoom bounds", () => {
    expect(resizePlaylistTrackHeightFromScrollbar(12, "start", 0.9)).toBe(12);
    expect(resizePlaylistTrackHeightFromScrollbar(1.2, "end", 0.9)).toBe(1.2);
  });
});

describe("getScenePlayingAtTime", () => {
  const scenes = [
    { id: "intro", start: 0, end: 10, effect: "starfield" },
    { id: "middle", start: 10, effect: "starfield" },
    { id: "ending", start: 20, end: 24, effect: "starfield" }
  ];

  it("returns the scene containing the demo time", () => {
    expect(getScenePlayingAtTime(scenes, 5)?.id).toBe("intro");
    expect(getScenePlayingAtTime(scenes, 10)?.id).toBe("middle");
  });

  it("selects scenes by latest start time when end is omitted", () => {
    expect(getScenePlayingAtTime(scenes, 19.5)?.id).toBe("middle");
  });

  it("keeps the final scene active after its former explicit end", () => {
    expect(getScenePlayingAtTime(scenes, 30)?.id).toBe("ending");
  });

  it("returns null when no scene matches", () => {
    expect(getScenePlayingAtTime(scenes, Number.NaN)).toBeNull();
  });

  it("ignores explicit end overlap and picks the newest started scene", () => {
    const overlapping = [
      { id: "a", start: 0, end: 99, effect: "starfield" },
      { id: "b", start: 10, end: 20, effect: "rain" }
    ];
    expect(getScenePlayingAtTime(overlapping, 12)?.id).toBe("b");
  });

  it("works with unsorted sections by sorting before selection", () => {
    const unsorted = [
      { id: "late", start: 20, effect: "rain" },
      { id: "early", start: 0, effect: "starfield" },
      { id: "mid", start: 10, effect: "plasma" }
    ];
    expect(getScenePlayingAtTime(unsorted, 11)?.id).toBe("mid");
  });
});

describe("main slot selection helpers", () => {
  it("derives top/centre/bottom slot effects from scene and source-over full-opacity layers", () => {
    const selection = getMainSlotSelection({
      id: "scene-1",
      start: 0,
      end: 10,
      effect: "starfield",
      fitAlign: "centre",
      layers: [
        { effect: "plasma", fitAlign: "top", blend: "source-over", opacity: 1 },
        { effect: "rain", fitAlign: "bottom", blend: "source-over", opacity: 1 },
        { effect: "tunnel", fitAlign: "top", blend: "screen", opacity: 0.7 }
      ]
    });

    expect(selection).toEqual({
      top: "plasma",
      centre: "starfield",
      bottom: "rain"
    });
  });

  it("applies slot selection by setting the primary scene effect and generating secondary slot layers", () => {
    const scene = {
      id: "scene-2",
      start: 0,
      end: 10,
      effect: "starfield",
      fitAlign: "fill",
      layers: [{ effect: "custom", fitAlign: "fill", blend: "screen", opacity: 0.6 }]
    };

    applyMainSlotSelection(scene, {
      top: "plasma",
      centre: "tunnel",
      bottom: "rain"
    });

    expect(scene.effect).toBe("tunnel");
    expect(scene.fitAlign).toBe("centre");
    expect(scene.layers).toEqual([
      { effect: "plasma", opacity: 1, blend: "source-over", params: {}, automation: [], fitAlign: "top" },
      { effect: "rain", opacity: 1, blend: "source-over", params: {}, automation: [], fitAlign: "bottom" },
      { effect: "custom", fitAlign: "fill", blend: "screen", opacity: 0.6 }
    ]);
  });
});

describe("getNewSceneTimeRange", () => {
  const scenes = [
    { id: "intro", start: 0, end: 10, effect: "starfield" },
    { id: "middle", start: 10, end: 20, effect: "starfield" },
    { id: "ending", start: 24, end: 28, effect: "starfield" }
  ];

  it("starts the new scene at the current playback position", () => {
    expect(getNewSceneTimeRange(scenes, 12.5)).toEqual({ start: 12.5, end: 24 });
  });

  it("uses the next scene start as the new scene end", () => {
    expect(getNewSceneTimeRange(scenes, 0)).toEqual({ start: 0, end: 10 });
  });

  it("falls back to a 10 second duration when there is no following scene", () => {
    expect(getNewSceneTimeRange(scenes, 30)).toEqual({ start: 30, end: 40 });
  });

  it("clamps negative playback time to zero", () => {
    expect(getNewSceneTimeRange(scenes, -3)).toEqual({ start: 0, end: 10 });
  });
});

describe("getNextNewSectionName", () => {
  it("uses New Section 1 when there are no matching section ids", () => {
    expect(getNextNewSectionName([])).toBe("New Section 1");
    expect(getNextNewSectionName([{ id: "intro", start: 0, effect: "starfield" }])).toBe("New Section 1");
  });

  it("increments from the highest New Section suffix", () => {
    const scenes = [
      { id: "New Section 2", start: 0, effect: "starfield" },
      { id: "New Section 9", start: 10, effect: "starfield" },
      { id: "New Section 4", start: 20, effect: "starfield" }
    ];
    expect(getNextNewSectionName(scenes)).toBe("New Section 10");
  });
});

describe("transition selector sources", () => {
  it("includes bitplane-wipe in the shared editor transition options", () => {
    expect(transitionOptions).toContainEqual({
      value: "bitplane-wipe",
      label: "Bitplane Wipe"
    });
  });

  it("includes audio-reactive-particle in the shared editor transition options", () => {
    expect(transitionOptions).toContainEqual({
      value: "audio-reactive-particle",
      label: "Audio-reactive Particle"
    });
    expect(buildTransitionOptionMarkup()).toContain(
      "<option value=\"audio-reactive-particle\">Audio-reactive Particle</option>"
    );
  });
  it("builds the debug transition options from the same registry data", () => {
    expect(buildTransitionOptionMarkup({ includeAuto: true })).toContain(
      '<option value="bitplane-wipe">Bitplane Wipe</option>'
    );
  });
});

describe("getRandomEffectSelection", () => {
  it("returns a random effect from the available list", () => {
    expect(getRandomEffectSelection(["starfield", "plasma", "glitch"], () => 0.5)).toBe("plasma");
  });

  it("falls back to starfield when no effects are available", () => {
    expect(getRandomEffectSelection([], () => 0.8)).toBe("starfield");
  });
});

describe("getRandomEffectParams", () => {
  it("generates random values for all effect controls", () => {
    const nextValue = [0.2, 0.6, 0.1, 0.8, 0.05, 0.95, 0.4, 0.75];
    let index = 0;
    const randomValue = () => {
      const value = nextValue[index] ?? 0.5;
      index += 1;
      return value;
    };

    const params = getRandomEffectParams("starfield", randomValue);
    expect(Object.keys(params)).toEqual([
      "speed",
      "warp",
      "turnRate",
      "turnStrength",
      "drift",
      "sparkle",
      "colorShift"
    ]);
    expect(params).toEqual({
      speed: 0.4,
      warp: 0.6,
      turnRate: 0.15,
      turnStrength: 0.8,
      drift: 0.05,
      sparkle: 1.9,
      colorShift: -0.2
    });
  });

  it("supports toggle and select controls", () => {
    const params = getRandomEffectParams("metaballs", () => 0.9);

    expect(params.palette).toBe("neon");
    expect(params.smoothing).toBe(1);
    expect(params.seed).toBe(899);
  });
});

describe("isWithinSceneStartThreshold", () => {
  const scenes = [
    { id: "a", start: 2, effect: "starfield" },
    { id: "b", start: 5.5, effect: "starfield" }
  ];

  it("returns true when playback time is within the threshold of a start", () => {
    expect(isWithinSceneStartThreshold(scenes, 2.08)).toBe(true);
  });

  it("returns false when playback time is outside the threshold", () => {
    expect(isWithinSceneStartThreshold(scenes, 2.11)).toBe(false);
  });
});

describe("playlist helpers", () => {
  it("packs overlapping clips into multiple tracks", () => {
    const scenes = [
      { id: "intro", start: 0, end: 10, effect: "starfield" },
      { id: "overlap", start: 4, end: 8, effect: "plasma" },
      { id: "next", start: 10, end: 14, effect: "rain" }
    ];

    const layout = layoutPlaylistTracks(scenes, (scene) => Number(scene.end ?? scene.start));
    expect(layout.trackCount).toBe(2);
    expect(layout.clips.map((clip) => ({ id: clip.sceneId, track: clip.track }))).toEqual([
      { id: "intro", track: 0 },
      { id: "overlap", track: 1 },
      { id: "next", track: 0 }
    ]);
  });

  it("zooms the viewport around a focus time and keeps it clamped to the duration", () => {
    const zoomed = zoomPlaylistViewport(20, 30, 0.5, 35, 100);
    expect(zoomed.duration).toBe(15);
    expect(zoomed.start).toBeCloseTo(27.5);
  });

  it("clamps zoom focus ratio so out-of-bounds cursor positions do not lock viewport panning", () => {
    const zoomedNearLeft = zoomPlaylistViewport(40, 20, 0.5, 10, 120);
    const zoomedNearRight = zoomPlaylistViewport(40, 20, 0.5, 90, 120);
    expect(zoomedNearLeft.start).toBeLessThanOrEqual(40);
    expect(zoomedNearRight.start).toBeGreaterThanOrEqual(40);
  });

  it("pans the viewport while respecting bounds", () => {
    expect(panPlaylistViewport(5, -20, 80, 20)).toBe(0);
    expect(panPlaylistViewport(65, 40, 80, 20)).toBe(60);
  });

  it("clamps viewport start against zoom window and timeline duration", () => {
    expect(clampPlaylistViewportStart(-8, 120, 30)).toBe(0);
    expect(clampPlaylistViewportStart(500, 120, 30)).toBe(90);
  });

  it("clamps zoom duration to the allowed range", () => {
    const zoomedIn = zoomPlaylistViewport(0, 8, 0.1, 1, 120);
    const zoomedOut = zoomPlaylistViewport(0, 40, 10, 1, 120);
    expect(zoomedIn.duration).toBeGreaterThanOrEqual(4);
    expect(zoomedOut.duration).toBe(120);
  });

  it("computes scrollbar thumb size/start from viewport ratios", () => {
    const metrics = getPlaylistScrollbarMetrics(120, 30, 20);
    expect(metrics.thumbSizeRatio).toBeCloseTo(1 / 6);
    expect(metrics.thumbStartRatio).toBeCloseTo(0.25);
  });

  it("clamps scrollbar thumb to minimum visible size", () => {
    const metrics = getPlaylistScrollbarMetrics(300, 10, 1);
    expect(metrics.thumbSizeRatio).toBe(0.05);
  });
});

describe("stripSceneEnds", () => {
  it("removes explicit end properties so scene length derives from next start", () => {
    const sections = [
      { id: "a", start: 0, end: 4, effect: "starfield" },
      { id: "b", start: 4, end: 8, effect: "rain" }
    ];
    stripSceneEnds(sections);
    expect(sections).toEqual([
      { id: "a", start: 0, effect: "starfield" },
      { id: "b", start: 4, effect: "rain" }
    ]);
  });

  it("is safe to run when sections already omit end", () => {
    const sections = [{ id: "a", start: 0, effect: "starfield" }];
    stripSceneEnds(sections);
    expect(sections).toEqual([{ id: "a", start: 0, effect: "starfield" }]);
  });
});

describe("parseEditorParamInputValue", () => {
  it("parses booleans and null", () => {
    expect(parseEditorParamInputValue("true")).toBe(true);
    expect(parseEditorParamInputValue("false")).toBe(false);
    expect(parseEditorParamInputValue("null")).toBeNull();
  });

  it("parses numbers and strings", () => {
    expect(parseEditorParamInputValue("1.25")).toBe(1.25);
    expect(parseEditorParamInputValue("\"chrome\"")).toBe("chrome");
    expect(parseEditorParamInputValue("rawValue")).toBe("rawValue");
  });
});

describe("isEditorParamToggleChecked", () => {
  it("accepts both legacy numeric and boolean values", () => {
    expect(isEditorParamToggleChecked(true)).toBe(true);
    expect(isEditorParamToggleChecked(1)).toBe(true);
    expect(isEditorParamToggleChecked(false)).toBe(false);
    expect(isEditorParamToggleChecked(0)).toBe(false);
  });
});

describe("clampEditorNumberParam", () => {
  it("clamps values to configured min/max", () => {
    expect(clampEditorNumberParam(12, { min: 0, max: 10 })).toBe(10);
    expect(clampEditorNumberParam(-2, { min: 0, max: 10 })).toBe(0);
  });

  it("uses fallback when value is not finite", () => {
    expect(clampEditorNumberParam("oops", { min: 0, max: 10, fallback: 3 })).toBe(3);
  });
});

describe("stepEditorNumberParam", () => {
  it("increments using control step while respecting bounds", () => {
    expect(stepEditorNumberParam(0.5, 1, { min: 0, max: 1, step: 0.25 })).toBe(0.75);
    expect(stepEditorNumberParam(0.9, 1, { min: 0, max: 1, step: 0.25 })).toBe(1);
  });

  it("decrements using a default step when none is provided", () => {
    expect(stepEditorNumberParam(1, -1, { min: 0, max: 2 })).toBeCloseTo(0.99);
  });
});

describe("splitCueWords", () => {
  it("splits on whitespace and ignores empty tokens", () => {
    expect(splitCueWords("  one\n two   three\t")).toEqual(["one", "two", "three"]);
  });
});

describe("generateWordTextCues", () => {
  it("creates one cue per word spread across the timing window", () => {
    const cues = generateWordTextCues({
      text: "alpha beta gamma",
      start: 10,
      end: 13,
      font: "Inter",
      color: "#ff00aa",
      size: 56,
      x: 0.2,
      y: 0.4,
      align: "left",
      existingIds: new Set()
    });

    expect(cues).toHaveLength(3);
    expect(cues.map((cue) => cue.text)).toEqual(["alpha", "beta", "gamma"]);
    expect(cues.map((cue) => cue.start)).toEqual([10, 11, 12]);
    expect(cues.map((cue) => cue.end)).toEqual([11, 12, 13]);
    expect(cues[0]).toMatchObject({
      color: "#ff00aa",
      size: 56,
      x: 0.2,
      y: 0.4,
      align: "left",
      units: "normalized"
    });
    expect(cues[0].spans?.[0]).toMatchObject({
      font: "Inter",
      color: "#ff00aa",
      size: 56,
      text: "alpha"
    });
  });

  it("ensures generated ids are unique against existing cues", () => {
    const cues = generateWordTextCues({
      text: "one two",
      start: 0,
      end: 1,
      font: "inherit",
      color: "#fff",
      size: 42,
      x: 0.5,
      y: 0.7,
      align: "center",
      idPrefix: "scene",
      existingIds: new Set(["scene-1", "scene-2"])
    });

    expect(cues.map((cue) => cue.id)).toEqual(["scene-1-2", "scene-2-2"]);
  });
});


describe("textCueFontOptions", () => {
  it("includes the extended Google font families for text cues", () => {
    expect(textCueFontOptions).toEqual(expect.arrayContaining([
      "Audiowide",
      "Bitcount",
      "Bruno Ace",
      "Coiny",
      "Doto",
      "Faster One",
      "Frijole",
      "Galindo",
      "Indie Flower",
      "Miss Fajardose",
      "Nosifer",
      "Orbitron",
      "Press Start 2P",
      "Rubik Glitch",
      "SUSE",
      "Sankofa Display",
      "Schoolbell",
      "Science Gothic",
      "Silkscreen",
      "Sixtyfour",
      "Syne Mono",
      "Trade Winds",
      "Workbench"
    ]));
  });
});
