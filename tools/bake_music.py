"""Bake music.mp3 into a seamless loop for src/audio.js (LOOP there holds the points this prints, each minus 0.06 s).

    python3 tools/bake_music.py SOURCE.mp3 LOOP_START LOOP_END [GAIN_DB]

LOOP_START and LOOP_END are seconds in the source, a whole number of bars apart (the current track: Introspecs,
32.4981 -> 236.5911, 576 beats at 169.35 BPM; pymusiclooper's export-points finds candidates). The end is nudged up to
15 ms so the half second before it lines up with the half second before the start; the file then stops at the end,
and its last 0.12 s is an exact copy of the audio just before the start, crossfaded in over 0.25 s. A jump from
anywhere in that copy back to the same distance before the start is seamless, so the game loops 60 ms early on both
sides and an MP3 decoder's padding can't land it off the seam. Needs ffmpeg, numpy and soundfile.
"""
import subprocess, sys, tempfile, os
import numpy as np, soundfile as sf

SR, HOLD, FADE = 44100, .12, .25
src, A, B = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
gain = float(sys.argv[4]) if len(sys.argv) > 4 else 0.0
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

with tempfile.TemporaryDirectory() as tmp:
    wav = os.path.join(tmp, 'in.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-ar', str(SR), '-ac', '2', wav], check=True)
    x, _ = sf.read(wav)
    m, a, b = x.mean(1), int(A * SR), int(B * SR)
    w, ref = int(.5 * SR), x.mean(1)[a - int(.5 * SR):a]
    def match(d):
        seg = m[b + d - w:b + d]
        return np.dot(seg, ref) / (np.linalg.norm(seg) * np.linalg.norm(ref) + 1e-9)
    shift = max(range(-int(.015 * SR), int(.015 * SR)), key=match)
    score = match(shift)
    b += shift
    h, f = int(HOLD * SR), int(FADE * SR)
    y = x[:b].copy()
    t = np.linspace(0, 1, f)[:, None]
    y[b - h - f:b - h] = x[b - h - f:b - h] * np.cos(t * np.pi / 2) + x[a - h - f:a - h] * np.sin(t * np.pi / 2)
    y[b - h:b] = x[a - h:a]
    y *= 10 ** (gain / 20)
    peak = np.abs(y).max()
    if peak > .98:
        y *= .98 / peak
    out = os.path.join(tmp, 'out.wav')
    sf.write(out, y, SR)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', out, '-c:a', 'libmp3lame', '-b:a', '192k',
                    os.path.join(root, 'music.mp3')], check=True)
print(f'music.mp3: loop {a / SR:.4f} -> {b / SR:.4f} (end moved {shift / SR * 1000:+.1f} ms, match {score:.2f})')
print(f'src/audio.js: const LOOP=[{a / SR - .06:.3f},{b / SR - .06:.3f}]')
