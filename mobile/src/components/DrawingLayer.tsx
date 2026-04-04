import { useCallback, useRef } from "react";
import { LayoutChangeEvent, PanResponder, StyleSheet, View } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import { smoothStroke } from "../lib/smoothStroke";
import type { LocalStroke } from "../stores/drawingStore";
import { useDrawingStore } from "../stores/drawingStore";
import { useMatchStore } from "../stores/matchStore";

type Props = {
  enabled: boolean;
};

export function DrawingLayer({ enabled }: Props) {
  const sizeRef = useRef({ w: 1, h: 1 });
  const currentRef = useRef<{ x: number; y: number }[]>([]);
  const strokes = useDrawingStore((s) => s.strokes);
  const remoteStrokes = useDrawingStore((s) => s.remoteStrokes);
  const color = useDrawingStore((s) => s.color);
  const width = useDrawingStore((s) => s.width);
  const brush = useDrawingStore((s) => s.brush);
  const addLocalStroke = useDrawingStore((s) => s.addLocalStroke);
  const socket = useMatchStore((s) => s.socket);
  const matchId = useMatchStore((s) => s.matchId);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    sizeRef.current = { w: Math.max(1, w), h: Math.max(1, h) };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => enabled,
      onMoveShouldSetPanResponder: () => enabled,
      onPanResponderGrant: (ev) => {
        const { w, h } = sizeRef.current;
        const x = ev.nativeEvent.locationX / w;
        const y = ev.nativeEvent.locationY / h;
        currentRef.current = [{ x, y }];
      },
      onPanResponderMove: (ev) => {
        const { w, h } = sizeRef.current;
        const x = ev.nativeEvent.locationX / w;
        const y = ev.nativeEvent.locationY / h;
        const last = currentRef.current[currentRef.current.length - 1];
        if (!last || Math.hypot(x - last.x, y - last.y) > 0.002) {
          currentRef.current.push({ x, y });
        }
      },
      onPanResponderRelease: () => {
        const pts = smoothStroke(currentRef.current, 5);
        currentRef.current = [];
        if (pts.length < 2 || !matchId || !socket) return;
        const strokeId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const stroke: LocalStroke = {
          id: strokeId,
          points: pts,
          color,
          width,
          brush,
        };
        addLocalStroke(stroke);
        socket.emit("stroke", {
          matchId,
          strokeId,
          points: pts,
          color,
          width,
          brush,
        });
      },
    })
  ).current;

  const strokeProps = (b: string, c: string, wv: number) => {
    const base = { stroke: c, strokeWidth: wv, fill: "none", strokeLinecap: "round" as const };
    if (b === "ink") return { ...base, strokeOpacity: 0.85 };
    if (b === "fire") return { ...base, stroke: "#fb7185" };
    if (b === "sparkles") return { ...base, stroke: "#fef08a", strokeWidth: wv * 0.9 };
    return base;
  };

  const toSvgPoints = (p: { x: number; y: number }[]) =>
    p.map((q) => `${q.x * 1000},${q.y * 1000}`).join(" ");

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout} {...panResponder.panHandlers}>
      <Svg width="100%" height="100%" viewBox="0 0 1000 1000">
        {remoteStrokes.map((s) => (
          <Polyline key={`r-${s.id}`} points={toSvgPoints(s.points)} {...strokeProps(s.brush, s.color, s.width * 8)} />
        ))}
        {strokes.map((s) => (
          <Polyline key={`l-${s.id}`} points={toSvgPoints(s.points)} {...strokeProps(s.brush, s.color, s.width * 8)} />
        ))}
      </Svg>
    </View>
  );
}
