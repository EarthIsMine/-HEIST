#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8081}"
MAX_TRIES="${MAX_TRIES:-500}"

ALLOW=""
DENY=""

# 같은 타입(default) 내에서 allow/deny를 각각 1개씩 찾는다.
for i in $(seq 1 "$MAX_TRIES"); do
  rid="default:smoke-$i"
  allowed=$(curl -s "${BASE_URL}/_migrate/room/decision?roomId=${rid}" | jq -r '.decision.allowed')
  if [[ "$allowed" == "true" && -z "$ALLOW" ]]; then
    ALLOW="$rid"
  fi
  if [[ "$allowed" == "false" && -z "$DENY" ]]; then
    DENY="$rid"
  fi
  if [[ -n "$ALLOW" && -n "$DENY" ]]; then
    break
  fi
done

if [[ -z "$ALLOW" || -z "$DENY" ]]; then
  echo "[canary-smoke] allow/deny roomId 탐색 실패" >&2
  exit 1
fi

echo "[canary-smoke] ALLOW=$ALLOW"
echo "[canary-smoke] DENY=$DENY"

deny_resp=$(curl -s -X POST "${BASE_URL}/_migrate/room/join" \
  -H 'content-type: application/json' \
  -d "{\"roomId\":\"${DENY}\",\"walletAddress\":\"wallet-deny\"}")
allow_resp=$(curl -s -X POST "${BASE_URL}/_migrate/room/join" \
  -H 'content-type: application/json' \
  -d "{\"roomId\":\"${ALLOW}\",\"walletAddress\":\"wallet-allow\"}")

# strict 카나리 게이트 기대값: deny는 legacy, allow는 Nest 수용.
deny_ok=$(echo "$deny_resp" | jq -r '.route == "legacy" and .ok == false')
allow_ok=$(echo "$allow_resp" | jq -r '.ok == true')

if [[ "$deny_ok" != "true" ]]; then
  echo "[canary-smoke] deny 검증 실패" >&2
  echo "$deny_resp" | jq . >&2
  exit 1
fi
if [[ "$allow_ok" != "true" ]]; then
  echo "[canary-smoke] allow 검증 실패" >&2
  echo "$allow_resp" | jq . >&2
  exit 1
fi

echo "[canary-smoke] join 게이트 검증 성공"

metrics=$(curl -s "${BASE_URL}/_metrics")
rollback=$(echo "$metrics" | jq -r '.operations.stage4RiskGates.rollbackRecommended')
scaleout=$(echo "$metrics" | jq -r '.operations.stage4RiskGates.scaleOutAllowed')
consistency=$(echo "$metrics" | jq -r '.consistency.lastOk')

echo "[canary-smoke] rollbackRecommended=$rollback"
echo "[canary-smoke] scaleOutAllowed=$scaleout"
echo "[canary-smoke] consistency.lastOk=$consistency"

echo "[canary-smoke] 완료"
