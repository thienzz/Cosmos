# T-E-06 — tile-server throughput benchmark.
#
# Doc 25 §5 target: 50 000 req/s on a warm L1 cache hit. This harness
# scripts the full setup so anyone can reproduce the numbers:
#
#   1. Generate a Doc 11 §4.1 star tile fixture into a temp dir.
#   2. Start the release tile-server pointed at the fixture
#      (L1-only cache; no Redis, no Postgres).
#   3. Warm the L1 with 10 priming requests.
#   4. Run the load generator for 30s @ 4 threads / 100 connections.
#   5. Print + persist the report.
#
# The task spec asks for `wrk` which is Linux-only. We substitute
# `oha` (cross-platform Rust wrk-alike, cargo-installable) by default;
# set $env:TILE_BENCH_TOOL = "wrk" to use wrk if it's on PATH (e.g.
# from WSL).
#
# Usage (from repo root):
#   pwsh -File scripts/bench-tile-server.ps1
#
# Optional env vars:
#   TILE_BENCH_DURATION  default 30s
#   TILE_BENCH_THREADS   default 4
#   TILE_BENCH_CONNS     default 100
#   TILE_BENCH_PORT      default 3099   (avoids collision with dev server)
#   TILE_BENCH_ORDER     default 6
#   TILE_BENCH_PIXEL     default 12345

$ErrorActionPreference = 'Stop'

$duration = if ($env:TILE_BENCH_DURATION) { $env:TILE_BENCH_DURATION } else { '30s' }
$threads  = if ($env:TILE_BENCH_THREADS)  { [int]$env:TILE_BENCH_THREADS }  else { 4 }
$conns    = if ($env:TILE_BENCH_CONNS)    { [int]$env:TILE_BENCH_CONNS }    else { 100 }
$port     = if ($env:TILE_BENCH_PORT)     { [int]$env:TILE_BENCH_PORT }     else { 3099 }
$order    = if ($env:TILE_BENCH_ORDER)    { [int]$env:TILE_BENCH_ORDER }    else { 6 }
$pixel    = if ($env:TILE_BENCH_PIXEL)    { [int]$env:TILE_BENCH_PIXEL }    else { 12345 }
$tool     = if ($env:TILE_BENCH_TOOL)     { $env:TILE_BENCH_TOOL }          else { 'oha' }

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$binary   = Join-Path $repoRoot 'apps\tile-server\target\release\cosmos-tile-server.exe'
if (-not (Test-Path $binary)) {
    throw "Release binary missing at $binary. Run: cargo build --release --manifest-path apps/tile-server/Cargo.toml"
}

# ---- 1. Fixture ----------------------------------------------------------
$tileRoot = New-Item -ItemType Directory -Force -Path (Join-Path $env:TEMP ("cosmos-bench-" + [guid]::NewGuid()))
$tilePath = Join-Path $tileRoot "stars\healpix\$order\$pixel.bin"
$null = New-Item -ItemType Directory -Force -Path (Split-Path $tilePath)

# 16-byte header + 500 * 16-byte records = 8016 bytes. Matches the typical
# Doc 26 §7.1 tile payload size so the response is representative.
$starCount = 500
$totalBytes = 16 + $starCount * 16
$payload = New-Object byte[] $totalBytes
# tile_id = 42
[BitConverter]::GetBytes([uint32]42).CopyTo($payload, 0)
# star_count
[BitConverter]::GetBytes([uint32]$starCount).CopyTo($payload, 4)
# min_distance = 0.1
[BitConverter]::GetBytes([float]0.1).CopyTo($payload, 8)
# max_distance = 100.0
[BitConverter]::GetBytes([float]100.0).CopyTo($payload, 12)
# Record bytes stay zero — the benchmark only cares about payload size,
# not contents.
[IO.File]::WriteAllBytes($tilePath, $payload)
Write-Host ("fixture: {0} bytes at {1}" -f $totalBytes, $tilePath)

# ---- 2. Start server -----------------------------------------------------
$env:TILE_SERVER_PORT = $port
$env:TILE_SERVER_BIND = '127.0.0.1'
$env:COSMOS_TILE_ROOT = $tileRoot.FullName
$env:COSMOS_DATA_VERSION = 'bench-v1'
$env:RUST_LOG = 'warn'
# L1 big enough to hold every probed tile; no Redis — we want to measure
# the pure Rust hot-path, not network round-trips to external services.
$env:TILE_L1_CAPACITY = '4096'
Remove-Item env:REDIS_URL -ErrorAction SilentlyContinue

$serverLog = Join-Path $tileRoot 'server.log'
$server = Start-Process -FilePath $binary -PassThru -WindowStyle Hidden `
    -RedirectStandardOutput $serverLog `
    -RedirectStandardError  (Join-Path $tileRoot 'server.err.log')
try {
    # ---- 3. Wait + warm ---------------------------------------------------
    $url = "http://127.0.0.1:$port/v1/tiles/stars/healpix/$order/$pixel"
    $healthUrl = "http://127.0.0.1:$port/health"
    $ready = $false
    for ($i = 0; $i -lt 50 -and -not $ready; $i++) {
        Start-Sleep -Milliseconds 100
        try {
            $r = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 1 -ErrorAction Stop
            if ($r.StatusCode -eq 200) { $ready = $true }
        } catch { }
    }
    if (-not $ready) {
        throw "tile-server did not become ready on port $port within 5s"
    }
    Write-Host "server ready on $url"

    for ($i = 0; $i -lt 10; $i++) {
        $null = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
    }
    Write-Host "L1 warmed (10 priming requests)"

    # ---- 4. Benchmark ----------------------------------------------------
    Write-Host "running ${tool}: threads=$threads connections=$conns duration=$duration"
    switch ($tool) {
        'oha' {
            # -z duration, -c concurrent connections. oha auto-uses all
            # cores; the thread knob from the task spec only applies to
            # `wrk`. We still honour TILE_BENCH_THREADS for wrk mode.
            # `--disable-compression` forces `Accept-Encoding: identity`
            # so we measure the handler hot-path, not brotli throughput
            # — tile bytes are already short enough (~8 KB) that CDNs
            # typically don't re-compress anyway.
            & oha --no-tui --disable-compression -z $duration -c $conns $url
        }
        'wrk' {
            & wrk -t$threads -c$conns -d$duration $url
        }
        default {
            throw "unknown TILE_BENCH_TOOL '$tool' (expected oha|wrk)"
        }
    }
} finally {
    if ($server -and -not $server.HasExited) {
        Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "fixture kept at: $($tileRoot.FullName)"
    Write-Host "server log:      $serverLog"
}
