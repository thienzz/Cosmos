#!/usr/bin/env bash
# Download SPICE kernels for the ephemeris service.
#
# Default mode pulls the minimal kernel set the service + unit tests need:
# DE440s + leap seconds + PCK (~33 MB). Pass `--full` (or set FULL=1) to
# fetch the T39 superset Doc 25 §9.1 calls for: DE441 (parts 1+2, ~3 GB)
# + planet satellite SPKs. CI uses Git LFS for the big kernels — local
# dev usually wants the minimal set.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KERNEL_DIR="${SPICE_KERNEL_DIR:-$REPO_ROOT/data/spice}"
BASE="https://naif.jpl.nasa.gov/pub/naif/generic_kernels"

FULL="${FULL:-0}"
for arg in "$@"; do
  case "$arg" in
    --full|-f) FULL=1 ;;
    --help|-h)
      echo "Usage: $0 [--full]"
      echo "  default : minimal dev kernels (~33 MB)"
      echo "  --full  : T39 production set (DE441 + satellite SPKs, ~3.5 GB)"
      exit 0
      ;;
  esac
done

mkdir -p "$KERNEL_DIR"

declare -a KERNELS=(
  "lsk/naif0012.tls"
  "pck/pck00011.tpc"
  "spk/planets/de440s.bsp"
)

if [[ "$FULL" == "1" ]]; then
  echo "Including T39 full kernel set (DE441 + satellite SPKs, ~3.5 GB)"
  KERNELS+=(
    "spk/planets/de441_part-1.bsp"
    "spk/planets/de441_part-2.bsp"
    "spk/satellites/jup365.bsp"
    "spk/satellites/sat441.bsp"
    "spk/satellites/ura111.bsp"
    "spk/satellites/nep097.bsp"
    "spk/satellites/plu058.bsp"
    "spk/satellites/mar097.bsp"
  )
fi

for rel in "${KERNELS[@]}"; do
  name="$(basename "$rel")"
  out="$KERNEL_DIR/$name"
  if [[ -f "$out" ]]; then
    echo "✓ $name already present ($(du -h "$out" | cut -f1))"
    continue
  fi
  echo "↓ fetching $name from $BASE/$rel"
  curl -fsSL -o "$out" "$BASE/$rel"
  echo "  done ($(du -h "$out" | cut -f1))"
done

echo
echo "Kernel set ready in $KERNEL_DIR"
ls -lh "$KERNEL_DIR"
