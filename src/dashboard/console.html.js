// ============================================================
// DASHBOARD HTML GENERATOR
// PRD §7: dark operations console
// ============================================================

export function htmlConsole() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Honeypot Console - Live Threat Monitoring</title>
  <script defer src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js"></script>
  <script defer src="https://unpkg.com/globe.gl@2.37.0/dist/globe.gl.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0b0f14;
      --card: #121821;
      --border: #1e2736;
      --text: #e2e8f0;
      --muted: #64748b;
      --accent: #22d3ee;
      --critical: #dc2626;
      --high: #ef4444;
      --medium: #f59e0b;
      --low: #3b82f6;
      --clean: #6b7280;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      overflow-x: hidden;
    }
    /* Stats Bar */
    .stats-bar {
      display: flex;
      gap: 16px;
      padding: 16px 20px;
      background: var(--card);
      border-bottom: 1px solid var(--border);
      overflow-x: auto;
      height: 132px;
      overflow-y: hidden;
      flex-wrap: nowrap;
    }
    .stat-card {
      flex: 1;
      min-width: 160px;
      padding: 12px 16px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      height: 104px;
      overflow: hidden;
    }
    .stat-label {
      font-size: 11px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .stat-value {
      font-size: 28px;
      font-weight: 700;
      line-height: 1.2;
    }
    .stat-value.critical { color: var(--critical); }
    .stat-value.accent { color: var(--accent); }
    .stat-sub {
      font-size: 11px;
      color: var(--muted);
      margin-top: 2px;
    }
    .stat-card canvas { max-height: 70px !important; }
    @media (max-height: 700px) {
      .stats-bar { height: 132px; }
      .stat-card { height: 104px; }
      .stat-card canvas { max-height: 70px !important; }
      .main-layout { height: calc(100vh - 132px); }
    }
    /* Main Layout */
    .main-layout {
      display: flex;
      height: calc(100vh - 90px);
      min-height: 0;
    }
    .map-container {
      flex: 1;
      position: relative;
      min-width: 0;
      min-height: 0;
    }
    #map {
      width: 100%;
      height: 100%;
      background: var(--bg);
      overflow: hidden;
    }
    #map canvas { display: block; }
    .feed-panel {
      width: 50%;
      min-width: 460px;
      max-width: 760px;
      background: var(--card);
      border-left: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .feed-header {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .feed-title {
      font-size: 13px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .live-dot {
      width: 8px;
      height: 8px;
      background: #22c55e;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    .feed-filter {
      display: flex;
      gap: 8px;
      padding: 8px 16px;
      border-bottom: 1px solid var(--border);
    }
    .feed-filter select, .feed-filter input {
      background: var(--bg);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
    }
    .feed-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }
    .feed-item {
      padding: 10px 12px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      margin-bottom: 6px;
      cursor: pointer;
      transition: border-color 0.15s;
    }
    .feed-item:hover {
      border-color: var(--accent);
    }
    .feed-item.new {
      animation: flash 1s ease-out;
    }
    @keyframes flash {
      0% { background: rgba(34, 211, 238, 0.2); }
      100% { background: var(--bg); }
    }
    .feed-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    .feed-ip {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: var(--accent);
    }
    .feed-country {
      font-size: 14px;
    }
    .feed-time {
      font-size: 10px;
      color: var(--muted);
      margin-left: auto;
    }
    .feed-details {
      font-size: 11px;
      color: var(--muted);
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .route-grid { display: grid; grid-template-columns: 1fr auto 1fr; gap: 8px; align-items: center; margin: 8px 0; }
    .route-box { min-width: 0; padding: 7px 8px; border: 1px solid var(--border); border-radius: 5px; background: rgba(11,15,20,.75); }
    .route-label { font-size: 9px; color: var(--muted); text-transform: uppercase; letter-spacing: .4px; margin-bottom: 3px; }
    .route-value { font-family: 'JetBrains Mono', monospace; color: var(--accent); font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .event-extra { display: flex; gap: 8px; flex-wrap: wrap; font-size: 10px; color: var(--muted); margin-top: 5px; }
    .intel-panel { padding: 9px 16px; border-bottom: 1px solid var(--border); background: rgba(34,211,238,.035); font-size: 10px; }
    .intel-title { color: var(--accent); font-weight: 600; margin-bottom: 5px; }
    .intel-row { display: flex; gap: 6px; flex-wrap: wrap; color: var(--muted); }
    .intel-chip { border: 1px solid var(--border); border-radius: 10px; padding: 2px 7px; background: var(--bg); }
    .severity-badge {
      font-size: 9px;
      padding: 2px 6px;
      border-radius: 3px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .severity-CRITICAL { background: rgba(220, 38, 38, 0.2); color: #fca5a5; }
    .severity-HIGH { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }
    .severity-MEDIUM { background: rgba(245, 158, 11, 0.2); color: #fcd34d; }
    .severity-LOW { background: rgba(59, 130, 246, 0.2); color: #93c5fd; }
    .severity-CLEAN { background: rgba(107, 114, 128, 0.2); color: #9ca3af; }
    .honeypot-badge {
      font-size: 9px;
      padding: 2px 6px;
      border-radius: 3px;
      background: rgba(34, 211, 238, 0.15);
      color: var(--accent);
    }
    /* Charts Bar */
    .charts-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 140px;
      background: var(--card);
      border-top: 1px solid var(--border);
      display: flex;
      padding: 12px 16px;
      gap: 16px;
    }
    .chart-box {
      flex: 1;
      position: relative;
    }
    .chart-title {
      font-size: 11px;
      color: var(--muted);
      margin-bottom: 4px;
    }
    /* Detail Drawer */
    .detail-drawer {
      position: fixed;
      top: 0;
      right: -420px;
      width: 420px;
      height: 100vh;
      background: var(--card);
      border-left: 1px solid var(--border);
      z-index: 1000;
      transition: right 0.3s ease;
      overflow-y: auto;
    }
    .detail-drawer.open {
      right: 0;
    }
    .drawer-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .drawer-close {
      background: none;
      border: none;
      color: var(--muted);
      font-size: 20px;
      cursor: pointer;
    }
    .drawer-body {
      padding: 16px 20px;
    }
    .detail-row {
      margin-bottom: 12px;
    }
    .detail-label {
      font-size: 11px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .detail-value {
      font-size: 13px;
      font-family: 'JetBrains Mono', monospace;
      word-break: break-all;
    }
    .detail-headers {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 10px 12px;
      font-size: 11px;
      font-family: 'JetBrains Mono', monospace;
      max-height: 200px;
      overflow-y: auto;
      white-space: pre-wrap;
      color: var(--muted);
    }
    /* Overlay */
    .overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 999;
    }
    .overlay.open { display: block; }
    /* Empty State */
    .empty-state {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: var(--muted);
      z-index: 400;
    }
    .empty-state h2 {
      font-size: 18px;
      margin-bottom: 8px;
      color: var(--text);
    }
    /* Connection Status */
    .conn-status {
      position: fixed;
      bottom: 150px;
      left: 16px;
      padding: 6px 12px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 11px;
      color: var(--muted);
      z-index: 500;
    }
    .conn-status.disconnected {
      border-color: var(--critical);
      color: var(--critical);
    }
    /* Legend */
    .map-legend {
      position: absolute;
      bottom: 155px;
      right: 16px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 10px 12px;
      font-size: 11px;
      z-index: 400;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }
    .legend-item:last-child { margin-bottom: 0; }
    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }
    @media (max-width: 900px) {
      .main-layout { flex-direction: column; height: auto; min-height: 720px; }
      .map-container { height: 62vh; min-height: 420px; }
      .feed-panel { width: 100%; max-width: none; min-width: 0; height: 48vh; min-height: 360px; }
    }
  </style>
</head>
<body>
  <!-- Stats Bar -->
  <div class="stats-bar" id="stats-bar">
    <div class="stat-card">
      <div class="stat-label">24h Hits</div>
      <div class="stat-value accent" id="stat-total">-</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Unique IPs</div>
      <div class="stat-value" id="stat-ips">-</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Critical Events</div>
      <div class="stat-value critical" id="stat-critical">-</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Current Rate</div>
      <div class="stat-value" id="stat-rate">-</div>
      <div class="stat-sub">requests/min</div>
    </div>
    <div class="stat-card" style="flex: 2;">
      <div class="stat-label">Top Attack Types</div>
      <canvas id="chart-types" height="50"></canvas>
    </div>
    <div class="stat-card" style="flex: 2;">
      <div class="stat-label">24h Trend</div>
      <canvas id="chart-trend" height="50"></canvas>
    </div>
    <div class="stat-card" style="flex: 1.5;">
      <div class="stat-label">Login Attempts (Redacted)</div>
      <div class="stat-value" id="stat-creds">-</div>
      <div class="stat-sub" id="stat-creds-sub">Password length/pattern only</div>
    </div>
  </div>

  <!-- Main Layout -->
  <div class="main-layout">
    <!-- Map -->
    <div class="map-container">
      <div id="map"><div class="globe-loading">Loading threat globe…</div></div>
      <div class="empty-state" id="empty-state" style="display: none;">
        <h2>Waiting for telemetry…</h2>
        <p>Traffic will appear after the honeypot is reachable<br>and receives its first requests.</p>
      </div>
      <div class="map-legend">
        <div class="legend-item"><span class="legend-dot" style="background: var(--critical);"></span> CRITICAL</div>
        <div class="legend-item"><span class="legend-dot" style="background: var(--high);"></span> HIGH</div>
        <div class="legend-item"><span class="legend-dot" style="background: var(--medium);"></span> MEDIUM</div>
        <div class="legend-item"><span class="legend-dot" style="background: var(--low);"></span> LOW</div>
        <div class="legend-item"><span class="legend-dot" style="background: var(--accent);"></span> Attack source</div>
        <div class="legend-item"><span style="color:#67e8f9;font-size:16px;line-height:10px">➤</span> Flow direction (source → target)</div>
        <div style="font-size:9px;color:var(--muted);margin-top:8px;line-height:1.4">Location is a Cloudflare GeoIP estimate and may reflect a proxy/VPN.</div>
      </div>
      <div class="conn-status" id="conn-status">
        <span class="live-dot" style="display: inline-block; margin-right: 4px;"></span>
        Connected
      </div>
      <!-- Charts Bar -->
      <div class="charts-bar">
        <div class="chart-box">
          <div class="chart-title">By Honeypot</div>
          <canvas id="chart-honeypot" height="80"></canvas>
        </div>
        <div class="chart-box">
          <div class="chart-title">Top Countries</div>
          <canvas id="chart-countries" height="80"></canvas>
        </div>
      </div>
    </div>

    <!-- Feed Panel -->
    <div class="feed-panel">
      <div class="feed-header">
        <span class="feed-title"><span class="live-dot"></span> Live Attack Feed</span>
        <span id="feed-count" style="font-size: 11px; color: var(--muted);">0 events</span>
      </div>
      <div class="feed-filter">
        <select id="filter-severity">
          <option value="">All severities</option>
          <option value="CRITICAL">CRITICAL</option>
          <option value="HIGH">HIGH</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="LOW">LOW</option>
          <option value="CLEAN">CLEAN</option>
        </select>
        <select id="filter-honeypot">
          <option value="">All honeypots</option>
          <option value="openclaw">OpenClaw</option>
          <option value="mcp">MCP</option>
          <option value="langflow">Langflow</option>
          <option value="n8n">n8n</option>
        </select>
        <input type="text" id="filter-ip" placeholder="Search IP…">
      </div>
      <div class="intel-panel">
        <div class="intel-title">Credential &amp; Attack Intelligence (Redacted)</div>
        <div class="intel-row" id="cred-patterns"><span>Loading login patterns…</span></div>
        <div class="intel-row" id="cred-lengths" style="margin-top:4px"><span>Loading password lengths…</span></div>
        <div class="intel-row" id="cred-kinds" style="margin-top:4px"><span>Loading identifier types…</span></div>
        <div class="intel-row" id="attack-methods" style="margin-top:4px"><span>Loading attack methods…</span></div>
      </div>
      <div class="feed-list" id="feed-list">
        <div style="text-align: center; padding: 40px; color: var(--muted);">Loading…</div>
      </div>
    </div>
  </div>

  <!-- Detail Drawer -->
  <div class="overlay" id="overlay"></div>
  <div class="detail-drawer" id="drawer">
    <div class="drawer-header">
      <span style="font-weight: 600;">Event Details</span>
      <button class="drawer-close" id="drawer-close">&times;</button>
    </div>
    <div class="drawer-body" id="drawer-body">
      <div style="text-align: center; padding: 40px; color: var(--muted);">Loading…</div>
    </div>
  </div>

  <script>
    // ============================================================
    // STATE
    // ============================================================
    let map, markers = [], arcs = [], boundaryLayer, flowAnimations = [], flowRaf;
    const targetNodes = { openclaw: [1.35, 103.82], mcp: [50.11, 8.68], langflow: [39.04, -77.49], n8n: [52.37, 4.90] };
    let lastSince = null;
    let pollInterval = 5000;
    let chartTrend, chartTypes, chartHoneypot, chartCountries;
    let feedEvents = [];
    let isPaused = false;

    // ============================================================
    // INIT
    // ============================================================
    function init() {
      initMap();
      initCharts();
      initDrawer();
      initFilters();
      loadData();
      startPolling();
      document.addEventListener('visibilitychange', handleVisibility);
    }

    // ============================================================
    // MAP
    // ============================================================
    function initMap() {
      if (typeof Globe !== 'function') return;
      const host = document.getElementById('map');
      host.querySelector('.globe-loading')?.remove();
      map = Globe()(host)
        .width(host.clientWidth).height(host.clientHeight)
        .backgroundColor('#0b0f14').showAtmosphere(true)
        .atmosphereColor('#22d3ee').atmosphereAltitude(0.12)
        .globeImageUrl(null).polygonsData([])
        .polygonCapColor(() => 'rgba(14,34,48,.72)')
        .polygonSideColor(() => 'rgba(34,211,238,.12)')
        .polygonStrokeColor(() => 'rgba(148,163,184,.62)')
        .polygonAltitude(0.006).pointsData([])
        .pointLat('lat').pointLng('lng')
        .pointColor(d => d.kind === 'target' ? '#f59e0b' : '#22d3ee')
        .pointAltitude(d => d.kind === 'target' ? 0.08 : 0.035)
        .pointRadius(d => d.kind === 'target' ? 0.65 : Math.min(0.35 + Math.sqrt(d.count || 1) * 0.08, 0.9))
        .pointLabel(d => d.label || d.country || '')
        .arcsData([]).arcStartLat('startLat').arcStartLng('startLng')
        .arcEndLat('endLat').arcEndLng('endLng').arcColor('color')
        .arcAltitudeAutoScale(0.35).arcStroke(0.45)
        .arcDashLength(0.42).arcDashGap(0.8).arcDashInitialGap(() => Math.random())
        .arcDashAnimateTime(1800);
      map.controls().enableZoom = true;
      window.addEventListener('resize', () => map.width(host.clientWidth).height(host.clientHeight));
      loadCountryBoundaries();
    }

    async function loadCountryBoundaries() {
      try {
        const res = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
        const topology = await res.json();
        const object = Object.values(topology.objects || {})[0];
        if (!object || !window.topojson) throw new Error('boundary data unavailable');
        boundaryLayer = window.topojson.feature(topology, object).features || [];
        if (map && map.polygonsData) map.polygonsData(boundaryLayer);
      } catch (_) {
        // Keep the attack view usable even if the optional boundary asset is unavailable.
      }
    }

    function updateMap(points) {
      if (!map || !map.pointsData) return;
      const sourcePoints = (points || []).map(p => ({ ...p, kind: 'source', label: \`\${p.count || 0} attacks · \${p.max_severity || 'CLEAN'}\` }));
      const targets = Object.entries(targetNodes).map(([honeypot, coords]) => ({ lat: coords[0], lng: coords[1], kind: 'target', honeypot, label: \`\${honeypot} honeypot target\` }));
      map.pointsData([...sourcePoints, ...targets]);

      document.getElementById('empty-state').style.display = points.length === 0 ? 'block' : 'none';
    }

    function updateArcs(events) {
      if (!map || !map.arcsData) return;
      flowAnimations = [];
      const seen = new Set();
      (events || []).filter(e => Number.isFinite(e.lat) && Number.isFinite(e.lng)).slice(0, 80).forEach(e => {
        const target = targetNodes[e.honeypot] || targetNodes.openclaw;
        const key = \`\${e.lat},\${e.lng}->\${target.join(',')}\`;
        if (seen.has(key)) return; seen.add(key);
        const color = e.severity === 'CRITICAL' ? '#dc2626' : e.severity === 'HIGH' ? '#ef4444' : '#22d3ee';
        flowAnimations.push({ startLat: e.lat, startLng: e.lng, endLat: target[0], endLng: target[1], color });
      });
      map.arcsData(flowAnimations);
    }

    // ============================================================
    // CHARTS
    // ============================================================
    function initCharts() {
      Chart.defaults.color = '#64748b';
      Chart.defaults.borderColor = '#1e2736';

      chartTrend = new Chart(document.getElementById('chart-trend'), {
        type: 'line',
        data: { labels: [], datasets: [] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { display: false },
            y: { display: false }
          }
        }
      });

      chartTypes = new Chart(document.getElementById('chart-types'), {
        type: 'bar',
        data: { labels: [], datasets: [] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: {
            x: { display: false },
            y: { display: false }
          }
        }
      });

      chartHoneypot = new Chart(document.getElementById('chart-honeypot'), {
        type: 'doughnut',
        data: { labels: [], datasets: [] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } }
          }
        }
      });

      chartCountries = new Chart(document.getElementById('chart-countries'), {
        type: 'bar',
        data: { labels: [], datasets: [] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: {
            x: { display: false },
            y: { ticks: { font: { size: 10 } } }
          }
        }
      });
    }

    function updateCharts(stats) {
      // Trend chart
      if (stats.trend && stats.trend.length > 0) {
        const labels = stats.trend.map(t => t.hour + ':00');
        const honeypots = ['openclaw', 'mcp', 'langflow', 'n8n'];
        const colors = ['#f97316', '#22d3ee', '#a855f7', '#22c55e'];
        const datasets = honeypots.map((hp, i) => ({
          label: hp,
          data: stats.trend.map(t => t[hp] || 0),
          borderColor: colors[i],
          backgroundColor: colors[i] + '33',
          fill: true,
          tension: 0.4,
          pointRadius: 0
        }));
        chartTrend.data.labels = labels;
        chartTrend.data.datasets = datasets;
        chartTrend.update('none');
      }

      // Types chart
      if (stats.top_types && stats.top_types.length > 0) {
        const types = stats.top_types.slice(0, 5);
        chartTypes.data.labels = types.map(t => t.type.replace(/_/g, ' '));
        chartTypes.data.datasets = [{
          data: types.map(t => t.count),
          backgroundColor: '#22d3ee'
        }];
        chartTypes.update('none');
      }

      // Honeypot distribution
      if (stats.trend && stats.trend.length > 0) {
        const totals = {};
        stats.trend.forEach(t => {
          for (const [hp, cnt] of Object.entries(t)) {
            if (hp !== 'hour') totals[hp] = (totals[hp] || 0) + cnt;
          }
        });
        const labels = Object.keys(totals);
        const colors = ['#f97316', '#22d3ee', '#a855f7', '#22c55e'];
        chartHoneypot.data.labels = labels;
        chartHoneypot.data.datasets = [{
          data: Object.values(totals),
          backgroundColor: colors.slice(0, labels.length)
        }];
        chartHoneypot.update('none');
      }

      // Countries chart
      if (stats.top_countries && stats.top_countries.length > 0) {
        const countries = stats.top_countries.slice(0, 6);
        chartCountries.data.labels = countries.map(c => c.country);
        chartCountries.data.datasets = [{
          data: countries.map(c => c.count),
          backgroundColor: '#3b82f6'
        }];
        chartCountries.update('none');
      }
    }

    // ============================================================
    // FEED
    // ============================================================
    function updateFeed(events) {
      const list = document.getElementById('feed-list');
      const filterSev = document.getElementById('filter-severity').value;
      const filterHp = document.getElementById('filter-honeypot').value;
      const filterIp = document.getElementById('filter-ip').value.toLowerCase();

      const filtered = events.filter(e => {
        if (filterSev && e.severity !== filterSev) return false;
        if (filterHp && e.honeypot !== filterHp) return false;
        if (filterIp && !e.ip.toLowerCase().includes(filterIp)) return false;
        return true;
      });

      const targetHosts = { openclaw: 'op.example.com', mcp: 'mcp.example.com', langflow: 'langflow.example.com', n8n: 'n8n.example.com' };
      list.innerHTML = filtered.map(e => \`
        <div class="feed-item" onclick="openDetail('\${e.id}')">
          <div class="feed-meta">
            <span class="feed-ip">\${e.ip}</span>
            <span class="feed-country">\${getCountryFlag(e.country)} \${e.city || e.country || 'Unknown'}</span>
            <span class="severity-badge severity-\${e.severity}">\${e.severity}</span>
            <span class="honeypot-badge">\${e.honeypot}</span>
            <span class="feed-time">\${formatTime(e.ts)}</span>
          </div>
          <div class="route-grid">
            <div class="route-box"><div class="route-label">Source Address</div><div class="route-value" title="\${e.ip}">\${e.ip}</div><div style="font-size:10px;color:var(--muted);margin-top:3px">\${e.city || e.country || 'Unknown'} · \${e.asn || 'ASN ?'}</div></div>
            <div style="color:#67e8f9;font-size:18px">➜</div>
            <div class="route-box"><div class="route-label">Target Address</div><div class="route-value" title="\${targetHosts[e.honeypot] || 'honeypot'}">\${targetHosts[e.honeypot] || 'honeypot'}</div><div style="font-size:10px;color:var(--muted);margin-top:3px">Cloudflare edge ingress · \${e.method || 'GET'} \${e.path || '/'}</div></div>
          </div>
          <div class="feed-details">
            <span>\${e.attack_types.slice(0, 2).join(', ') || 'Normal'}</span>
          </div>
          <div class="event-extra"><span>Threat \${e.threat_score ?? 0}</span><span>Bot \${e.bot_score >= 0 ? e.bot_score : 'n/a'}</span><span>CF-Ray \${e.cf_ray || 'n/a'}</span></div>
        </div>
      \`).join('');

      document.getElementById('feed-count').textContent = filtered.length + ' events';
    }

    // ============================================================
    // DETAIL DRAWER
    // ============================================================
    function initDrawer() {
      document.getElementById('drawer-close').addEventListener('click', closeDrawer);
      document.getElementById('overlay').addEventListener('click', closeDrawer);
    }

    async function openDetail(id) {
      const drawer = document.getElementById('drawer');
      const overlay = document.getElementById('overlay');
      const body = document.getElementById('drawer-body');

      drawer.classList.add('open');
      overlay.classList.add('open');
      body.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--muted);">Loading…</div>';

      try {
        const res = await fetch('/api/dashboard/attack/' + id);
        const data = await res.json();

        body.innerHTML = \`
          <div class="detail-row">
            <div class="detail-label">IP Address</div>
            <div class="detail-value" style="color: var(--accent);">\${data.ip}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Location</div>
            <div class="detail-value">\${data.city} \${data.region} \${data.country}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">ASN</div>
            <div class="detail-value">\${data.asn}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Honeypot</div>
            <div class="detail-value"><span class="honeypot-badge">\${data.honeypot}</span></div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Severity</div>
            <div class="detail-value"><span class="severity-badge severity-\${data.severity}">\${data.severity}</span></div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Attack Types</div>
            <div class="detail-value">\${data.attack_types.join(', ') || '-'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">HTTP Method</div>
            <div class="detail-value" style="color: \${data.method === 'POST' ? 'var(--medium)' : 'var(--low)'};">\${data.method}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Path</div>
            <div class="detail-value" style="word-break: break-all;">\${data.path}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Query String</div>
            <div class="detail-value">\${data.query_string || '-'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">User-Agent</div>
            <div class="detail-value" style="font-size: 11px;">\${data.user_agent || '-'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Threat Score</div>
            <div class="detail-value">\${data.threat_score}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">CF-Ray</div>
            <div class="detail-value" style="font-size: 10px;">\${data.cf_ray || '-'}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Timestamp</div>
            <div class="detail-value">\${data.timestamp}</div>
          </div>
          \${data.raw_headers && Object.keys(data.raw_headers).length > 0 ? \`
          <div class="detail-row">
            <div class="detail-label">Request Headers</div>
            <div class="detail-headers">\${JSON.stringify(data.raw_headers, null, 2)}</div>
          </div>
          \` : ''}
          \${data.body ? \`
          <div class="detail-row">
            <div class="detail-label">Request Body</div>
            <div class="detail-headers">\${escapeHtml(data.body)}</div>
          </div>
          \` : ''}
          <div style="margin-top: 16px;">
            <button onclick="banIP('\${data.ip}')" style="width: 100%; padding: 10px; background: var(--critical); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Block this IP</button>
          </div>
        \`;
      } catch (e) {
        body.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--critical);">Load failed: ' + e.message + '</div>';
      }
    }

    function closeDrawer() {
      document.getElementById('drawer').classList.remove('open');
      document.getElementById('overlay').classList.remove('open');
    }

    async function banIP(ip) {
      if (!confirm('Block IP ' + ip + ' for 24 hours?')) return;
      try {
        await fetch('/admin/ban', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'ip=' + encodeURIComponent(ip)
        });
        alert('IP ' + ip + ' blocked');
        closeDrawer();
      } catch (e) {
        alert('Block failed: ' + e.message);
      }
    }

    // ============================================================
    // FILTERS
    // ============================================================
    function initFilters() {
      document.getElementById('filter-severity').addEventListener('change', () => updateFeed(feedEvents));
      document.getElementById('filter-honeypot').addEventListener('change', () => updateFeed(feedEvents));
      document.getElementById('filter-ip').addEventListener('input', () => updateFeed(feedEvents));
    }

    // ============================================================
    // DATA LOADING
    // ============================================================
    async function loadData() {
      try {
        const [statsRes, geoRes, liveRes] = await Promise.all([
          fetch('/api/dashboard/stats?window=24h'),
          fetch('/api/dashboard/geo?window=1h'),
          fetch('/api/dashboard/live?limit=50')
        ]);

        const stats = await statsRes.json();
        const geo = await geoRes.json();
        const live = await liveRes.json();

        // Update stats
        document.getElementById('stat-total').textContent = stats.total.toLocaleString();
        document.getElementById('stat-ips').textContent = stats.unique_ips.toLocaleString();
        document.getElementById('stat-critical').textContent = stats.critical.toLocaleString();
        document.getElementById('stat-rate').textContent = stats.rate_per_min;

        // Update charts
        updateCharts(stats);

        // Update map
        updateMap(geo.points);

        // Update feed
        feedEvents = live.events;
        updateFeed(feedEvents);
        updateArcs(feedEvents);
        try {
          const cred = await (await fetch('/api/dashboard/credentials?window=24h')).json();
          document.getElementById('stat-creds').textContent = (cred.total || 0).toLocaleString();
          const top = (cred.patterns || []).slice(0, 2).map(p => \`\${p.pattern}: \${p.count}\`).join(' · ');
          document.getElementById('stat-creds-sub').textContent = top || 'Password length/pattern only';
          document.getElementById('cred-patterns').innerHTML = (cred.patterns || []).slice(0, 5).map(p => '<span class="intel-chip">Pattern ' + escapeHtml(p.pattern) + ' · ' + p.count + '</span>').join('') || '<span>No login attempts</span>';
          document.getElementById('cred-lengths').innerHTML = '<span style="color:var(--muted)">Password length:</span> ' + (cred.lengths || []).slice(0, 8).map(p => '<span class="intel-chip">' + p.length + ' chars · ' + p.count + '</span>').join('') || '<span>No data</span>';
          document.getElementById('cred-kinds').innerHTML = '<span style="color:var(--muted)">Identifier:</span> ' + (cred.kinds || []).map(p => '<span class="intel-chip">' + escapeHtml(p.kind) + ' · ' + p.count + '</span>').join('') || '<span>No data</span>';
          document.getElementById('attack-methods').innerHTML = '<span style="color:var(--muted)">Attack method:</span> ' + (stats.top_types || []).slice(0, 6).map(t => '<span class="intel-chip">' + escapeHtml(t.type) + ' · ' + t.count + '</span>').join('');
        } catch (_) {}
        if (live.events.length > 0) {
          lastSince = live.events[0].ts;
        }

        document.getElementById('conn-status').innerHTML = '<span class="live-dot" style="display: inline-block; margin-right: 4px;"></span> Connected';
        document.getElementById('conn-status').classList.remove('disconnected');
      } catch (e) {
        console.error('Load failed:', e);
        document.getElementById('conn-status').textContent = 'Disconnected';
        document.getElementById('conn-status').classList.add('disconnected');
      }
    }

    // ============================================================
    // POLLING
    // ============================================================
    function startPolling() {
      setInterval(async () => {
        if (isPaused) return;
        try {
          const res = await fetch('/api/dashboard/live?since=' + encodeURIComponent(lastSince || new Date(Date.now() - 3600000).toISOString()) + '&limit=50');
          const data = await res.json();

          if (data.events && data.events.length > 0) {
            feedEvents = [...data.events, ...feedEvents].slice(0, 200);
            lastSince = data.events[0].ts;
            updateFeed(feedEvents);
          }
        } catch (e) {
          console.error('Poll failed:', e);
        }
      }, pollInterval);
    }

    function handleVisibility() {
      isPaused = document.hidden;
      if (!isPaused) loadData();
    }

    // ============================================================
    // HELPERS
    // ============================================================
    function formatTime(iso) {
      if (!iso) return '';
      const d = new Date(iso);
      const now = Date.now();
      const diff = Math.floor((now - d.getTime()) / 1000);
      if (diff < 60) return diff + 's ago';
      if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
      if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
      return d.toLocaleDateString('en-US');
    }

    function getCountryFlag(country) {
      if (!country || country === 'Unknown') return '🌍';
      const flags = {
        'US': '🇺🇸', 'CN': '🇨🇳', 'RU': '🇷🇺', 'DE': '🇩🇪', 'GB': '🇬🇧',
        'FR': '🇫🇷', 'JP': '🇯🇵', 'KR': '🇰🇷', 'IN': '🇮🇳', 'BR': '🇧🇷',
        'NL': '🇳🇱', 'SG': '🇸🇬', 'HK': '🇭🇰', 'TW': '🇹🇼', 'AU': '🇦🇺',
        'CA': '🇨🇦', 'PL': '🇵🇱', 'VN': '🇻🇳', 'ID': '🇮🇩', 'TH': '🇹🇭'
      };
      return flags[country] || '🌍';
    }

    function escapeHtml(s) {
      if (!s) return '';
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // Init
    document.addEventListener('DOMContentLoaded', init);
  </script>
</body>
</html>`;
}
