import { CameraView, useCameraPermissions } from "expo-camera";
import { BlurView } from "expo-blur";
import type { MediaStream as RNMediaStream } from "react-native-webrtc";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { getRTC } from "../lib/webrtc";
import { colors } from "../theme";

type Props = {
  stream: RNMediaStream | null;
  mirror?: boolean;
  blur?: boolean;
  drawingOnlyFaceBlur?: boolean;
};

export function VideoPane({ stream, mirror, blur, drawingOnlyFaceBlur }: Props) {
  const [perm, request] = useCameraPermissions();
  const RTC = getRTC();

  if (RTC && stream) {
    const { RTCView } = RTC;
    const url = (stream as unknown as { toURL?: () => string }).toURL?.();
    if (url) {
      return (
        <View style={styles.wrap}>
          <RTCView
            objectFit="cover"
            style={[styles.video, mirror && styles.mirror]}
            streamURL={url}
            mirror={mirror}
          />
          {(blur || drawingOnlyFaceBlur) && (
            <BlurView intensity={drawingOnlyFaceBlur ? 55 : 90} tint="dark" style={StyleSheet.absoluteFill} />
          )}
        </View>
      );
    }
  }

  if (!perm?.granted) {
    return (
      <View style={[styles.wrap, styles.fallback]}>
        <Text style={styles.hint}>Camera</Text>
        <Pressable style={styles.btn} onPress={() => void request()}>
          <Text style={styles.btnText}>Allow access</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrap} collapsable={false}>
      <CameraView
        facing="front"
        mode="video"
        style={[styles.video, mirror && styles.mirror]}
        mirror={Boolean(mirror)}
      />
      {(blur || drawingOnlyFaceBlur) && (
        <BlurView intensity={drawingOnlyFaceBlur ? 55 : 90} tint="dark" style={StyleSheet.absoluteFill} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.void, overflow: "hidden" },
  video: { flex: 1, width: "100%", height: "100%" },
  mirror: { transform: [{ scaleX: -1 }] },
  fallback: { alignItems: "center", justifyContent: "center", gap: 12 },
  hint: { color: colors.muted },
  btn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.panel },
  btnText: { color: colors.text, fontWeight: "600" },
});
