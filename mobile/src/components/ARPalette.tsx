import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useDrawingStore } from "../stores/drawingStore";
import { colors } from "../theme";

const PRESETS = ["#a78bfa", "#22d3ee", "#f472b6", "#fbbf24", "#34d399", "#f8fafc"];

export function ARPalette() {
  const [open, setOpen] = useState(true);
  const { color, brush, setTool, clearLocal } = useDrawingStore();

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Pressable style={styles.tab} onPress={() => setOpen((o) => !o)}>
        <Text style={styles.tabText}>{open ? "⟩" : "⟨"}</Text>
      </Pressable>
      {open && (
        <LinearGradient colors={["rgba(15,15,20,0.95)", "rgba(5,5,8,0.6)"]} style={styles.panel}>
          <Text style={styles.label}>Color</Text>
          <View style={styles.row}>
            {PRESETS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setTool({ color: c })}
                style={[styles.swatch, { backgroundColor: c, borderColor: color === c ? colors.text : "transparent" }]}
              />
            ))}
          </View>
          <Text style={styles.label}>Brush</Text>
          {(["neon", "ink", "fire", "sparkles"] as const).map((b) => (
            <Pressable
              key={b}
              onPress={() => setTool({ brush: b })}
              style={[styles.chip, brush === b && styles.chipOn]}
            >
              <Text style={styles.chipText}>{b}</Text>
            </Pressable>
          ))}
          <Pressable style={styles.trash} onPress={clearLocal}>
            <Text style={styles.trashText}>Clear mine</Text>
          </Pressable>
        </LinearGradient>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: 0,
    top: "18%",
    bottom: "22%",
    flexDirection: "row",
    alignItems: "stretch",
  },
  tab: {
    width: 28,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    backgroundColor: "rgba(15,15,20,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: { color: colors.text, fontSize: 18 },
  panel: {
    width: 132,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    gap: 8,
  },
  label: { color: colors.muted, fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  swatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 2 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  chipOn: { borderWidth: 1, borderColor: colors.accent },
  chipText: { color: colors.text, fontSize: 13, textTransform: "capitalize" },
  trash: {
    marginTop: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(244,63,94,0.15)",
    alignItems: "center",
  },
  trashText: { color: colors.danger, fontSize: 12, fontWeight: "600" },
});
