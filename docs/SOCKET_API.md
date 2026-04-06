# Socket.IO events (reference)

## Client → server

| Event | Payload (validated) | Notes |
|-------|---------------------|--------|
| `authenticate` | `{ userId?: string }` | Assigns or generates user id; checks ban |
| `join_queue` | tags, language, drawingOnly, excludeUserIds | Server uses authenticated `userId` |
| `leave_queue` | — | |
| `signal` | WebRTC `offer` / `answer` / `candidate` | Forwarded to peer in same `matchId` |
| `stroke` | drawing payload | Forwarded to peer |
| `wave_ready` | `{ matchId, ready }` | |
| `block_user` | `{ matchId, peerUserId }` | Verified against active match |
| `icebreaker_request` | `{ matchId }` | Broadcasts prompt to both |
| `moderation_frame` | `{ frameId }` | Stub scorer; callback with action |
| `moderation_audio` | `{ text }` | Stub scorer |
| `report` | `{ reason, matchId?, reportedUserId? }` | |
| `disconnect_match` | — | Ends session for both |

## Server → client

| Event | Purpose |
|-------|---------|
| `authenticated` | Auth succeeded |
| `auth_error` | e.g. `BANNED` |
| `error_msg` | Validation / auth errors |
| `queue_status` | Position in bucket |
| `matched` | Includes `isOfferer` for WebRTC role |
| `signal` | WebRTC signaling relay |
| `stroke` | Remote drawing |
| `peer_wave` | Wave-to-unblur sync |
| `icebreaker` | Shared prompt text |
| `peer_disconnected` | Peer left / block / moderation |
| `moderation_violation` | Visual policy |
| `blocked_ok` | Block persisted |

See `mobile/src/constants/socketEvents.ts` for client-side names.
