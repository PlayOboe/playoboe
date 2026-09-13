(() => {
  "use strict";

  // ---------- Audio context & master chain ----------
  let ctx = null;
  let masterGain, oboeBus, backingBus, melodicBus, melodyBus, analyser;
  let duckGain, masterComp, accompanyBus, genBus, accompanyDuck;
  let reverbInput, reverbReturn, oboeReverbSend, melodicReverbSend, melodyReverbSend;
  let performanceBus, performanceReverbReturn, micGain, trackGainNode, loopGainNode;
  let fullRecordDest, punchRecordDest;
  let running = false;

  function createImpulseResponse(duration, decay) {
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * duration);
    const impulse = ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random()*2-1) * Math.pow(1 - i/length, decay);
      }
    }
    return impulse;
  }

  function initAudio() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.9;

    oboeBus = ctx.createGain();
    oboeBus.gain.value = parseInt(oboeVolEl.value,10)/100;
    backingBus = ctx.createGain();
    backingBus.gain.value = parseInt(backVolEl.value,10)/100;
    melodicBus = ctx.createGain(); // pad + arp, feeds into backingBus
    melodicBus.gain.value = 1;
    melodyBus = ctx.createGain(); // generative auto-melody, own volume
    melodyBus.gain.value = parseInt(melodyVolEl.value,10)/100;

    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;

    // "performance" bus = mic + the oboe you play live. Kept separate from the
    // backing/track signal so a punch-in recording can capture ONLY your live
    // performance (not the backing bleeding back into the new take digitally).
    performanceBus = ctx.createGain(); performanceBus.gain.value = 1;
    micGain = ctx.createGain(); micGain.gain.value = parseInt(micVolEl.value,10)/100;
    trackGainNode = ctx.createGain(); trackGainNode.gain.value = 1;
    loopGainNode = ctx.createGain(); loopGainNode.gain.value = parseInt(loopVolEl.value,10)/100;
    loopGainNode.connect(masterGain);

    const irBuffer = createImpulseResponse(2.6, 2.1);

    // ambient reverb (backing: pad/arp + auto-melody)
    reverbInput = ctx.createGain();
    reverbInput.gain.value = 1;
    const convolver = ctx.createConvolver();
    convolver.buffer = irBuffer;
    reverbReturn = ctx.createGain();
    reverbReturn.gain.value = parseInt(reverbEl.value,10)/100;
    reverbInput.connect(convolver);
    convolver.connect(reverbReturn);
    reverbReturn.connect(masterGain);

    melodicReverbSend = ctx.createGain(); melodicReverbSend.gain.value = 0.22;
    melodyReverbSend = ctx.createGain(); melodyReverbSend.gain.value = 0.45;
    melodicBus.connect(melodicReverbSend); melodicReverbSend.connect(reverbInput);
    melodyBus.connect(melodyReverbSend); melodyReverbSend.connect(reverbInput);

    // performance reverb -- its own convolver (same IR, separate send/return) so it
    // stays inside performanceBus instead of mixing with the backing's reverb tail
    const performanceConvolver = ctx.createConvolver();
    performanceConvolver.buffer = irBuffer;
    performanceReverbReturn = ctx.createGain();
    performanceReverbReturn.gain.value = parseInt(reverbEl.value,10)/100;
    oboeReverbSend = ctx.createGain(); oboeReverbSend.gain.value = 0.22;
    oboeBus.connect(oboeReverbSend);
    oboeReverbSend.connect(performanceConvolver);
    performanceConvolver.connect(performanceReverbReturn);
    performanceReverbReturn.connect(performanceBus);

    // stereo chorus on the oboe bus (two modulated delay taps, panned wide)
    const chorusL = ctx.createDelay(0.05);
    const chorusR = ctx.createDelay(0.05);
    chorusL.delayTime.value = 0.018;
    chorusR.delayTime.value = 0.024;
    const lfo1 = ctx.createOscillator(); lfo1.type="sine"; lfo1.frequency.value = 0.17;
    const lfo1Depth = ctx.createGain(); lfo1Depth.gain.value = 0.004;
    const lfo2 = ctx.createOscillator(); lfo2.type="sine"; lfo2.frequency.value = 0.23;
    const lfo2Depth = ctx.createGain(); lfo2Depth.gain.value = 0.004;
    lfo1.connect(lfo1Depth); lfo1Depth.connect(chorusL.delayTime);
    lfo2.connect(lfo2Depth); lfo2Depth.connect(chorusR.delayTime);
    lfo1.start(); lfo2.start();
    const panL = ctx.createStereoPanner(); panL.pan.value = -0.8;
    const panR = ctx.createStereoPanner(); panR.pan.value = 0.8;
    const chorusMix = ctx.createGain(); chorusMix.gain.value = 0.2;
    oboeBus.connect(chorusL); chorusL.connect(panL); panL.connect(chorusMix);
    oboeBus.connect(chorusR); chorusR.connect(panR); panR.connect(chorusMix);
    chorusMix.connect(performanceBus);

    oboeBus.connect(performanceBus);
    micGain.connect(performanceBus);
    performanceBus.connect(masterGain);

    // Everything the generative track produces runs through genBus, so stopping can
    // silence it in one move — including notes already scheduled a moment ahead.
    genBus = ctx.createGain();
    genBus.gain.value = 1;
    genBus.connect(backingBus);

    // sidechain duck: the harmonic layers pass through here so the kick can pump them,
    // which is what gives trance its breathing motion.
    duckGain = ctx.createGain();
    duckGain.gain.value = 1;
    duckGain.connect(genBus);
    melodicBus.connect(duckGain);

    // Accompaniment voices that track what the player holds. They pump with the kick
    // like the rest of the backing, but sit outside genBus on purpose: they belong to
    // the instrument, so they keep answering the player once the track is stopped.
    accompanyDuck = ctx.createGain();
    accompanyDuck.gain.value = 1;
    accompanyDuck.connect(backingBus);
    accompanyBus = ctx.createGain();
    accompanyBus.gain.value = 0.55;
    accompanyBus.connect(accompanyDuck);
    const accompanyReverbSend = ctx.createGain();
    accompanyReverbSend.gain.value = 0.28;
    accompanyBus.connect(accompanyReverbSend);
    accompanyReverbSend.connect(reverbInput);

    backingBus.connect(masterGain);
    melodyBus.connect(masterGain);
    trackGainNode.connect(masterGain);

    // master glue: stops the drop from clipping once every layer is running at once
    masterComp = ctx.createDynamicsCompressor();
    masterComp.threshold.value = -10;
    masterComp.knee.value = 8;
    masterComp.ratio.value = 2.5;
    masterComp.attack.value = 0.004;
    masterComp.release.value = 0.18;

    masterGain.connect(masterComp);
    masterComp.connect(analyser);
    analyser.connect(ctx.destination);

    // recording taps: full session (everything audible) and performance-only (for punch-ins)
    fullRecordDest = ctx.createMediaStreamDestination();
    masterComp.connect(fullRecordDest);
    punchRecordDest = ctx.createMediaStreamDestination();
    performanceBus.connect(punchRecordDest);
  }

  // shared noise buffer (breath / hats)
  let noiseBuffer = null;
  function getNoiseBuffer() {
    if (noiseBuffer) return noiseBuffer;
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i=0;i<len;i++) data[i] = Math.random()*2-1;
    noiseBuffer = buf;
    return buf;
  }

  // ---------- Music theory helpers ----------
  const A3 = 220.0; // reference
  const KEY_OFFSETS = { "0":0, "7":7, "5":5, "10":10, "3":3 }; // semitone shift for chosen key vs A minor
  const NATURAL_MINOR = [0,2,3,5,7,8,10];

  function noteFreq(semitoneFromA3) {
    return A3 * Math.pow(2, semitoneFromA3/12);
  }

  function currentKeyOffset() {
    return KEY_OFFSETS[keySelectEl.value] || 0;
  }

  function inScaleSet(keyOffset) {
    const set = new Set();
    NATURAL_MINOR.forEach(s => set.add(((s + keyOffset)%12+12)%12));
    return set;
  }

  function snapToScale(semitoneAbs) {
    const keyOffset = currentKeyOffset();
    const scaleSet = inScaleSet(keyOffset);
    let pc = ((semitoneAbs%12)+12)%12;
    if (scaleSet.has(pc)) return semitoneAbs;
    for (let d=1; d<=6; d++) {
      if (scaleSet.has(((pc-d)%12+12)%12)) return semitoneAbs - d;
      if (scaleSet.has(((pc+d)%12+12)%12)) return semitoneAbs + d;
    }
    return semitoneAbs;
  }

  // scale-degree walk (0,1,2,...) -> absolute semitone from A3, for the generative melody
  function scaleDegreeToSemitone(degree, keyOffset) {
    const octave = Math.floor(degree/7);
    const idx = ((degree%7)+7)%7;
    return NATURAL_MINOR[idx] + 12*octave + keyOffset;
  }

  // inverse of the above: the scale degree sitting closest to a given note, so the
  // accompaniment can work in scale steps relative to whatever the player is holding
  function semitoneToScaleDegree(semitoneAbs, keyOffset) {
    let best = 0;
    let bestDist = Infinity;
    for (let d = -14; d <= 35; d++) {
      const dist = Math.abs(scaleDegreeToSemitone(d, keyOffset) - semitoneAbs);
      if (dist < bestDist) { bestDist = dist; best = d; }
    }
    return best;
  }

  const NOTE_NAMES = ["A","A#","B","C","C#","D","D#","E","F","F#","G","G#"];
  function noteName(semitoneAbs) {
    const idx = ((semitoneAbs%12)+12)%12;
    const octave = 3 + Math.floor(semitoneAbs/12);
    return NOTE_NAMES[idx] + octave;
  }

  function makeSaturationCurve(amount) {
    const n = 1024;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i / (n-1)) * 2 - 1;
      curve[i] = Math.tanh(x * amount) / Math.tanh(amount);
    }
    return curve;
  }

  // ---------- Oboe voice ----------
  const activeVoices = new Map(); // key -> voice
  let lastPlayedSemitone = null;  // what the melody bed harmonises against

  function playOboe(semitoneAbs) {
    if (!ctx) return;
    const now = ctx.currentTime;
    const freq = noteFreq(semitoneAbs);

    const osc1 = ctx.createOscillator();
    osc1.type = "sawtooth";
    osc1.frequency.value = freq;

    const osc2 = ctx.createOscillator();
    osc2.type = "sawtooth";
    osc2.frequency.value = freq * 1.004;

    const oscSub = ctx.createOscillator();
    oscSub.type = "triangle";
    oscSub.frequency.value = freq;

    // overtone layer: an octave-up partial that blooms in shortly after the attack,
    // like an oboe's brighter upper harmonics catching once the reed settles
    const oscOvertone = ctx.createOscillator();
    oscOvertone.type = "sawtooth";
    oscOvertone.frequency.value = freq * 2.003;

    // reed formant -- a double-peak formant bank is what actually reads as "oboe" rather
    // than generic synth: a strong low-mid nasal peak plus a brighter upper presence peak,
    // both with a slow breathing sweep so long notes don't sound static
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1500;
    bp.Q.value = 8;
    const bp2 = ctx.createBiquadFilter();
    bp2.type = "bandpass";
    bp2.frequency.value = 2900;
    bp2.Q.value = 6;
    const bpLfo = ctx.createOscillator();
    bpLfo.type = "sine";
    bpLfo.frequency.value = 0.35;
    const bpLfoDepth = ctx.createGain();
    bpLfoDepth.gain.value = 120;
    const bp2LfoDepth = ctx.createGain();
    bp2LfoDepth.gain.value = 90;
    bpLfo.connect(bpLfoDepth);
    bpLfo.connect(bp2LfoDepth);
    bpLfoDepth.connect(bp.frequency);
    bp2LfoDepth.connect(bp2.frequency);
    bpLfo.start(now);

    const formantMix = ctx.createGain();
    formantMix.gain.value = 0.55;

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 4800;

    // gentle saturation for harmonic richness (soft-clip, not distortion)
    const shaper = ctx.createWaveShaper();
    shaper.curve = makeSaturationCurve(2.1);
    shaper.oversample = "2x";

    const mixSaws = ctx.createGain();
    mixSaws.gain.value = 1.0;
    const mixSub = ctx.createGain();
    mixSub.gain.value = 0.22;
    const mixOvertone = ctx.createGain();
    mixOvertone.gain.setValueAtTime(0, now);
    mixOvertone.gain.linearRampToValueAtTime(0.2, now + 0.18);

    const env = ctx.createGain();
    env.gain.value = 0.0001;

    osc1.connect(mixSaws);
    osc2.connect(mixSaws);
    oscSub.connect(mixSub);
    oscOvertone.connect(mixOvertone);
    mixSaws.connect(shaper);
    mixSub.connect(shaper);
    mixOvertone.connect(shaper);
    shaper.connect(bp);
    shaper.connect(bp2);
    bp.connect(formantMix);
    bp2.connect(formantMix);
    formantMix.connect(lp);
    lp.connect(env);

    // breath noise texture
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = getNoiseBuffer();
    noiseSrc.loop = true;
    const noiseBP = ctx.createBiquadFilter();
    noiseBP.type = "bandpass";
    noiseBP.frequency.value = 2200;
    noiseBP.Q.value = 1.2;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.02;
    noiseSrc.connect(noiseBP);
    noiseBP.connect(noiseGain);
    noiseGain.connect(env);

    env.connect(oboeBus);

    // vibrato (delayed onset, like a real player)
    let lfo=null, lfoDepth=null;
    if (vibratoOn) {
      lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 5.4;
      lfoDepth = ctx.createGain();
      const centsDepth = freq * (Math.pow(2, 7/1200) - 1); // ~7 cents
      lfoDepth.gain.setValueAtTime(0, now);
      lfoDepth.gain.linearRampToValueAtTime(centsDepth, now + 0.5);
      lfo.connect(lfoDepth);
      lfoDepth.connect(osc1.frequency);
      lfoDepth.connect(osc2.frequency);
      lfoDepth.connect(oscOvertone.frequency);
      lfo.start(now);
    }

    // envelope: strong, immediate attack that stays present through the sustain
    const peak = 0.68;
    env.gain.cancelScheduledValues(now);
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(peak, now + 0.032);
    env.gain.linearRampToValueAtTime(peak*0.86, now + 0.18);

    osc1.start(now); osc2.start(now); oscSub.start(now); oscOvertone.start(now); noiseSrc.start(now);

    return { osc1, osc2, oscSub, oscOvertone, noiseSrc, bpLfo, env, lfo, freq, semitoneAbs };
  }

  function releaseOboe(voice) {
    if (!voice || !ctx) return;
    const now = ctx.currentTime;
    const release = 0.28;
    voice.env.gain.cancelScheduledValues(now);
    voice.env.gain.setValueAtTime(voice.env.gain.value, now);
    voice.env.gain.exponentialRampToValueAtTime(0.0001, now + release);
    const stopAt = now + release + 0.05;
    [voice.osc1, voice.osc2, voice.oscSub, voice.oscOvertone, voice.noiseSrc, voice.bpLfo].forEach(n => {
      try { n.stop(stopAt); } catch(e){}
    });
    if (voice.lfo) { try { voice.lfo.stop(stopAt); } catch(e){} }
  }

  // A sustained voice a diatonic third under whatever the player is holding. It sits
  // on the backing side of the mix (and ducks with it) so the oboe stays on top.
  function playAccompany(semitoneAbs) {
    if (!ctx || !accompanyOn || !accompanyBus) return null;
    const keyOffset = currentKeyOffset();
    const degree = semitoneToScaleDegree(semitoneAbs, keyOffset);
    const freq = noteFreq(scaleDegreeToSemitone(degree - 2, keyOffset));
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    osc1.type = "triangle";
    osc1.frequency.value = freq;
    const osc2 = ctx.createOscillator();
    osc2.type = "sawtooth";
    osc2.frequency.value = freq * 1.004;

    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.value = 1900;
    filt.Q.value = 0.6;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(0.18, now + 0.16);

    osc1.connect(filt); osc2.connect(filt); filt.connect(env); env.connect(accompanyBus);
    osc1.start(now); osc2.start(now);
    return { osc1, osc2, env };
  }

  function releaseAccompany(voice) {
    if (!voice || !ctx) return;
    const now = ctx.currentTime;
    voice.env.gain.cancelScheduledValues(now);
    voice.env.gain.setValueAtTime(voice.env.gain.value, now);
    voice.env.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
    [voice.osc1, voice.osc2].forEach(n => { try { n.stop(now + 0.42); } catch(e){} });
  }

  function noteOn(keyId, semitoneRaw) {
    if (activeVoices.has(keyId)) return;
    initAudio();
    if (ctx.state === "suspended") ctx.resume();
    let semitone = semitoneRaw + octaveShift*12;
    if (scaleLockOn) semitone = snapToScale(semitone);
    const voice = playOboe(semitone);
    voice.accompany = playAccompany(semitone);
    lastPlayedSemitone = semitone;
    activeVoices.set(keyId, voice);
    highlightKey(keyId, true);
  }

  function noteOff(keyId) {
    const voice = activeVoices.get(keyId);
    if (voice) {
      releaseOboe(voice);
      releaseAccompany(voice.accompany);
      activeVoices.delete(keyId);
    }
    highlightKey(keyId, false);
  }

  function highlightKey(keyId, on) {
    const el = document.querySelector(`.key[data-key="${cssEscape(keyId)}"]`);
    if (el) el.classList.toggle("active", on);
  }
  function cssEscape(s){ return s.replace(/[^a-zA-Z0-9_-]/g, "\\$&"); }

  // ---------- Keyboard / on-screen key layout ----------
  // Mapped by e.code (physical key position), not e.key (the character your
  // layout produces) -- so this works the same on any keyboard layout/language,
  // not just US-QWERTY. Labels shown are the US-QWERTY reference letters.
  // lower row: 12 chromatic semitones from A3 (0..11), upper row continues 12..23
  const LOWER = [
    {k:"KeyZ",  s:0,  black:false, label:"Z"},
    {k:"KeyS",  s:1,  black:true,  label:"S"},
    {k:"KeyX",  s:2,  black:false, label:"X"},
    {k:"KeyD",  s:3,  black:true,  label:"D"},
    {k:"KeyC",  s:4,  black:false, label:"C"},
    {k:"KeyV",  s:5,  black:false, label:"V"},
    {k:"KeyG",  s:6,  black:true,  label:"G"},
    {k:"KeyB",  s:7,  black:false, label:"B"},
    {k:"KeyN",  s:8,  black:false, label:"N"},
    {k:"KeyJ",  s:9,  black:true,  label:"J"},
    {k:"KeyM",  s:10, black:false, label:"M"},
    {k:"Comma", s:11, black:false, label:","},
  ];
  const UPPER = [
    {k:"KeyQ",   s:12, black:false, label:"Q"},
    {k:"Digit2", s:13, black:true,  label:"2"},
    {k:"KeyW",   s:14, black:false, label:"W"},
    {k:"Digit3", s:15, black:true,  label:"3"},
    {k:"KeyE",   s:16, black:false, label:"E"},
    {k:"KeyR",   s:17, black:false, label:"R"},
    {k:"Digit5", s:18, black:true,  label:"5"},
    {k:"KeyT",   s:19, black:false, label:"T"},
    {k:"Digit6", s:20, black:true,  label:"6"},
    {k:"KeyY",   s:21, black:false, label:"Y"},
    {k:"Digit7", s:22, black:true,  label:"7"},
    {k:"KeyU",   s:23, black:false, label:"U"},
  ];
  const ALL_KEYS = LOWER.concat(UPPER);
  const KEY_TO_SEMITONE = {};
  ALL_KEYS.forEach(o => KEY_TO_SEMITONE[o.k] = o.s);

  function buildKeyboardUI() {
    const container = document.getElementById("keys");
    container.innerHTML = "";
    ALL_KEYS.forEach(o => {
      const div = document.createElement("div");
      div.className = "key" + (o.black ? " black" : "");
      div.dataset.key = o.k;
      div.textContent = o.label.toUpperCase();
      container.appendChild(div);

      const press = (ev) => { ev.preventDefault(); noteOn(o.k, o.s); };
      const release = (ev) => { ev.preventDefault(); noteOff(o.k); };
      div.addEventListener("pointerdown", press);
      div.addEventListener("pointerup", release);
      div.addEventListener("pointerleave", release);
      div.addEventListener("pointercancel", release);
    });
  }

  const heldKeys = new Set();
  window.addEventListener("keydown", (e) => {
    const k = e.code;
    if (KEY_TO_SEMITONE.hasOwnProperty(k) && !e.repeat) {
      heldKeys.add(k);
      noteOn(k, KEY_TO_SEMITONE[k]);
    }
  });
  window.addEventListener("keyup", (e) => {
    const k = e.code;
    if (KEY_TO_SEMITONE.hasOwnProperty(k)) {
      heldKeys.delete(k);
      noteOff(k);
    }
  });
  window.addEventListener("blur", () => {
    heldKeys.forEach(k => noteOff(k));
    heldKeys.clear();
  });

  // ---------- Trance backing track ----------
  let bpm = 138;
  let schedulerTimer = null;
  let nextStepTime = 0;
  let step16 = 0; // 0..15 within a bar
  let bar = 0;    // 0..7 within the 8-bar progression
  const LOOKAHEAD_MS = 25;
  const SCHEDULE_AHEAD = 0.12;

  // Two 8-bar progressions, 2 bars per chord, alternating every arrangement cycle so
  // the harmony actually travels instead of looping the same four chords all night.
  //   A: i - VI - III - VII  (the classic minor-trance turn)
  //   B: i - iv - VI - VII   (the iv darkens the second half of the journey)
  // Degrees are semitones from the tonic; both stay inside the natural minor scale,
  // so anything the player hits with Scale Lock on still agrees with the backing.
  const PROGRESSIONS = [
    [{ deg:0, third:3, name:"i" }, { deg:-4, third:4, name:"VI" }, { deg:3, third:4, name:"III" }, { deg:-2, third:4, name:"VII" }],
    [{ deg:0, third:3, name:"i" }, { deg:5, third:3, name:"iv" }, { deg:-4, third:4, name:"VI" }, { deg:-2, third:4, name:"VII" }],
  ];

  function chordForBar(barIdx, keyOffset) {
    // relative to A2 = 110
    const A2 = 110 * Math.pow(2, keyOffset/12);
    const prog = PROGRESSIONS[Math.floor(totalBars / CYCLE_BARS) % PROGRESSIONS.length];
    const c = prog[Math.floor(barIdx/2) % 4];
    return { root: A2 * Math.pow(2, c.deg/12), third: c.third, name: c.name };
  }

  // Bassline variety: 6 curated 4-step rhythmic motifs (semitone offsets from the
  // chord root; null = rest) combined across 4 beats to build a pool of 64 distinct
  // 16-step bassline patterns (well over the requested 50+), cycled bar-by-bar so
  // the groove keeps evolving instead of looping the same 16 steps forever.
  const BASS_MOTIFS = [
    [0,0,7,0],
    [0,null,7,12],
    [0,0,0,7],
    [12,0,7,0],
    [0,7,0,12],
    [0,null,0,7],
  ];
  function buildBassPatterns(count) {
    const patterns = [];
    for (let i = 0; i < count; i++) {
      const pat = [];
      for (let g = 0; g < 4; g++) {
        const motifIdx = Math.floor(i / Math.pow(BASS_MOTIFS.length, g)) % BASS_MOTIFS.length;
        pat.push(...BASS_MOTIFS[motifIdx]);
      }
      pat[0] = 0; // always anchor the downbeat on the root
      patterns.push(pat);
    }
    return patterns;
  }
  const BASS_PATTERNS = buildBassPatterns(64);
  let totalBars = 0;

  // ---------- Arrangement ----------
  // A 32-bar journey rather than one flat texture: layers arrive, the drop lands,
  // then it strips back to pad and melody before building again.
  const CYCLE_BARS = 32;
  const SECTIONS = [
    { name:"intro",     from:0,  to:8,  kick:true,  hats:false, bass:false, arp:false, pad:true, melody:false, arpMul:2 },
    { name:"build",     from:8,  to:16, kick:true,  hats:true,  bass:true,  arp:true,  pad:true, melody:false, arpMul:2 },
    { name:"drop",      from:16, to:24, kick:true,  hats:true,  bass:true,  arp:true,  pad:true, melody:true,  arpMul:4 },
    { name:"breakdown", from:24, to:32, kick:false, hats:false, bass:false, arp:true,  pad:true, melody:true,  arpMul:2 },
  ];

  function sectionFor(barsElapsed) {
    const pos = ((barsElapsed % CYCLE_BARS) + CYCLE_BARS) % CYCLE_BARS;
    for (const s of SECTIONS) {
      if (pos >= s.from && pos < s.to) return s;
    }
    return SECTIONS[0];
  }

  function freqToSemitone(freq) { return Math.round(12*Math.log2(freq/A3)); }
  function chordLabel(chord) {
    const idx = ((freqToSemitone(chord.root)%12)+12)%12;
    return NOTE_NAMES[idx] + (chord.third === 3 ? "m" : "");
  }

  function playKick(time) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.11);
    gain.gain.setValueAtTime(0.9, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);
    osc.connect(gain); gain.connect(genBus);
    osc.start(time); osc.stop(time + 0.3);
    duckOnKick(time);
  }

  // sidechain envelope: snap the harmonic layers down on the kick, let them swell back
  function duckOnKick(time) {
    const beat = 60/bpm;
    [duckGain, accompanyDuck].forEach(node => {
      if (!node) return;
      node.gain.cancelScheduledValues(time);
      node.gain.setValueAtTime(1, time);
      node.gain.linearRampToValueAtTime(0.3, time + 0.014);
      node.gain.linearRampToValueAtTime(1, time + beat*0.68);
    });
  }

  // noise sweep that lifts into a section change
  function playRiser(time, dur) {
    const src = ctx.createBufferSource();
    src.buffer = getNoiseBuffer();
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(600, time);
    bp.frequency.exponentialRampToValueAtTime(8000, time + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.12, time + dur*0.85);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    src.connect(bp); bp.connect(gain); gain.connect(genBus);
    src.start(time); src.stop(time + dur + 0.05);
  }

  // downbeat crash to land a drop
  function playCrash(time) {
    const src = ctx.createBufferSource();
    src.buffer = getNoiseBuffer();
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 4000;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.22, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.4);
    src.connect(hp); hp.connect(gain); gain.connect(genBus);
    src.start(time); src.stop(time + 1.5);
  }

  function playHat(time, open) {
    const src = ctx.createBufferSource();
    src.buffer = getNoiseBuffer();
    const bp = ctx.createBiquadFilter();
    bp.type = "highpass";
    bp.frequency.value = 7000;
    const gain = ctx.createGain();
    const dur = open ? 0.18 : 0.045;
    gain.gain.setValueAtTime(open ? 0.18 : 0.14, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    src.connect(bp); bp.connect(gain); gain.connect(genBus);
    src.start(time); src.stop(time + dur + 0.02);
  }

  function playBassNote(time, freq, dur) {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass";
    filt.Q.value = 6;
    filt.frequency.setValueAtTime(1800, time);
    filt.frequency.exponentialRampToValueAtTime(180, time + dur*0.9);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.5, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(filt); filt.connect(gain); gain.connect(duckGain);
    osc.start(time); osc.stop(time + dur + 0.02);
  }

  function playPad(time, freqs, dur) {
    freqs.forEach((f, i) => {
      const osc1 = ctx.createOscillator();
      osc1.type = "sawtooth";
      osc1.frequency.value = f;
      const osc2 = ctx.createOscillator();
      osc2.type = "sawtooth";
      osc2.frequency.value = f * 1.006;
      // Highpass first: the pad has no business in the bass register, and keeping it
      // out is most of what stops the mix sounding like a wash.
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 220;
      const filt = ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.value = 1600;
      filt.Q.value = 0.7;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(0.045, time + 0.6);
      gain.gain.setValueAtTime(0.045, time + dur - 0.6);
      gain.gain.linearRampToValueAtTime(0.0001, time + dur);
      osc1.connect(hp); osc2.connect(hp); hp.connect(filt); filt.connect(gain); gain.connect(melodicBus);
      osc1.start(time); osc2.start(time);
      osc1.stop(time + dur + 0.05); osc2.stop(time + dur + 0.05);
    });
  }

  // classic trance "pluck": fast filter-swept saw, short decay, ping-ponged L/R
  function playPluck(time, freq, dur, pan) {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    const filt = ctx.createBiquadFilter();
    filt.type = "bandpass";
    filt.Q.value = 3.5;
    filt.frequency.setValueAtTime(4200, time);
    filt.frequency.exponentialRampToValueAtTime(500, time + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.22, time + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    osc.connect(filt); filt.connect(gain); gain.connect(panner); panner.connect(melodicBus);
    osc.start(time); osc.stop(time + dur + 0.02);
  }

  // soft bell/pluck timbre for the generative counter-melody (2-op FM-ish, distinct from the oboe)
  function playBell(time, freq, dur, pan) {
    const carrier = ctx.createOscillator();
    carrier.type = "sine";
    carrier.frequency.value = freq;
    const modulator = ctx.createOscillator();
    modulator.type = "sine";
    modulator.frequency.value = freq * 3.01;
    const modGain = ctx.createGain();
    modGain.gain.setValueAtTime(freq * 1.2, time);
    modGain.gain.exponentialRampToValueAtTime(1, time + dur*0.8);
    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.3, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    carrier.connect(gain); gain.connect(panner); panner.connect(melodyBus);
    carrier.start(time); modulator.start(time);
    carrier.stop(time + dur + 0.05); modulator.stop(time + dur + 0.05);
  }

  let melodyDegree = 7; // scale-degree random walk position for the generative melody
  let lastMelodyNote = null;

  // The melody bed answers the player rather than wandering on its own: while a note
  // is held it thins out and harmonises underneath it, and in the gaps it picks the
  // line back up from wherever the player left off.
  // Shift a scale degree by whole octaves until it lands in the bell's register.
  // Transposing by 7 degrees keeps the interval intact, where clamping would flatten
  // a harmony line into a wrong note whenever the player sits low on the keyboard.
  function fitDegreeToRange(degree, lo, hi) {
    let d = degree;
    while (d < lo) d += 7;
    while (d > hi) d -= 7;
    return d;
  }

  function scheduleMelodyNote(time, stepDur, keyOffset) {
    const playerHolding = activeVoices.size > 0;
    if (Math.random() >= (playerHolding ? 0.26 : 0.62)) return;

    if (playerHolding && lastPlayedSemitone !== null) {
      const degree = semitoneToScaleDegree(lastPlayedSemitone, keyOffset);
      const interval = Math.random() < 0.6 ? 2 : 5; // a third or a sixth away
      melodyDegree = fitDegreeToRange(degree - interval, 7, 20);
    } else {
      if (lastPlayedSemitone !== null && Math.random() < 0.35) {
        melodyDegree = fitDegreeToRange(
          semitoneToScaleDegree(lastPlayedSemitone, keyOffset), 7, 20
        );
      }
      const steps = [-2,-1,-1,0,1,1,2];
      melodyDegree += steps[Math.floor(Math.random()*steps.length)];
      melodyDegree = Math.max(7, Math.min(20, melodyDegree));
    }

    const semitone = scaleDegreeToSemitone(melodyDegree, keyOffset) + 12;
    const dur = stepDur * (Math.random() < 0.3 ? 3.6 : 1.8);
    const pan = (Math.random()*1.2 - 0.6);
    playBell(time, noteFreq(semitone), dur, pan);
    lastMelodyNote = noteName(semitone);
  }

  function scheduleStep(stepIdx, barIdx, time) {
    const keyOffset = currentKeyOffset();
    const chord = chordForBar(barIdx, keyOffset);
    const stepDur = (60/bpm)/4;
    const section = sectionFor(totalBars);
    const barInCycle = ((totalBars % CYCLE_BARS) + CYCLE_BARS) % CYCLE_BARS;

    // transitions: a two-bar riser into the drop, a crash on the downbeat it lands on
    if (stepIdx === 0 && barInCycle === 14) playRiser(time, (60/bpm)*4*2);
    if (stepIdx === 0 && barInCycle === 16) playCrash(time);

    // kick: 4-on-the-floor
    if (section.kick && stepIdx % 4 === 0) playKick(time);
    // hats: offbeat 8ths, open hat on step 14
    if (section.hats) {
      if (stepIdx % 2 === 1) playHat(time, false);
      if (stepIdx === 14) playHat(time, true);
    }

    // bass: cycles through the 64-pattern pool, one pattern per bar
    if (section.bass) {
      const bassPattern = BASS_PATTERNS[totalBars % BASS_PATTERNS.length];
      const semis = bassPattern[stepIdx];
      if (semis !== null) {
        const bassFreq = chord.root * Math.pow(2, semis/12);
        playBassNote(time, bassFreq, stepDur*0.9);
      }
    }

    // pad: once per chord (every 2 bars = 32 steps), at bar start when bar is even.
    // The added 9th is what keeps the chord from sounding like a plain triad.
    if (section.pad && stepIdx === 0 && barIdx % 2 === 0) {
      const barDur = (60/bpm)*4;
      const padFreqs = [
        chord.root*2,
        chord.root*Math.pow(2, chord.third/12)*2,
        chord.root*Math.pow(2, 7/12)*2,
        chord.root*Math.pow(2, 14/12)*2,
      ];
      playPad(time, padFreqs, barDur*2*0.98);
    }

    // arpeggio: classic 16th-note trance pluck cycling through the chord tones,
    // ping-ponging left/right — an octave lower outside the drop
    if (arpOn && section.arp) {
      const tones = [0, chord.third, 7, 12];
      const toneIdx = stepIdx % 4;
      if (!(stepIdx % 8 === 7)) { // brief gate breath every 2 beats
        const arpFreq = chord.root * section.arpMul * Math.pow(2, tones[toneIdx]/12);
        const pan = (Math.floor(stepIdx/4) % 2 === 0) ? -0.55 : 0.55;
        playPluck(time, arpFreq, stepDur*0.95, pan);
      }
    }

    if (melodyOn && section.melody && stepIdx % 2 === 0) {
      scheduleMelodyNote(time, stepDur, keyOffset);
    }
  }

  function schedulerTick() {
    while (nextStepTime < ctx.currentTime + SCHEDULE_AHEAD) {
      scheduleStep(step16, bar, nextStepTime);
      const stepDur = (60/bpm)/4;
      nextStepTime += stepDur;
      step16++;
      if (step16 === 16) { step16 = 0; bar = (bar+1) % 8; totalBars++; }
    }
  }

  function startBacking() {
    initAudio();
    if (ctx.state === "suspended") ctx.resume();
    if (running) return;
    restoreGenerativeLevels();
    running = true;
    step16 = 0; bar = 0; totalBars = 0;
    nextStepTime = ctx.currentTime + 0.05;
    schedulerTimer = setInterval(schedulerTick, LOOKAHEAD_MS);
    startBtn.textContent = "■ Stop Backing Track";
    statusEl.textContent = "backing track running — play the oboe over it";
  }

  // Clearing the scheduler is not enough to make Stop sound like a stop: notes are
  // queued a moment ahead, the pad runs for two bars and the reverb tails for another
  // two seconds. Fading the generative buses out cuts all of that at once.
  function silenceGenerative() {
    if (!ctx) return;
    const t = ctx.currentTime;
    [genBus, melodyBus, reverbReturn].forEach(node => {
      if (!node) return;
      node.gain.cancelScheduledValues(t);
      node.gain.setValueAtTime(node.gain.value, t);
      node.gain.linearRampToValueAtTime(0.0001, t + 0.14);
    });
    if (duckGain) {
      duckGain.gain.cancelScheduledValues(t);
      duckGain.gain.setValueAtTime(1, t);
    }
  }

  function restoreGenerativeLevels() {
    if (!ctx) return;
    const t = ctx.currentTime;
    const set = (node, value) => {
      if (!node) return;
      node.gain.cancelScheduledValues(t);
      node.gain.setValueAtTime(value, t);
    };
    set(genBus, 1);
    set(melodyBus, parseInt(melodyVolEl.value,10)/100);
    set(reverbReturn, parseInt(reverbEl.value,10)/100);
  }

  function stopBacking() {
    running = false;
    if (schedulerTimer) clearInterval(schedulerTimer);
    schedulerTimer = null;
    silenceGenerative();
    startBtn.textContent = "▶ Start Backing Track";
    statusEl.textContent = "backing track stopped";
  }

  // ---------- UI wiring ----------
  const startBtn = document.getElementById("startBtn");
  const bpmEl = document.getElementById("bpm");
  const oboeVolEl = document.getElementById("oboeVol");
  const backVolEl = document.getElementById("backVol");
  const melodyVolEl = document.getElementById("melodyVol");
  const reverbEl = document.getElementById("reverb");
  const keySelectEl = document.getElementById("keySelect");
  const scaleLockBtn = document.getElementById("scaleLockBtn");
  const vibratoBtn = document.getElementById("vibratoBtn");
  const arpBtn = document.getElementById("arpBtn");
  const melodyBtn = document.getElementById("melodyBtn");
  const accompanyBtn = document.getElementById("accompanyBtn");
  const octDownBtn = document.getElementById("octDownBtn");
  const octUpBtn = document.getElementById("octUpBtn");
  const octLabel = document.getElementById("octLabel");
  const statusEl = document.getElementById("status");
  const screenLine1El = document.getElementById("screenLine1");
  const screenLine2El = document.getElementById("screenLine2");
  const bpmValEl = document.getElementById("bpmVal");
  const oboeVolValEl = document.getElementById("oboeVolVal");
  const backVolValEl = document.getElementById("backVolVal");
  const melodyVolValEl = document.getElementById("melodyVolVal");
  const reverbValEl = document.getElementById("reverbVal");
  const micBtn = document.getElementById("micBtn");
  const micVolEl = document.getElementById("micVol");
  const micVolValEl = document.getElementById("micVolVal");
  const uploadInput = document.getElementById("uploadInput");
  const downloadBtn = document.getElementById("downloadBtn");
  const trackLenLabelEl = document.getElementById("trackLenLabel");
  const punchLabelEl = document.getElementById("punchLabel");
  const posLabelEl = document.getElementById("posLabel");
  const playBtn = document.getElementById("playBtn");
  const trackLoopBtn = document.getElementById("trackLoopBtn");
  const recordBtn = document.getElementById("recordBtn");
  const punchBtn = document.getElementById("punchBtn");
  const clearPunchBtn = document.getElementById("clearPunchBtn");
  const studioStatusEl = document.getElementById("studioStatus");
  const srcGenBtn = document.getElementById("srcGenBtn");
  const srcTrackBtn = document.getElementById("srcTrackBtn");
  const srcLoopBtn = document.getElementById("srcLoopBtn");
  const srcHintEl = document.getElementById("srcHint");
  const loopBarsEl = document.getElementById("loopBars");
  const loopVolEl = document.getElementById("loopVol");
  const loopVolValEl = document.getElementById("loopVolVal");
  const loopInfoLabelEl = document.getElementById("loopInfoLabel");
  const loopLayersLabelEl = document.getElementById("loopLayersLabel");
  const recordLoopBtn = document.getElementById("recordLoopBtn");
  const overdubBtn = document.getElementById("overdubBtn");
  const loopPlayBtn = document.getElementById("loopPlayBtn");
  const undoLoopBtn = document.getElementById("undoLoopBtn");
  const clearLoopBtn = document.getElementById("clearLoopBtn");
  const insertLoopBtn = document.getElementById("insertLoopBtn");
  const loopStatusEl = document.getElementById("loopStatus");

  let scaleLockOn = true;
  let vibratoOn = true;
  let arpOn = true;
  let melodyOn = true;
  let accompanyOn = true;
  let octaveShift = 0;

  startBtn.addEventListener("click", () => {
    if (!running) { startBacking(); selectBackingSource("generated"); } else stopBacking();
  });

  // ---- Backing source selector: only one plays as "the backing" at a time ----
  function selectBackingSource(src) {
    srcGenBtn.classList.toggle("on", src === "generated");
    srcTrackBtn.classList.toggle("on", src === "track");
    srcLoopBtn.classList.toggle("on", src === "loop");
    if (src !== "generated" && running) stopBacking();
    if (src !== "track" && isTrackPlaying) stopTrackPlayback();
    if (src !== "loop") stopLoopPlayback();
    const hints = {
      generated: "only one plays as your backing at a time — use Start Backing Track above",
      track: "only one plays as your backing at a time — use Play Track in the Recording Studio below",
      loop: "only one plays as your backing at a time — use Play Loop / Record Loop Base in the Looper below",
    };
    srcHintEl.textContent = hints[src];
  }
  srcGenBtn.addEventListener("click", () => selectBackingSource("generated"));
  srcTrackBtn.addEventListener("click", () => selectBackingSource("track"));
  srcLoopBtn.addEventListener("click", () => selectBackingSource("loop"));

  bpmEl.addEventListener("input", () => { bpm = parseInt(bpmEl.value,10); bpmValEl.textContent = bpm; });

  oboeVolEl.addEventListener("input", () => {
    oboeVolValEl.textContent = oboeVolEl.value;
    if (oboeBus) oboeBus.gain.value = parseInt(oboeVolEl.value,10)/100;
  });
  backVolEl.addEventListener("input", () => {
    backVolValEl.textContent = backVolEl.value;
    if (backingBus) backingBus.gain.value = parseInt(backVolEl.value,10)/100;
  });
  melodyVolEl.addEventListener("input", () => {
    melodyVolValEl.textContent = melodyVolEl.value;
    if (melodyBus) melodyBus.gain.value = parseInt(melodyVolEl.value,10)/100;
  });
  reverbEl.addEventListener("input", () => {
    reverbValEl.textContent = reverbEl.value;
    const v = parseInt(reverbEl.value,10)/100;
    if (reverbReturn) reverbReturn.gain.value = v;
    if (performanceReverbReturn) performanceReverbReturn.gain.value = v;
  });

  scaleLockBtn.addEventListener("click", () => {
    scaleLockOn = !scaleLockOn;
    scaleLockBtn.textContent = "Scale Lock: " + (scaleLockOn ? "ON" : "OFF");
    scaleLockBtn.classList.toggle("on", scaleLockOn);
  });
  vibratoBtn.addEventListener("click", () => {
    vibratoOn = !vibratoOn;
    vibratoBtn.textContent = "Vibrato: " + (vibratoOn ? "ON" : "OFF");
    vibratoBtn.classList.toggle("on", vibratoOn);
  });
  arpBtn.addEventListener("click", () => {
    arpOn = !arpOn;
    arpBtn.textContent = "Arp: " + (arpOn ? "ON" : "OFF");
    arpBtn.classList.toggle("on", arpOn);
  });
  melodyBtn.addEventListener("click", () => {
    melodyOn = !melodyOn;
    melodyBtn.textContent = "Auto-Melody: " + (melodyOn ? "ON" : "OFF");
    melodyBtn.classList.toggle("on", melodyOn);
    if (!melodyOn) lastMelodyNote = null;
  });
  accompanyBtn.addEventListener("click", () => {
    accompanyOn = !accompanyOn;
    accompanyBtn.textContent = "Accompany: " + (accompanyOn ? "ON" : "OFF");
    accompanyBtn.classList.toggle("on", accompanyOn);
    if (!accompanyOn) {
      activeVoices.forEach(v => { releaseAccompany(v.accompany); v.accompany = null; });
    }
  });
  octDownBtn.addEventListener("click", () => { octaveShift = Math.max(-2, octaveShift-1); octLabel.textContent = "octave " + octaveShift; });
  octUpBtn.addEventListener("click", () => { octaveShift = Math.min(2, octaveShift+1); octLabel.textContent = "octave " + octaveShift; });

  buildKeyboardUI();

  // ---------- Live instrument-screen readout ----------
  setInterval(() => {
    if (!ctx) {
      screenLine1El.textContent = "— idle —";
      screenLine2El.textContent = "start the backing or play a key";
      return;
    }
    const keyOffset = currentKeyOffset();
    const chord = chordForBar(bar, keyOffset);
    const heldNotes = Array.from(activeVoices.values()).map(v => noteName(v.semitoneAbs));
    const barInCycle = ((totalBars % CYCLE_BARS) + CYCLE_BARS) % CYCLE_BARS;
    const posLabel = running
      ? `${sectionFor(totalBars).name.toUpperCase()} ${barInCycle+1}/${CYCLE_BARS}`
      : "stopped";
    screenLine1El.textContent = `${chordLabel(chord)} (${chord.name})  ${posLabel}`;
    screenLine2El.textContent = `Oboe:${heldNotes.length ? heldNotes.join(",") : "-"}  Mel:${melodyOn ? (lastMelodyNote || "…") : "off"}  Acc:${accompanyOn ? "on" : "off"}`;
  }, 150);

  // ---------- Recording Studio ----------
  let micStream = null, micSourceNode = null;
  let currentTrackBuffer = null;
  let trackSourceNode = null;
  let trackPlaybackStartCtxTime = 0, trackPlaybackStartOffset = 0;
  let isTrackPlaying = false;
  let pausedAtSec = 0;
  let punchStartSec = null, punchEndSec = null;
  let fullRecorder = null, fullRecorderChunks = [];
  let punchRecorder = null, punchRecorderChunks = [];
  let punchAbort = false;

  function pickMimeType() {
    const candidates = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
    for (const c of candidates) {
      if (window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(c)) return c;
    }
    return "";
  }

  function formatTime(s) {
    s = Math.max(0, s || 0);
    const m = Math.floor(s / 60);
    const sec = (s % 60).toFixed(1).padStart(4, "0");
    return `${m}:${sec}`;
  }

  // ---- Microphone ----
  async function enableMic() {
    initAudio();
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      micSourceNode = ctx.createMediaStreamSource(micStream);
      micSourceNode.connect(micGain);
      micBtn.textContent = "🎙 Mic: ON";
      micBtn.classList.add("on");
      studioStatusEl.textContent = "mic connected — use headphones to avoid feedback/echo";
    } catch (err) {
      studioStatusEl.textContent = "mic permission denied or unavailable: " + err.message;
    }
  }
  function disableMic() {
    if (micSourceNode) { micSourceNode.disconnect(); micSourceNode = null; }
    if (micStream) { micStream.getTracks().forEach(t => t.stop()); micStream = null; }
    micBtn.textContent = "🎙 Enable Mic";
    micBtn.classList.remove("on");
    studioStatusEl.textContent = "mic off";
  }
  micBtn.addEventListener("click", () => { if (micStream) disableMic(); else enableMic(); });
  micVolEl.addEventListener("input", () => {
    micVolValEl.textContent = micVolEl.value;
    if (micGain) micGain.gain.value = parseInt(micVolEl.value, 10) / 100;
  });
  loopVolEl.addEventListener("input", () => {
    loopVolValEl.textContent = loopVolEl.value;
    if (loopGainNode) loopGainNode.gain.value = parseInt(loopVolEl.value, 10) / 100;
  });

  // ---- Track loading ----
  function setTrack(buffer) {
    currentTrackBuffer = buffer;
    pausedAtSec = 0;
    punchStartSec = null; punchEndSec = null;
    updatePunchLabel();
    trackLenLabelEl.textContent = formatTime(buffer.duration);
    playBtn.disabled = false;
    downloadBtn.disabled = false;
    punchBtn.disabled = true;
    clearPunchBtn.disabled = true;
    drawWaveform();
  }

  uploadInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    initAudio();
    stopTrackPlayback();
    try {
      const arrayBuf = await file.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuf);
      setTrack(decoded);
      studioStatusEl.textContent = `loaded "${file.name}" (${formatTime(decoded.duration)}) — drag a region to punch-in`;
    } catch (err) {
      studioStatusEl.textContent = "could not decode that audio file: " + err.message;
    }
    uploadInput.value = "";
  });

  downloadBtn.addEventListener("click", () => {
    if (!currentTrackBuffer) return;
    const blob = audioBufferToWavBlob(currentTrackBuffer);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "oboe-trance-session.wav";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  });

  function audioBufferToWavBlob(buffer) {
    const numCh = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const numFrames = buffer.length;
    const blockAlign = numCh * 2;
    const dataSize = numFrames * blockAlign;
    const arrBuf = new ArrayBuffer(44 + dataSize);
    const view = new DataView(arrBuf);
    const writeStr = (offset, str) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };
    writeStr(0, "RIFF"); view.setUint32(4, 36 + dataSize, true); writeStr(8, "WAVE");
    writeStr(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, numCh, true);
    view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true); view.setUint16(34, 16, true);
    writeStr(36, "data"); view.setUint32(40, dataSize, true);
    const channels = [];
    for (let ch = 0; ch < numCh; ch++) channels.push(buffer.getChannelData(ch));
    let offset = 44;
    for (let i = 0; i < numFrames; i++) {
      for (let ch = 0; ch < numCh; ch++) {
        const s = Math.max(-1, Math.min(1, channels[ch][i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        offset += 2;
      }
    }
    return new Blob([view], { type: "audio/wav" });
  }

  // splice a re-recorded clip into an existing buffer over [startSec,endSec), truncating/zero-padding
  // the clip to fit the region exactly so total track length never shifts
  function spliceBuffer(original, clip, startSec, endSec) {
    const sr = original.sampleRate;
    const numCh = original.numberOfChannels;
    const startSample = Math.max(0, Math.round(startSec * sr));
    const endSample = Math.min(original.length, Math.round(endSec * sr));
    const regionLen = endSample - startSample;
    const result = ctx.createBuffer(numCh, original.length, sr);
    for (let ch = 0; ch < numCh; ch++) {
      const src = original.getChannelData(ch);
      const dst = result.getChannelData(ch);
      dst.set(src);
      const clipCh = clip.getChannelData(Math.min(ch, clip.numberOfChannels - 1));
      for (let i = 0; i < regionLen; i++) {
        dst[startSample + i] = i < clipCh.length ? clipCh[i] : 0;
      }
    }
    return result;
  }

  // ---- Transport ----
  let trackLoopOn = false;
  function getPlayheadOffset() {
    if (isTrackPlaying) {
      const raw = trackPlaybackStartOffset + (ctx.currentTime - trackPlaybackStartCtxTime);
      return trackLoopOn && currentTrackBuffer ? raw % currentTrackBuffer.duration : raw;
    }
    return pausedAtSec;
  }
  function stopTrackPlayback() {
    if (isTrackPlaying) pausedAtSec = getPlayheadOffset();
    if (trackSourceNode) { try { trackSourceNode.onended = null; trackSourceNode.stop(); } catch (e) {} trackSourceNode.disconnect(); trackSourceNode = null; }
    isTrackPlaying = false;
    playBtn.textContent = "▶ Play Track";
  }
  function playTrackFrom(offsetSec) {
    if (!currentTrackBuffer) return;
    stopTrackPlayback();
    const clamped = Math.max(0, Math.min(currentTrackBuffer.duration - 0.01, offsetSec));
    trackSourceNode = ctx.createBufferSource();
    trackSourceNode.buffer = currentTrackBuffer;
    trackSourceNode.loop = trackLoopOn;
    trackSourceNode.connect(trackGainNode);
    trackGainNode.gain.cancelScheduledValues(ctx.currentTime);
    trackGainNode.gain.setValueAtTime(1, ctx.currentTime);
    trackSourceNode.start(0, clamped);
    trackPlaybackStartCtxTime = ctx.currentTime;
    trackPlaybackStartOffset = clamped;
    isTrackPlaying = true;
    playBtn.textContent = "⏸ Stop";
    trackSourceNode.onended = () => { isTrackPlaying = false; pausedAtSec = 0; playBtn.textContent = "▶ Play Track"; };
  }
  playBtn.addEventListener("click", () => {
    initAudio();
    if (ctx.state === "suspended") ctx.resume();
    if (isTrackPlaying) stopTrackPlayback();
    else {
      selectBackingSource("track");
      playTrackFrom(pausedAtSec >= (currentTrackBuffer ? currentTrackBuffer.duration - 0.05 : 0) ? 0 : pausedAtSec);
    }
  });
  trackLoopBtn.addEventListener("click", () => {
    trackLoopOn = !trackLoopOn;
    trackLoopBtn.textContent = "Loop: " + (trackLoopOn ? "ON" : "OFF");
    trackLoopBtn.classList.toggle("on", trackLoopOn);
    if (trackSourceNode) trackSourceNode.loop = trackLoopOn;
  });

  // ---- Record a brand-new take from a blank timeline ----
  recordBtn.addEventListener("click", () => {
    if (fullRecorder && fullRecorder.state === "recording") { fullRecorder.stop(); return; }
    startFullRecording();
  });

  async function startFullRecording() {
    initAudio();
    if (ctx.state === "suspended") await ctx.resume();
    const mime = pickMimeType();
    fullRecorderChunks = [];
    fullRecorder = new MediaRecorder(fullRecordDest.stream, mime ? { mimeType: mime } : undefined);
    fullRecorder.ondataavailable = (e) => { if (e.data.size > 0) fullRecorderChunks.push(e.data); };
    fullRecorder.onstop = async () => {
      recordBtn.textContent = "⏺ Record New Track";
      recordBtn.classList.remove("on");
      const blob = new Blob(fullRecorderChunks, { type: fullRecorder.mimeType || mime || "audio/webm" });
      studioStatusEl.textContent = "decoding recording…";
      try {
        const buf = await blob.arrayBuffer();
        const decoded = await ctx.decodeAudioData(buf);
        setTrack(decoded);
        studioStatusEl.textContent = `new track recorded (${formatTime(decoded.duration)}) — drag a region to punch-in, or download it`;
      } catch (err) {
        studioStatusEl.textContent = "recording finished but could not be decoded: " + err.message;
      }
    };
    fullRecorder.start();
    recordBtn.textContent = "⏹ Stop Recording";
    recordBtn.classList.add("on");
    studioStatusEl.textContent = "recording a brand-new take — play/sing along, then click Stop Recording";
  }

  // ---- Punch-in: re-record just the selected region, replacing it in place ----
  punchBtn.addEventListener("click", () => {
    if (punchRecorder && punchRecorder.state === "recording") { abortPunch(); return; }
    startPunchIn();
  });

  function startPunchIn() {
    if (!currentTrackBuffer || punchStartSec == null || punchEndSec == null) return;
    initAudio();
    const preRoll = Math.min(1.5, punchStartSec);
    const playFrom = punchStartSec - preRoll;
    const regionDur = punchEndSec - punchStartSec;

    playTrackFrom(playFrom);
    // duck the track under the punch region so the new take is easy to hear/monitor
    const t0 = trackPlaybackStartCtxTime;
    const duckStart = t0 + preRoll;
    const duckEnd = duckStart + regionDur;
    trackGainNode.gain.cancelScheduledValues(t0);
    trackGainNode.gain.setValueAtTime(1, t0);
    trackGainNode.gain.setValueAtTime(1, duckStart);
    trackGainNode.gain.linearRampToValueAtTime(0.12, duckStart + 0.05);
    trackGainNode.gain.setValueAtTime(0.12, Math.max(duckStart + 0.05, duckEnd - 0.05));
    trackGainNode.gain.linearRampToValueAtTime(1, duckEnd + 0.05);

    const mime = pickMimeType();
    punchRecorderChunks = [];
    punchAbort = false;
    punchRecorder = new MediaRecorder(punchRecordDest.stream, mime ? { mimeType: mime } : undefined);
    punchRecorder.ondataavailable = (e) => { if (e.data.size > 0) punchRecorderChunks.push(e.data); };
    punchRecorder.onstop = async () => {
      punchBtn.textContent = "⏺ Punch-In Over Selection";
      punchBtn.classList.remove("on");
      stopTrackPlayback();
      if (punchAbort || punchRecorderChunks.length === 0) { studioStatusEl.textContent = "punch-in cancelled"; return; }
      studioStatusEl.textContent = "decoding punch-in take…";
      try {
        const blob = new Blob(punchRecorderChunks, { type: punchRecorder.mimeType || mime || "audio/webm" });
        const buf = await blob.arrayBuffer();
        const clip = await ctx.decodeAudioData(buf);
        const spliced = spliceBuffer(currentTrackBuffer, clip, punchStartSec, punchEndSec);
        const start = punchStartSec, end = punchEndSec;
        setTrack(spliced);
        studioStatusEl.textContent = `punch-in applied to ${formatTime(start)}–${formatTime(end)} — download, or select another region to punch again`;
      } catch (err) {
        studioStatusEl.textContent = "punch-in recorded but could not be decoded: " + err.message;
      }
    };

    const startDelayMs = Math.max(0, preRoll * 1000);
    const stopDelayMs = startDelayMs + regionDur * 1000;
    setTimeout(() => { if (punchRecorder && punchRecorder.state === "inactive" && !punchAbort) punchRecorder.start(); }, startDelayMs);
    setTimeout(() => { if (punchRecorder && punchRecorder.state === "recording") punchRecorder.stop(); }, stopDelayMs);

    punchBtn.textContent = "⏹ Recording Punch-In…";
    punchBtn.classList.add("on");
    studioStatusEl.textContent = `punch-in armed — lead-in playing, your take starts in ${preRoll.toFixed(1)}s`;
  }
  function abortPunch() {
    punchAbort = true;
    if (punchRecorder && punchRecorder.state === "recording") punchRecorder.stop();
    else stopTrackPlayback();
    punchBtn.textContent = "⏺ Punch-In Over Selection";
    punchBtn.classList.remove("on");
    studioStatusEl.textContent = "punch-in cancelled";
  }

  clearPunchBtn.addEventListener("click", () => {
    punchStartSec = null; punchEndSec = null;
    updatePunchLabel();
    punchBtn.disabled = true;
    clearPunchBtn.disabled = true;
    drawWaveform();
  });

  function updatePunchLabel() {
    if (punchStartSec == null || punchEndSec == null) {
      punchLabelEl.textContent = "none selected (drag on the waveform)";
    } else {
      punchLabelEl.textContent = `${formatTime(punchStartSec)} – ${formatTime(punchEndSec)} (${formatTime(punchEndSec - punchStartSec)})`;
    }
  }

  // ---- Waveform display + drag-to-select punch region ----
  const waveformCanvas = document.getElementById("waveform");
  const wctx2d = waveformCanvas.getContext("2d");
  function resizeWaveform() {
    const rect = waveformCanvas.getBoundingClientRect();
    waveformCanvas.width = rect.width * devicePixelRatio;
    waveformCanvas.height = rect.height * devicePixelRatio;
    drawWaveform();
  }
  window.addEventListener("resize", resizeWaveform);

  function drawWaveform() {
    const w = waveformCanvas.width, h = waveformCanvas.height;
    wctx2d.clearRect(0, 0, w, h);
    if (!currentTrackBuffer) {
      wctx2d.fillStyle = "rgba(143,130,184,0.5)";
      wctx2d.font = (12 * devicePixelRatio) + "px sans-serif";
      wctx2d.textAlign = "center";
      wctx2d.fillText("no track yet — record a new take or upload/load one", w / 2, h / 2);
      return;
    }
    const data = currentTrackBuffer.getChannelData(0);
    const step = Math.max(1, Math.ceil(data.length / w));
    wctx2d.strokeStyle = "#5ef1ff";
    wctx2d.lineWidth = 1;
    wctx2d.beginPath();
    for (let x = 0; x < w; x++) {
      let mn = 1, mx = -1;
      const base = x * step;
      for (let i = 0; i < step; i++) {
        const idx = base + i;
        if (idx >= data.length) break;
        const v = data[idx];
        if (v < mn) mn = v;
        if (v > mx) mx = v;
      }
      if (mx < mn) { mn = 0; mx = 0; }
      const y1 = (1 - (mx + 1) / 2) * h;
      const y2 = (1 - (mn + 1) / 2) * h;
      wctx2d.moveTo(x + 0.5, y1); wctx2d.lineTo(x + 0.5, y2);
    }
    wctx2d.stroke();

    const dur = currentTrackBuffer.duration;
    if (punchStartSec != null && punchEndSec != null && dur > 0) {
      const x1 = (punchStartSec / dur) * w, x2 = (punchEndSec / dur) * w;
      wctx2d.fillStyle = "rgba(255,94,203,0.22)";
      wctx2d.fillRect(x1, 0, x2 - x1, h);
      wctx2d.strokeStyle = "rgba(255,94,203,0.8)";
      wctx2d.strokeRect(x1, 0, x2 - x1, h);
    }
    if (dur > 0) {
      const playPos = isTrackPlaying ? getPlayheadOffset() : pausedAtSec;
      const px = Math.min(w, Math.max(0, (playPos / dur) * w));
      wctx2d.strokeStyle = "#ff5ecb";
      wctx2d.lineWidth = 2;
      wctx2d.beginPath(); wctx2d.moveTo(px, 0); wctx2d.lineTo(px, h); wctx2d.stroke();
    }
  }

  let dragActive = false;
  function xToSec(clientX) {
    if (!currentTrackBuffer) return 0;
    const rect = waveformCanvas.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return frac * currentTrackBuffer.duration;
  }
  waveformCanvas.addEventListener("pointerdown", (e) => {
    if (!currentTrackBuffer) return;
    dragActive = true;
    const sec = xToSec(e.clientX);
    punchStartSec = sec; punchEndSec = sec;
    waveformCanvas.setPointerCapture(e.pointerId);
    drawWaveform();
  });
  waveformCanvas.addEventListener("pointermove", (e) => {
    if (!dragActive || !currentTrackBuffer) return;
    punchEndSec = xToSec(e.clientX);
    drawWaveform();
  });
  waveformCanvas.addEventListener("pointerup", () => {
    if (!dragActive) return;
    dragActive = false;
    if (punchStartSec != null && punchEndSec != null) {
      if (punchEndSec < punchStartSec) { const t = punchStartSec; punchStartSec = punchEndSec; punchEndSec = t; }
      if (punchEndSec - punchStartSec < 0.15) {
        punchStartSec = null; punchEndSec = null;
        punchBtn.disabled = true; clearPunchBtn.disabled = true;
      } else {
        punchBtn.disabled = false; clearPunchBtn.disabled = false;
      }
    }
    updatePunchLabel();
    drawWaveform();
  });

  setInterval(() => {
    if (!currentTrackBuffer) return;
    posLabelEl.textContent = formatTime(isTrackPlaying ? getPlayheadOffset() : pausedAtSec);
    if (isTrackPlaying) drawWaveform();
  }, 100);

  resizeWaveform();

  // ---------- Looper ----------
  // Classic layered looper: "Record Loop Base" captures your mic+oboe for exactly
  // one loop's worth of time (chosen bars, at the current BPM), then it loops
  // seamlessly forever. "Overdub Layer" records one more full pass starting the
  // instant you press it, and mixes that pass circularly into the loop buffer at
  // whatever phase the loop happened to be at, so it always lines up on replay.
  let loopBuffer = null;
  let loopDurationSec = 0;
  let loopSourceNode = null;
  let loopStartCtxTime = 0;
  let loopLayers = 0;
  let loopHistory = [];
  let loopRecorder = null, loopRecorderChunks = [];
  let loopMode = "idle"; // idle | recording-base | playing | overdubbing | stopped

  function computeLoopDuration() {
    const bars = parseInt(loopBarsEl.value, 10);
    return bars * 4 * (60 / bpm);
  }

  // force a decoded take to exactly targetDur seconds (truncate or zero-pad) so the
  // loop's length never drifts away from what the UI/timers expect
  function fitBufferToDuration(decoded, targetDur) {
    const sr = decoded.sampleRate;
    const targetLen = Math.round(targetDur * sr);
    const numCh = decoded.numberOfChannels;
    const result = ctx.createBuffer(numCh, targetLen, sr);
    for (let ch = 0; ch < numCh; ch++) {
      const src = decoded.getChannelData(ch);
      const dst = result.getChannelData(ch);
      const n = Math.min(targetLen, src.length);
      dst.set(src.subarray(0, n));
    }
    return result;
  }

  // additively mixes `clip` into a copy of `base`, wrapping around the buffer end,
  // starting at the sample position the loop was at when the overdub began
  function mixCircular(base, clip, phaseStartSec) {
    const sr = base.sampleRate;
    const numCh = base.numberOfChannels;
    const length = base.length;
    const startSample = Math.round(phaseStartSec * sr) % length;
    const result = ctx.createBuffer(numCh, length, sr);
    for (let ch = 0; ch < numCh; ch++) {
      const baseCh = base.getChannelData(ch);
      const clipCh = clip.getChannelData(Math.min(ch, clip.numberOfChannels - 1));
      const dst = result.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const idx = (startSample + i) % length;
        const clipVal = i < clipCh.length ? clipCh[i] : 0;
        dst[idx] = Math.max(-1, Math.min(1, baseCh[idx] * 0.88 + clipVal * 0.95));
      }
    }
    return result;
  }

  function copyBuffer(buf) {
    const c = ctx.createBuffer(buf.numberOfChannels, buf.length, buf.sampleRate);
    for (let ch = 0; ch < buf.numberOfChannels; ch++) c.getChannelData(ch).set(buf.getChannelData(ch));
    return c;
  }
  function concatBuffers(a, b) {
    const sr = a.sampleRate;
    const numCh = Math.max(a.numberOfChannels, b.numberOfChannels);
    const result = ctx.createBuffer(numCh, a.length + b.length, sr);
    for (let ch = 0; ch < numCh; ch++) {
      const dst = result.getChannelData(ch);
      dst.set(a.getChannelData(Math.min(ch, a.numberOfChannels - 1)), 0);
      dst.set(b.getChannelData(Math.min(ch, b.numberOfChannels - 1)), a.length);
    }
    return result;
  }

  function currentLoopPhase() {
    if (!loopBuffer || loopDurationSec <= 0) return 0;
    return ((ctx.currentTime - loopStartCtxTime) % loopDurationSec + loopDurationSec) % loopDurationSec;
  }
  function nextLoopBoundary() {
    const elapsed = ctx.currentTime - loopStartCtxTime;
    const cyclesPassed = Math.ceil(elapsed / loopDurationSec);
    return loopStartCtxTime + cyclesPassed * loopDurationSec;
  }

  // starts (or seamlessly swaps to) the persistent looping source at ctx time `atTime`
  function startLoopPlayback(atTime) {
    const t = atTime != null ? atTime : ctx.currentTime + 0.03;
    const src = ctx.createBufferSource();
    src.buffer = loopBuffer;
    src.loop = true;
    src.connect(loopGainNode);
    src.start(t);
    if (loopSourceNode) { try { loopSourceNode.stop(t); } catch (e) {} }
    loopSourceNode = src;
    loopStartCtxTime = t;
    loopMode = "playing";
    loopPlayBtn.textContent = "⏸ Stop Loop";
  }
  function stopLoopPlayback() {
    if (loopSourceNode) { try { loopSourceNode.stop(); } catch (e) {} loopSourceNode.disconnect(); loopSourceNode = null; }
    if (loopMode === "playing") loopMode = "stopped";
    loopPlayBtn.textContent = "▶ Play Loop";
  }

  function updateLoopUI() {
    loopLayersLabelEl.textContent = String(loopLayers);
    loopInfoLabelEl.textContent = loopBuffer
      ? `${loopBarsEl.value} bars (${loopDurationSec.toFixed(1)}s)`
      : "none yet";
    const hasLoop = !!loopBuffer;
    loopPlayBtn.disabled = !hasLoop;
    overdubBtn.disabled = !hasLoop || loopMode === "recording-base";
    undoLoopBtn.disabled = loopHistory.length === 0;
    clearLoopBtn.disabled = !hasLoop;
    insertLoopBtn.disabled = !hasLoop;
  }

  recordLoopBtn.addEventListener("click", () => {
    if (loopMode === "recording-base") return; // already running, auto-stops on its own
    recordLoopBase();
  });

  async function recordLoopBase() {
    initAudio();
    if (ctx.state === "suspended") await ctx.resume();
    selectBackingSource("loop");
    loopDurationSec = computeLoopDuration();
    const mime = pickMimeType();
    loopRecorderChunks = [];
    loopRecorder = new MediaRecorder(punchRecordDest.stream, mime ? { mimeType: mime } : undefined);
    loopRecorder.ondataavailable = (e) => { if (e.data.size > 0) loopRecorderChunks.push(e.data); };
    loopMode = "recording-base";
    recordLoopBtn.textContent = "⏹ Recording Base…";
    recordLoopBtn.classList.add("on");
    loopStatusEl.textContent = `recording base loop — ${loopDurationSec.toFixed(1)}s, play/sing now…`;
    loopRecorder.onstop = async () => {
      recordLoopBtn.textContent = "⏺ Record Loop Base";
      recordLoopBtn.classList.remove("on");
      const blob = new Blob(loopRecorderChunks, { type: loopRecorder.mimeType || mime || "audio/webm" });
      try {
        const buf = await blob.arrayBuffer();
        const decoded = await ctx.decodeAudioData(buf);
        loopBuffer = fitBufferToDuration(decoded, loopDurationSec);
        loopHistory = [];
        loopLayers = 1;
        startLoopPlayback();
        updateLoopUI();
        loopStatusEl.textContent = "loop base recorded — now looping. Overdub to add more layers.";
      } catch (err) {
        loopMode = "idle";
        loopStatusEl.textContent = "could not decode loop take: " + err.message;
      }
    };
    loopRecorder.start();
    setTimeout(() => { if (loopRecorder && loopRecorder.state === "recording") loopRecorder.stop(); }, loopDurationSec * 1000);
  }

  overdubBtn.addEventListener("click", () => {
    if (loopMode === "overdubbing") return;
    overdubLoop();
  });

  async function overdubLoop() {
    if (!loopBuffer || loopMode !== "playing") return;
    const phaseAtStart = currentLoopPhase();
    const mime = pickMimeType();
    loopRecorderChunks = [];
    loopRecorder = new MediaRecorder(punchRecordDest.stream, mime ? { mimeType: mime } : undefined);
    loopRecorder.ondataavailable = (e) => { if (e.data.size > 0) loopRecorderChunks.push(e.data); };
    loopMode = "overdubbing";
    overdubBtn.textContent = "⏹ Overdubbing…";
    overdubBtn.classList.add("on");
    loopStatusEl.textContent = "overdubbing a new layer — it joins the loop on the next pass…";
    loopRecorder.onstop = async () => {
      overdubBtn.textContent = "⏺ Overdub Layer";
      overdubBtn.classList.remove("on");
      const blob = new Blob(loopRecorderChunks, { type: loopRecorder.mimeType || mime || "audio/webm" });
      try {
        const buf = await blob.arrayBuffer();
        const clip = await ctx.decodeAudioData(buf);
        const fitted = fitBufferToDuration(clip, loopDurationSec);
        loopHistory.push(loopBuffer);
        if (loopHistory.length > 8) loopHistory.shift();
        loopBuffer = mixCircular(loopBuffer, fitted, phaseAtStart);
        loopLayers++;
        startLoopPlayback(nextLoopBoundary());
        updateLoopUI();
        loopStatusEl.textContent = `layer added — ${loopLayers} layers total`;
      } catch (err) {
        loopStatusEl.textContent = "overdub could not be decoded: " + err.message;
      }
      loopMode = "playing";
    };
    loopRecorder.start();
    setTimeout(() => { if (loopRecorder && loopRecorder.state === "recording") loopRecorder.stop(); }, loopDurationSec * 1000);
  }

  loopPlayBtn.addEventListener("click", () => {
    if (!loopBuffer) return;
    if (loopMode === "playing") stopLoopPlayback();
    else { initAudio(); if (ctx.state === "suspended") ctx.resume(); selectBackingSource("loop"); startLoopPlayback(); }
  });

  undoLoopBtn.addEventListener("click", () => {
    if (loopHistory.length === 0) return;
    loopBuffer = loopHistory.pop();
    loopLayers = Math.max(1, loopLayers - 1);
    if (loopMode === "playing") startLoopPlayback(nextLoopBoundary());
    updateLoopUI();
    loopStatusEl.textContent = `last layer undone — ${loopLayers} layers total`;
  });

  clearLoopBtn.addEventListener("click", () => {
    stopLoopPlayback();
    loopBuffer = null; loopHistory = []; loopLayers = 0; loopMode = "idle";
    updateLoopUI();
    loopStatusEl.textContent = "loop cleared — pick a length and record a new base";
  });

  insertLoopBtn.addEventListener("click", () => {
    if (!loopBuffer) return;
    if (!currentTrackBuffer) {
      setTrack(copyBuffer(loopBuffer));
      studioStatusEl.textContent = "loop inserted as the new Recording Studio track";
    } else {
      const merged = concatBuffers(currentTrackBuffer, loopBuffer);
      setTrack(merged);
      studioStatusEl.textContent = `loop appended to the track (now ${formatTime(merged.duration)})`;
    }
  });

  // ---------- Visualizer ----------
  const vizCanvas = document.getElementById("viz");
  const vctx = vizCanvas.getContext("2d");
  function resizeCanvas() {
    const rect = vizCanvas.getBoundingClientRect();
    vizCanvas.width = rect.width * devicePixelRatio;
    vizCanvas.height = rect.height * devicePixelRatio;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  function drawViz() {
    requestAnimationFrame(drawViz);
    const w = vizCanvas.width, h = vizCanvas.height;
    vctx.clearRect(0,0,w,h);
    if (!analyser) {
      vctx.fillStyle = "rgba(143,130,184,0.5)";
      vctx.font = (12*devicePixelRatio)+"px sans-serif";
      vctx.textAlign = "center";
      vctx.fillText("waiting for audio…", w/2, h/2);
      return;
    }
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    const barCount = 64;
    const barW = w / barCount;
    for (let i=0;i<barCount;i++) {
      const v = data[Math.floor(i * data.length / barCount)] / 255;
      const barH = v * h * 0.95;
      const grad = vctx.createLinearGradient(0, h-barH, 0, h);
      grad.addColorStop(0, "#5ef1ff");
      grad.addColorStop(1, "#ff5ecb");
      vctx.fillStyle = grad;
      vctx.fillRect(i*barW+1, h-barH, barW-2, barH);
    }
  }
  drawViz();

})();
