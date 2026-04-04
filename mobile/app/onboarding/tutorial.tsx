import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { PanResponder, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import { useSessionStore } from "../../src/stores/sessionStore";
import { colors } from "../../src/theme";

export default function TutorialScreen() {
  const completeTutorial = useSessionStore((s) => s.completeTutorial);
  const finishOnboarding = useSessionStore((s) => s.finishOnboarding);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [done, setDone] = useState(false);
  const size = useRef({ w: 280, h: 280 });

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !done,
      onMoveShouldSetPanResponder: () => !done,
      onPanResponderGrant: (e) => {
        const ne = e.nativeEvent;
        if (ne == null) return;
        const { locationX: x, locationY: y } = ne;
        setPoints([{ x, y }]);
      },
      onPanResponderMove: (e) => {
        const ne = e.nativeEvent;
        if (ne == null) return;
        const { locationX: x, locationY: y } = ne;
        setPoints((prev) => [...prev, { x, y }]);
      },
      onPanResponderRelease: (e) => {
        const ne = e.nativeEvent;
        if (ne == null) return;
        const { locationX: x, locationY: y } = ne;
        setPoints((prev) => {
          const next = [...prev, { x, y }];
          const len = pathLength(next);
          if (len > 420) setDone(true);
          return next;
        });
      },
    })
  ).current;

  const finish = async () => {
    await completeTutorial();
    await finishOnboarding();
    router.replace("/(main)/lobby");
  };

  return (
    <LinearGradient colors={["#0b0b10", colors.void]} style={styles.root}>
      <Text style={styles.title}>Gesture tutorial</Text>
      <Text style={styles.sub}>Trace a loop in the box — this unlocks the void.</Text>
      <View
        style={styles.pad}
        onLayout={(ev) => {
          const { width, height } = ev.nativeEvent.layout;
          size.current = { w: width, h: height };
        }}
        {...pan.panHandlers}
      >
        <Svg width="100%" height="100%">
          {points.length > 1 && (
            <Polyline
              points={points.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke={colors.accent2}
              strokeWidth={4}
              strokeLinecap="round"
            />
          )}
        </Svg>
      </View>
      <Text style={styles.hint}>{done ? "Nice. You're ready." : "Draw a circle or any closed loop."}</Text>
      <Pressable style={styles.doneBtn} onPress={() => void finish()}>
        <Text style={styles.doneBtnText}>{done ? "Enter Glyph" : "Skip for now (dev)"}</Text>
      </Pressable>
    </LinearGradient>
  );
}

function pathLength(pts: { x: number; y: number }[]) {
  let t = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    t += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return t;
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 24, paddingTop: 56 },
  title: { fontSize: 28, fontWeight: "800", color: colors.text },
  sub: { color: colors.muted, marginTop: 8, marginBottom: 20 },
  pad: {
    height: 280,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(255,255,255,0.03)",
    overflow: "hidden",
  },
  hint: { marginTop: 16, color: colors.muted },
  doneBtn: { marginTop: 24, alignSelf: "flex-start", paddingVertical: 8 },
  doneBtnText: { color: colors.accent, fontWeight: "700", fontSize: 16 },
});
