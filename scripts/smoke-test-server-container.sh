#!/usr/bin/env bash

set -euo pipefail

image_name="${1:-autodify-server:smoke}"
container_name="autodify-server-smoke-${GITHUB_RUN_ID:-local}-$$"

trap 'docker rm --force "$container_name" >/dev/null 2>&1 || true' EXIT

docker run \
  --detach \
  --name "$container_name" \
  --env LLM_API_KEY=smoke-test-only \
  --health-interval=2s \
  --health-timeout=2s \
  --health-start-period=0s \
  --health-retries=15 \
  "$image_name" >/dev/null

for _ in {1..15}; do
  health_status="$(docker inspect --format '{{.State.Health.Status}}' "$container_name")"

  if [[ "$health_status" == "healthy" ]]; then
    docker exec "$container_name" node -e "require('http').get('http://localhost:3001/api/health', (response) => { let body = ''; response.on('data', (chunk) => { body += chunk; }); response.on('end', () => { const payload = JSON.parse(body); process.exit(response.statusCode === 200 && payload.status === 'ok' ? 0 : 1); }); }).on('error', () => process.exit(1));"
    echo "Server container is healthy and /api/health returned status=ok."
    exit 0
  fi

  if [[ "$health_status" == "unhealthy" ]]; then
    break
  fi

  sleep 2
done

docker inspect --format '{{json .State.Health}}' "$container_name"
docker logs "$container_name"
exit 1
