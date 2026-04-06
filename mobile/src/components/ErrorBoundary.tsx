import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

type Props = { children: ReactNode };
type State = { err: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { err: null };

  static getDerivedStateFromError(err: Error): State {
    return { err };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error("Glyph render error", err, info.componentStack);
  }

  render() {
    if (this.state.err) {
      return (
        <View style={styles.box}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.msg}>{this.state.err.message}</Text>
          <Pressable style={styles.btn} onPress={() => this.setState({ err: null })}>
            <Text style={styles.btnTxt}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    backgroundColor: colors.void,
    justifyContent: "center",
    padding: 24,
  },
  title: { color: colors.text, fontSize: 20, fontWeight: "800", marginBottom: 12 },
  msg: { color: colors.muted, marginBottom: 20 },
  btn: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.panel,
    borderRadius: 12,
  },
  btnTxt: { color: colors.accent, fontWeight: "700" },
});
