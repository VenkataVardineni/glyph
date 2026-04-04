# Glyph — Performance QA (Guideline 2.5)

## Thermal & memory (30+ minutes)

- [ ] Run a full match on a **minimum supported iPhone** (oldest device you claim to support) with:
  - Front camera on
  - WebRTC connected
  - Drawing overlay active
  - Moderation timers firing
- [ ] Duration: **≥ 30 minutes** continuous; note peak temperature and any “app paused” / throttle warnings.
- [ ] Watch Xcode Instruments: **Memory** (leaks, unbounded growth), **Energy**.

## Graceful degradation

- [ ] If AR / hand tracking is added: on low performance, **reduce drawing update rate** before failing video.
- [ ] If moderation pipeline lags: **queue or sample frames** rather than blocking the UI thread.

## Network

- [ ] Test signaling and REST on **IPv6-only** network (Apple requirement).
- [ ] Confirm **TURN** servers (if any) support IPv6 when WebRTC falls back to relay.

## Crash-free sessions

- [ ] Cold start → match → skip → rematch 10 cycles.
- [ ] Background / foreground transitions during a call.
