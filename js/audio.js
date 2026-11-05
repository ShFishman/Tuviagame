/**
 * audio.js — procedural music + SFX engine for "טוביה אוכל את הארץ".
 *
 * Dependency-free ES module, vanilla Web Audio API, zero samples (SPEC §8).
 * The file is self-contained on purpose: it is copied verbatim into the four
 * prototype branches (novel / walker / catcher / mix).
 *
 *   import { createAudio } from './js/audio.js';
 *   const audio = createAudio({ basePath: 'audio/' });
 *   audio.playMusic('bneibrak');   // crossfades from whatever is playing
 *   audio.setMood(85);             // adaptive layering (SPEC §3.1 bands, §8.2)
 *   audio.playSfx('burp');         // procedural, or audio/burp.mp3 if it exists (§8.4)
 *   audio.sting('good');           // ta-da in the current theme's style
 *   audio.sting('bad');            // music detunes + slows for ~2 s, then recovers
 *   audio.cue('trombone');         // theme one-shots: trombone | tease | krekhts | honk
 *   audio.getBeat(); audio.onStep(cb);  // rhythm-minigame sync (settlement 7/8)
 *
 * Layout of this file:
 *   PART 1  Musical data: scales, pattern notation, THEMES table, SFX list.
 *           Game authors add / tweak patterns here without touching the engine.
 *   PART 2  Synth toolbox: envelopes, oscillators, noise, Karplus-Strong.
 *   PART 3  Instruments (melodic) and DRUMS (percussion), small synth functions.
 *   PART 4  SFX synths (burp, nu, goat, ...), stings and cues.
 *   PART 5  The engine: context, buses, lookahead sequencer, crossfades,
 *           mood layering, mp3 hook, public API.
 *
 * Every sound has an attack and a release (no clicks); everything goes through
 * master gain → mute gain → DynamicsCompressor → destination, levels moderate.
 */

// ============================================================================
// PART 1 — MUSICAL DATA
// ============================================================================

/**
 * Scales as semitone offsets of degrees 1..7 above the theme root.
 * Freygish (Ahava Rabbah) and maqam Hijaz are the same seven notes on D:
 * D E♭ F♯ G A B♭ C — the "Jewish / Arabic" shared mode the game leans on.
 * Phrygian dominant is the same mode again (Balkan brass loves it on E).
 */
export const SCALES = {
  major:            [0, 2, 4, 5, 7, 9, 11],
  dorian:           [0, 2, 3, 5, 7, 9, 10],   // minor with a bright 6th: lounge / jazz
  naturalMinor:     [0, 2, 3, 5, 7, 8, 10],
  freygish:         [0, 1, 4, 5, 7, 8, 10],   // 1 ♭2 3 4 5 ♭6 ♭7  (D E♭ F♯ G A B♭ C)
  hijaz:            [0, 1, 4, 5, 7, 8, 10],   // same notes, maqam phrasing
  phrygianDominant: [0, 1, 4, 5, 7, 8, 10],
};

/**
 * PATTERN NOTATION (one string per bar, tokens separated by spaces, one token
 * per sequencer step; a theme says how many steps make a bar):
 *
 *   1..7   scale degree (1 = root)            .   rest
 *   #  b   raise / lower a semitone (3#, 7b)  -   tie: hold the previous note
 *   '      one octave up  (1', 5'')           _   one octave down (5_, 1__)
 *   [a+b]  chord (several notes on one step)  >   accent prefix (>1, >[1+3+5])
 *
 * Drum layers (instrument 'drums') use letters instead of degrees:
 *   K kick   S snare   r short snare roll   H hi-hat   h soft hat   Z shaker
 *   T tapan boom   t tapan rim   D darbuka dum   k darbuka tek
 *   M timpani (root)   m timpani (fifth)   C crash
 *
 * A note's length = 1 step + the number of '-' ties that follow it.
 * Patterns loop on their own length, so a 2-bar riff over an 8-bar melody is fine.
 */

/**
 * Layer fields:
 *   name        label (for debugging)
 *   inst        instrument key from INSTRUMENTS, or 'drums'
 *   bars        array of bar strings (see notation)
 *   minMood     the layer fades in at this mood (SPEC §8.2 bands: 0 / 20 / 60 / 80)
 *   maxMood     (optional) fades out at this mood; used for "lone sad lead" (<20)
 *   gain        layer level 0..1
 *   octave      octave shift of the whole layer
 *   transposeDeg  diatonic shift (−2 = "a third below": tight Balkan thirds)
 *   legato      note length factor (1 = full step length, 0.5 = staccato)
 *   krekhts     (clarinet) allow the sobbing pitch catch on long notes
 *   enterBar    (mashup only) bar number, relative to the mashup start, when
 *               the layer starts: the finale escalates by adding layers
 */

// ---------- Bnei Brak: the emotional home theme (freylekhs in D freygish) ----------
// A 16-bar freylekhs: A section circles the tonic with the ♭2 neighbour (the
// "oy" note), B section climbs to the upper tonic and tumbles back down.
// 2/4 at 16th resolution → 8 steps per bar.
const FREYLEKHS_A = [
  '1 - 3 - 5 - 5 -',      // D F# A A      : stake the tonic triad
  '6 - 5 - 4 - 3 -',      // Bb A G F#     : step down
  '2 3 2 1 7_ - 1 -',     // Eb F# Eb D C D: the ♭2 wobble around home
  '1 - - - 5_ - 1 -',     // hold... pickup from the fifth
  '1 - 3 - 5 - 1\' -',    // up to the octave
  '7 - 6 - 5 - 4 -',      // C Bb A G      : down the mode
  '3 4 3 2 1 - 2 -',      // turn around the 3rd
  '1 - - - . . 5_ 7_',    // rest, pickup (A C) into the B section
];
const FREYLEKHS_B = [
  '5 - 1\' - 1\' - 2\' -',  // A D D Eb      : the high ♭2 cry
  '1\' - 7 - 6 - 5 -',      // D C Bb A      : tumble
  '6 - 5 - 4 - 3 -',
  '5 - - - 3 - 5 -',
  '1\' - 7 - 6 - 5 -',
  '4 5 4 3 2 - 3 -',
  '3 2 1 7_ 2 - 1 -',       // the cadential ♭2 → 1
  '1 - - - 1 - . .',        // land
];
const FREYLEKHS = [...FREYLEKHS_A, ...FREYLEKHS_B];
/** Two 2/4 bars joined into one 4/4 bar (for the finale mashup, 16 steps per bar). */
const pairBars = (bars) => bars.reduce((out, bar, i) => (i % 2 ? out[out.length - 1] += ' ' + bar : out.push(bar), out), []);
const FREYLEKHS_44 = pairBars(FREYLEKHS);

// ---------- Settlement: Balkan brass riff in E phrygian dominant, 7/8 (2+2+3) ----------
// 7 eighths per bar at 16th resolution → 14 steps. Groups: 2+2+3 eighths.
const BALKAN_RIFF = [
  '1 - 1 - 3 - 3 - 5 - 5 - 4 -',      // E E | G# G# | B B A
  '3 - 2 - 3 - 4 - 5 - - - - -',      // G# F | G# A | B .. (the ♭2 bite)
  '5 - 6 - 5 - 4 - 3 - 3 - 2 -',      // B C | B A | G# G# F
  '1 - - - 1 - 1 - 1 - . . . .',      // E .. | E E | E . .
  '5 - 5 - 6 - 7 - 1\' - 1\' - 7 -',  // B B | C D | E E D   (second half climbs)
  '6 - 5 - 4 - 5 - 6 - - - - -',
  '5 4 3 2 3 - 4 - 3 - 2 - 1 -',      // 16th run down
  '1 - - - 1 - 1 - 1 - 5_ - 7_ -',
];

// ---------- Ramallah: oud taqsim-flavoured melody in D hijaz, 4/4 ----------
// Maqam phrasing: climb to the 5th (the ghammaz), linger on 4 and 3, descend
// through the ♭2, rest on the tonic.
const HIJAZ_MELODY = [
  '1 2 3 4 5 - - - 4 - 3 - 2 - 1 -',
  '5 - 6 - 5 - 4 - 3 - - - - - . .',
  '3 4 5 4 3 2 1 - 2 - - - 1 - . .',
  '1 - - - 5_ 7_ 1 2 1 - - - . . . .',
  '5 - 5 6 5 - 4 - 5 - 1\' - 7 - 6 -',
  '5 - - - 4 3 4 - 3 - 2 - 1 - . .',
  '2 1 7_ 1 2 - 3 - 2 - 1 - 7_ - 1 -',
  '1 - - - - - - - . . . . 5_ - 7_ -',
];

// ---------- Berlin: Ländler tune in G major, 3/4 ----------
// 3 quarters at 16th resolution → 12 steps per bar. Chords: I I V V | V V I I.
const LAENDLER = [
  '1 - 3 - 5 - 1\' - 5 - 3 -',
  '2 - 4 - 7_ - 2 - - - - -',
  '7_ - 2 - 4 - 7 - 4 - 2 -',
  '1 - - - - - 1 - 3 - 5 -',
  '1\' - - - 5 - 3 - 1 - 3 -',
  '6 - 6 - 6 - 4 - 1\' - 6 -',
  '5 - 4 - 3 - 2 - 7_ - 2 -',
  '1 - - - - - 1 - . . . .',
];
const LAENDLER_TUBA = ['1_ . . . . . . . . . . .', '1_ . . . . . . . . . . .',
                       '5_ . . . . . . . . . . .', '5_ . . . . . . . . . . .'];
const LAENDLER_CHUCK = ['. . . . [1+3+5] . . . [1+3+5] . . .', '. . . . [1+3+5] . . . [1+3+5] . . .',
                        '. . . . [7_+2+5] . . . [7_+2+5] . . .', '. . . . [7_+2+5] . . . [7_+2+5] . . .'];

/**
 * THEMES — one entry per location (SPEC §8.1).
 *   root         MIDI note of degree 1 (62 = D4)
 *   scale        key of SCALES
 *   bpm          number, or { from, to, seconds } for an accelerando
 *   stepsPerBar  sequencer steps per bar (16th-note resolution everywhere)
 *   beatSteps    steps per counted beat for getBeat() (2 = eighths, 4 = quarters)
 *   groups       beat grouping inside the bar (7/8 = [2,2,3]) for rhythm games
 *   swing        delay of off-beat eighths as a fraction of a step (lounge feel)
 *   stingInst    instrument used by sting('good')
 *   layers       see the layer field list above
 *   sequence     (finale) list of { theme, bars } segments played in order
 */
export const THEMES = {
  // Ben Gurion: slow major muzak. Soft pad + chime. The klezmer tease is cue('tease').
  airport: {
    root: 60, scale: 'major', bpm: 80, stepsPerBar: 16, beatSteps: 4, stingInst: 'chime',
    layers: [
      { name: 'chime lead', inst: 'chime', minMood: 0, gain: 0.5, bars: [
        '5 - - - . . . . 3 - - - . . . .',
        '1 - - - - - - - . . . . . . . .',
        '4 - - - . . . . 6 - - - . . . .',
        '5 - - - - - - - . . . . 2 - 3 -',
      ] },
      { name: 'pad', inst: 'softPad', minMood: 20, gain: 0.45, octave: -1, legato: 1.05, bars: [
        '[1+3+5] - - - - - - - - - - - - - - -',     // I
        '[6_+1+3] - - - - - - - - - - - - - - -',    // vi
        '[4+6+1\'] - - - - - - - - - - - - - - -',   // IV
        '[5+7+2\'] - - - - - - - - - - - - - - -',   // V
      ] },
      { name: 'brush', inst: 'drums', minMood: 60, gain: 0.35, bars: [
        'Z . . . Z . h . Z . . . Z . h .',
      ] },
      { name: 'sparkle', inst: 'glockenspiel', minMood: 80, gain: 0.25, octave: 1, bars: [
        '. . . . 1 . . . . . . . 5 . . .',
        '. . . . 3 . . . . . . . . . . .',
      ] },
    ],
  },

  // Tel Aviv: dorian lounge, lazy swing, rhodes + soft kick + pretentious sax.
  telaviv: {
    root: 62, scale: 'dorian', bpm: 95, stepsPerBar: 16, beatSteps: 4, swing: 0.5, stingInst: 'rhodes',
    layers: [
      { name: 'sad sax', inst: 'sax', maxMood: 20, gain: 0.45, bars: [
        '5 - - - - - - - - - - - . . . .',
        '3 - - - - - - - 2 - - - - - - -',
        '1 - - - - - - - - - - - - - - -',
        '. . . . . . . . . . . . . . . .',
      ] },
      { name: 'sax', inst: 'sax', minMood: 20, gain: 0.42, bars: [
        '5 - - - - - 4 - 3 - - - . . . .',
        '. . 1 - 2 - 3 - - - - - . . . .',
        '4# - 5 - - - - - 7 - 1\' - - - - -',   // chromatic G#→A: very pretentious
        '7 - 5 - 3 - - - . . . . . . . .',
        '. . . . . . . . . . . . . . . .',
        '6 - 5 - 3 - 1 - - - - - . . . .',
        '2 - - - 1 - - - . . . . . . . .',
        '. . . . . . . . . . . . . . . .',
      ] },
      { name: 'rhodes', inst: 'rhodes', minMood: 20, gain: 0.4, octave: -1, bars: [
        '[1+3+5+7] - - - - - . . . . [1+3+5+7] - - . . .',  // Dm7
        '. . . . [1+3+5+7] - - - . . . . . . . .',
        '[4+6+1\'+3\'] - - - - - . . . . [4+6+1\'+3\'] - - . . .',  // G7 (IV in dorian is major)
        '. . . . [4+6+1\'+3\'] - - - . . . . . . . .',
      ] },
      { name: 'bass', inst: 'oomBass', minMood: 20, gain: 0.5, octave: -2, bars: [
        '1 - - - . . 5 - . . 1 - . . 7 -',
        '1 - - - . . 5 - . . 3 - 4 - 5 -',
        '4 - - - . . 1\' - . . 4 - . . 3 -',
        '4 - - - . . 1\' - . . 5 - 4 - 1 -',
      ] },
      { name: 'kick', inst: 'drums', minMood: 60, gain: 0.5, bars: [
        'K . . . . . . . K . . . . . . .',
        'K . . . . . . . K . . K . . . .',
      ] },
      { name: 'hats', inst: 'drums', minMood: 60, gain: 0.3, bars: [
        '. . H . . . H . . . H . . . H .',
      ] },
      { name: 'shaker', inst: 'drums', minMood: 80, gain: 0.25, bars: [
        'Z . Z . Z . Z . Z . Z . Z . Z Z',
      ] },
    ],
  },

  // Settlement: Balkan brass, 7/8 (2+2+3). Rhythm minigame syncs via getBeat()/onStep().
  settlement: {
    root: 64, scale: 'phrygianDominant', bpm: 140, stepsPerBar: 14, beatSteps: 2, groups: [2, 2, 3],
    stingInst: 'brass',
    layers: [
      { name: 'sad trumpet', inst: 'brass', maxMood: 20, gain: 0.35, legato: 0.95, bars: [
        '1 - - - - - - - - - - - - -',
        '2 - - - - - 1 - - - - - - -',
        '7_ - - - - - - - - - - - - -',
        '. . . . . . . . . . . . . .',
      ] },
      { name: 'brass lead', inst: 'brass', minMood: 20, gain: 0.4, legato: 0.85, bars: BALKAN_RIFF },
      { name: 'brass third', inst: 'brass', minMood: 20, gain: 0.3, legato: 0.85, transposeDeg: -2, bars: BALKAN_RIFF },
      { name: 'tuba', inst: 'tuba', minMood: 20, gain: 0.55, octave: -1, bars: [
        '1_ - . . 5_ - . . 1_ - 1_ - 5_ -',   // oom on 1 and 3, pickup on the 3-group
      ] },
      { name: 'tapan', inst: 'drums', minMood: 60, gain: 0.6, bars: [
        '>T . . . t . . . >T . t . t .',     // 2+2+3: boom . rim . boom rim rim
      ] },
      { name: 'hats', inst: 'drums', minMood: 80, gain: 0.3, bars: [
        'H h H h H h H h H h H h h h',
      ] },
      { name: 'trumpet fills', inst: 'brass', minMood: 80, gain: 0.25, octave: 1, legato: 0.6, bars: [
        '. . . . . . . . . . . . . .',
        '. . . . . . . . 5 . 4 . 3 .',
        '. . . . . . . . . . . . . .',
        '. . . . 1 2 3 2 1 . 7_ . . .',
      ] },
    ],
  },

  // Bnei Brak: klezmer freylekhs. Accelerando 120 → 160 bpm over ~60 s.
  bneibrak: {
    root: 62, scale: 'freygish', bpm: { from: 120, to: 160, seconds: 60 }, stepsPerBar: 8, beatSteps: 4,
    stingInst: 'clarinet',
    layers: [
      { name: 'sad clarinet', inst: 'clarinet', maxMood: 20, gain: 0.45, krekhts: true, legato: 1, bars: [
        '1 - - - - - - -',
        '2 - - - 1 - - -',
        '7_ - - - - - - -',
        '. . . . . . . .',
        '3 - - - 2 - - -',
        '1 - - - - - - -',
        '. . . . . . . .',
        '. . . . . . . .',
      ] },
      { name: 'clarinet', inst: 'clarinet', minMood: 20, gain: 0.45, krekhts: true, legato: 0.92, bars: FREYLEKHS },
      { name: 'oom', inst: 'oomBass', minMood: 20, gain: 0.55, octave: -2, bars: [
        '1 . . . . . . .', '5 . . . . . . .',   // oom: root (D2), fifth (A2)
        '1 . . . . . . .', '5 . . . . . . .',
        '1 . . . . . . .', '5 . . . . . . .',
        '4 . . . . . . .', '5 . . . 5 . 7_ .',   // IV then V walk-up
      ] },
      { name: 'chuck', inst: 'accordion', minMood: 20, gain: 0.22, octave: -1, legato: 0.5, bars: [
        '. . [1+3+5] . . . [1+3+5] .',          // chuck on the off-beats
        '. . [1+3+5] . . . [1+3+5] .',
        '. . [1+3+5] . . . [1+3+5] .',
        '. . [1+3+5] . . . [1+3+5] .',
        '. . [1+3+5] . . . [1+3+5] .',
        '. . [1+3+5] . . . [1+3+5] .',
        '. . [4+6+1\'] . . . [4+6+1\'] .',
        '. . [5+7+2\'] . . . [5+7+2\'] .',
      ] },
      { name: 'drums', inst: 'drums', minMood: 60, gain: 0.45, bars: [
        'K . h . S . h .',
        'K . h . S . h h',
      ] },
      { name: 'fiddle', inst: 'fiddle', minMood: 80, gain: 0.28, octave: 1, legato: 0.9, bars: FREYLEKHS },
      { name: 'tambourine', inst: 'drums', minMood: 80, gain: 0.25, bars: [
        '. . Z . . . Z .',
      ] },
    ],
  },

  // Ramallah: maqam hijaz, oud (Karplus-Strong), darbuka maqsum, ney drone high up.
  ramallah: {
    root: 62, scale: 'hijaz', bpm: 100, stepsPerBar: 16, beatSteps: 4, stingInst: 'oud',
    layers: [
      { name: 'sad oud', inst: 'oud', maxMood: 20, gain: 0.5, bars: [
        '1 - - - - - - - . . . . . . . .',
        '2 - - - 1 - - - . . . . . . . .',
        '7_ - - - - - - - . . . . . . . .',
        '. . . . . . . . . . . . . . . .',
      ] },
      { name: 'oud', inst: 'oud', minMood: 20, gain: 0.5, bars: HIJAZ_MELODY },
      { name: 'bass oud', inst: 'oud', minMood: 20, gain: 0.45, octave: -1, bars: [
        '1 . . . . . . . 1 . . . 5_ . . .',
        '1 . . . . . . . 1 . . . . . . .',
      ] },
      { name: 'darbuka', inst: 'drums', minMood: 60, gain: 0.55, bars: [
        '>D . k . . . k . >D . . . k . . .',      // maqsum: DUM tek . tek DUM . tek .
        '>D . k . . . k . >D . k . k . k .',
      ] },
      { name: 'ney', inst: 'ney', minMood: 80, gain: 0.3, octave: 1, legato: 1, bars: [
        '5 - - - - - - - - - - - - - - -',
        '- - - - - - - - - - - - 4 - 3 -',
        '1 - - - - - - - - - - - - - - -',
        '- - - - - - - - . . . . . . . .',
      ] },
      { name: 'riq', inst: 'drums', minMood: 80, gain: 0.25, bars: [
        '. Z . Z . Z . Z . Z . Z . Z k Z',
      ] },
    ],
  },

  // Knesset: pompous brassy march. Brass stabs, timpani, snare rolls. cue('trombone') on demand.
  knesset: {
    root: 60, scale: 'major', bpm: 112, stepsPerBar: 16, beatSteps: 4, stingInst: 'brass',
    layers: [
      { name: 'sad horn', inst: 'brass', maxMood: 20, gain: 0.35, bars: [
        '5 - - - - - - - 3 - - - - - - -',
        '1 - - - - - - - - - - - . . . .',
        '7_ - - - - - - - 2 - - - - - - -',
        '1 - - - - - - - . . . . . . . .',
      ] },
      { name: 'fanfare', inst: 'brass', minMood: 20, gain: 0.4, legato: 0.8, bars: [
        '5 - - - 1\' - - - 3\' - - - 1\' - 5 -',
        '3\' - - - - - - - . . . . 5 - 5 -',
        '6 - - - 1\' - - - 4\' - - - 2\' - 7 -',
        '1\' - - - - - - - . . . . . . . .',
      ] },
      { name: 'stabs', inst: 'brass', minMood: 20, gain: 0.22, octave: -1, legato: 0.35, bars: [
        '[1+3+5] . . . [1+3+5] . . . [1+3+5] . . . [1+3+5] . . .',   // I
        '[1+3+5] . . . [1+3+5] . . . [5_+7_+2] . . . [5_+7_+2] . . .', // I  V
        '[4+6+1\'] . . . [4+6+1\'] . . . [1+3+5] . . . [1+3+5] . . .', // IV I
        '[5_+7_+2] . . . [5_+7_+2] . . . [1+3+5] . . . [1+3+5] . . .', // V  I
      ] },
      { name: 'tuba', inst: 'tuba', minMood: 20, gain: 0.5, octave: -1, bars: [
        '1 . . . 5_ . . . 1 . . . 5_ . . .',   // C3 / G2
      ] },
      { name: 'timpani', inst: 'drums', minMood: 60, gain: 0.6, bars: [
        'M . . . . . . . m . . . . . . .',
        'M . . . . . . . M . . . m . M .',
      ] },
      { name: 'snare', inst: 'drums', minMood: 60, gain: 0.45, bars: [
        'S . . . S . h h S . . . S . r .',
        'S . h h S . . . S . h h r . S .',
      ] },
      { name: 'piccolo', inst: 'glockenspiel', minMood: 80, gain: 0.25, octave: 1, bars: [
        '. . . . . . . . . . . . 5 6 7 1\'',
        '3\' . 1\' . . . . . . . . . . . . .',
        '. . . . . . . . . . . . 2\' 1\' 7 2\'',
        '1\' . . . . . . . . . . . . . . .',
      ] },
    ],
  },

  // Berlin: 3/4 Ländler oom-pah-pah. Tuba on 1, accordion on 2 and 3, glockenspiel melody.
  berlin: {
    root: 55, scale: 'major', bpm: 120, stepsPerBar: 12, beatSteps: 4, stingInst: 'glockenspiel',
    layers: [
      { name: 'sad tuba', inst: 'tuba', maxMood: 20, gain: 0.5, octave: -1, legato: 1, bars: [
        '1 - - - - - - - - - - -',
        '7_ - - - - - - - - - - -',
        '6_ - - - - - - - 5_ - - -',
        '. . . . . . . . . . . .',
      ] },
      { name: 'glock', inst: 'glockenspiel', minMood: 20, gain: 0.4, octave: 1, bars: LAENDLER },
      { name: 'tuba', inst: 'tuba', minMood: 20, gain: 0.6, octave: -1, bars: LAENDLER_TUBA },
      { name: 'accordion', inst: 'accordion', minMood: 20, gain: 0.25, legato: 0.6, bars: LAENDLER_CHUCK },
      { name: 'drums', inst: 'drums', minMood: 60, gain: 0.4, bars: [
        'K . . . h . . . h . . .',
        'K . . . h . . . S . . .',
      ] },
      { name: 'accordion melody', inst: 'accordion', minMood: 80, gain: 0.2, bars: LAENDLER },
      { name: 'bells', inst: 'drums', minMood: 80, gain: 0.25, bars: [
        '. . . . Z . . . Z . . .',
      ] },
    ],
  },

  // Finale: medley (8 bars each) then an escalating mashup. One shared tempo.
  finale: {
    bpm: 132,
    sequence: [
      { theme: 'bneibrak', bars: 8 },
      { theme: 'settlement', bars: 8 },
      { theme: 'berlin', bars: 8 },
      { theme: 'ramallah', bars: 8 },
      { theme: '_mashup', bars: Infinity, bpm: { from: 132, to: 152, seconds: 40 } },
    ],
  },

  // The Shabbat-table mashup: everything in D freygish/hijaz, 4/4, layers pile up
  // every few bars (enterBar), tempo creeps up. Not exported as a location.
  _mashup: {
    root: 62, scale: 'freygish', bpm: { from: 132, to: 152, seconds: 40 }, stepsPerBar: 16, beatSteps: 4,
    stingInst: 'clarinet',
    layers: [
      { name: 'clarinet', inst: 'clarinet', minMood: 0, gain: 0.45, krekhts: true, legato: 0.92, bars: FREYLEKHS_44, enterBar: 0 },
      { name: 'darbuka', inst: 'drums', minMood: 60, gain: 0.5, bars: ['>D . k . . . k . >D . . . k . . .'], enterBar: 0 },
      { name: 'polka tuba', inst: 'tuba', minMood: 20, gain: 0.55, octave: -2, bars: ['1 . . . 5 . . . 1 . . . 5 . . .'], enterBar: 2 },
      { name: 'accordion', inst: 'accordion', minMood: 20, gain: 0.2, octave: -1, legato: 0.5,
        bars: ['. . [1+3+5] . . . [1+3+5] . . . [1+3+5] . . . [1+3+5] .'], enterBar: 4 },
      { name: 'tapan', inst: 'drums', minMood: 60, gain: 0.5, bars: ['>T . . . t . t . >T . . . t . . .'], enterBar: 6 },
      { name: 'balkan brass', inst: 'brass', minMood: 20, gain: 0.3, legato: 0.85,
        bars: ['1 - 1 - 3 - 3 - 5 - 5 - 4 - 3 -', '2 - 3 - 4 - 5 - - - - - . . . .'], enterBar: 8 },
      { name: 'brass third', inst: 'brass', minMood: 60, gain: 0.22, legato: 0.85, transposeDeg: -2,
        bars: ['1 - 1 - 3 - 3 - 5 - 5 - 4 - 3 -', '2 - 3 - 4 - 5 - - - - - . . . .'], enterBar: 10 },
      { name: 'fiddle', inst: 'fiddle', minMood: 60, gain: 0.25, octave: 1, bars: FREYLEKHS_44, enterBar: 12 },
      { name: 'glock', inst: 'glockenspiel', minMood: 80, gain: 0.22, octave: 2, bars: FREYLEKHS_44, enterBar: 14 },
      { name: 'oud', inst: 'oud', minMood: 80, gain: 0.35, bars: HIJAZ_MELODY, enterBar: 16 },
      { name: 'hats', inst: 'drums', minMood: 80, gain: 0.25, bars: ['H h H h H h H h H h H h H h h h'], enterBar: 16 },
      { name: 'snare', inst: 'drums', minMood: 80, gain: 0.3, bars: ['. . . . S . . . . . . . S . r .'], enterBar: 20 },
    ],
  },
};

/** Public location names (what playMusic accepts). */
export const LOCATIONS = ['airport', 'telaviv', 'settlement', 'bneibrak', 'ramallah', 'knesset', 'berlin', 'finale'];

/** All procedural SFX names (what playSfx accepts). */
export const SFX_NAMES = [
  'burp', 'nu', 'sigh', 'crunch', 'slurp', 'fizz', 'scribble', 'phone', 'goat', 'gasp', 'page',
  'click', 'pop', 'tada', 'boo', 'thud', 'cheer', 'zzz', 'ding', 'whoosh', 'cash', 'honk', 'drumroll', 'choir',
];

/** Cue names (what cue accepts). */
export const CUE_NAMES = ['trombone', 'tease', 'krekhts', 'honk'];

// ============================================================================
// PART 2 — SYNTH TOOLBOX
// ============================================================================

const midiToHz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Oscillator at frequency f starting at t, with the music pitch-bend node attached. */
function mkOsc(ctx, type, f, t, bend) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(Math.max(1, f), t);
  if (bend) bend.connect(o.detune);
  return o;
}

/**
 * Gain node with an ADSR. Attack and decay are linear/exponential ramps, the
 * release uses setTargetAtTime so it always starts from the live value (no clicks).
 * Returns { g, end } where `end` is a safe time to stop sources.
 */
function mkEnv(ctx, t, { a = 0.01, d = 0, s = 1, r = 0.08, dur = 0.2, peak = 0.3 }) {
  const g = ctx.createGain();
  const hold = Math.max(dur, a + 0.005);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  if (d > 0 && s < 1) g.gain.setTargetAtTime(peak * s, t + a, d / 3);
  g.gain.setTargetAtTime(0, t + hold, Math.max(0.005, r / 4));
  return { g, end: t + hold + r + 0.1 };
}

function mkFilter(ctx, type, f, q = 1) {
  const fl = ctx.createBiquadFilter();
  fl.type = type;
  fl.frequency.value = f;
  fl.Q.value = q;
  return fl;
}

/** Sine LFO → target AudioParam (usually `detune`, in cents). `delay` fades the depth in. */
function mkVibrato(ctx, target, t, end, rate = 5.5, depth = 8, delay = 0.12) {
  const lfo = ctx.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = rate;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(depth, t + delay);
  lfo.connect(g).connect(target);
  lfo.start(t);
  lfo.stop(end);
  return lfo;
}

/** Shared 2 s white-noise buffer per context. */
const noiseBuffers = new WeakMap();
function noiseSource(ctx, t, dur) {
  let buf = noiseBuffers.get(ctx);
  if (!buf) {
    buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 2), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    noiseBuffers.set(ctx, buf);
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  src.start(t);
  src.stop(t + dur + 0.05);
  return src;
}

/**
 * Karplus-Strong plucked string rendered into a buffer (no feedback cycle of
 * nodes, so it works offline and cleans itself up). `damp` 0.99 = long ring.
 */
function pluckBuffer(ctx, f, dur, damp = 0.995, bright = 0.5) {
  const sr = ctx.sampleRate;
  const N = Math.max(2, Math.round(sr / f));
  const len = Math.floor(sr * dur);
  const buf = ctx.createBuffer(1, len, sr);
  const out = buf.getChannelData(0);
  const ring = new Float32Array(N);
  for (let i = 0; i < N; i++) ring[i] = Math.random() * 2 - 1;
  // Pre-filter the excitation so the pluck isn't harsh (bright = how much HF survives).
  let lp = 0;
  for (let i = 0; i < N; i++) { lp += (ring[i] - lp) * (0.3 + bright * 0.6); ring[i] = lp; }
  let idx = 0;
  for (let i = 0; i < len; i++) {
    const cur = ring[idx];
    const next = ring[(idx + 1) % N];
    out[i] = cur;
    ring[idx] = (cur + next) * 0.5 * damp;   // 2-point average = the string's lowpass
    idx = (idx + 1) % N;
  }
  return buf;
}

// ============================================================================
// PART 3 — INSTRUMENTS
// Each: (ctx, dest, n) with n = { f, t, dur, vel, bend, layer }. They connect
// their own output into `dest` and stop all sources themselves.
// ============================================================================

export const INSTRUMENTS = {
  /** Airport pad: two detuned triangles + a sine, slow attack, dark lowpass. */
  softPad(ctx, dest, { f, t, dur, vel, bend }) {
    const env = mkEnv(ctx, t, { a: 0.35, r: 0.7, dur, peak: 0.16 * vel });
    const fl = mkFilter(ctx, 'lowpass', 900, 0.5);
    fl.connect(env.g).connect(dest);
    [['triangle', -6], ['triangle', 6], ['sine', 0]].forEach(([type, det]) => {
      const o = mkOsc(ctx, type, f, t, bend);
      o.detune.value = det;
      o.connect(fl);
      o.start(t); o.stop(env.end);
    });
  },

  /** FM bell: carrier + inharmonic modulator (ratio 1.4) whose index decays. */
  chime(ctx, dest, { f, t, dur, vel, bend }) {
    const env = mkEnv(ctx, t, { a: 0.005, d: 0.6, s: 0.25, r: 0.5, dur: Math.max(dur, 0.3), peak: 0.28 * vel });
    const car = mkOsc(ctx, 'sine', f, t, bend);
    const mod = mkOsc(ctx, 'sine', f * 1.4, t, bend);
    const mg = ctx.createGain();
    mg.gain.setValueAtTime(f * 1.5, t);
    mg.gain.setTargetAtTime(0, t, 0.25);
    mod.connect(mg).connect(car.frequency);
    car.connect(env.g).connect(dest);
    car.start(t); mod.start(t); car.stop(env.end); mod.stop(env.end);
  },

  /** Rhodes: 2-op FM at ratio 1:1, small decaying index, plus a soft octave. */
  rhodes(ctx, dest, { f, t, dur, vel, bend }) {
    const env = mkEnv(ctx, t, { a: 0.008, d: 0.9, s: 0.4, r: 0.25, dur, peak: 0.24 * vel });
    const car = mkOsc(ctx, 'sine', f, t, bend);
    const mod = mkOsc(ctx, 'sine', f, t, bend);
    const mg = ctx.createGain();
    mg.gain.setValueAtTime(f * 1.6 * vel, t);
    mg.gain.setTargetAtTime(f * 0.15, t, 0.2);
    mod.connect(mg).connect(car.frequency);
    const oct = mkOsc(ctx, 'sine', f * 2, t, bend);
    const og = ctx.createGain(); og.gain.value = 0.15;
    oct.connect(og).connect(env.g);
    car.connect(env.g).connect(dest);
    car.start(t); mod.start(t); oct.start(t);
    car.stop(env.end); mod.stop(env.end); oct.stop(env.end);
  },

  /** "Pretentious sax": filtered saw, cutoff envelope, slow attack, wide late vibrato. */
  sax(ctx, dest, { f, t, dur, vel, bend }) {
    const env = mkEnv(ctx, t, { a: 0.09, d: 0.2, s: 0.8, r: 0.18, dur, peak: 0.2 * vel });
    const fl = mkFilter(ctx, 'lowpass', 700, 3);
    fl.frequency.setValueAtTime(500, t);
    fl.frequency.linearRampToValueAtTime(1800 + 800 * vel, t + 0.12);
    fl.frequency.setTargetAtTime(1200, t + 0.12, 0.4);
    const o = mkOsc(ctx, 'sawtooth', f, t, bend);
    const o2 = mkOsc(ctx, 'square', f, t, bend);
    const g2 = ctx.createGain(); g2.gain.value = 0.25;
    o.connect(fl); o2.connect(g2).connect(fl);
    fl.connect(env.g).connect(dest);
    mkVibrato(ctx, o.detune, t, env.end, 5, 18, 0.25);
    mkVibrato(ctx, o2.detune, t, env.end, 5, 18, 0.25);
    o.start(t); o2.start(t); o.stop(env.end); o2.stop(env.end);
  },

  /** Bright brass: saw + square, fat detune, filter "blat" envelope. */
  brass(ctx, dest, { f, t, dur, vel, bend }) {
    const env = mkEnv(ctx, t, { a: 0.025, d: 0.12, s: 0.75, r: 0.09, dur, peak: 0.17 * vel });
    const fl = mkFilter(ctx, 'lowpass', 1500, 2);
    fl.frequency.setValueAtTime(700, t);
    fl.frequency.linearRampToValueAtTime(3500 + 1500 * vel, t + 0.05);
    fl.frequency.setTargetAtTime(2200, t + 0.05, 0.15);
    const a = mkOsc(ctx, 'sawtooth', f, t, bend); a.detune.value = -5;
    const b = mkOsc(ctx, 'sawtooth', f, t, bend); b.detune.value = 5;
    const c = mkOsc(ctx, 'square', f, t, bend);
    const cg = ctx.createGain(); cg.gain.value = 0.3;
    a.connect(fl); b.connect(fl); c.connect(cg).connect(fl);
    fl.connect(env.g).connect(dest);
    mkVibrato(ctx, a.detune, t, env.end, 6, 5, 0.3);
    [a, b, c].forEach((o) => { o.start(t); o.stop(env.end); });
  },

  /**
   * Klezmer clarinet: triangle (hollow, odd harmonics) + a little square, vibrato,
   * and on long notes the "krekhts": a sob-like upward catch then a fall, with a
   * small dip in volume, placed near the end of the note.
   */
  clarinet(ctx, dest, { f, t, dur, vel, bend, layer }) {
    const env = mkEnv(ctx, t, { a: 0.04, d: 0.1, s: 0.85, r: 0.12, dur, peak: 0.25 * vel });
    const fl = mkFilter(ctx, 'lowpass', 2600, 1);
    const o = mkOsc(ctx, 'triangle', f, t, bend);
    const sq = mkOsc(ctx, 'square', f, t, bend);
    const sg = ctx.createGain(); sg.gain.value = 0.12;
    o.connect(fl); sq.connect(sg).connect(fl);
    fl.connect(env.g).connect(dest);
    mkVibrato(ctx, o.detune, t, env.end, 5.5, 9, 0.2);
    mkVibrato(ctx, sq.detune, t, env.end, 5.5, 9, 0.2);
    const wantsKrekhts = layer && layer.krekhts && dur > 0.35 && Math.random() < 0.6;
    if (wantsKrekhts) {
      const k = t + dur * 0.62;
      for (const osc of [o, sq]) {
        osc.detune.setValueAtTime(0, k);
        osc.detune.linearRampToValueAtTime(140, k + 0.06);   // the catch (up ~a semitone and a half)
        osc.detune.linearRampToValueAtTime(-60, k + 0.14);   // the fall
        osc.detune.linearRampToValueAtTime(0, k + 0.22);
      }
      env.g.gain.setTargetAtTime(0.25 * vel * 0.35, k, 0.02);  // the sob swallows the tone
      env.g.gain.setTargetAtTime(0.25 * vel * 0.85, k + 0.08, 0.03);
    }
    o.start(t); sq.start(t); o.stop(env.end); sq.stop(env.end);
  },

  /** Fiddle: saw with delayed vibrato and a resonant lowpass; slight bow attack. */
  fiddle(ctx, dest, { f, t, dur, vel, bend }) {
    const env = mkEnv(ctx, t, { a: 0.05, d: 0.1, s: 0.85, r: 0.12, dur, peak: 0.13 * vel });
    const fl = mkFilter(ctx, 'lowpass', 3200, 2.5);
    const o = mkOsc(ctx, 'sawtooth', f, t, bend);
    o.connect(fl).connect(env.g).connect(dest);
    mkVibrato(ctx, o.detune, t, env.end, 6, 14, 0.18);
    o.start(t); o.stop(env.end);
  },

  /** Oom bass (klezmer / lounge): triangle + sub sine, short plucky envelope. */
  oomBass(ctx, dest, { f, t, dur, vel, bend }) {
    const env = mkEnv(ctx, t, { a: 0.008, d: 0.25, s: 0.5, r: 0.08, dur: Math.min(dur, 0.45), peak: 0.4 * vel });
    const fl = mkFilter(ctx, 'lowpass', 500, 1);
    const o = mkOsc(ctx, 'triangle', f, t, bend);
    const sub = mkOsc(ctx, 'sine', f, t, bend);
    o.connect(fl); sub.connect(fl);
    fl.connect(env.g).connect(dest);
    o.start(t); sub.start(t); o.stop(env.end); sub.stop(env.end);
  },

  /** Tuba: square + triangle an octave down, dark lowpass, "oom" envelope. */
  tuba(ctx, dest, { f, t, dur, vel, bend }) {
    const env = mkEnv(ctx, t, { a: 0.02, d: 0.2, s: 0.6, r: 0.1, dur: Math.min(dur, 0.5), peak: 0.3 * vel });
    const fl = mkFilter(ctx, 'lowpass', 420, 1.5);
    const o = mkOsc(ctx, 'square', f, t, bend);
    const o2 = mkOsc(ctx, 'triangle', f, t, bend);
    const og = ctx.createGain(); og.gain.value = 0.35;
    o.connect(og).connect(fl); o2.connect(fl);
    fl.connect(env.g).connect(dest);
    o.start(t); o2.start(t); o.stop(env.end); o2.stop(env.end);
  },

  /** Accordion: two detuned saws + fast tremolo (the bellows shake). */
  accordion(ctx, dest, { f, t, dur, vel, bend }) {
    const env = mkEnv(ctx, t, { a: 0.02, d: 0.05, s: 0.9, r: 0.08, dur, peak: 0.1 * vel });
    const fl = mkFilter(ctx, 'lowpass', 2200, 0.7);
    const a = mkOsc(ctx, 'sawtooth', f, t, bend); a.detune.value = -9;
    const b = mkOsc(ctx, 'sawtooth', f, t, bend); b.detune.value = 9;
    const trem = ctx.createGain(); trem.gain.value = 0.8;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 6.5;
    const lg = ctx.createGain(); lg.gain.value = 0.2;
    lfo.connect(lg).connect(trem.gain);
    a.connect(fl); b.connect(fl);
    fl.connect(trem).connect(env.g).connect(dest);
    lfo.start(t); a.start(t); b.start(t);
    lfo.stop(env.end); a.stop(env.end); b.stop(env.end);
  },

  /** Glockenspiel: additive bell partials (1, 2.76, 5.4) with fast decay. */
  glockenspiel(ctx, dest, { f, t, dur, vel, bend }) {
    const env = mkEnv(ctx, t, { a: 0.003, d: 0.5, s: 0.15, r: 0.4, dur: Math.max(dur, 0.25), peak: 0.22 * vel });
    env.g.connect(dest);
    [[1, 1], [2.76, 0.35], [5.4, 0.12]].forEach(([ratio, amp]) => {
      if (f * ratio > 18000) return;   // partial above the audible/nominal range
      const o = mkOsc(ctx, 'sine', f * ratio, t, bend);
      const g = ctx.createGain();
      g.gain.setValueAtTime(amp, t);
      g.gain.setTargetAtTime(0, t, ratio > 1 ? 0.12 : 0.6);
      o.connect(g).connect(env.g);
      o.start(t); o.stop(env.end);
    });
  },

  /** Oud: Karplus-Strong pluck (buffer), bendable through the source's detune. */
  oud(ctx, dest, { f, t, dur, vel, bend }) {
    const ring = Math.min(1.6, dur + 0.6);
    const src = ctx.createBufferSource();
    src.buffer = pluckBuffer(ctx, f, ring, f < 150 ? 0.997 : 0.994, 0.45);
    if (bend) bend.connect(src.detune);
    const env = mkEnv(ctx, t, { a: 0.003, r: 0.15, dur: ring - 0.2, peak: 0.45 * vel });
    const fl = mkFilter(ctx, 'lowpass', 3800, 0.7);
    src.connect(fl).connect(env.g).connect(dest);
    src.start(t); src.stop(env.end);
  },

  /** Ney: breathy sine — sine + band-passed noise around the pitch, slow attack. */
  ney(ctx, dest, { f, t, dur, vel, bend }) {
    const env = mkEnv(ctx, t, { a: 0.3, d: 0.3, s: 0.8, r: 0.4, dur, peak: 0.16 * vel });
    const o = mkOsc(ctx, 'sine', f, t, bend);
    const o2 = mkOsc(ctx, 'triangle', f, t, bend);
    const g2 = ctx.createGain(); g2.gain.value = 0.3;
    o.connect(env.g); o2.connect(g2).connect(env.g);
    const n = noiseSource(ctx, t, env.end - t);
    const nf = mkFilter(ctx, 'bandpass', f, 12);
    const ng = ctx.createGain(); ng.gain.value = 0.9;
    n.connect(nf).connect(ng).connect(env.g);
    env.g.connect(dest);
    mkVibrato(ctx, o.detune, t, env.end, 4.5, 10, 0.5);
    mkVibrato(ctx, o2.detune, t, env.end, 4.5, 10, 0.5);
    o.start(t); o2.start(t); o.stop(env.end); o2.stop(env.end);
  },
};

// ---------------------------------------------------------------------------
// Drums: (ctx, dest, t, vel, rootHz). Noise + pitched thumps, all enveloped.
// ---------------------------------------------------------------------------

function thump(ctx, dest, t, vel, fStart, fEnd, dur, peak) {
  const env = mkEnv(ctx, t, { a: 0.003, r: 0.06, dur, peak: peak * vel });
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(fStart, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, fEnd), t + dur * 0.6);
  o.connect(env.g).connect(dest);
  o.start(t); o.stop(env.end);
}

function noiseHit(ctx, dest, t, vel, { type = 'bandpass', f = 2000, q = 1, dur = 0.05, peak = 0.3, a = 0.002 }) {
  const env = mkEnv(ctx, t, { a, r: dur * 0.8, dur: dur * 0.4, peak: peak * vel });
  const n = noiseSource(ctx, t, env.end - t);
  n.connect(mkFilter(ctx, type, f, q)).connect(env.g).connect(dest);
}

export const DRUMS = {
  K: (ctx, d, t, v) => { thump(ctx, d, t, v, 150, 45, 0.25, 0.7); noiseHit(ctx, d, t, v, { type: 'lowpass', f: 400, dur: 0.03, peak: 0.2 }); },
  S: (ctx, d, t, v) => { noiseHit(ctx, d, t, v, { f: 1800, q: 0.8, dur: 0.14, peak: 0.35 }); thump(ctx, d, t, v, 220, 150, 0.08, 0.3); },
  r: (ctx, d, t, v) => { for (let i = 0; i < 6; i++) noiseHit(ctx, d, t + i * 0.028, v * (0.4 + i * 0.1), { f: 1800, q: 0.8, dur: 0.06, peak: 0.25 }); },
  H: (ctx, d, t, v) => noiseHit(ctx, d, t, v, { type: 'highpass', f: 7000, dur: 0.05, peak: 0.18 }),
  h: (ctx, d, t, v) => noiseHit(ctx, d, t, v, { type: 'highpass', f: 8000, dur: 0.03, peak: 0.1 }),
  Z: (ctx, d, t, v) => noiseHit(ctx, d, t, v, { f: 5500, q: 1.5, dur: 0.09, peak: 0.14, a: 0.015 }),
  T: (ctx, d, t, v) => { thump(ctx, d, t, v, 110, 48, 0.4, 0.8); noiseHit(ctx, d, t, v, { type: 'lowpass', f: 300, dur: 0.06, peak: 0.3 }); },
  t: (ctx, d, t, v) => { noiseHit(ctx, d, t, v, { f: 2600, q: 2, dur: 0.05, peak: 0.25 }); thump(ctx, d, t, v, 420, 300, 0.04, 0.2); },
  D: (ctx, d, t, v) => { thump(ctx, d, t, v, 170, 70, 0.22, 0.7); noiseHit(ctx, d, t, v, { type: 'lowpass', f: 600, dur: 0.02, peak: 0.2 }); },
  k: (ctx, d, t, v) => { noiseHit(ctx, d, t, v, { type: 'highpass', f: 3500, dur: 0.035, peak: 0.3 }); noiseHit(ctx, d, t, v, { f: 5200, q: 8, dur: 0.05, peak: 0.25 }); },
  M: (ctx, d, t, v, root) => { thump(ctx, d, t, v, root / 2 * 1.1, root / 2, 0.8, 0.7); noiseHit(ctx, d, t, v, { type: 'lowpass', f: 500, dur: 0.05, peak: 0.25 }); },
  m: (ctx, d, t, v, root) => { thump(ctx, d, t, v, root * 0.75 * 1.1, root * 0.75, 0.7, 0.6); noiseHit(ctx, d, t, v, { type: 'lowpass', f: 500, dur: 0.05, peak: 0.25 }); },
  C: (ctx, d, t, v) => noiseHit(ctx, d, t, v, { type: 'highpass', f: 4000, dur: 1.2, peak: 0.2 }),
};

// ============================================================================
// PART 4 — SFX, STINGS, CUES (all procedural)
// Each SFX: (ctx, dest, t) → nothing. Levels are kept moderate (peak ≈ 0.3–0.5).
// ============================================================================

/** Formant-filtered source: bandpass sweeps, used for the voice-ish sounds. */
function formant(ctx, src, dest, t, f1, f2, dur, q = 8, gain = 1) {
  const fl = mkFilter(ctx, 'bandpass', f1, q);
  fl.frequency.setValueAtTime(f1, t);
  fl.frequency.linearRampToValueAtTime(f2, t + dur);
  const g = ctx.createGain(); g.gain.value = gain;
  src.connect(fl).connect(g).connect(dest);
  return fl;
}

export const SFX = {
  /** Low noise burst with a pitch-dropping formant (plus a growly sub-saw). */
  burp(ctx, dest, t) {
    const env = mkEnv(ctx, t, { a: 0.02, d: 0.2, s: 0.5, r: 0.15, dur: 0.45, peak: 0.6 });
    env.g.connect(dest);
    const n = noiseSource(ctx, t, 0.8);
    formant(ctx, n, env.g, t, 520, 130, 0.5, 6, 1.4);
    formant(ctx, n, env.g, t, 1400, 500, 0.5, 8, 0.6);
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.5);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 28;   // growl
    const lg = ctx.createGain(); lg.gain.value = 0.5;
    const og = ctx.createGain(); og.gain.value = 0.5;
    lfo.connect(lg).connect(og.gain);
    o.connect(mkFilter(ctx, 'lowpass', 300, 2)).connect(og).connect(env.g);
    o.start(t); lfo.start(t); o.stop(env.end); lfo.stop(env.end);
  },

  /** "Nu?": two-formant voice (n → u) on a rising pitch, question intonation. */
  nu(ctx, dest, t) {
    const env = mkEnv(ctx, t, { a: 0.04, d: 0.1, s: 0.9, r: 0.12, dur: 0.42, peak: 0.5 });
    env.g.connect(dest);
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(150, t);
    o.frequency.linearRampToValueAtTime(170, t + 0.2);
    o.frequency.exponentialRampToValueAtTime(260, t + 0.45);
    formant(ctx, o, env.g, t, 280, 360, 0.3, 7, 1.2);       // F1: nasal n → u
    formant(ctx, o, env.g, t, 1700, 800, 0.3, 9, 0.5);      // F2 drops into the "u"
    mkVibrato(ctx, o.detune, t, env.end, 6, 12, 0.2);
    o.start(t); o.stop(env.end);
  },

  /** Sigh: filtered noise swell with the cutoff falling (air going out). */
  sigh(ctx, dest, t) {
    const env = mkEnv(ctx, t, { a: 0.35, d: 0.4, s: 0.5, r: 0.5, dur: 0.9, peak: 0.35 });
    const fl = mkFilter(ctx, 'lowpass', 2200, 1.2);
    fl.frequency.setValueAtTime(2200, t);
    fl.frequency.exponentialRampToValueAtTime(350, t + 1.3);
    noiseSource(ctx, t, 1.6).connect(fl).connect(env.g).connect(dest);
    const o = ctx.createOscillator(); o.type = 'sine';                // a weary hum
    o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(150, t + 1.2);
    const og = ctx.createGain(); og.gain.value = 0.25;
    o.connect(og).connect(env.g); o.start(t); o.stop(env.end);
  },

  /** Crunch (kale, spelt): a few short bright noise bursts. */
  crunch(ctx, dest, t) {
    let tt = t;
    for (let i = 0; i < 5; i++) {
      noiseHit(ctx, dest, tt, 1, { type: 'bandpass', f: 1800 + Math.random() * 2500, q: 1.5, dur: 0.04 + Math.random() * 0.03, peak: 0.45 });
      tt += 0.05 + Math.random() * 0.06;
    }
  },

  /** Slurp (cholent): bandpass noise sweeping up with a wobble + a rising sine. */
  slurp(ctx, dest, t) {
    const env = mkEnv(ctx, t, { a: 0.03, d: 0.2, s: 0.8, r: 0.1, dur: 0.5, peak: 0.45 });
    env.g.connect(dest);
    const n = noiseSource(ctx, t, 0.8);
    const fl = formant(ctx, n, env.g, t, 300, 2600, 0.5, 6, 1);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 18;
    const lg = ctx.createGain(); lg.gain.value = 350;
    lfo.connect(lg).connect(fl.frequency); lfo.start(t); lfo.stop(env.end);
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(900, t + 0.5);
    const og = ctx.createGain(); og.gain.value = 0.3;
    o.connect(og).connect(env.g); o.start(t); o.stop(env.end);
  },

  /** Fizz (Coke Zero): click of the tab, then hissing high-passed noise decaying. */
  fizz(ctx, dest, t) {
    thump(ctx, dest, t, 1, 2500, 900, 0.03, 0.25);
    noiseHit(ctx, dest, t + 0.01, 1, { type: 'bandpass', f: 3000, q: 2, dur: 0.05, peak: 0.3 });
    const env = mkEnv(ctx, t + 0.04, { a: 0.02, d: 0.8, s: 0.2, r: 0.4, dur: 1.0, peak: 0.3 });
    noiseSource(ctx, t, 1.6).connect(mkFilter(ctx, 'highpass', 5500, 0.7)).connect(env.g).connect(dest);
  },

  /** Scribble (pages earned): a flurry of tiny pen ticks. */
  scribble(ctx, dest, t) {
    let tt = t;
    for (let i = 0; i < 11; i++) {
      noiseHit(ctx, dest, tt, 0.6 + Math.random() * 0.4, { type: 'bandpass', f: 2500 + Math.random() * 4000, q: 3, dur: 0.03, peak: 0.35 });
      tt += 0.035 + Math.random() * 0.045;
    }
  },

  /** Phone (Isi): old bell ring — two tones, 20 Hz clapper modulation, ring-ring. */
  phone(ctx, dest, t) {
    for (let burst = 0; burst < 2; burst++) {
      const t0 = t + burst * 0.5;
      const env = mkEnv(ctx, t0, { a: 0.01, r: 0.08, dur: 0.33, peak: 0.25 });
      env.g.connect(dest);
      const clap = ctx.createOscillator(); clap.type = 'square'; clap.frequency.value = 22;
      const cg = ctx.createGain(); cg.gain.value = 0.5;
      const mod = ctx.createGain(); mod.gain.value = 0.5;
      clap.connect(cg).connect(mod.gain);
      [1180, 1480].forEach((f) => { const o = ctx.createOscillator(); o.frequency.value = f; o.connect(mod); o.start(t0); o.stop(env.end); });
      mod.connect(env.g);
      clap.start(t0); clap.stop(env.end);
    }
  },

  /** Goat: "meh-eh-eh" — vibrato square through a nasal formant, pitch sagging. */
  goat(ctx, dest, t) {
    const env = mkEnv(ctx, t, { a: 0.03, d: 0.1, s: 0.8, r: 0.1, dur: 0.55, peak: 0.45 });
    env.g.connect(dest);
    const o = ctx.createOscillator(); o.type = 'square';
    o.frequency.setValueAtTime(240, t);
    o.frequency.linearRampToValueAtTime(215, t + 0.6);
    formant(ctx, o, env.g, t, 950, 700, 0.6, 5, 0.7);
    formant(ctx, o, env.g, t, 1900, 1600, 0.6, 7, 0.3);
    mkVibrato(ctx, o.detune, t, env.end, 9, 60, 0.05);   // the bleat
    o.start(t); o.stop(env.end);
  },

  /** Gasp: sharp inhale — bandpassed noise rising fast, cut short. */
  gasp(ctx, dest, t) {
    const env = mkEnv(ctx, t, { a: 0.18, r: 0.05, dur: 0.22, peak: 0.5 });
    const n = noiseSource(ctx, t, 0.5);
    formant(ctx, n, env.g, t, 500, 2800, 0.25, 3, 1);
    env.g.connect(dest);
  },

  /** Page flip: short noise sweep downward. */
  page(ctx, dest, t) {
    const env = mkEnv(ctx, t, { a: 0.01, d: 0.1, s: 0.3, r: 0.1, dur: 0.18, peak: 0.4 });
    const n = noiseSource(ctx, t, 0.4);
    formant(ctx, n, env.g, t, 3500, 600, 0.22, 1.5, 1);
    env.g.connect(dest);
  },

  click(ctx, dest, t) { thump(ctx, dest, t, 1, 1800, 1200, 0.025, 0.35); noiseHit(ctx, dest, t, 1, { type: 'highpass', f: 4000, dur: 0.02, peak: 0.25 }); },
  pop(ctx, dest, t) { thump(ctx, dest, t, 1, 700, 150, 0.09, 0.5); },
  thud(ctx, dest, t) { thump(ctx, dest, t, 1, 130, 38, 0.3, 0.7); noiseHit(ctx, dest, t, 1, { type: 'lowpass', f: 350, dur: 0.08, peak: 0.35 }); },

  /** Generic ta-da: fast major arpeggio into a held chord, glockenspiel + brass. */
  tada(ctx, dest, t) {
    const root = 67; // G4
    [0, 4, 7, 12].forEach((semi, i) => {
      const f = midiToHz(root + semi);
      INSTRUMENTS.glockenspiel(ctx, dest, { f, t: t + i * 0.08, dur: 0.3, vel: 0.9, bend: null });
    });
    [12, 16, 19].forEach((semi) => INSTRUMENTS.brass(ctx, dest, { f: midiToHz(root + semi - 12), t: t + 0.32, dur: 0.55, vel: 0.8, bend: null }));
  },

  /** Boo: descending "wah-wah" saw with a falling filter. */
  boo(ctx, dest, t) {
    const env = mkEnv(ctx, t, { a: 0.03, d: 0.2, s: 0.7, r: 0.15, dur: 0.55, peak: 0.3 });
    const fl = mkFilter(ctx, 'lowpass', 900, 4);
    fl.frequency.setValueAtTime(1200, t); fl.frequency.exponentialRampToValueAtTime(250, t + 0.6);
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(300, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.6);
    o.connect(fl).connect(env.g).connect(dest);
    mkVibrato(ctx, o.detune, t, env.end, 7, 40, 0.1);
    o.start(t); o.stop(env.end);
  },

  /** Cheer: crowd swell (formant-wobbled noise) + a handful of "ahh" voices. */
  cheer(ctx, dest, t) {
    const env = mkEnv(ctx, t, { a: 0.25, d: 0.5, s: 0.6, r: 0.5, dur: 1.0, peak: 0.3 });
    env.g.connect(dest);
    const n = noiseSource(ctx, t, 1.8);
    const fl = formant(ctx, n, env.g, t, 900, 1300, 1.0, 1.5, 1);
    const lfo = ctx.createOscillator(); lfo.frequency.value = 9;
    const lg = ctx.createGain(); lg.gain.value = 300;
    lfo.connect(lg).connect(fl.frequency); lfo.start(t); lfo.stop(env.end);
    [262, 330, 392, 523].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(f * 0.98, t); o.frequency.linearRampToValueAtTime(f * 1.02, t + 1.2);
      const vf = mkFilter(ctx, 'bandpass', 800, 2);
      const vg = ctx.createGain(); vg.gain.value = 0.12;
      o.connect(vf).connect(vg).connect(env.g);
      mkVibrato(ctx, o.detune, t, env.end, 5 + i, 20, 0.3);
      o.start(t); o.stop(env.end);
    });
  },

  /** Zzz: three rising buzzy snores. */
  zzz(ctx, dest, t) {
    [0, 0.35, 0.7].forEach((off, i) => {
      const t0 = t + off;
      const env = mkEnv(ctx, t0, { a: 0.05, d: 0.1, s: 0.8, r: 0.1, dur: 0.22, peak: 0.25 });
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(110 + i * 25, t0); o.frequency.linearRampToValueAtTime(150 + i * 25, t0 + 0.25);
      o.connect(mkFilter(ctx, 'lowpass', 700, 3)).connect(env.g).connect(dest);
      o.start(t0); o.stop(env.end);
    });
  },

  ding(ctx, dest, t) { INSTRUMENTS.chime(ctx, dest, { f: 1320, t, dur: 0.6, vel: 1, bend: null }); },

  /** Whoosh: bandpass noise sweeping up then down. */
  whoosh(ctx, dest, t) {
    const env = mkEnv(ctx, t, { a: 0.15, d: 0.1, s: 0.9, r: 0.2, dur: 0.3, peak: 0.4 });
    const fl = mkFilter(ctx, 'bandpass', 400, 1.2);
    fl.frequency.setValueAtTime(300, t);
    fl.frequency.exponentialRampToValueAtTime(3500, t + 0.2);
    fl.frequency.exponentialRampToValueAtTime(250, t + 0.55);
    noiseSource(ctx, t, 0.8).connect(fl).connect(env.g).connect(dest);
  },

  /** Cash: two quick coin pings with a sparkly tail. */
  cash(ctx, dest, t) {
    [[1975, 0], [2637, 0.07]].forEach(([f, off]) => {
      const env = mkEnv(ctx, t + off, { a: 0.003, d: 0.3, s: 0.2, r: 0.3, dur: 0.25, peak: 0.25 });
      const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = f;
      o.connect(mkFilter(ctx, 'lowpass', 6000, 0.5)).connect(env.g).connect(dest);
      o.start(t + off); o.stop(env.end);
    });
    for (let i = 0; i < 4; i++) INSTRUMENTS.glockenspiel(ctx, dest, { f: 2093 * [1, 1.25, 1.5, 2][i], t: t + 0.18 + i * 0.05, dur: 0.15, vel: 0.5, bend: null });
  },

  /** Honk (Moshe's taxi): two detuned saws, old rubber-bulb horn with a sag. */
  honk(ctx, dest, t) {
    const env = mkEnv(ctx, t, { a: 0.03, d: 0.1, s: 0.9, r: 0.1, dur: 0.35, peak: 0.3 });
    const fl = mkFilter(ctx, 'lowpass', 1400, 3);
    [285, 357].forEach((f) => {
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * 0.93, t + 0.4);
      o.connect(fl); o.start(t); o.stop(env.end);
    });
    fl.connect(env.g).connect(dest);
  },

  /** Drumroll: accelerating snare hits with a crescendo, ending in a crash. */
  drumroll(ctx, dest, t) {
    let tt = t, gap = 0.07;
    for (let i = 0; i < 26 && tt < t + 1.35; i++) {
      DRUMS.S(ctx, dest, tt, 0.35 + i * 0.025);
      tt += gap; gap = Math.max(0.028, gap * 0.95);
    }
    DRUMS.C(ctx, dest, tt, 0.8);
    DRUMS.K(ctx, dest, tt, 0.8);
  },

  /** Choir: golden-light "ahh" chord (D major with the 9th) for the cholent reveal. */
  choir(ctx, dest, t) {
    const notes = [50, 57, 62, 66, 69, 76]; // D2 A2 D3 F#3 A3 E4
    notes.forEach((m, i) => {
      const f = midiToHz(m);
      const env = mkEnv(ctx, t, { a: 0.35, d: 0.4, s: 0.9, r: 0.9, dur: 1.5, peak: 0.07 });
      env.g.connect(dest);
      ['sawtooth', 'triangle'].forEach((type, j) => {
        const o = ctx.createOscillator(); o.type = type;
        o.frequency.value = f; o.detune.value = (j ? 6 : -6) + (i % 2 ? 3 : -3);
        const f1 = mkFilter(ctx, 'bandpass', 720, 3);   // "ah" formants
        const f2 = mkFilter(ctx, 'bandpass', 1150, 4);
        const g1 = ctx.createGain(); g1.gain.value = 1.2;
        const g2 = ctx.createGain(); g2.gain.value = 0.5;
        o.connect(f1).connect(g1).connect(env.g);
        o.connect(f2).connect(g2).connect(env.g);
        mkVibrato(ctx, o.detune, t, env.end, 4.5 + i * 0.2, 7, 0.6);
        o.start(t); o.stop(env.end);
      });
    });
    for (let i = 0; i < 5; i++) INSTRUMENTS.glockenspiel(ctx, dest, { f: midiToHz([86, 90, 93, 98, 102][i]), t: t + 0.4 + i * 0.12, dur: 0.4, vel: 0.5, bend: null });
  },
};

/** Sad trombone slide (Knesset): wah wah wah waaah, detuned by +35 cents. */
function cueTrombone(ctx, dest, t) {
  const seq = [[65, 0.32], [63, 0.32], [61, 0.32], [59, 0.9]]; // F E♭ D♭ B (slides between)
  let tt = t;
  seq.forEach(([m, d], i) => {
    const env = mkEnv(ctx, tt, { a: 0.04, d: 0.1, s: 0.9, r: 0.12, dur: d - 0.05, peak: 0.28 });
    const fl = mkFilter(ctx, 'lowpass', 1300, 2);
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    const f = midiToHz(m);
    o.frequency.setValueAtTime(f * 1.06, tt);                // the slide in from above
    o.frequency.exponentialRampToValueAtTime(f, tt + 0.12);
    if (i === 3) o.frequency.exponentialRampToValueAtTime(f * 0.9, tt + d); // the final sag
    o.detune.value = 35;
    o.connect(fl).connect(env.g).connect(dest);
    mkVibrato(ctx, o.detune, tt, env.end, 5, i === 3 ? 30 : 10, 0.15);
    o.start(tt); o.stop(env.end);
    tt += d;
  });
}

/** Klezmer tease: a freygish clarinet lick with a krekhts at the end. */
function cueTease(ctx, dest, t, root = 60) {
  const sc = SCALES.freygish;
  const lick = [[0, 0.11], [1, 0.11], [2, 0.11], [3, 0.11], [4, 0.11], [5, 0.11], [4, 0.11], [3, 0.11], [2, 0.11], [1, 0.11], [0, 0.11], [1, 0.22], [0, 0.9]];
  let tt = t;
  lick.forEach(([deg, d]) => {
    INSTRUMENTS.clarinet(ctx, dest, { f: midiToHz(root + sc[deg]), t: tt, dur: d * 0.95, vel: 0.9, bend: null, layer: { krekhts: true } });
    tt += d;
  });
}

/** Krekhts: one sobbing clarinet note (forced catch). */
function cueKrekhts(ctx, dest, t, root = 62) {
  const f = midiToHz(root + 7);   // the 5th: A
  const env = mkEnv(ctx, t, { a: 0.04, d: 0.1, s: 0.85, r: 0.15, dur: 0.7, peak: 0.3 });
  const o = mkOsc(ctx, 'triangle', f, t, null);
  o.connect(mkFilter(ctx, 'lowpass', 2600, 1)).connect(env.g).connect(dest);
  mkVibrato(ctx, o.detune, t, env.end, 5.5, 10, 0.2);
  const k = t + 0.38;
  o.detune.setValueAtTime(0, k);
  o.detune.linearRampToValueAtTime(160, k + 0.07);
  o.detune.linearRampToValueAtTime(-70, k + 0.16);
  o.detune.linearRampToValueAtTime(0, k + 0.26);
  env.g.gain.setTargetAtTime(0.1, k, 0.02);
  env.g.gain.setTargetAtTime(0.26, k + 0.09, 0.03);
  o.start(t); o.stop(env.end);
}

/** Sad slide for sting('bad') when nothing is playing: a saw sliding down a fifth. */
function sadSlide(ctx, dest, t) {
  const env = mkEnv(ctx, t, { a: 0.05, d: 0.2, s: 0.8, r: 0.3, dur: 1.2, peak: 0.25 });
  const o = ctx.createOscillator(); o.type = 'sawtooth';
  o.frequency.setValueAtTime(330, t);
  o.frequency.exponentialRampToValueAtTime(220, t + 1.4);
  o.connect(mkFilter(ctx, 'lowpass', 1200, 2)).connect(env.g).connect(dest);
  mkVibrato(ctx, o.detune, t, env.end, 4, 25, 0.4);
  o.start(t); o.stop(env.end);
}

// ============================================================================
// PART 5 — THE ENGINE
// ============================================================================

const TOKEN_RE = /^(>)?(?:\[([^\]]+)\]|(\S+))$/;
const NOTE_RE = /^([1-7])([#b]?)('*|_*)$/;

/** Parse one layer's bars into a flat step array (null | 'tie' | step object). */
function parsePattern(bars, isDrums) {
  const tokens = bars.join(' ').trim().split(/\s+/);
  const steps = tokens.map((tok) => {
    if (tok === '.') return null;
    if (tok === '-') return 'tie';
    const m = TOKEN_RE.exec(tok);
    if (!m) throw new Error(`audio.js: bad token "${tok}"`);
    const names = (m[2] ? m[2].split('+') : [m[3]]);
    const notes = names.map((nm) => {
      if (isDrums) return nm;
      const n = NOTE_RE.exec(nm);
      if (!n) throw new Error(`audio.js: bad note "${nm}"`);
      const deg = +n[1] - 1;
      const acc = n[2] === '#' ? 1 : n[2] === 'b' ? -1 : 0;
      const oct = n[3] ? (n[3][0] === "'" ? n[3].length : -n[3].length) : 0;
      return { deg, acc, oct };
    });
    return { notes, accent: !!m[1], len: 1 };
  });
  for (let i = 0; i < steps.length; i++) {
    if (steps[i] && steps[i] !== 'tie') {
      let j = i + 1;
      while (j < steps.length && steps[j] === 'tie') { steps[i].len++; j++; }
    }
  }
  return steps;
}

/** Degree (0-based, may be out of 0..6) + octave + accidental → MIDI. */
function degreeToMidi(root, scale, deg, oct, acc) {
  const o = Math.floor(deg / 7);
  const d = ((deg % 7) + 7) % 7;
  return root + scale[d] + 12 * (oct + o) + acc;
}

/** Dev helper: verify every bar has exactly stepsPerBar tokens. Returns a list of problems. */
export function validateThemes() {
  const problems = [];
  for (const [name, def] of Object.entries(THEMES)) {
    if (!def.layers) continue;
    for (const layer of def.layers) {
      layer.bars.forEach((bar, i) => {
        const n = bar.trim().split(/\s+/).length;
        if (n !== def.stepsPerBar) problems.push(`${name}/${layer.name} bar ${i}: ${n} tokens, expected ${def.stepsPerBar}`);
      });
      try { parsePattern(layer.bars, layer.inst === 'drums'); } catch (e) { problems.push(`${name}/${layer.name}: ${e.message}`); }
      if (layer.inst !== 'drums' && !INSTRUMENTS[layer.inst]) problems.push(`${name}/${layer.name}: unknown instrument ${layer.inst}`);
    }
  }
  return problems;
}

/**
 * createAudio(opts) → the audio object used by the game.
 *   basePath   folder of optional real recordings (`audio/<name>.mp3`), default 'audio/'
 *   context    optional AudioContext / OfflineAudioContext to use (tests)
 *   volume     initial master volume 0..1
 *   checkFiles set false to skip the mp3 lookups entirely
 */
export function createAudio(opts = {}) {
  const basePath = opts.basePath == null ? 'audio/' : opts.basePath;
  const checkFiles = opts.checkFiles !== false && !!basePath;
  const hasWindow = typeof window !== 'undefined';
  const AC = hasWindow ? (window.AudioContext || window.webkitAudioContext) : null;
  const OAC = hasWindow ? (window.OfflineAudioContext || window.webkitOfflineAudioContext) : null;

  // ---- state ----
  let ctx = opts.context || null;
  let isOffline = !!(ctx && OAC && ctx instanceof OAC);
  let unavailable = !ctx && !AC;
  let nodes = null;                 // master chain, created with the context
  let muted = false;
  let volume = clamp(opts.volume == null ? 0.8 : opts.volume, 0, 1);
  let mood = 60;                    // SPEC §3.1 start value
  let tempoScale = 1;
  let stingTempo = 1;               // sting('bad') slows the music temporarily
  let instances = [];               // playing / fading theme instances
  let current = null;               // the instance getBeat() reports
  let timer = null;
  const stepListeners = new Set();
  const fileCache = new Map();      // name → true | false | Promise
  const LOOKAHEAD = 0.14;           // seconds scheduled ahead of the clock
  const TICK_MS = 25;

  // ---- context + master chain -------------------------------------------
  function ensureCtx() {
    if (unavailable) return null;
    if (!ctx) {
      try { ctx = new AC(); } catch (e) { unavailable = true; return null; }
    }
    if (!nodes) buildChain();
    return ctx;
  }

  function buildChain() {
    const master = ctx.createGain();
    master.gain.value = volume;
    const mute = ctx.createGain();
    mute.gain.value = muted ? 0 : 1;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.knee.value = 12; comp.ratio.value = 4;
    comp.attack.value = 0.005; comp.release.value = 0.2;
    const music = ctx.createGain(); music.gain.value = 0.6;
    const sfx = ctx.createGain(); sfx.gain.value = 0.9;
    music.connect(master); sfx.connect(master);
    master.connect(mute).connect(comp).connect(ctx.destination);
    // One ConstantSource feeds every oscillator's detune: the sting('bad') bend.
    let bend = null;
    if (ctx.createConstantSource) {
      bend = ctx.createConstantSource();
      bend.offset.value = 0;
      bend.start();
    }
    nodes = { master, mute, comp, music, sfx, bend };
  }

  function resumeCtx() {
    const c = ensureCtx();
    if (c && !isOffline && c.state === 'suspended' && c.resume) c.resume().catch(() => {});
  }

  if (hasWindow && !isOffline) {
    // First user gesture creates/resumes the context (autoplay policy).
    const onGesture = () => { resumeCtx(); };
    ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => window.addEventListener(ev, onGesture, { passive: true }));
  }

  const now = () => (ctx ? ctx.currentTime : 0);

  // ---- mp3 hook (SPEC §8.4) -----------------------------------------------
  function fileStatus(name) {
    if (!checkFiles || isOffline || typeof fetch !== 'function') return false;
    if (hasWindow && window.location && window.location.protocol === 'file:') return false;
    const cached = fileCache.get(name);
    if (cached !== undefined) return cached;
    const p = (async () => {
      try {
        const r = await fetch(`${basePath}${name}.mp3`, { method: 'HEAD' });
        const ok = r.ok && !/text\/html/i.test(r.headers.get('content-type') || '');
        fileCache.set(name, ok);
        return ok;
      } catch (e) {
        fileCache.set(name, false);
        return false;
      }
    })();
    fileCache.set(name, p);
    return p;
  }

  function playFileSfx(name) {
    try {
      const el = new Audio(`${basePath}${name}.mp3`);
      el.volume = muted ? 0 : volume;
      el.play().catch(() => {});
    } catch (e) { /* ignore */ }
  }

  // ---- theme instances -----------------------------------------------------
  function bpmOf(b, startTime, time) {
    if (typeof b === 'number') return b;
    const k = clamp((time - startTime) / b.seconds, 0, 1);
    return b.from + (b.to - b.from) * k;
  }

  function layerTarget(layerDef, m) {
    const min = layerDef.minMood == null ? 0 : layerDef.minMood;
    const max = layerDef.maxMood == null ? 101 : layerDef.maxMood;
    return (m >= min && m < max) ? layerDef.gain : 0;
  }

  /** Build the runtime layers of a theme definition on an instance. */
  function buildLayers(inst, def, t) {
    return def.layers.map((ld) => {
      const g = ctx.createGain();
      const target = layerTarget(ld, mood);
      g.gain.setValueAtTime(target, t);
      g.connect(inst.bus);
      return { def: ld, gain: g, pattern: parsePattern(ld.bars, ld.inst === 'drums'), target };
    });
  }

  function enterSegment(inst, segIdx, t) {
    const seq = inst.def.sequence;
    const seg = seq[segIdx];
    const sub = THEMES[seg.theme];
    inst.segIdx = segIdx;
    inst.segName = seg.theme === '_mashup' ? 'mashup' : seg.theme;
    inst.segBars = seg.bars;
    inst.sub = sub;
    // Tempo: the segment's own override, else the medley's shared bpm, else the sub-theme's.
    inst.bpmSpec = seg.bpm != null ? seg.bpm : (inst.def.bpm != null ? inst.def.bpm : sub.bpm);
    inst.segStartTime = t;
    inst.stepIndex = 0;
    // Fade the old layers out over one second, keep them around until silent.
    for (const l of inst.layers) l.gain.gain.setTargetAtTime(0, t, 0.25);
    const old = inst.layers;
    if (!isOffline) setTimeout(() => old.forEach((l) => { try { l.gain.disconnect(); } catch (e) { /* */ } }), 2500);
    inst.layers = buildLayers(inst, sub, t);
  }

  function makeInstance(name, def, t) {
    const bus = ctx.createGain();
    bus.gain.setValueAtTime(0, t);
    bus.connect(nodes.music);
    const inst = { name, def, bus, startTime: t, nextTime: t + 0.02, stepIndex: 0, layers: [], history: [], dead: false, sub: def, bpmSpec: def.bpm };
    if (def.sequence) enterSegment(inst, 0, t);
    else inst.layers = buildLayers(inst, def, t);
    return inst;
  }

  function fadeOut(inst, t, secs = 1) {
    inst.bus.gain.cancelScheduledValues(t);
    inst.bus.gain.setValueAtTime(inst.bus.gain.value, t);
    inst.bus.gain.linearRampToValueAtTime(0, t + secs);
    inst.dead = true;
    inst.deadAt = t + secs + 0.1;
  }

  // ---- scheduling one step for one instance -----------------------------
  function scheduleStep(inst, t) {
    const def = inst.sub;
    const spb = def.stepsPerBar;
    const stepIndex = inst.stepIndex;
    const bar = Math.floor(stepIndex / spb);
    const step = stepIndex % spb;
    const bpm = bpmOf(inst.bpmSpec, inst.segStartTime == null ? inst.startTime : inst.segStartTime, t);
    const moodTempo = mood < 20 ? 0.72 : 1;
    const stepDur = 60 / (bpm * tempoScale * moodTempo * stingTempo) / 4;   // 16th notes
    const scale = SCALES[def.scale];
    const rootHz = midiToHz(def.root);

    for (const layer of inst.layers) {
      const ld = layer.def;
      if (ld.enterBar != null && bar < ld.enterBar) continue;
      // Skip silent layers entirely (saves CPU); their fade-in restarts on the next step.
      if (layer.target === 0 && layer.gain.gain.value < 0.002) continue;
      const pat = layer.pattern;
      const entry = pat[stepIndex % pat.length];
      if (!entry || entry === 'tie') continue;
      let when = t;
      if (def.swing && (step % 4) === 2) when += def.swing * stepDur;   // lazy off-beat eighths
      const vel = entry.accent ? 1 : 0.75;
      if (ld.inst === 'drums') {
        for (const name of entry.notes) {
          const fn = DRUMS[name];
          if (fn) fn(ctx, layer.gain, when, vel, rootHz);
        }
      } else {
        const fn = INSTRUMENTS[ld.inst];
        if (!fn) continue;
        const legato = ld.legato == null ? 0.9 : ld.legato;
        const dur = Math.max(0.05, entry.len * stepDur * legato);
        for (const n of entry.notes) {
          const midi = degreeToMidi(def.root, scale, n.deg + (ld.transposeDeg || 0), n.oct + (ld.octave || 0), n.acc);
          fn(ctx, layer.gain, { f: midiToHz(midi), t: when, dur, vel, bend: nodes.bend, layer: ld });
        }
      }
    }

    // Beat bookkeeping for getBeat() / onStep().
    const beatSteps = def.beatSteps || 4;
    const info = {
      time: t, location: inst.name, segment: inst.segName || inst.name, bar, step, stepsPerBar: spb,
      beat: Math.floor(step / beatSteps), beatsPerBar: Math.round(spb / beatSteps),
      isBeat: step % beatSteps === 0, isDownbeat: step === 0,
      groups: def.groups || null, bpm: bpm * tempoScale * moodTempo * stingTempo, stepDuration: stepDur,
    };
    inst.history.push(info);
    if (inst.history.length > 64) inst.history.shift();
    if (inst === current && !inst.dead) {
      for (const cb of stepListeners) { try { cb(info); } catch (e) { /* listener error must not kill the clock */ } }
    }

    inst.stepIndex++;
    inst.nextTime = t + stepDur;

    // Finale medley: advance to the next segment at the bar boundary.
    if (inst.def.sequence && inst.stepIndex % spb === 0 && Math.floor(inst.stepIndex / spb) >= inst.segBars) {
      enterSegment(inst, (inst.segIdx + 1) % inst.def.sequence.length, inst.nextTime);
    }
  }

  function tick() {
    if (!ctx) return;
    const horizon = now() + (isOffline ? ctx.length / ctx.sampleRate + 0.5 : LOOKAHEAD);
    for (const inst of instances) {
      if (inst.dead) continue;
      let guard = 0;
      while (inst.nextTime < horizon && guard++ < 4000) scheduleStep(inst, inst.nextTime);
    }
    const t = now();
    instances = instances.filter((inst) => {
      if (inst.dead && inst.deadAt <= t) {
        try { inst.bus.disconnect(); if (inst.el) inst.el.pause(); } catch (e) { /* */ }
        return false;
      }
      return true;
    });
    if (!instances.length && timer) { clearInterval(timer); timer = null; }
  }

  function startClock() {
    if (isOffline) { tick(); return; }
    if (!timer) timer = setInterval(tick, TICK_MS);
  }

  // ---- public API ---------------------------------------------------------
  const api = {
    /** Start (or crossfade to) a location theme. Same location = no-op. */
    playMusic(location) {
      if (!THEMES[location] || location[0] === '_') return;
      if (current && current.name === location && !current.dead) return;
      const c = ensureCtx();
      if (!c) return;
      resumeCtx();
      const t = now() + 0.02;
      for (const inst of instances) if (!inst.dead) fadeOut(inst, t, 1);
      const inst = makeInstance(location, THEMES[location], t);
      inst.bus.gain.linearRampToValueAtTime(1, t + 1);
      instances.push(inst);
      current = inst;
      startClock();
      // mp3 hook: a real recording replaces the procedural theme when it exists.
      const st = fileStatus(location);
      if (st === true) swapToFile(inst, location);
      else if (st && st.then) st.then((ok) => { if (ok && current === inst && !inst.dead) swapToFile(inst, location); });
    },

    /** Fade the music out (~1 s). */
    stopMusic() {
      if (!ctx) return;
      const t = now();
      for (const inst of instances) if (!inst.dead) fadeOut(inst, t, 1);
      current = null;
    },

    /** Adaptive layering: 0–19 lone sad lead, 20–59 + bass, 60–79 + drums, 80+ everything. */
    setMood(m) {
      mood = clamp(+m || 0, 0, 100);
      if (!ctx) return;
      const t = now();
      for (const inst of instances) {
        for (const layer of inst.layers) {
          const target = layerTarget(layer.def, mood);
          if (target !== layer.target) {
            layer.target = target;
            layer.gain.gain.cancelScheduledValues(t);
            layer.gain.gain.setTargetAtTime(target, t, 0.3);   // ~1 s smooth fade
          }
        }
      }
    },
    getMood() { return mood; },

    setMuted(b) {
      muted = !!b;
      if (nodes) { const t = now(); nodes.mute.gain.cancelScheduledValues(t); nodes.mute.gain.setTargetAtTime(muted ? 0 : 1, t, 0.03); }
      for (const inst of instances) if (inst.el) inst.el.muted = muted;
    },
    isMuted() { return muted; },
    toggleMuted() { api.setMuted(!muted); return muted; },

    setVolume(v) {
      volume = clamp(+v || 0, 0, 1);
      if (nodes) { const t = now(); nodes.master.gain.cancelScheduledValues(t); nodes.master.gain.setTargetAtTime(volume, t, 0.03); }
      for (const inst of instances) if (inst.el) inst.el.volume = volume;
    },
    getVolume() { return volume; },

    /** Global tempo multiplier (Berlin gets sillier with 1.1, 1.2 ...). */
    setTempoScale(x) { tempoScale = clamp(+x || 1, 0.25, 3); },

    /** Procedural SFX (or audio/<name>.mp3 if that file exists). */
    playSfx(name) {
      const c = ensureCtx();
      if (!c) return;
      resumeCtx();
      const st = fileStatus(name);
      if (st === true) { playFileSfx(name); return; }
      const fn = SFX[name];
      if (!fn) return;
      fn(ctx, nodes.sfx, now() + 0.01);
    },

    /**
     * sting('good'): ta-da arpeggio in the current theme's scale and instrument.
     * sting('bad'): the music bends down ~4 semitones and slows for ~2 s, then recovers.
     */
    sting(kind) {
      const c = ensureCtx();
      if (!c) return;
      resumeCtx();
      const t = now() + 0.01;
      const def = current && !current.dead ? current.sub : null;
      if (kind === 'bad') {
        if (nodes.bend && def) {
          const p = nodes.bend.offset;
          p.cancelScheduledValues(t);
          p.setValueAtTime(p.value, t);
          p.linearRampToValueAtTime(-450, t + 0.45);
          p.setValueAtTime(-450, t + 1.4);
          p.linearRampToValueAtTime(0, t + 2.1);
        }
        stingTempo = 0.72;
        if (!isOffline) setTimeout(() => { stingTempo = 0.86; }, 1500);
        if (!isOffline) setTimeout(() => { stingTempo = 1; }, 2200);
        sadSlide(ctx, nodes.sfx, t);
        if (def) SFX.boo(ctx, nodes.sfx, t + 0.3);
        return;
      }
      // good
      const scale = def ? SCALES[def.scale] : SCALES.major;
      const root = def ? def.root : 67;
      const inst = def && INSTRUMENTS[def.stingInst] ? def.stingInst : 'chime';
      const fn = INSTRUMENTS[inst];
      const degs = [0, 2, 4, 7, 9];                      // 1 3 5 1' 3'
      degs.forEach((d, i) => fn(ctx, nodes.sfx, { f: midiToHz(degreeToMidi(root, scale, d, 0, 0)), t: t + i * 0.09, dur: i === 4 ? 0.6 : 0.16, vel: 0.9, bend: null, layer: {} }));
      [0, 2, 4].forEach((d) => INSTRUMENTS.glockenspiel(ctx, nodes.sfx, { f: midiToHz(degreeToMidi(root, scale, d, 1, 0)), t: t + 0.45, dur: 0.5, vel: 0.6, bend: null }));
    },

    /** Theme one-shots: 'trombone' | 'tease' | 'krekhts' | 'honk'. */
    cue(name) {
      const c = ensureCtx();
      if (!c) return;
      resumeCtx();
      const t = now() + 0.01;
      const def = current && !current.dead ? current.sub : null;
      switch (name) {
        case 'trombone': cueTrombone(ctx, nodes.sfx, t); break;
        case 'tease': cueTease(ctx, nodes.sfx, t, def ? def.root : 60); break;
        case 'krekhts': cueKrekhts(ctx, nodes.sfx, t, def ? def.root : 62); break;
        case 'honk': SFX.honk(ctx, nodes.sfx, t); break;
        default: break;
      }
    },

    /**
     * Rhythm sync. Returns the step the music is on *right now* (audio clock):
     * { playing, location, segment, bar, step, stepsPerBar, beat, beatsPerBar, groups,
     *   bpm, stepDuration, timeToNextStep, time }
     * `segment` is the sub-theme the finale medley is currently on ('mashup' at the end).
     * Settlement: beatsPerBar = 7 (eighths), groups = [2,2,3].
     */
    getBeat() {
      const empty = { playing: false, location: null, segment: null, bar: 0, step: 0, stepsPerBar: 16, beat: 0, beatsPerBar: 4, groups: null, bpm: 0, stepDuration: 0, timeToNextStep: 0, time: now() };
      if (!current || current.dead || !current.history.length) return empty;
      const t = now();
      const h = current.history;
      let i = h.length - 1;
      while (i > 0 && h[i].time > t) i--;
      const s = h[i];
      const next = (s.time + s.stepDuration);
      return { ...s, playing: true, timeToNextStep: Math.max(0, next - t), time: t };
    },

    /** Called for every scheduled step of the current theme, ahead of time. Returns an unsubscribe fn. */
    onStep(cb) { stepListeners.add(cb); return () => stepListeners.delete(cb); },

    /** Audio clock in seconds (compare with onStep's `time`). */
    now,
    currentLocation() { return current && !current.dead ? current.name : null; },
    get context() { return ctx; },
    isAvailable() { return !unavailable; },
    /** Expose the tables so games can extend them at runtime. */
    THEMES, SCALES, INSTRUMENTS, DRUMS, SFX, SFX_NAMES, LOCATIONS, CUE_NAMES,
  };

  /** Replace a procedural instance with a looping <audio> element through the same bus. */
  function swapToFile(inst, location) {
    try {
      const el = new Audio(`${basePath}${location}.mp3`);
      el.loop = true;
      el.crossOrigin = 'anonymous';
      const src = ctx.createMediaElementSource(el);
      const bus = ctx.createGain();
      bus.gain.setValueAtTime(0, now());
      src.connect(bus).connect(nodes.music);
      const fileInst = { name: location, def: inst.def, sub: inst.sub, bus, el, layers: [], history: inst.history, dead: true, deadAt: Infinity, startTime: inst.startTime };
      el.play().then(() => {
        const t = now();
        fadeOut(inst, t, 1);
        bus.gain.linearRampToValueAtTime(1, t + 1);
        fileInst.dead = false;
        instances.push(fileInst);
        current = fileInst;
      }).catch(() => { /* keep the procedural theme */ });
    } catch (e) { /* keep the procedural theme */ }
  }

  return api;
}

export default createAudio;
