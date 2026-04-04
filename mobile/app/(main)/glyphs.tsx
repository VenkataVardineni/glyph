import { router } from "expo-router";
import { useEffect } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGlyphsStore } from "../../src/stores/glyphsStore";
import { colors } from "../../src/theme";

export default function GlyphsScreen() {
  const insets = useSafeAreaInsets();
  const hydrate = useGlyphsStore((s) => s.hydrate);
  const items = useGlyphsStore((s) => s.items);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backTxt}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>My Glyphs</Text>
      </View>
      <Text style={styles.sub}>Saved sessions (both-party consent in production).</Text>
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: 40, gap: 10 }}
        ListEmptyComponent={
          <Text style={styles.empty}>Nothing saved yet. Finish a call and tap Save on canvas.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMeta}>{new Date(item.createdAt).toLocaleString()}</Text>
            {item.note ? <Text style={styles.cardNote}>{item.note}</Text> : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.void, paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  back: { paddingVertical: 6, paddingRight: 8 },
  backTxt: { color: colors.accent, fontWeight: "600" },
  title: { fontSize: 24, fontWeight: "800", color: colors.text },
  sub: { color: colors.muted, marginBottom: 16 },
  empty: { color: colors.muted, marginTop: 24 },
  card: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  cardMeta: { color: colors.muted, marginTop: 4, fontSize: 12 },
  cardNote: { color: colors.muted, marginTop: 8 },
});
