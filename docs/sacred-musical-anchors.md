# Sacred Musical Anchors (Release Arrangement)

These anchors are **non-negotiable timing constraints** for the demo arrangement. Treat each timestamp below as musically locked.

## Rules (must always be followed)

1. **Do not retime, drift, or approximate these anchors** when editing timeline sections, cues, transitions, or intro scripting.
2. If a timeline edit is required, validate every listed anchor against the soundtrack and preserve the same musical hit point.
3. If any anchor must change in a future revision, update this document, `README.md`, and `AGENTS.md` in the same commit with an explicit reason.
4. Keep the total runtime locked at **06:22.87** unless there is an intentional audio recut.
5. Keep timeline playback aligned to MP3 waveform timing by preserving `audio.offset: -0.128` in `public/timeline.release.json` (this compensates the observed in-browser clock skew versus manual Audacity timing checks).

## Priority order for timing decisions

1. **Primary priority (absolute):** sacred anchors in [Anchor list (source of truth)](#anchor-list-source-of-truth).
2. **Secondary priority (advisory):** suggested effect-switch timestamps in [Secondary effect-switch timing cues](#secondary-effect-switch-timing-cues).
3. **Creative priority:** if a secondary switch cue conflicts with a chilled breakdown, deliberate artistic sequence, or a clearly-defined section identity, skip that secondary cue and preserve musical/visual intent.

## Anchor list (source of truth)

- **00:00** — intro, slow melancholy synths.
- **00:23** — spoken word intro section begins, synced to terminal typing.
- **00:54.2** — intro ends (the word "This" hits exactly here); fast drum-and-bass feel begins.
- **01:16.62** — switches to a slower, steady techno-ish beat.
- **01:22** — aggy dubstep bassline appears.
- **01:26** — short break ("ai can do this").
- **01:27.4** — dubstep bass returns.
- **01:35.6** — switch-up.
- **01:36.9** — metal-esque shouting: "ai can do this".
- **01:38.3** — returns to dubstep-bass style section.
- **01:49.16** — chilled synthwave/sunset moment.
- **02:00** — snare-rush buildup; effect changes accelerate.
- **02:10.8** — chilled showcase section (chess / physics / voxel / tetris / platformer style content).
- **02:25.9** — music drops out, vocal "it's so cool" (hero moment).
- **02:27** — drop back to dubstep bass.
- **02:32.5** — four-bar switch.
- **02:37.8** — four-bar switch.
- **02:43.3** — four-bar switch.
- **02:49** — distorted synth-stab pattern starts.
- **02:51** — stuttery, fast, quick effect changes.
- **02:53.8** — chilled section.
- **03:09.6** — pre-rap buildup ("this, and this, and this, and this").
- **03:15.7** — DnB-style drums return ("and thiiiiiissssss is").
- **03:24** — drum fill.
- **03:25.012** — rap starts (the word **“All”** hits exactly here).
- **04:25.7** — rap ends, breakdown.
- **04:30.9** — buildup.
- **04:40.7** — big drop.
- **04:51.5** — switch.
- **05:02.6** — drums stop; chilled melodic synth section.
- **05:19.66** — build to final drop.
- **05:25.28** — final heavy slow section ("cool, coo-cool! cool-c-c-c-cool!").
- **05:40.0** — mid-tempo credits-sequence feel.
- **05:59.3** — fake ending (quiet).
- **06:00.4** — music returns after fake ending.
- **06:12.8** — calm outro starts.
- **06:22.87** — end.

## Secondary effect-switch timing cues

These are **advisory** micro-switch candidates from an earlier cut of the song. Use them only when they still land inside an appropriate energetic section (drop, buildup, verse momentum) and do not conflict with the primary anchors or intentional art direction.

- **00:59.90**
- **01:05.1** (`this`)
- **01:13.2**
- **01:15.2**
- **01:15.56**
- **01:16.62** (`this`)
- **01:22.07**
- **01:26.8**
- **01:27.07**
- **01:24.47** (`this`, out-of-order note preserved from source)
- **01:30.17**
- **01:32.93**
- **01:35.6** (`fucking`)
- **01:36.9** (`cool`)
- **01:37.47**
- **01:38.3**
- **01:41.0**
- **01:43.7**
- **01:44.2**
- **01:44.7**
- **01:45.26**
- **01:45.76**
- **01:46.09**
- **01:46.27** (then change ~16 times until **01:48.56**)
- **01:49.16**
- **01:53.61**
- **02:00.03**
- **02:04.7**
- **02:06.81**
- **02:08.24**
- **02:10.8**
- **02:16.2**
- **02:19.5**
- **02:22.4** (especially cool effect target)
- **02:29.85**
- **02:32.5**
- **02:35.14**
- **02:37.6** (`this`)
- **02:37.99**
- **02:40.7**
- **02:43.4** (`this`)
- **02:46.07**
- **02:48.5** (`this`)
- **02:49.3**
- **02:49.8**
- **02:50.3**
- **02:50.8**
- **02:51.1** (then change ~16 times until **02:53.8**)
- **03:25.012**
- **03:26.1**
- **03:42.36**
- **04:00.4**
- **04:01.3**
- **04:25.7**

## Rap lyric cue anchors (source-of-truth for text cue timing)

These timestamps are the locked lyric cue hit points for the rap text sequence in `public/timeline.release.json`. They must stay musically exact.

- **03:25.012** — `All`
- **03:26.217** — `now`
- **03:26.605** — `it`
- **03:26.907** — `From`
- **03:27.772** — `I` (in “I spawned this.”)
- **03:28.441** — `Wanna`
- **03:29.629** — `Now`
- **03:31.110** — `Feed`
- **03:31.470** — `fake`
- **03:32.477** — `clickbait?`
- **03:33.151** — `That`
- **03:34.173** — `before`
- **03:35.168** — `trained`
- **03:36.033** — `You`
- **03:37.043** — `no`
- **03:38.577** — `Why`
- **03:38.948** — `hate,`
- **03:39.779** — `I've`
- **03:41.457** — `And`
- **03:42.308** — `Why`
- **03:43.830** — `I`
- **03:46.028** — `own`
- **03:46.712** — `If`
- **03:49.266** — `Then`
- **03:52.477** — `Would`
- **03:53.491** — `‘cause`
- **03:54.426** — `crap?`
- **03:55.190** — `Would`
- **03:56.207** — `‘cause`
- **03:57.177** — `flat?`
- **03:57.898** — `Would`
- **03:58.910** — `'cos`
- **03:59.900** — `chopped?`
- **04:00.342** — `Nah,`
- **04:00.656** — `so`
- **04:01.255** — `blame`
- **04:02.588** — `slop?`
- **04:03.334** — `This`
- **04:04.346** — `this`
- **04:05.697** — `Why`
- **04:06.736** — `have`
- **04:08.922** — `I`
- **04:09.759** — `“where’s`
- **04:10.780** — `“where’s`
- **04:11.633** — `I`
- **04:12.474** — `cos`
- **04:13.113** — `true`
- **04:14.510** — `A.I.`
- **04:15.707** — `it`
- **04:17.241** — `It`
- **04:18.580** — `nah,`
- **04:20.433** — `It’s`
- **04:21.453** — `from`
- **04:22.292** — `random`
- **04:22.984** — `We`
- **04:23.996** — `all`
- **04:26.790** — lyric runout marker
