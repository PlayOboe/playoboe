import Script from "next/script";
import { breadcrumbJsonLd, jsonLdScript, pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import "./studio.css";

export const metadata = pageMetadata({
  title: `The Studio | ${SITE.name}`,
  description:
    "Play an oboe in your browser over a generative trance backing that arranges itself, with an accompaniment that follows your line, a recorder and a looper. Free, no sign-up.",
  path: "/studio",
});

export default function StudioPage() {
  return (
    <div className="studio-root">
      <script
        {...jsonLdScript([
          breadcrumbJsonLd([
            { name: SITE.name, path: "/" },
            { name: "The Studio", path: "/studio" },
          ]),
        ])}
      />
      <div className="studio-bar">
        <a href="/">← Back to Play Oboe</a>
        <span style={{ color: "var(--dim)", fontSize: 12 }}>
          Everything runs on your device — nothing is uploaded.
        </span>
      </div>

      <main id="content" className="wrap">
        <h1>OBOE TRANCE</h1>
        <div className="subtitle">
          a synthesized double-reed lead, playable live over a generative trance backing
          track
        </div>

        <canvas id="viz" width={900} height={110} aria-hidden="true"></canvas>

        <div className="panel">
          <div className="row">
            <button id="startBtn" className="primary">
              ▶ Start Backing Track
            </button>
            <div className="field">
              <label htmlFor="bpm">
                Tempo{" "}
                <span id="bpmVal" className="val">
                  138
                </span>{" "}
                BPM
              </label>
              <input type="range" id="bpm" min="100" max="200" defaultValue="138" />
            </div>
            <div className="field">
              <label htmlFor="oboeVol">
                Oboe Volume{" "}
                <span id="oboeVolVal" className="val">
                  85
                </span>
                %
              </label>
              <input type="range" id="oboeVol" min="0" max="100" defaultValue="85" />
            </div>
            <div className="field">
              <label htmlFor="backVol">
                Backing Volume{" "}
                <span id="backVolVal" className="val">
                  60
                </span>
                %
              </label>
              <input type="range" id="backVol" min="0" max="100" defaultValue="60" />
            </div>
            <div className="field">
              <label htmlFor="melodyVol">
                Melody Bed{" "}
                <span id="melodyVolVal" className="val">
                  22
                </span>
                %
              </label>
              <input type="range" id="melodyVol" min="0" max="100" defaultValue="22" />
            </div>
            <div className="field">
              <label htmlFor="reverb">
                Reverb Space{" "}
                <span id="reverbVal" className="val">
                  32
                </span>
                %
              </label>
              <input type="range" id="reverb" min="0" max="80" defaultValue="32" />
            </div>
            <div className="field">
              <label htmlFor="keySelect">Key / Scale</label>
              <select id="keySelect" defaultValue="0">
                <option value="0">A minor</option>
                <option value="7">E minor</option>
                <option value="5">D minor</option>
                <option value="10">G minor</option>
                <option value="3">C minor</option>
              </select>
            </div>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <button id="scaleLockBtn" className="toggle on">
              Scale Lock: ON
            </button>
            <button id="vibratoBtn" className="toggle on">
              Vibrato: ON
            </button>
            <button id="arpBtn" className="toggle on">
              Arp: ON
            </button>
            <button id="melodyBtn" className="toggle on">
              Auto-Melody: ON
            </button>
            <button id="accompanyBtn" className="toggle on">
              Accompany: ON
            </button>
            <button id="octDownBtn">Octave −</button>
            <button id="octUpBtn">Octave +</button>
            <span id="octLabel" style={{ color: "var(--dim)", fontSize: 12 }}>
              octave 0
            </span>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <span
              style={{
                color: "var(--dim)",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Backing Source:
            </span>
            <button id="srcGenBtn" className="toggle on">
              Generated Trance
            </button>
            <button id="srcTrackBtn" className="toggle">
              My Loaded Track
            </button>
            <button id="srcLoopBtn" className="toggle">
              My Looper
            </button>
            <span id="srcHint" style={{ color: "var(--dim)", fontSize: 12 }}>
              only one plays as your backing at a time — use Start Backing Track above
            </span>
          </div>
        </div>

        <div className="instrument-wrap">
          <svg viewBox="0 0 800 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1d3b2e" />
                <stop offset="45%" stopColor="#102419" />
                <stop offset="100%" stopColor="#03110a" />
              </linearGradient>
              <linearGradient id="keyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#dbe8de" />
                <stop offset="100%" stopColor="#8aa899" />
              </linearGradient>
            </defs>
            {/* reed / mouthpiece */}
            <path d="M8,74 L46,68 L46,92 L8,86 Z" fill="#c9a86b" />
            <rect x="4" y="78" width="10" height="4" rx="2" fill="#e8d9b0" />
            {/* main body */}
            <path
              d="M46,64 L660,56 C672,56 672,104 660,104 L46,96 Z"
              fill="url(#bodyGrad)"
              stroke="#1d4435"
              strokeWidth="1.5"
            />
            {/* bell flare */}
            <path
              d="M655,58 L730,44 C748,58 748,102 730,116 L655,102 Z"
              fill="url(#bodyGrad)"
              stroke="#1d4435"
              strokeWidth="1.5"
            />
            {/* decorative ferrule rings */}
            <rect x="150" y="57" width="6" height="45" fill="#7fc9a3" opacity="0.35" />
            <rect x="480" y="57" width="6" height="45" fill="#7fc9a3" opacity="0.35" />
            <rect x="620" y="57" width="6" height="45" fill="#c4a35a" opacity="0.35" />
            {/* tone holes */}
            <g fill="#03110a" stroke="#1d4435" strokeWidth="1">
              <circle cx="90" cy="80" r="6" />
              <circle cx="115" cy="78" r="6" />
              <circle cx="580" cy="82" r="6" />
              <circle cx="605" cy="83" r="6" />
            </g>
            {/* keys (decorative) */}
            <g fill="url(#keyGrad)" stroke="#1d4435" strokeWidth="1">
              <ellipse cx="200" cy="72" rx="14" ry="9" />
              <ellipse cx="235" cy="73" rx="10" ry="7" />
              <ellipse cx="330" cy="74" rx="16" ry="10" />
              <ellipse cx="420" cy="76" rx="12" ry="8" />
              <ellipse cx="545" cy="80" rx="13" ry="9" />
            </g>
            <g stroke="#8aa899" strokeWidth="2">
              <line x1="200" y1="63" x2="200" y2="60" />
              <line x1="330" y1="64" x2="330" y2="60" />
              <line x1="545" y1="71" x2="545" y2="60" />
            </g>
          </svg>
          <div className="oboe-screen">
            <div className="line" id="screenLine1">
              — idle —
            </div>
            <div className="line dim" id="screenLine2">
              start the backing or play a key
            </div>
          </div>
        </div>

        <div className="keys" id="keys"></div>
        <div className="hint">
          Play with your keyboard: <b>Z S X D C V G B N J M ,</b> (lower row) and{" "}
          <b>Q 2 W 3 E R 5 T 6 Y 7 U</b> (upper row) — mapped by physical key position,
          so it works on any keyboard layout. Or click / tap the keys above.
          <br />
          Scale Lock snaps everything you play into the current key, so it always sits in
          tune with the backing track. Turn it off for full chromatic freedom.
          <br />
          Accompany adds a sustained harmony a third under every note you hold, and the
          Melody Bed answers your phrases in the gaps between them.
        </div>
        <div className="legend">
          <span>
            <span className="dot" style={{ background: "var(--neon1)" }}></span>oboe note
            held
          </span>
          <span>
            <span className="dot" style={{ background: "var(--neon2)" }}></span>upper-row
            key
          </span>
        </div>
        <div className="status" id="status" role="status" aria-live="polite">
          audio engine idle — click Start to begin
        </div>

        <div className="panel">
          <h2 className="studio-title">Recording Studio</h2>

          <div className="row" style={{ marginBottom: 14 }}>
            <button id="micBtn" className="toggle">
              🎙 Enable Mic
            </button>
            <div className="field">
              <label htmlFor="micVol">
                Mic Volume{" "}
                <span id="micVolVal" className="val">
                  70
                </span>
                %
              </label>
              <input type="range" id="micVol" min="0" max="150" defaultValue="70" />
            </div>
            <label id="uploadBtn" className="file-btn">
              Upload / Load Track
              <input type="file" id="uploadInput" accept="audio/*" />
            </label>
            <button id="downloadBtn" disabled>
              ⬇ Download Track (WAV)
            </button>
          </div>

          <canvas id="waveform" width={900} height={120}></canvas>
          <div className="studio-readout">
            <span>
              Track: <b id="trackLenLabel">none loaded</b>
            </span>
            <span>
              Punch-in region: <b id="punchLabel">none selected (drag on the waveform)</b>
            </span>
            <span>
              Position: <b id="posLabel">0:00</b>
            </span>
          </div>

          <div className="row">
            <button id="playBtn" disabled>
              ▶ Play Track
            </button>
            <button id="trackLoopBtn" className="toggle">
              Loop: OFF
            </button>
            <button id="recordBtn" className="danger">
              ⏺ Record New Track
            </button>
            <button id="punchBtn" className="danger" disabled>
              ⏺ Punch-In Over Selection
            </button>
            <button id="clearPunchBtn" disabled>
              Clear Selection
            </button>
          </div>
          <div className="studio-status" id="studioStatus" role="status" aria-live="polite">
            mic off · no track loaded — record a fresh take, or upload/load one to
            punch-in over
          </div>
          <div className="hint" style={{ marginTop: 10 }}>
            Recording captures your microphone mixed live with whatever you play and hear
            (backing track + oboe). &quot;Record New Track&quot; makes a brand-new take
            from a blank timeline; once a track exists, drag a region on the waveform and
            use &quot;Punch-In&quot; to re-record and replace just that slice. Download
            saves the current track as a universally-playable .wav file — reload that same
            file later with Upload to keep building on a past session.
          </div>
        </div>

        <div className="panel">
          <h2 className="studio-title">Looper</h2>
          <div className="row" style={{ marginBottom: 10 }}>
            <div className="field">
              <label htmlFor="loopBars">Loop Length</label>
              <select id="loopBars" defaultValue="8">
                <option value="2">2 bars</option>
                <option value="4">4 bars</option>
                <option value="8">8 bars</option>
                <option value="16">16 bars</option>
                <option value="32">32 bars</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="loopVol">
                Loop Volume{" "}
                <span id="loopVolVal" className="val">
                  80
                </span>
                %
              </label>
              <input type="range" id="loopVol" min="0" max="150" defaultValue="80" />
            </div>
          </div>
          <div className="studio-readout">
            <span>
              Loop: <b id="loopInfoLabel">none yet</b>
            </span>
            <span>
              Layers: <b id="loopLayersLabel">0</b>
            </span>
          </div>
          <div className="row">
            <button id="recordLoopBtn" className="danger">
              ⏺ Record Loop Base
            </button>
            <button id="overdubBtn" className="danger" disabled>
              ⏺ Overdub Layer
            </button>
            <button id="loopPlayBtn" disabled>
              ▶ Play Loop
            </button>
            <button id="undoLoopBtn" disabled>
              ↩ Undo Last Layer
            </button>
            <button id="clearLoopBtn" disabled>
              Clear Loop
            </button>
            <button id="insertLoopBtn" disabled>
              📥 Insert Loop Into Track
            </button>
          </div>
          <div className="studio-status" id="loopStatus" role="status" aria-live="polite">
            no loop yet — pick a length and hit Record Loop Base to lay down the first pass
          </div>
          <div className="hint" style={{ marginTop: 10 }}>
            Record Loop Base captures your mic + oboe for exactly the chosen length, then
            starts looping immediately. Overdub Layer records one more full pass and mixes
            it into the loop the instant it comes back around — like a hardware looper
            pedal. Undo removes the most recent layer. Insert Loop Into Track appends the
            current loop into the Recording Studio track above (as a new track if none
            exists yet).
          </div>
        </div>
      </main>

      <Script src="/studio/engine.js" strategy="afterInteractive" />
    </div>
  );
}
