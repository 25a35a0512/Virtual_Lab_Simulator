
let activeModal = null;
let animFrames  = {};

function openExperiment(id) {
  closeExperiment();
  const config = EXPERIMENTS[id];
  if (!config) return;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'exp-modal';
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3>${config.icon} ${config.title}</h3>
        <button class="modal-close" onclick="closeExperiment()" aria-label="Close">✕</button>
      </div>
      <div class="modal-body" id="modal-body">
        <p class="text-sub text-sm mb-2">${config.description}</p>
        <div id="sim-root"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost btn-sm" onclick="resetSim('${id}')">↺ Reset</button>
        <button class="btn btn-primary btn-sm" onclick="closeExperiment()">Done</button>
      </div>
    </div>
  `;

  overlay.addEventListener('click', e => { if (e.target === overlay) closeExperiment(); });
  document.body.appendChild(overlay);
  activeModal = id;

  config.init('sim-root');
  markExperimentDone();
}

function closeExperiment() {
  Object.values(animFrames).forEach(cancelAnimationFrame);
  animFrames = {};
  const el = document.getElementById('exp-modal');
  if (el) el.remove();
  activeModal = null;
}

function resetSim(id) {
  const config = EXPERIMENTS[id];
  if (!config) return;
  Object.values(animFrames).forEach(cancelAnimationFrame);
  animFrames = {};
  config.init('sim-root');
}

// ── Simulation helpers ─────────────────────────────────────
function simHtml(root, html) {
  document.getElementById(root).innerHTML = html;
}
function getEl(id) { return document.getElementById(id); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }


const EXPERIMENTS = {

  acidbase: {
    title: 'Acid-Base Reaction',
    icon: '🧪',
    description: 'Mix acid and base solutions and observe the neutralisation reaction in real time.',
    init(root) {
      simHtml(root, `
        <canvas id="ab-canvas" class="sim-canvas" width="680" height="280"></canvas>
        <div class="sim-controls">
          <div class="form-group">
            <label class="form-label">Acid Volume (mL)</label>
            <input id="acid-vol" type="range" min="0" max="100" value="50" oninput="updateAcidBase()">
            <span id="acid-vol-lbl" class="text-sm text-sub">50 mL HCl</span>
          </div>
          <div class="form-group">
            <label class="form-label">Base Volume (mL)</label>
            <input id="base-vol" type="range" min="0" max="100" value="30" oninput="updateAcidBase()">
            <span id="base-vol-lbl" class="text-sm text-sub">30 mL NaOH</span>
          </div>
          <button class="btn btn-primary btn-sm" onclick="runAcidBase()">▶ React</button>
        </div>
        <div class="sim-output" id="ab-output">
          <strong>Result</strong>Adjust volumes and click React.
        </div>
      `);
      drawAcidBase(0, 0, 0);
    },
  },

  phind: {
    title: 'pH Indicator',
    icon: '🌈',
    description: 'Observe how a universal indicator changes colour across different pH values.',
    init(root) {
      simHtml(root, `
        <div class="sim-controls">
          <div class="form-group" style="flex:1">
            <label class="form-label">pH Value: <strong id="ph-value-lbl">7</strong></label>
            <input id="ph-slider" type="range" min="0" max="14" value="7" step="0.1" oninput="updatePH()">
          </div>
        </div>
        <div class="ph-strip" id="ph-strip">pH 7 — Neutral</div>
        <canvas id="ph-canvas" class="sim-canvas mt-2" width="680" height="200"></canvas>
        <div class="sim-output" id="ph-output">
          <strong>Classification</strong>Neutral solution.
        </div>
      `);
      updatePH();
    },
  },

  projectile: {
    title: 'Projectile Motion',
    icon: '🎯',
    description: 'Launch a projectile and trace its parabolic trajectory under gravity.',
    init(root) {
      simHtml(root, `
        <canvas id="proj-canvas" class="sim-canvas" width="680" height="280"></canvas>
        <div class="sim-controls">
          <div class="form-group">
            <label class="form-label">Initial Speed (m/s)</label>
            <input id="proj-speed" type="range" min="10" max="80" value="40" oninput="updateProjLabels()">
            <span id="proj-speed-lbl" class="text-sm text-sub">40 m/s</span>
          </div>
          <div class="form-group">
            <label class="form-label">Launch Angle (°)</label>
            <input id="proj-angle" type="range" min="5" max="85" value="45" oninput="updateProjLabels()">
            <span id="proj-angle-lbl" class="text-sm text-sub">45°</span>
          </div>
          <button class="btn btn-primary btn-sm" onclick="launchProjectile()">▶ Launch</button>
        </div>
        <div class="sim-output" id="proj-output">
          <strong>Metrics</strong>Set parameters and click Launch.
        </div>
      `);
      drawProjectileIdle();
    },
  },

  ohms: {
    title: "Ohm's Law",
    icon: '⚡',
    description: 'Vary voltage and resistance to observe how current changes (V = IR).',
    init(root) {
      simHtml(root, `
        <div class="circuit-wrap">
          <canvas id="ohm-canvas" width="680" height="200" style="width:100%;height:200px;background:#f8faff;border-radius:8px;"></canvas>
        </div>
        <div class="sim-controls">
          <div class="form-group">
            <label class="form-label">Voltage V (volts)</label>
            <input id="ohm-v" type="range" min="1" max="24" value="12" oninput="updateOhms()">
            <span id="ohm-v-lbl" class="text-sm text-sub">12 V</span>
          </div>
          <div class="form-group">
            <label class="form-label">Resistance R (Ω)</label>
            <input id="ohm-r" type="range" min="1" max="100" value="6" oninput="updateOhms()">
            <span id="ohm-r-lbl" class="text-sm text-sub">6 Ω</span>
          </div>
        </div>
        <div class="sim-output" id="ohm-output">
          <strong>Calculation</strong>
          <span id="ohm-result">—</span>
        </div>
      `);
      updateOhms();
    },
  },

  bubblesort: {
    title: 'Bubble Sort Visualizer',
    icon: '📊',
    description: 'Watch Bubble Sort step through an array, swapping adjacent elements.',
    init(root) {
      simHtml(root, `
        <div class="bars-wrap" id="bars-wrap"></div>
        <div class="sim-controls">
          <div class="form-group">
            <label class="form-label">Array Size</label>
            <input id="bs-size" type="range" min="5" max="30" value="14" oninput="generateBars()">
            <span id="bs-size-lbl" class="text-sm text-sub">14 elements</span>
          </div>
          <div class="form-group">
            <label class="form-label">Speed</label>
            <select id="bs-speed" class="form-input" style="height:36px">
              <option value="300">Slow</option>
              <option value="120" selected>Medium</option>
              <option value="30">Fast</option>
            </select>
          </div>
          <button class="btn btn-primary btn-sm" id="bs-btn" onclick="startBubbleSort()">▶ Sort</button>
          <button class="btn btn-ghost btn-sm" onclick="generateBars()">↺ Shuffle</button>
        </div>
        <div class="sim-output" id="bs-output"><strong>Status</strong>Ready. Click Sort to begin.</div>
      `);
      generateBars();
    },
  },

  bsearch: {
    title: 'Binary Search Visualizer',
    icon: '🔍',
    description: 'See how Binary Search halves the search space to find a target value.',
    init(root) {
      simHtml(root, `
        <div class="bsearch-arr" id="bsearch-arr"></div>
        <div class="sim-controls">
          <div class="form-group" style="flex:2">
            <label class="form-label">Target Number</label>
            <input id="bs-target" type="number" class="form-input" placeholder="Enter a number 1–50" min="1" max="50">
          </div>
          <button class="btn btn-primary btn-sm" onclick="runBinarySearch()">🔍 Search</button>
          <button class="btn btn-ghost btn-sm" onclick="resetBSearch()">↺ New Array</button>
        </div>
        <div class="sim-output" id="bsearch-output"><strong>Status</strong>Enter a target and click Search.</div>
      `);
      resetBSearch();
    },
  },

  titration: {
    title: 'Titration Curve',
    icon: '🧫',
    description: 'Simulate adding a strong base (NaOH) to a weak acid and watch the pH titration curve build in real time.',
    init(root) {
      simHtml(root, `
        <canvas id="tit-canvas" class="sim-canvas" width="680" height="280"></canvas>
        <div class="sim-controls">
          <div class="form-group">
            <label class="form-label">NaOH Added (mL): <strong id="tit-vol-lbl">0</strong></label>
            <input id="tit-vol" type="range" min="0" max="60" value="0" step="1" oninput="updateTitration()">
          </div>
          <div class="form-group">
            <label class="form-label">Acid Concentration (mol/L)</label>
            <select id="tit-conc" class="form-input" style="height:36px" onchange="updateTitration()">
              <option value="0.1">0.1 M (dilute)</option>
              <option value="0.5" selected>0.5 M (standard)</option>
              <option value="1.0">1.0 M (concentrated)</option>
            </select>
          </div>
        </div>
        <div class="sim-output" id="tit-output"><strong>Status</strong>Drag the slider to add NaOH.</div>
      `);
      updateTitration();
    },
  },

  gaslaws: {
    title: "Boyle's Law Simulator",
    icon: '🫧',
    description: "Compress or expand a gas cylinder and observe how pressure and volume obey Boyle's Law (PV = constant).",
    init(root) {
      simHtml(root, `
        <canvas id="gas-canvas" class="sim-canvas" width="680" height="280"></canvas>
        <div class="sim-controls">
          <div class="form-group">
            <label class="form-label">Volume (L): <strong id="gas-vol-lbl">5.0</strong></label>
            <input id="gas-vol" type="range" min="1" max="10" value="5" step="0.1" oninput="updateGasLaw()">
          </div>
          <div class="form-group">
            <label class="form-label">Initial Pressure (atm): <strong id="gas-p0-lbl">2.0</strong></label>
            <input id="gas-p0" type="range" min="1" max="5" value="2" step="0.1" oninput="updateGasLaw()">
          </div>
        </div>
        <div class="sim-output" id="gas-output"><strong>Result</strong>Adjust sliders to explore PV = k.</div>
      `);
      updateGasLaw();
    },
  },

  electrolysis: {
    title: 'Electrolysis of Water',
    icon: '⚗️',
    description: 'Apply voltage to water and watch hydrogen and oxygen gas bubble up at the electrodes.',
    init(root) {
      simHtml(root, `
        <canvas id="elec-canvas" class="sim-canvas" width="680" height="300"></canvas>
        <div class="sim-controls">
          <div class="form-group">
            <label class="form-label">Voltage (V): <strong id="elec-v-lbl">6</strong></label>
            <input id="elec-v" type="range" min="2" max="20" value="6" step="1" oninput="updateElectrolysis()">
          </div>
          <button class="btn btn-primary btn-sm" id="elec-btn" onclick="toggleElectrolysis()">▶ Start</button>
        </div>
        <div class="sim-output" id="elec-output"><strong>Reaction</strong>2H₂O → 2H₂ + O₂ &nbsp;·&nbsp; Click Start to begin.</div>
      `);
      initElectrolysis();
    },
  },

  pendulum: {
    title: 'Simple Pendulum',
    icon: '🕰️',
    description: 'Observe how pendulum period depends on length, with real-time angle and energy readouts.',
    init(root) {
      simHtml(root, `
        <canvas id="pend-canvas" class="sim-canvas" width="680" height="300"></canvas>
        <div class="sim-controls">
          <div class="form-group">
            <label class="form-label">Length (m): <strong id="pend-len-lbl">1.0</strong></label>
            <input id="pend-len" type="range" min="0.2" max="3" value="1" step="0.1" oninput="updatePendulumParams()">
          </div>
          <div class="form-group">
            <label class="form-label">Initial Angle (°): <strong id="pend-ang-lbl">30</strong></label>
            <input id="pend-ang" type="range" min="5" max="75" value="30" step="1" oninput="updatePendulumParams()">
          </div>
          <button class="btn btn-primary btn-sm" id="pend-btn" onclick="togglePendulum()">▶ Start</button>
        </div>
        <div class="sim-output" id="pend-output"><strong>Info</strong>Click Start to swing the pendulum.</div>
      `);
      initPendulum();
    },
  },

  waveinterference: {
    title: 'Wave Interference',
    icon: '〰️',
    description: 'Adjust two wave sources and visualize constructive and destructive interference patterns.',
    init(root) {
      simHtml(root, `
        <canvas id="wave-canvas" class="sim-canvas" width="680" height="260"></canvas>
        <div class="sim-controls">
          <div class="form-group">
            <label class="form-label">Wave 1 Frequency (Hz): <strong id="w1f-lbl">2</strong></label>
            <input id="w1-freq" type="range" min="1" max="8" value="2" step="0.5" oninput="updateWaves()">
          </div>
          <div class="form-group">
            <label class="form-label">Wave 2 Frequency (Hz): <strong id="w2f-lbl">2</strong></label>
            <input id="w2-freq" type="range" min="1" max="8" value="2" step="0.5" oninput="updateWaves()">
          </div>
          <div class="form-group">
            <label class="form-label">Phase Offset (°): <strong id="wph-lbl">0</strong></label>
            <input id="w-phase" type="range" min="0" max="360" value="0" step="5" oninput="updateWaves()">
          </div>
        </div>
        <div class="sim-output" id="wave-output"><strong>Pattern</strong>Adjust frequencies and phase to see interference.</div>
      `);
      initWaves();
    },
  },

  // ── 12. Hooke's Law (Spring) ──────────────────────────
  hookes: {
    title: "Hooke's Law — Spring Simulator",
    icon: '🪝',
    description: 'Stretch a spring and measure force, extension, and stored elastic potential energy.',
    init(root) {
      simHtml(root, `
        <canvas id="hook-canvas" class="sim-canvas" width="680" height="260"></canvas>
        <div class="sim-controls">
          <div class="form-group">
            <label class="form-label">Spring Constant k (N/m): <strong id="hook-k-lbl">50</strong></label>
            <input id="hook-k" type="range" min="10" max="200" value="50" step="5" oninput="updateHookes()">
          </div>
          <div class="form-group">
            <label class="form-label">Extension x (cm): <strong id="hook-x-lbl">10</strong></label>
            <input id="hook-x" type="range" min="0" max="30" value="10" step="1" oninput="updateHookes()">
          </div>
        </div>
        <div class="sim-output" id="hook-output"><strong>Result</strong>Adjust k and x to compute force and energy.</div>
      `);
      updateHookes();
    },
  },

  // ── 13. Selection Sort ────────────────────────────────
  selectionsort: {
    title: 'Selection Sort Visualizer',
    icon: '🔢',
    description: 'Watch Selection Sort find the minimum element each pass and place it in sorted position.',
    init(root) {
      simHtml(root, `
        <div class="bars-wrap" id="sel-bars-wrap"></div>
        <div class="sim-controls">
          <div class="form-group">
            <label class="form-label">Array Size</label>
            <input id="sel-size" type="range" min="5" max="30" value="14" oninput="generateSelBars()">
            <span id="sel-size-lbl" class="text-sm text-sub">14 elements</span>
          </div>
          <div class="form-group">
            <label class="form-label">Speed</label>
            <select id="sel-speed" class="form-input" style="height:36px">
              <option value="400">Slow</option>
              <option value="150" selected>Medium</option>
              <option value="40">Fast</option>
            </select>
          </div>
          <button class="btn btn-primary btn-sm" id="sel-btn" onclick="startSelectionSort()">▶ Sort</button>
          <button class="btn btn-ghost btn-sm" onclick="generateSelBars()">↺ Shuffle</button>
        </div>
        <div class="sim-output" id="sel-output"><strong>Status</strong>Ready. Click Sort to begin.</div>
      `);
      generateSelBars();
    },
  },

  // ── 14. Linear Search ────────────────────────────────
  linearsearch: {
    title: 'Linear Search Visualizer',
    icon: '🔎',
    description: 'Watch Linear Search scan each element one by one until it finds the target.',
    init(root) {
      simHtml(root, `
        <div class="bsearch-arr" id="lsearch-arr"></div>
        <div class="sim-controls">
          <div class="form-group" style="flex:2">
            <label class="form-label">Target Number</label>
            <input id="ls-target" type="number" class="form-input" placeholder="Enter a number 1–50" min="1" max="50">
          </div>
          <div class="form-group">
            <label class="form-label">Speed</label>
            <select id="ls-speed" class="form-input" style="height:36px">
              <option value="600">Slow</option>
              <option value="250" selected>Medium</option>
              <option value="80">Fast</option>
            </select>
          </div>
          <button class="btn btn-primary btn-sm" onclick="runLinearSearch()">🔎 Search</button>
          <button class="btn btn-ghost btn-sm" onclick="resetLinearSearch()">↺ New Array</button>
        </div>
        <div class="sim-output" id="lsearch-output"><strong>Status</strong>Enter a target and click Search.</div>
      `);
      resetLinearSearch();
    },
  },

  // ── 15. Stack Visualizer ──────────────────────────────
  stackviz: {
    title: 'Stack (LIFO) Visualizer',
    icon: '📚',
    description: 'Push and pop items on a stack and see the Last-In-First-Out principle in action.',
    init(root) {
      simHtml(root, `
        <div id="stack-display" style="display:flex;flex-direction:column-reverse;align-items:center;min-height:200px;gap:6px;padding:1rem;background:#f8faff;border-radius:8px;border:2px dashed #c7d2fe;"></div>
        <div class="sim-controls" style="flex-wrap:wrap">
          <div class="form-group" style="flex:2">
            <label class="form-label">Value to Push</label>
            <input id="stack-input" type="text" class="form-input" placeholder='e.g. 42 or "hello"' maxlength="10">
          </div>
          <button class="btn btn-primary btn-sm" onclick="stackPush()">⬆ Push</button>
          <button class="btn btn-danger btn-sm" onclick="stackPop()">⬇ Pop</button>
          <button class="btn btn-ghost btn-sm" onclick="stackClear()">🗑 Clear</button>
        </div>
        <div class="sim-output" id="stack-output"><strong>Status</strong>Stack is empty. Push a value to start.</div>
      `);
      initStack();
    },
  },

  // ── 16. Queue Visualizer ──────────────────────────────
  queueviz: {
    title: 'Queue (FIFO) Visualizer',
    icon: '🚶',
    description: 'Enqueue and dequeue items to see the First-In-First-Out principle with animated queue visualization.',
    init(root) {
      simHtml(root, `
        <div style="overflow-x:auto;padding:.5rem 0">
          <div id="queue-display" style="display:flex;align-items:center;min-height:80px;gap:6px;padding:1rem;background:#f8faff;border-radius:8px;border:2px dashed #c7d2fe;min-width:400px;"></div>
        </div>
        <div class="sim-controls" style="flex-wrap:wrap">
          <div class="form-group" style="flex:2">
            <label class="form-label">Value to Enqueue</label>
            <input id="queue-input" type="text" class="form-input" placeholder="Enter a value" maxlength="10">
          </div>
          <button class="btn btn-primary btn-sm" onclick="queueEnqueue()">➕ Enqueue</button>
          <button class="btn btn-danger btn-sm" onclick="queueDequeue()">➖ Dequeue</button>
          <button class="btn btn-ghost btn-sm" onclick="queueClear()">🗑 Clear</button>
        </div>
        <div class="sim-output" id="queue-output"><strong>Status</strong>Queue is empty. Enqueue a value to start.</div>
      `);
      initQueue();
    },
  },

  // ── 17. Merge Sort ────────────────────────────────────
  mergesort: {
    title: 'Merge Sort Visualizer',
    icon: '🔀',
    description: 'Watch Merge Sort divide the array into halves, sort each, and merge them back together.',
    init(root) {
      simHtml(root, `
        <div class="bars-wrap" id="ms-bars-wrap"></div>
        <div class="sim-controls">
          <div class="form-group">
            <label class="form-label">Array Size</label>
            <input id="ms-size" type="range" min="5" max="28" value="14" oninput="generateMsBars()">
            <span id="ms-size-lbl" class="text-sm text-sub">14 elements</span>
          </div>
          <div class="form-group">
            <label class="form-label">Speed</label>
            <select id="ms-speed" class="form-input" style="height:36px">
              <option value="300">Slow</option>
              <option value="120" selected>Medium</option>
              <option value="30">Fast</option>
            </select>
          </div>
          <button class="btn btn-primary btn-sm" id="ms-btn" onclick="startMergeSort()">▶ Sort</button>
          <button class="btn btn-ghost btn-sm" onclick="generateMsBars()">↺ Shuffle</button>
        </div>
        <div class="sim-output" id="ms-output"><strong>Status</strong>Ready. Click Sort to begin.</div>
      `);
      generateMsBars();
    },
  },

  // ── 18. Insertion Sort ────────────────────────────────
  insertionsort: {
    title: 'Insertion Sort Visualizer',
    icon: '🃏',
    description: 'See how Insertion Sort builds a sorted sub-array by picking each element and inserting it in the right place.',
    init(root) {
      simHtml(root, `
        <div class="bars-wrap" id="ins-bars-wrap"></div>
        <div class="sim-controls">
          <div class="form-group">
            <label class="form-label">Array Size</label>
            <input id="ins-size" type="range" min="5" max="30" value="14" oninput="generateInsBars()">
            <span id="ins-size-lbl" class="text-sm text-sub">14 elements</span>
          </div>
          <div class="form-group">
            <label class="form-label">Speed</label>
            <select id="ins-speed" class="form-input" style="height:36px">
              <option value="350">Slow</option>
              <option value="130" selected>Medium</option>
              <option value="35">Fast</option>
            </select>
          </div>
          <button class="btn btn-primary btn-sm" id="ins-btn" onclick="startInsertionSort()">▶ Sort</button>
          <button class="btn btn-ghost btn-sm" onclick="generateInsBars()">↺ Shuffle</button>
        </div>
        <div class="sim-output" id="ins-output"><strong>Status</strong>Ready. Click Sort to begin.</div>
      `);
      generateInsBars();
    },
  },
};

// ══════════════════════════════════════════════════════════
//  SIMULATION 1 — Acid-Base
// ══════════════════════════════════════════════════════════
function drawAcidBase(acidVol, baseVol, reaction) {
  const canvas = getEl('ab-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = '#f0f4ff'; ctx.fillRect(0, 0, W, H);

  // Beakers
  function drawBeaker(cx, w, h, fillColor, label, sublabel) {
    const bx = cx - w / 2, by = H - h - 30;
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,.06)';
    ctx.fillRect(bx+4, by+4, w, h+24);
    // body
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#c8d4e8'; ctx.lineWidth = 2;
    ctx.fillRect(bx, by, w, h + 24);
    ctx.strokeRect(bx, by, w, h + 24);
    // liquid
    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fillRect(bx + 3, by + 4, w - 6, h + 16);
    }
    // rim
    ctx.strokeStyle = '#bdc8dc'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(bx - 6, by + 4); ctx.lineTo(bx + w + 6, by + 4); ctx.stroke();
    // label
    ctx.fillStyle = '#374151'; ctx.font = '600 13px Segoe UI, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(label, cx, H - 10);
    if (sublabel) {
      ctx.fillStyle = '#6b7280'; ctx.font = '12px Segoe UI, sans-serif';
      ctx.fillText(sublabel, cx, H - 26 - h - 14);
    }
  }

  // colour by ratio
  const total   = acidVol + baseVol;
  let flaskColor = '#d1d5db';
  let resultText = '';
  let ph = 7;
  if (total > 0) {
    const ratio = acidVol / total;
    if (ratio > 0.55)       { flaskColor = '#fca5a5'; ph = 2 + Math.round(ratio * 4); resultText = `Acidic — excess HCl (pH ≈ ${ph})`; }
    else if (ratio < 0.45)  { flaskColor = '#6ee7b7'; ph = 10 + Math.round((1-ratio)*2); resultText = `Basic — excess NaOH (pH ≈ ${ph})`; }
    else                    { flaskColor = '#a5b4fc'; ph = 7; resultText = 'Near-neutral — HCl + NaOH → NaCl + H₂O (pH ≈ 7)'; }
  }

  drawBeaker(200, 90, 120, '#fca5a5', 'HCl (Acid)',  acidVol + ' mL');
  drawBeaker(480, 90, 120, '#6ee7b7', 'NaOH (Base)', baseVol + ' mL');

  // Result flask
  if (reaction > 0) {
    drawBeaker(340, 110, 140, flaskColor, 'Mixture', resultText.split('—')[0].trim());
    // Bubbles animation hint
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(310 + i*18, H - 60 - Math.random()*40, 4 + Math.random()*4, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,.65)'; ctx.fill();
    }
  }

  // Arrow
  if (reaction > 0) {
    ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 2;
    ctx.setLineDash([5,4]);
    ctx.beginPath(); ctx.moveTo(260, H-80); ctx.lineTo(295, H-80); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(390, H-80); ctx.lineTo(425, H-80); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#6b7280'; ctx.font = '12px Segoe UI, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('→ mix →', 340, H-88);
  }

  return resultText;
}

function updateAcidBase() {
  const av = +getEl('acid-vol').value;
  const bv = +getEl('base-vol').value;
  getEl('acid-vol-lbl').textContent = av + ' mL HCl';
  getEl('base-vol-lbl').textContent = bv + ' mL NaOH';
}

function runAcidBase() {
  const av = +getEl('acid-vol').value;
  const bv = +getEl('base-vol').value;
  const text = drawAcidBase(av, bv, 1);
  const out  = getEl('ab-output');
  if (out) out.innerHTML = `<strong>Result</strong>${text || 'No reaction (no volumes set).'}`;
}

// ══════════════════════════════════════════════════════════
//  SIMULATION 2 — pH Indicator
// ══════════════════════════════════════════════════════════
function phColor(ph) {
  if (ph <= 3)        return { bg:'#ef4444', text:'Strong Acid',    hex:'#ef4444' };
  if (ph <= 5)        return { bg:'#f97316', text:'Weak Acid',      hex:'#f97316' };
  if (ph <= 6.5)      return { bg:'#eab308', text:'Slightly Acid',  hex:'#eab308' };
  if (ph <= 7.5)      return { bg:'#22c55e', text:'Neutral',        hex:'#22c55e' };
  if (ph <= 9)        return { bg:'#3b82f6', text:'Slightly Basic', hex:'#3b82f6' };
  if (ph <= 11)       return { bg:'#8b5cf6', text:'Weak Base',      hex:'#8b5cf6' };
  return                     { bg:'#a855f7', text:'Strong Base',    hex:'#a855f7' };
}

function updatePH() {
  const ph  = +getEl('ph-slider').value;
  const c   = phColor(ph);
  const strip = getEl('ph-strip');
  if (strip) { strip.style.background = c.bg; strip.textContent = `pH ${ph.toFixed(1)} — ${c.text}`; }
  getEl('ph-value-lbl').textContent = ph.toFixed(1);

  const out = getEl('ph-output');
  if (out) out.innerHTML = `<strong>Classification</strong>${c.text} solution (pH = ${ph.toFixed(1)}).`;

  // Draw scale
  const canvas = getEl('ph-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  const colors = ['#ef4444','#f97316','#eab308','#84cc16','#22c55e','#10b981','#3b82f6','#6366f1','#8b5cf6','#a855f7','#c026d3','#d946ef','#e11d48','#9f1239','#7c0a02'];
  const sw = W / 15;
  colors.forEach((col, i) => {
    ctx.fillStyle = col;
    ctx.fillRect(i * sw, 20, sw, H - 40);
    ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.font = '11px Segoe UI'; ctx.textAlign = 'center';
    ctx.fillText(i, i * sw + sw/2, H - 8);
  });
  // Cursor
  const cx = (ph / 14) * W;
  ctx.strokeStyle = '#1a1d23'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx, 10); ctx.lineTo(cx, H-30); ctx.stroke();
  ctx.fillStyle = '#1a1d23';
  ctx.beginPath(); ctx.moveTo(cx-7,10); ctx.lineTo(cx+7,10); ctx.lineTo(cx,0); ctx.fill();
}

// ══════════════════════════════════════════════════════════
//  SIMULATION 3 — Projectile Motion
// ══════════════════════════════════════════════════════════
let projState = { running: false };

function updateProjLabels() {
  getEl('proj-speed-lbl').textContent = getEl('proj-speed').value + ' m/s';
  getEl('proj-angle-lbl').textContent = getEl('proj-angle').value + '°';
}

function drawProjectileIdle() {
  const canvas = getEl('proj-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#f0f4ff'; ctx.fillRect(0, 0, W, H);
  // Ground
  ctx.fillStyle = '#e2e6ea'; ctx.fillRect(0, H-30, W, 30);
  ctx.fillStyle = '#374151'; ctx.font = '13px Segoe UI'; ctx.textAlign = 'left';
  ctx.fillText('Set parameters and click Launch ▶', 16, H/2);
}

function launchProjectile() {
  if (projState.running) return;
  const v0    = +getEl('proj-speed').value;
  const angle = +getEl('proj-angle').value * Math.PI / 180;
  const g     = 9.8;
  const canvas = getEl('proj-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height;

  const vx = v0 * Math.cos(angle);
  const vy = v0 * Math.sin(angle);
  const T  = 2 * vy / g;
  const R  = vx * T;
  const Hm = (vy * vy) / (2 * g);
  const scale = (W - 80) / R;
  const vScale = (H - 60) / Hm;

  // Output
  const out = getEl('proj-output');
  if (out) out.innerHTML = `<strong>Metrics</strong>Range: ${R.toFixed(1)} m &nbsp;|&nbsp; Max Height: ${Hm.toFixed(1)} m &nbsp;|&nbsp; Time of Flight: ${T.toFixed(2)} s`;

  const trail = [];
  let t = 0;
  projState.running = true;

  function frame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#f0f4ff'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e2e6ea'; ctx.fillRect(0, H-30, W, 30);

    // Grid lines
    ctx.strokeStyle = '#d1d9e6'; ctx.lineWidth = 1;
    for (let gx = 0; gx <= W; gx += 80) { ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,H-30); ctx.stroke(); }
    for (let gy = H-30; gy >= 0; gy -= 50) { ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(W,gy); ctx.stroke(); }

    const x = vx * t;
    const y = vy * t - 0.5 * g * t * t;
    const px = 40 + x * scale;
    const py = H - 30 - y * vScale;
    trail.push([px, py]);

    // Trail
    ctx.strokeStyle = '#93c5fd'; ctx.lineWidth = 2; ctx.setLineDash([4,3]);
    ctx.beginPath();
    trail.forEach(([tx,ty], i) => i===0 ? ctx.moveTo(tx,ty) : ctx.lineTo(tx,ty));
    ctx.stroke(); ctx.setLineDash([]);

    // Ball
    ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI*2);
    ctx.fillStyle = '#3b6ef5'; ctx.fill();
    ctx.strokeStyle = '#1e40af'; ctx.lineWidth = 2; ctx.stroke();

    // Labels
    ctx.fillStyle = '#374151'; ctx.font = '12px Segoe UI'; ctx.textAlign = 'left';
    ctx.fillText(`t = ${t.toFixed(2)}s`, 10, 22);
    ctx.fillText(`x = ${x.toFixed(1)}m`, 10, 40);
    ctx.fillText(`h = ${y.toFixed(1)}m`, 10, 58);

    t += 0.04;
    if (t <= T) {
      animFrames['proj'] = requestAnimationFrame(frame);
    } else {
      projState.running = false;
    }
  }
  frame();
}

// ══════════════════════════════════════════════════════════
//  SIMULATION 4 — Ohm's Law
// ══════════════════════════════════════════════════════════
function updateOhms() {
  const V  = +getEl('ohm-v').value;
  const R  = +getEl('ohm-r').value;
  const I  = V / R;
  const P  = V * I;

  getEl('ohm-v-lbl').textContent = V + ' V';
  getEl('ohm-r-lbl').textContent = R + ' Ω';

  const out = getEl('ohm-result');
  if (out) out.innerHTML = `Current I = V/R = ${V}/${R} = <b>${I.toFixed(3)} A</b> &nbsp;|&nbsp; Power P = V·I = <b>${P.toFixed(2)} W</b>`;

  drawCircuit(V, R, I);
}

function drawCircuit(V, R, I) {
  const canvas = getEl('ohm-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#f8faff'; ctx.fillRect(0, 0, W, H);

  // Circuit rectangle
  const ml=80, mr=80, mt=40, mb=40;
  const L=ml, R2=W-mr, T=mt, B=H-mb;
  ctx.strokeStyle = '#3b6ef5'; ctx.lineWidth = 3;
  ctx.strokeRect(L, T, R2-L, B-T);

  // Battery (left side, vertical)
  function drawBattery(cx, cy) {
    const bh=40, bw=22;
    ctx.fillStyle = '#f3f4f6'; ctx.fillRect(cx-bw/2, cy-bh/2, bw, bh);
    ctx.strokeStyle = '#6b7280'; ctx.lineWidth=1; ctx.strokeRect(cx-bw/2, cy-bh/2, bw, bh);
    // plates
    ctx.strokeStyle='#1e40af'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(cx-9, cy-8); ctx.lineTo(cx+9, cy-8); ctx.stroke();
    ctx.strokeStyle='#6b7280'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(cx-5, cy+6); ctx.lineTo(cx+5, cy+6); ctx.stroke();
    ctx.fillStyle='#1e40af'; ctx.font='bold 10px Segoe UI'; ctx.textAlign='center';
    ctx.fillText('+', cx, cy-12); ctx.fillText('−', cx, cy+20);
    ctx.fillStyle='#374151'; ctx.font='11px Segoe UI';
    ctx.fillText(`${V}V`, cx, cy+35);
  }

  // Resistor (top, horizontal)
  function drawResistor(cx, cy) {
    const rw=60, rh=20;
    ctx.fillStyle='#fff8e7'; ctx.fillRect(cx-rw/2, cy-rh/2, rw, rh);
    ctx.strokeStyle='#d97706'; ctx.lineWidth=2; ctx.strokeRect(cx-rw/2, cy-rh/2, rw, rh);
    // zig-zag inside
    ctx.strokeStyle='#b45309'; ctx.lineWidth=1.5;
    ctx.beginPath();
    const segs=6, step=rw/segs;
    ctx.moveTo(cx-rw/2, cy);
    for(let i=0;i<segs;i++) ctx.lineTo(cx-rw/2+(i+.5)*step, cy+(i%2===0?-7:7));
    ctx.lineTo(cx+rw/2, cy);
    ctx.stroke();
    ctx.fillStyle='#374151'; ctx.font='11px Segoe UI'; ctx.textAlign='center';
    ctx.fillText(`${R}Ω`, cx, cy-16);
  }

  // Current intensity (arrow thickness)
  const arrowW = clamp(I * 2, 1, 6);

  // Draw components
  drawBattery(L, (T+B)/2);
  drawResistor((L+R2)/2, T);

  // Current arrows along wire
  const brightness = clamp(I*15, 0, 255);
  ctx.strokeStyle = `rgba(59,110,245,${clamp(0.3+I/6,0.3,1)})`; ctx.lineWidth = arrowW;
  function arrow(x1,y1,x2,y2) {
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    const ang=Math.atan2(y2-y1,x2-x1);
    ctx.beginPath();
    ctx.moveTo(x2,y2);
    ctx.lineTo(x2-10*Math.cos(ang-0.4),y2-10*Math.sin(ang-0.4));
    ctx.lineTo(x2-10*Math.cos(ang+0.4),y2-10*Math.sin(ang+0.4));
    ctx.closePath(); ctx.fillStyle=`rgba(59,110,245,${clamp(0.4+I/6,0.4,1)})`; ctx.fill();
  }
  // top-right arrow
  arrow((L+R2)/2+40, T, R2-10, T);
  // right-down
  arrow(R2, T+10, R2, B-10);
  // bottom-left
  arrow(R2-10, B, L+10, B);
  // left-up
  arrow(L, B-10, L, T+10);

  // Labels
  ctx.fillStyle='#374151'; ctx.font='bold 12px Segoe UI'; ctx.textAlign='center';
  ctx.fillText(`I = ${I.toFixed(3)} A`, (L+R2)/2, B+30);
}

// ══════════════════════════════════════════════════════════
//  SIMULATION 5 — Bubble Sort
// ══════════════════════════════════════════════════════════
let bsArray = [], bsSorting = false;

function generateBars() {
  cancelAnimationFrame(animFrames['bs']);
  bsSorting = false;
  const size = +getEl('bs-size').value;
  getEl('bs-size-lbl').textContent = size + ' elements';
  bsArray = Array.from({length: size}, () => Math.floor(Math.random()*95)+5);
  renderBars(bsArray, [], [], []);
  const btn = getEl('bs-btn');
  if (btn) { btn.textContent = '▶ Sort'; btn.disabled = false; }
  const out = getEl('bs-output');
  if (out) out.innerHTML = '<strong>Status</strong>Array shuffled. Ready to sort.';
}

function renderBars(arr, comparing, swapping, sorted) {
  const wrap = getEl('bars-wrap');
  if (!wrap) return;
  wrap.innerHTML = '';
  const max = Math.max(...arr);
  arr.forEach((v, i) => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = (v / max * 100) + '%';
    if (sorted.includes(i) || (sorted.length === arr.length)) {
      bar.style.background = '#22c55e'; bar.classList.add('sorted');
    } else if (swapping.includes(i)) {
      bar.style.background = '#ef4444';
    } else if (comparing.includes(i)) {
      bar.style.background = '#f59e0b';
    } else {
      bar.style.background = '#93c5fd';
    }
    wrap.appendChild(bar);
  });
}

async function startBubbleSort() {
  if (bsSorting) return;
  bsSorting = true;
  const btn = getEl('bs-btn');
  if (btn) { btn.textContent = '⏳ Sorting…'; btn.disabled = true; }
  const arr   = [...bsArray];
  const n     = arr.length;
  const speed = +getEl('bs-speed').value;
  const sorted= [];
  let swaps=0, comps=0;

  for (let i=0; i<n-1; i++) {
    for (let j=0; j<n-i-1; j++) {
      comps++;
      renderBars(arr, [j, j+1], [], sorted);
      await sleep(speed);
      if (arr[j] > arr[j+1]) {
        swaps++;
        [arr[j], arr[j+1]] = [arr[j+1], arr[j]];
        renderBars(arr, [], [j, j+1], sorted);
        await sleep(speed);
      }
    }
    sorted.push(n-1-i);
    renderBars(arr, [], [], sorted);
  }
  sorted.push(0);
  renderBars(arr, [], [], arr.map((_,i)=>i));
  bsArray = arr;
  bsSorting = false;
  if (btn) { btn.textContent = '▶ Sort'; btn.disabled = false; }
  const out = getEl('bs-output');
  if (out) out.innerHTML = `<strong>Status</strong>Sorted! Comparisons: ${comps} &nbsp;|&nbsp; Swaps: ${swaps}`;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ══════════════════════════════════════════════════════════
//  SIMULATION 6 — Binary Search
// ══════════════════════════════════════════════════════════
let bsearchArr = [];

function resetBSearch() {
  const size = 16;
  const set  = new Set();
  while (set.size < size) set.add(Math.floor(Math.random()*50)+1);
  bsearchArr = [...set].sort((a,b)=>a-b);
  renderBSearchArr(bsearchArr, -1, -1, -1, [], false);
  const out = getEl('bsearch-output');
  if (out) out.innerHTML = '<strong>Status</strong>New sorted array generated. Enter a target and click Search.';
}

function renderBSearchArr(arr, lo, hi, mid, eliminated, found) {
  const wrap = getEl('bsearch-arr');
  if (!wrap) return;
  wrap.innerHTML = '';
  arr.forEach((v, i) => {
    const cell = document.createElement('div');
    cell.className = 'bsearch-cell';
    cell.textContent = v;
    if (found === i)          cell.classList.add('found');
    else if (mid === i)       cell.classList.add('mid');
    else if (i === lo || i===hi) cell.classList.add('left');
    else if (eliminated.includes(i)) cell.classList.add('eliminated');
    wrap.appendChild(cell);
  });
}

async function runBinarySearch() {
  const target = +getEl('bs-target').value;
  if (!target || target < 1 || target > 50) {
    const out = getEl('bsearch-output');
    if (out) out.innerHTML = '<strong>Error</strong>Please enter a number between 1 and 50.';
    return;
  }

  let lo=0, hi=bsearchArr.length-1, steps=0, eliminated=[];

  while (lo <= hi) {
    const mid = Math.floor((lo+hi)/2);
    steps++;
    renderBSearchArr(bsearchArr, lo, hi, mid, eliminated, -1);
    const out = getEl('bsearch-output');
    if (out) out.innerHTML = `<strong>Step ${steps}</strong>Checking index ${mid} → value ${bsearchArr[mid]}. Low=${lo}, High=${hi}.`;
    await sleep(700);

    if (bsearchArr[mid] === target) {
      renderBSearchArr(bsearchArr, lo, hi, -1, eliminated, mid);
      if (out) out.innerHTML = `<strong>Found!</strong>Target ${target} found at index ${mid} in ${steps} step${steps>1?'s':''}.`;
      return;
    } else if (bsearchArr[mid] < target) {
      for (let i=lo; i<=mid; i++) eliminated.push(i);
      lo = mid + 1;
    } else {
      for (let i=mid; i<=hi; i++) eliminated.push(i);
      hi = mid - 1;
    }
  }
  const out = getEl('bsearch-output');
  if (out) out.innerHTML = `<strong>Not Found</strong>${target} is not in this array. Searched in ${steps} steps.`;
  renderBSearchArr(bsearchArr, -1, -1, -1, bsearchArr.map((_,i)=>i), false);
}

// ══════════════════════════════════════════════════════════
//  SIMULATION 7 — Titration Curve
// ══════════════════════════════════════════════════════════
function updateTitration() {
  const vol  = +getEl('tit-vol').value;
  const conc = +getEl('tit-conc').value;
  getEl('tit-vol-lbl').textContent = vol + ' mL';

  // Simple weak-acid titration pH model
  // Equivalence point at 30 mL NaOH for all concentrations (scaled)
  const eq = 30;
  let pH;
  if (vol === 0) {
    pH = -(Math.log10(conc * 0.013)); // rough Ka for acetic acid
  } else if (vol < eq) {
    const ratio = vol / eq;
    pH = 4.75 + Math.log10(ratio / (1 - ratio));
  } else if (vol === eq) {
    pH = 8.7;
  } else {
    const excess = (vol - eq) / 1000 * conc;
    pH = 14 + Math.log10(excess / 0.06);
  }
  pH = clamp(pH, 0, 14);

  // Draw curve
  const canvas = getEl('tit-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#f0f4ff'; ctx.fillRect(0, 0, W, H);

  // Axes
  const ml = 60, mr = 20, mt = 20, mb = 40;
  ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
  // Y axis (pH 0-14)
  ctx.beginPath(); ctx.moveTo(ml, mt); ctx.lineTo(ml, H - mb); ctx.stroke();
  // X axis (0-60 mL)
  ctx.beginPath(); ctx.moveTo(ml, H - mb); ctx.lineTo(W - mr, H - mb); ctx.stroke();

  // Y gridlines + labels
  ctx.fillStyle = '#64748b'; ctx.font = '11px Segoe UI'; ctx.textAlign = 'right';
  for (let p = 0; p <= 14; p += 2) {
    const y = mt + (1 - p / 14) * (H - mt - mb);
    ctx.fillText(p, ml - 6, y + 4);
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ml, y); ctx.lineTo(W - mr, y); ctx.stroke();
  }
  ctx.fillStyle = '#475569'; ctx.font = '12px Segoe UI'; ctx.textAlign = 'center';
  ctx.save(); ctx.translate(14, (H - mt - mb) / 2 + mt); ctx.rotate(-Math.PI / 2);
  ctx.fillText('pH', 0, 0); ctx.restore();
  ctx.fillText('NaOH added (mL)', ml + (W - ml - mr) / 2, H - 4);

  // Plot titration curve up to current volume
  ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let v = 0; v <= vol; v++) {
    let p;
    if (v === 0) { p = clamp(-(Math.log10(conc * 0.013)), 0, 14); }
    else if (v < eq) { const r = v / eq; p = clamp(4.75 + Math.log10(r / (1 - r)), 0, 14); }
    else if (v === eq) { p = 8.7; }
    else { const ex = (v - eq) / 1000 * conc; p = clamp(14 + Math.log10(ex / 0.06), 0, 14); }
    const cx = ml + (v / 60) * (W - ml - mr);
    const cy = mt + (1 - p / 14) * (H - mt - mb);
    v === 0 ? ctx.moveTo(cx, cy) : ctx.lineTo(cx, cy);
  }
  ctx.stroke();

  // Current point dot
  const cx = ml + (vol / 60) * (W - ml - mr);
  const cy = mt + (1 - pH / 14) * (H - mt - mb);
  ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#f43f5e'; ctx.fill();

  // Equivalence point marker
  const eqX = ml + (eq / 60) * (W - ml - mr);
  ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(eqX, mt); ctx.lineTo(eqX, H - mb); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#b45309'; ctx.font = '11px Segoe UI'; ctx.textAlign = 'left';
  ctx.fillText('Eq. pt', eqX + 3, mt + 14);

  // Output
  let label = 'Neutral';
  if (pH < 7) label = `Acidic (excess HA)`;
  else if (pH > 7) label = `Basic (excess NaOH)`;
  const out = getEl('tit-output');
  if (out) out.innerHTML = `<strong>At ${vol} mL NaOH</strong>pH ≈ ${pH.toFixed(2)} — ${label}`;
}

// ══════════════════════════════════════════════════════════
//  SIMULATION 8 — Boyle's Law
// ══════════════════════════════════════════════════════════
function updateGasLaw() {
  const V  = +getEl('gas-vol').value;
  const P0 = +getEl('gas-p0').value;
  const V0 = 5; // reference volume at P0
  const k  = P0 * V0;
  const P  = k / V;

  getEl('gas-vol-lbl').textContent = V.toFixed(1);
  getEl('gas-p0-lbl').textContent  = P0.toFixed(1);

  const canvas = getEl('gas-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#f0f4ff'; ctx.fillRect(0, 0, W, H);

  // Draw cylinder
  const cylH = clamp(V / 10 * (H - 100) + 40, 40, H - 80);
  const cylW = 120;
  const cylX = W / 2 - cylW / 2;
  const cylY = H - 50 - cylH;

  // Cylinder body
  ctx.fillStyle = '#dbeafe'; ctx.fillRect(cylX, cylY, cylW, cylH);
  ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 2.5;
  ctx.strokeRect(cylX, cylY, cylW, cylH);

  // Piston
  const pistonY = cylY;
  ctx.fillStyle = '#64748b'; ctx.fillRect(cylX - 8, pistonY - 14, cylW + 16, 14);
  ctx.fillStyle = '#94a3b8'; ctx.fillRect(cylX + cylW / 2 - 4, pistonY - 30, 8, 20);

  // Gas molecules (dots)
  const numMols = Math.round(12 * (V / 10));
  ctx.fillStyle = '#3b82f6';
  for (let i = 0; i < numMols; i++) {
    const mx = cylX + 10 + (i % 5) * (cylW / 5);
    const my = cylY + 10 + Math.floor(i / 5) * (cylH / Math.ceil(numMols / 5) + 5);
    ctx.beginPath(); ctx.arc(mx, clamp(my, cylY + 6, cylY + cylH - 6), 4, 0, Math.PI * 2); ctx.fill();
  }

  // Pressure arrow (size = pressure)
  const arrLen = clamp(P * 18, 10, 80);
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(cylX + cylW + 20, cylY + cylH / 2);
  ctx.lineTo(cylX + cylW + 20 + arrLen, cylY + cylH / 2);
  ctx.stroke();
  ctx.fillStyle = '#ef4444'; ctx.font = 'bold 12px Segoe UI'; ctx.textAlign = 'left';
  ctx.fillText(`P = ${P.toFixed(2)} atm`, cylX + cylW + 26, cylY + cylH / 2 - 6);

  // Labels
  ctx.fillStyle = '#374151'; ctx.font = '13px Segoe UI'; ctx.textAlign = 'center';
  ctx.fillText(`V = ${V.toFixed(1)} L`, W / 2, H - 20);
  ctx.fillStyle = '#6366f1'; ctx.font = 'bold 13px Segoe UI';
  ctx.fillText(`PV = ${(P * V).toFixed(2)} atm·L (constant = ${k.toFixed(2)})`, W / 2, 18);

  const out = getEl('gas-output');
  if (out) out.innerHTML = `<strong>Boyle's Law</strong>P₁V₁ = P₂V₂ = ${k.toFixed(2)} atm·L &nbsp;|&nbsp; New Pressure: ${P.toFixed(3)} atm`;
}

// ══════════════════════════════════════════════════════════
//  SIMULATION 9 — Electrolysis
// ══════════════════════════════════════════════════════════
let elecRunning = false;
let elecBubbles = [];
let elecFrame;

function initElectrolysis() {
  elecRunning = false;
  elecBubbles = [];
  updateElectrolysis();
  drawElectrolysis();
}

function updateElectrolysis() {
  const v = getEl('elec-v');
  if (v) getEl('elec-v-lbl').textContent = v.value;
}

function toggleElectrolysis() {
  elecRunning = !elecRunning;
  const btn = getEl('elec-btn');
  if (btn) btn.textContent = elecRunning ? '⏸ Pause' : '▶ Start';
  if (elecRunning) elecLoop();
  else cancelAnimationFrame(elecFrame);
}

function elecLoop() {
  if (!elecRunning) return;
  const V = +getEl('elec-v').value;
  const canvas = getEl('elec-canvas');
  if (!canvas) { elecRunning = false; return; }
  const ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Water fill
  ctx.fillStyle = '#bfdbfe'; ctx.fillRect(60, 80, W - 120, H - 130);
  ctx.fillStyle = '#93c5fd'; ctx.fillRect(60, 80, W - 120, 20);

  // Tank outline
  ctx.strokeStyle = '#1d4ed8'; ctx.lineWidth = 3;
  ctx.strokeRect(60, 80, W - 120, H - 130);

  // Labels
  ctx.fillStyle = '#1e40af'; ctx.font = 'bold 13px Segoe UI'; ctx.textAlign = 'center';
  ctx.fillText('H₂O', W / 2, H - 60);

  // Electrodes
  const eH = H - 130;
  function drawElectrode(x, label, isAnode) {
    ctx.fillStyle = isAnode ? '#f97316' : '#3b82f6';
    ctx.fillRect(x - 6, 85, 12, eH - 20);
    ctx.fillStyle = '#374151'; ctx.font = 'bold 12px Segoe UI'; ctx.textAlign = 'center';
    ctx.fillText(label, x, 74);
    ctx.fillStyle = '#6b7280'; ctx.font = '11px Segoe UI';
    ctx.fillText(isAnode ? 'O₂' : 'H₂', x, 62);
  }
  drawElectrode(160, '+ Anode', true);
  drawElectrode(W - 160, '− Cathode', false);

  // Battery wire
  ctx.strokeStyle = '#374151'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(160, 50); ctx.lineTo(W - 160, 50); ctx.stroke();
  ctx.fillStyle = '#111827'; ctx.font = 'bold 12px Segoe UI'; ctx.textAlign = 'center';
  ctx.fillText(`⚡ ${V}V Battery`, W / 2, 44);

  // Spawn bubbles based on voltage
  if (Math.random() < V * 0.05) {
    elecBubbles.push({ x: 160 + (Math.random() - 0.5) * 14, y: H - 140, r: 3 + Math.random() * 4, anode: true });
    elecBubbles.push({ x: W - 160 + (Math.random() - 0.5) * 14, y: H - 140, r: 3 + Math.random() * 4, anode: false });
    if (V > 8 && Math.random() < 0.5) {
      elecBubbles.push({ x: 160 + (Math.random() - 0.5) * 14, y: H - 140, r: 2 + Math.random() * 3, anode: true });
      elecBubbles.push({ x: W - 160 + (Math.random() - 0.5) * 14, y: H - 140, r: 2 + Math.random() * 3, anode: false });
    }
  }

  // Move & draw bubbles
  elecBubbles = elecBubbles.filter(b => b.y > 78);
  elecBubbles.forEach(b => {
    b.y -= 1.2 + Math.random() * 0.6;
    b.x += (Math.random() - 0.5) * 0.8;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fillStyle = b.anode ? 'rgba(249,115,22,0.5)' : 'rgba(59,130,246,0.5)';
    ctx.fill();
    ctx.strokeStyle = b.anode ? '#ea580c' : '#2563eb'; ctx.lineWidth = 0.8;
    ctx.stroke();
  });

  const rate = (V * 0.0093).toFixed(4);
  const out = getEl('elec-output');
  if (out) out.innerHTML = `<strong>Reaction</strong>2H₂O → 2H₂ (cathode) + O₂ (anode) &nbsp;|&nbsp; Rate ≈ ${rate} mol/s at ${V}V`;

  elecFrame = requestAnimationFrame(elecLoop);
}

function drawElectrolysis() {
  const canvas = getEl('elec-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#f0f4ff'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#bfdbfe'; ctx.fillRect(60, 80, W - 120, H - 130);
  ctx.strokeStyle = '#1d4ed8'; ctx.lineWidth = 3;
  ctx.strokeRect(60, 80, W - 120, H - 130);
  ctx.fillStyle = '#1e40af'; ctx.font = 'bold 13px Segoe UI'; ctx.textAlign = 'center';
  ctx.fillText('H₂O — Click Start to begin electrolysis', W / 2, H / 2 - 10);
}

// ══════════════════════════════════════════════════════════
//  SIMULATION 10 — Simple Pendulum
// ══════════════════════════════════════════════════════════
let pendState = { running: false, theta: 0, omega: 0, t: 0, frame: null, L: 1, theta0: 30 * Math.PI / 180 };

function initPendulum() {
  pendState.running = false;
  pendState.theta = pendState.theta0;
  pendState.omega = 0;
  pendState.t = 0;
  cancelAnimationFrame(pendState.frame);
  drawPendulumFrame();
}

function updatePendulumParams() {
  pendState.L = +getEl('pend-len').value;
  pendState.theta0 = +getEl('pend-ang').value * Math.PI / 180;
  getEl('pend-len-lbl').textContent = pendState.L.toFixed(1);
  getEl('pend-ang-lbl').textContent = getEl('pend-ang').value;
  if (!pendState.running) {
    pendState.theta = pendState.theta0;
    pendState.omega = 0;
    drawPendulumFrame();
  }
}

function togglePendulum() {
  pendState.running = !pendState.running;
  const btn = getEl('pend-btn');
  if (btn) btn.textContent = pendState.running ? '⏸ Pause' : '▶ Start';
  if (pendState.running) pendLoop();
}

function pendLoop() {
  if (!pendState.running) return;
  const g = 9.8, L = pendState.L, dt = 0.033;
  pendState.omega += (-g / L * Math.sin(pendState.theta)) * dt;
  pendState.theta += pendState.omega * dt;
  pendState.t += dt;
  drawPendulumFrame();

  const T = 2 * Math.PI * Math.sqrt(L / g);
  const KE = 0.5 * (pendState.omega * pendState.omega) * L * L;
  const PE = g * L * (1 - Math.cos(pendState.theta));
  const out = getEl('pend-output');
  if (out) out.innerHTML = `<strong>Period T = ${T.toFixed(3)} s</strong>θ = ${(pendState.theta * 180 / Math.PI).toFixed(1)}° &nbsp;|&nbsp; KE = ${KE.toFixed(3)} J &nbsp;|&nbsp; PE = ${PE.toFixed(3)} J`;

  pendState.frame = requestAnimationFrame(pendLoop);
}

function drawPendulumFrame() {
  const canvas = getEl('pend-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#f0f4ff'; ctx.fillRect(0, 0, W, H);

  const ox = W / 2, oy = 40;
  const pxPerM = 160 / pendState.L;
  const px = ox + Math.sin(pendState.theta) * pendState.L * pxPerM;
  const py = oy + Math.cos(pendState.theta) * pendState.L * pxPerM;

  // Pivot
  ctx.fillStyle = '#374151'; ctx.beginPath(); ctx.arc(ox, oy, 6, 0, Math.PI * 2); ctx.fill();
  // Rod
  ctx.strokeStyle = '#475569'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(px, py); ctx.stroke();
  // Bob
  const r = 16;
  ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(px - 4, py - 4, 2, px, py, r);
  grad.addColorStop(0, '#93c5fd');
  grad.addColorStop(1, '#1d4ed8');
  ctx.fillStyle = grad; ctx.fill();
  ctx.strokeStyle = '#1e3a8a'; ctx.lineWidth = 1.5; ctx.stroke();

  // Ground bar
  ctx.fillStyle = '#94a3b8'; ctx.fillRect(ox - 40, oy - 4, 80, 8);
  ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2;
  for (let i = -30; i <= 30; i += 10) {
    ctx.beginPath(); ctx.moveTo(ox + i, oy - 4); ctx.lineTo(ox + i - 8, oy - 14); ctx.stroke();
  }

  // Angle arc
  ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(ox, oy, 40, Math.PI / 2 - 0.01, Math.PI / 2 + pendState.theta, pendState.theta < 0);
  ctx.stroke();
}

// ══════════════════════════════════════════════════════════
//  SIMULATION 11 — Wave Interference
// ══════════════════════════════════════════════════════════
let waveAnimId;
let waveTick = 0;

function initWaves() {
  cancelAnimationFrame(waveAnimId);
  waveTick = 0;
  waveLoop();
}

function updateWaves() {
  getEl('w1f-lbl').textContent = getEl('w1-freq').value;
  getEl('w2f-lbl').textContent = getEl('w2-freq').value;
  getEl('wph-lbl').textContent = getEl('w-phase').value;
}

function waveLoop() {
  const canvas = getEl('wave-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, W, H);

  const f1 = +getEl('w1-freq').value;
  const f2 = +getEl('w2-freq').value;
  const ph = +getEl('w-phase').value * Math.PI / 180;
  const amp = 50;
  const midY = H / 2;
  const t = waveTick * 0.04;

  // Wave 1
  function drawWave(freq, phaseOff, color, yOffset) {
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < W; x++) {
      const y = yOffset + amp * Math.sin(freq * (x / W) * Math.PI * 4 - t * freq * 2 + phaseOff);
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const row = H / 4;
  drawWave(f1, 0,  '#60a5fa', row);
  drawWave(f2, ph, '#f472b6', row * 3);

  // Superposition
  ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let x = 0; x < W; x++) {
    const y1 = amp * Math.sin(f1 * (x / W) * Math.PI * 4 - t * f1 * 2);
    const y2 = amp * Math.sin(f2 * (x / W) * Math.PI * 4 - t * f2 * 2 + ph);
    const combined = midY + (y1 + y2) * 0.5;
    x === 0 ? ctx.moveTo(x, combined) : ctx.lineTo(x, combined);
  }
  ctx.stroke();

  // Legend
  ctx.font = '11px Segoe UI'; ctx.textAlign = 'left';
  ctx.fillStyle = '#60a5fa'; ctx.fillText(`Wave 1 (${f1} Hz)`, 10, 16);
  ctx.fillStyle = '#f472b6'; ctx.fillText(`Wave 2 (${f2} Hz)`, 10, 30);
  ctx.fillStyle = '#a78bfa'; ctx.fillText('Superposition', 10, 44);

  // Output
  const pattern = f1 === f2 ? (ph === 0 ? 'Constructive interference (in phase)' : ph >= 150 ? 'Destructive interference (near anti-phase)' : 'Partial interference') : 'Beat pattern (different frequencies)';
  const out = getEl('wave-output');
  if (out) out.innerHTML = `<strong>Pattern</strong>${pattern}`;

  waveTick++;
  waveAnimId = requestAnimationFrame(waveLoop);
}

// ══════════════════════════════════════════════════════════
//  SIMULATION 12 — Hooke's Law
// ══════════════════════════════════════════════════════════
function updateHookes() {
  const k = +getEl('hook-k').value;
  const x = +getEl('hook-x').value / 100; // cm to m
  getEl('hook-k-lbl').textContent = getEl('hook-k').value;
  getEl('hook-x-lbl').textContent = getEl('hook-x').value;

  const F = k * x;
  const E = 0.5 * k * x * x;

  const canvas = getEl('hook-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#f0f4ff'; ctx.fillRect(0, 0, W, H);

  // Wall
  ctx.fillStyle = '#94a3b8'; ctx.fillRect(0, 0, 30, H);
  for (let y = 0; y < H; y += 18) {
    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(18, y + 18); ctx.stroke();
  }

  // Spring coils
  const springX0 = 30;
  const naturalLen = 160;
  const extension = x * 300; // pixels per meter
  const springLen = naturalLen + extension;
  const coils = 12;
  const coilH = 20;
  const cy = H / 2;

  ctx.strokeStyle = '#475569'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(springX0, cy);
  for (let i = 0; i <= coils; i++) {
    const sx = springX0 + (i / coils) * springLen;
    const sy = cy + (i % 2 === 0 ? -coilH : coilH);
    ctx.lineTo(sx, sy);
  }
  ctx.lineTo(springX0 + springLen, cy);
  ctx.stroke();

  // Mass block
  const massX = springX0 + springLen;
  const mSize = 50;
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(massX, cy - mSize / 2, mSize, mSize);
  ctx.strokeStyle = '#1d4ed8'; ctx.lineWidth = 2;
  ctx.strokeRect(massX, cy - mSize / 2, mSize, mSize);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 12px Segoe UI'; ctx.textAlign = 'center';
  ctx.fillText('m', massX + mSize / 2, cy + 5);

  // Force arrow
  if (F > 0) {
    const arrowLen = clamp(F / (k > 100 ? 4 : 2), 10, 100);
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(massX + mSize, cy); ctx.lineTo(massX + mSize + arrowLen, cy); ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(massX + mSize + arrowLen + 10, cy);
    ctx.lineTo(massX + mSize + arrowLen - 5, cy - 7);
    ctx.lineTo(massX + mSize + arrowLen - 5, cy + 7);
    ctx.fill();
    ctx.fillStyle = '#ef4444'; ctx.font = 'bold 12px Segoe UI'; ctx.textAlign = 'left';
    ctx.fillText(`F = ${F.toFixed(2)} N`, massX + mSize + arrowLen + 14, cy + 4);
  }

  // Labels
  ctx.fillStyle = '#374151'; ctx.font = '12px Segoe UI'; ctx.textAlign = 'center';
  ctx.fillText(`x = ${(x * 100).toFixed(0)} cm`, springX0 + springLen / 2, cy + 40);

  const out = getEl('hook-output');
  if (out) out.innerHTML = `<strong>Hooke's Law</strong>F = kx = ${k}×${x.toFixed(2)} = <b>${F.toFixed(2)} N</b> &nbsp;|&nbsp; Elastic PE = ½kx² = <b>${E.toFixed(4)} J</b>`;
}

// ══════════════════════════════════════════════════════════
//  SIMULATION 13 — Selection Sort
// ══════════════════════════════════════════════════════════
let selArray = [], selSorting = false;

function generateSelBars() {
  cancelAnimationFrame(animFrames['sel']);
  selSorting = false;
  const size = +getEl('sel-size').value;
  getEl('sel-size-lbl').textContent = size + ' elements';
  selArray = Array.from({ length: size }, () => Math.floor(Math.random() * 95) + 5);
  renderSelBars(selArray, [], -1, []);
  const btn = getEl('sel-btn');
  if (btn) { btn.textContent = '▶ Sort'; btn.disabled = false; }
  const out = getEl('sel-output');
  if (out) out.innerHTML = '<strong>Status</strong>Array shuffled. Ready to sort.';
}

function renderSelBars(arr, comparing, minIdx, sorted) {
  const wrap = getEl('sel-bars-wrap');
  if (!wrap) return;
  wrap.innerHTML = '';
  const max = Math.max(...arr);
  arr.forEach((v, i) => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = (v / max * 100) + '%';
    if (sorted.includes(i)) { bar.style.background = '#22c55e'; bar.classList.add('sorted'); }
    else if (i === minIdx)   { bar.style.background = '#ef4444'; }
    else if (comparing.includes(i)) { bar.style.background = '#f59e0b'; }
    else { bar.style.background = '#93c5fd'; }
    wrap.appendChild(bar);
  });
}

async function startSelectionSort() {
  if (selSorting) return;
  selSorting = true;
  const btn = getEl('sel-btn');
  if (btn) { btn.textContent = '⏳ Sorting…'; btn.disabled = true; }
  const arr = [...selArray];
  const n = arr.length;
  const speed = +getEl('sel-speed').value;
  const sorted = [];
  let swaps = 0, comps = 0;

  for (let i = 0; i < n - 1; i++) {
    let minI = i;
    for (let j = i + 1; j < n; j++) {
      comps++;
      renderSelBars(arr, [j], minI, sorted);
      await sleep(speed);
      if (arr[j] < arr[minI]) minI = j;
    }
    if (minI !== i) {
      swaps++;
      [arr[i], arr[minI]] = [arr[minI], arr[i]];
    }
    sorted.push(i);
    renderSelBars(arr, [], -1, sorted);
  }
  sorted.push(n - 1);
  renderSelBars(arr, [], -1, arr.map((_, i) => i));
  selArray = arr;
  selSorting = false;
  if (btn) { btn.textContent = '▶ Sort'; btn.disabled = false; }
  const out = getEl('sel-output');
  if (out) out.innerHTML = `<strong>Status</strong>Sorted! Comparisons: ${comps} &nbsp;|&nbsp; Swaps: ${swaps}`;
}

// ══════════════════════════════════════════════════════════
//  SIMULATION 14 — Linear Search
// ══════════════════════════════════════════════════════════
let lsearchArr = [];

function resetLinearSearch() {
  const size = 16;
  lsearchArr = Array.from({ length: size }, () => Math.floor(Math.random() * 50) + 1);
  renderLSearchArr(lsearchArr, -1, -1, []);
  const out = getEl('lsearch-output');
  if (out) out.innerHTML = '<strong>Status</strong>New array generated. Enter a target and click Search.';
}

function renderLSearchArr(arr, current, found, eliminated) {
  const wrap = getEl('lsearch-arr');
  if (!wrap) return;
  wrap.innerHTML = '';
  arr.forEach((v, i) => {
    const cell = document.createElement('div');
    cell.className = 'bsearch-cell';
    cell.textContent = v;
    if (i === found)               cell.classList.add('found');
    else if (i === current)        cell.classList.add('mid');
    else if (eliminated.includes(i)) cell.classList.add('eliminated');
    wrap.appendChild(cell);
  });
}

async function runLinearSearch() {
  const target = +getEl('ls-target').value;
  const speed  = +getEl('ls-speed').value;
  if (!target || target < 1 || target > 50) {
    const out = getEl('lsearch-output');
    if (out) out.innerHTML = '<strong>Error</strong>Please enter a number between 1 and 50.';
    return;
  }
  const eliminated = [];
  for (let i = 0; i < lsearchArr.length; i++) {
    renderLSearchArr(lsearchArr, i, -1, eliminated);
    const out = getEl('lsearch-output');
    if (out) out.innerHTML = `<strong>Step ${i + 1}</strong>Checking index ${i} → value ${lsearchArr[i]}.`;
    await sleep(speed);
    if (lsearchArr[i] === target) {
      renderLSearchArr(lsearchArr, -1, i, eliminated);
      if (out) out.innerHTML = `<strong>Found!</strong>${target} found at index ${i} after ${i + 1} step${i > 0 ? 's' : ''}.`;
      return;
    }
    eliminated.push(i);
  }
  renderLSearchArr(lsearchArr, -1, -1, lsearchArr.map((_, i) => i));
  const out = getEl('lsearch-output');
  if (out) out.innerHTML = `<strong>Not Found</strong>${target} is not in this array. Scanned all ${lsearchArr.length} elements.`;
}

// ══════════════════════════════════════════════════════════
//  SIMULATION 15 — Stack Visualizer
// ══════════════════════════════════════════════════════════
let stackData = [];

function initStack() { stackData = []; renderStack(); }

function renderStack() {
  const display = getEl('stack-display');
  if (!display) return;
  display.innerHTML = '';
  if (stackData.length === 0) {
    const empty = document.createElement('p');
    empty.style.cssText = 'color:#94a3b8;font-size:13px;margin:auto';
    empty.textContent = 'Stack is empty';
    display.appendChild(empty);
    return;
  }
  stackData.forEach((val, i) => {
    const item = document.createElement('div');
    item.style.cssText = `
      padding:8px 24px;background:${i === stackData.length-1 ? '#3b82f6' : '#dbeafe'};
      color:${i === stackData.length-1 ? '#fff' : '#1e40af'};
      border-radius:6px;font-weight:600;font-size:14px;width:200px;text-align:center;
      border:2px solid ${i === stackData.length-1 ? '#1d4ed8' : '#93c5fd'};
      position:relative;
    `;
    item.textContent = val;
    if (i === stackData.length - 1) {
      const top = document.createElement('span');
      top.style.cssText = 'position:absolute;right:6px;top:50%;transform:translateY(-50%);font-size:10px;background:#1d4ed8;color:#fff;padding:1px 5px;border-radius:4px';
      top.textContent = 'TOP';
      item.appendChild(top);
    }
    display.appendChild(item);
  });
}

function stackPush() {
  const input = getEl('stack-input');
  const val = input ? input.value.trim() : '';
  if (!val) { const o = getEl('stack-output'); if (o) o.innerHTML = '<strong>Error</strong>Please enter a value to push.'; return; }
  stackData.push(val);
  if (input) input.value = '';
  renderStack();
  const out = getEl('stack-output');
  if (out) out.innerHTML = `<strong>Push</strong>"${val}" pushed. Stack size: ${stackData.length}`;
}

function stackPop() {
  if (stackData.length === 0) { const o = getEl('stack-output'); if (o) o.innerHTML = '<strong>Error</strong>Stack underflow — nothing to pop.'; return; }
  const val = stackData.pop();
  renderStack();
  const out = getEl('stack-output');
  if (out) out.innerHTML = `<strong>Pop</strong>"${val}" popped. Stack size: ${stackData.length}`;
}

function stackClear() {
  stackData = [];
  renderStack();
  const out = getEl('stack-output');
  if (out) out.innerHTML = '<strong>Cleared</strong>Stack is now empty.';
}

// ══════════════════════════════════════════════════════════
//  SIMULATION 16 — Queue Visualizer
// ══════════════════════════════════════════════════════════
let queueData = [];

function initQueue() { queueData = []; renderQueue(); }

function renderQueue() {
  const display = getEl('queue-display');
  if (!display) return;
  display.innerHTML = '';
  if (queueData.length === 0) {
    const empty = document.createElement('p');
    empty.style.cssText = 'color:#94a3b8;font-size:13px;margin:auto';
    empty.textContent = 'Queue is empty';
    display.appendChild(empty);
    return;
  }
  const labels = document.createElement('div');
  labels.style.cssText = 'position:absolute;top:-20px;font-size:10px;color:#64748b;width:100%;display:flex;justify-content:space-between;padding:0 4px';
  queueData.forEach((val, i) => {
    const item = document.createElement('div');
    item.style.cssText = `
      padding:10px 18px;background:${i === 0 ? '#f97316' : '#fef3c7'};
      color:${i === 0 ? '#fff' : '#92400e'};
      border-radius:6px;font-weight:600;font-size:14px;text-align:center;
      border:2px solid ${i === 0 ? '#ea580c' : '#fcd34d'};white-space:nowrap;position:relative;
    `;
    item.textContent = val;
    if (i === 0) {
      const lbl = document.createElement('span');
      lbl.style.cssText = 'position:absolute;top:-18px;left:50%;transform:translateX(-50%);font-size:10px;color:#ea580c;font-weight:700;white-space:nowrap';
      lbl.textContent = 'FRONT';
      item.appendChild(lbl);
    }
    if (i === queueData.length - 1 && queueData.length > 1) {
      const lbl = document.createElement('span');
      lbl.style.cssText = 'position:absolute;top:-18px;left:50%;transform:translateX(-50%);font-size:10px;color:#9333ea;font-weight:700;white-space:nowrap';
      lbl.textContent = 'REAR';
      item.appendChild(lbl);
    }
    display.appendChild(item);
    if (i < queueData.length - 1) {
      const arr = document.createElement('span');
      arr.style.cssText = 'font-size:18px;color:#94a3b8;align-self:center';
      arr.textContent = '→';
      display.appendChild(arr);
    }
  });
}

function queueEnqueue() {
  const input = getEl('queue-input');
  const val = input ? input.value.trim() : '';
  if (!val) { const o = getEl('queue-output'); if (o) o.innerHTML = '<strong>Error</strong>Please enter a value to enqueue.'; return; }
  queueData.push(val);
  if (input) input.value = '';
  renderQueue();
  const out = getEl('queue-output');
  if (out) out.innerHTML = `<strong>Enqueue</strong>"${val}" added to rear. Queue size: ${queueData.length}`;
}

function queueDequeue() {
  if (queueData.length === 0) { const o = getEl('queue-output'); if (o) o.innerHTML = '<strong>Error</strong>Queue is empty — nothing to dequeue.'; return; }
  const val = queueData.shift();
  renderQueue();
  const out = getEl('queue-output');
  if (out) out.innerHTML = `<strong>Dequeue</strong>"${val}" removed from front. Queue size: ${queueData.length}`;
}

function queueClear() {
  queueData = [];
  renderQueue();
  const out = getEl('queue-output');
  if (out) out.innerHTML = '<strong>Cleared</strong>Queue is now empty.';
}

// ══════════════════════════════════════════════════════════
//  SIMULATION 17 — Merge Sort
// ══════════════════════════════════════════════════════════
let msArray = [], msSorting = false;

function generateMsBars() {
  cancelAnimationFrame(animFrames['ms']);
  msSorting = false;
  const size = +getEl('ms-size').value;
  getEl('ms-size-lbl').textContent = size + ' elements';
  msArray = Array.from({ length: size }, () => Math.floor(Math.random() * 95) + 5);
  renderMsBars(msArray, [], []);
  const btn = getEl('ms-btn');
  if (btn) { btn.textContent = '▶ Sort'; btn.disabled = false; }
  const out = getEl('ms-output');
  if (out) out.innerHTML = '<strong>Status</strong>Array shuffled. Ready to sort.';
}

function renderMsBars(arr, merging, sorted) {
  const wrap = getEl('ms-bars-wrap');
  if (!wrap) return;
  wrap.innerHTML = '';
  const max = Math.max(...arr);
  arr.forEach((v, i) => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = (v / max * 100) + '%';
    if (sorted.includes(i))        { bar.style.background = '#22c55e'; bar.classList.add('sorted'); }
    else if (merging.includes(i))  { bar.style.background = '#f59e0b'; }
    else                           { bar.style.background = '#c084fc'; }
    wrap.appendChild(bar);
  });
}

async function startMergeSort() {
  if (msSorting) return;
  msSorting = true;
  const btn = getEl('ms-btn');
  if (btn) { btn.textContent = '⏳ Sorting…'; btn.disabled = true; }
  const arr = [...msArray];
  const speed = +getEl('ms-speed').value;
  let ops = 0;

  async function merge(arr, l, m, r) {
    const left = arr.slice(l, m + 1);
    const right = arr.slice(m + 1, r + 1);
    let i = 0, j = 0, k = l;
    while (i < left.length && j < right.length) {
      ops++;
      arr[k] = left[i] <= right[j] ? left[i++] : right[j++];
      k++;
      renderMsBars(arr, Array.from({ length: r - l + 1 }, (_, idx) => l + idx), []);
      await sleep(speed);
    }
    while (i < left.length) { arr[k++] = left[i++]; }
    while (j < right.length) { arr[k++] = right[j++]; }
  }

  async function mergeSort(arr, l, r) {
    if (l >= r) return;
    const m = Math.floor((l + r) / 2);
    await mergeSort(arr, l, m);
    await mergeSort(arr, m + 1, r);
    await merge(arr, l, m, r);
  }

  await mergeSort(arr, 0, arr.length - 1);
  renderMsBars(arr, [], arr.map((_, i) => i));
  msArray = arr;
  msSorting = false;
  if (btn) { btn.textContent = '▶ Sort'; btn.disabled = false; }
  const out = getEl('ms-output');
  if (out) out.innerHTML = `<strong>Status</strong>Sorted! Merge operations: ${ops}`;
}

// ══════════════════════════════════════════════════════════
//  SIMULATION 18 — Insertion Sort
// ══════════════════════════════════════════════════════════
let insArray = [], insSorting = false;

function generateInsBars() {
  cancelAnimationFrame(animFrames['ins']);
  insSorting = false;
  const size = +getEl('ins-size').value;
  getEl('ins-size-lbl').textContent = size + ' elements';
  insArray = Array.from({ length: size }, () => Math.floor(Math.random() * 95) + 5);
  renderInsBars(insArray, -1, [], []);
  const btn = getEl('ins-btn');
  if (btn) { btn.textContent = '▶ Sort'; btn.disabled = false; }
  const out = getEl('ins-output');
  if (out) out.innerHTML = '<strong>Status</strong>Array shuffled. Ready to sort.';
}

function renderInsBars(arr, current, shifting, sorted) {
  const wrap = getEl('ins-bars-wrap');
  if (!wrap) return;
  wrap.innerHTML = '';
  const max = Math.max(...arr);
  arr.forEach((v, i) => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = (v / max * 100) + '%';
    if (sorted.includes(i))       { bar.style.background = '#22c55e'; bar.classList.add('sorted'); }
    else if (i === current)       { bar.style.background = '#ef4444'; }
    else if (shifting.includes(i)) { bar.style.background = '#f59e0b'; }
    else                          { bar.style.background = '#86efac'; }
    wrap.appendChild(bar);
  });
}

async function startInsertionSort() {
  if (insSorting) return;
  insSorting = true;
  const btn = getEl('ins-btn');
  if (btn) { btn.textContent = '⏳ Sorting…'; btn.disabled = true; }
  const arr = [...insArray];
  const n = arr.length;
  const speed = +getEl('ins-speed').value;
  const sorted = [0];
  let shifts = 0, comps = 0;

  for (let i = 1; i < n; i++) {
    const key = arr[i];
    let j = i - 1;
    renderInsBars(arr, i, [], sorted);
    await sleep(speed);
    while (j >= 0 && arr[j] > key) {
      comps++;
      shifts++;
      arr[j + 1] = arr[j];
      renderInsBars(arr, i, [j, j + 1], sorted);
      await sleep(speed);
      j--;
    }
    arr[j + 1] = key;
    sorted.push(i);
    renderInsBars(arr, -1, [], sorted);
    await sleep(speed);
  }

  renderInsBars(arr, -1, [], arr.map((_, i) => i));
  insArray = arr;
  insSorting = false;
  if (btn) { btn.textContent = '▶ Sort'; btn.disabled = false; }
  const out = getEl('ins-output');
  if (out) out.innerHTML = `<strong>Status</strong>Sorted! Comparisons: ${comps} &nbsp;|&nbsp; Shifts: ${shifts}`;
}
