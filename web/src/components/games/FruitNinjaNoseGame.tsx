"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Difficulty } from "@/types";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface Props {
  difficulty: Difficulty;
  onComplete: (result: {
    score: number;
    maxScore: number;
    correctAnswers: number;
    totalQuestions: number;
    duration: number;
  }) => void;
  onExit: () => void;
}

/* ------------------------------------------------------------------ */
/*  Config per difficulty                                              */
/* ------------------------------------------------------------------ */
const GAME_CONFIG = {
  easy:   { duration: 45, spawnInterval: 2000, fallSpeed: 0.12, bombChance: 0,    fruitSize: 52 },
  medium: { duration: 40, spawnInterval: 1500, fallSpeed: 0.17, bombChance: 0.10, fruitSize: 48 },
  hard:   { duration: 35, spawnInterval: 1000, fallSpeed: 0.24, bombChance: 0.18, fruitSize: 44 },
};

const FRUIT_EMOJIS = ["🍎", "🍊", "🍋", "🍇", "🍉", "🍌", "🍑", "🍓", "🥝", "🍐"];

/* ------------------------------------------------------------------ */
/*  Internal types                                                     */
/* ------------------------------------------------------------------ */
interface FruitObj {
  id: number;
  x: number;   // 0‑1
  y: number;   // 0‑1
  emoji: string;
  speed: number;
  isBomb: boolean;
  sliced: boolean;
  size: number;
  wobble: number;
}

interface SliceEffect {
  id: number;
  x: number;
  y: number;
  emoji: string;
  age: number;
  isBomb: boolean;
}

type Phase = "loading" | "camera-error" | "ready" | "countdown" | "playing";

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */
export default function FruitNinjaNoseGame({ difficulty, onComplete, onExit }: Props) {
  const config = GAME_CONFIG[difficulty];

  /* refs ------------------------------------------------------------ */
  const videoRef          = useRef<HTMLVideoElement>(null);
  const canvasRef         = useRef<HTMLCanvasElement>(null);
  const faceLandmarkerRef = useRef<any>(null);       // MediaPipe FaceLandmarker
  const animFrameRef      = useRef(0);
  const streamRef         = useRef<MediaStream | null>(null);
  const onCompleteRef     = useRef(onComplete);
  const configRef         = useRef(config);

  /* mutable game state (never triggers re‑render) ------------------- */
  const gs = useRef({
    fruits:    [] as FruitObj[],
    effects:   [] as SliceEffect[],
    noseX: 0.5,
    noseY: 0.5,
    noseOk: false,
    trail: [] as { x: number; y: number; t: number }[],
    score: 0,
    sliced: 0,
    missed: 0,
    spawned: 0,        // total non‑bomb fruits spawned
    nextId: 0,
    lastSpawn: 0,
    startT: 0,
    lastFrame: 0,
  });

  /* react state (for overlay UI) ------------------------------------ */
  const [phase, setPhase]             = useState<Phase>("loading");
  const [displayScore, setDisplayScore] = useState(0);
  const [displayTime, setDisplayTime] = useState(config.duration);
  const [countdown, setCountdown]     = useState(3);
  const [errorMsg, setErrorMsg]       = useState("");

  // keep refs fresh
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { configRef.current = config; }, [config]);

  /* ────────────────────────────────────────────────────────────────── */
  /*  1. Initialise MediaPipe + Camera                                 */
  /* ────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // dynamic import avoids SSR crash
        const { FaceLandmarker, FilesetResolver } =
          await import("@mediapipe/tasks-vision");
        if (cancelled) return;

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
        );
        if (cancelled) return;

        const fl = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
        });
        if (cancelled) return;
        faceLandmarkerRef.current = fl;

        // camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;

        const vid = videoRef.current;
        if (vid) { vid.srcObject = stream; await vid.play(); }

        setPhase("ready");
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Camera init failed";
          setErrorMsg(msg);
          setPhase("camera-error");
        }
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      faceLandmarkerRef.current?.close();
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  /* ────────────────────────────────────────────────────────────────── */
  /*  2. Countdown → playing                                           */
  /* ────────────────────────────────────────────────────────────────── */
  const startGame = useCallback(() => {
    setPhase("countdown");
    setCountdown(3);

    let c = 3;
    const iv = setInterval(() => {
      c -= 1;
      if (c <= 0) {
        clearInterval(iv);
        // reset mutable state
        const s = gs.current;
        s.fruits = []; s.effects = []; s.trail = [];
        s.score = 0; s.sliced = 0; s.missed = 0; s.spawned = 0;
        setDisplayScore(0);
        setDisplayTime(configRef.current.duration);
        setPhase("playing");
      } else {
        setCountdown(c);
      }
    }, 1000);
  }, []);

  /* ────────────────────────────────────────────────────────────────── */
  /*  3. Main game loop                                                */
  /* ────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (phase !== "playing") return;

    const s  = gs.current;
    const cf = configRef.current;
    s.startT    = performance.now();
    s.lastFrame = performance.now();
    s.lastSpawn = performance.now();

    let alive = true;
    let displayTick = 0;           // throttle setState

    function loop(now: number) {
      if (!alive) return;

      const dt = Math.min((now - s.lastFrame) / 1000, 0.1);
      s.lastFrame = now;

      const elapsed   = (now - s.startT) / 1000;
      const remaining = cf.duration - elapsed;

      /* throttled React updates (~5 Hz) */
      displayTick += dt;
      if (displayTick > 0.2) {
        displayTick = 0;
        setDisplayTime(Math.max(0, Math.ceil(remaining)));
        setDisplayScore(s.score);
      }

      /* ── time's up ── */
      if (remaining <= 0) {
        alive = false;
        onCompleteRef.current({
          score:          s.score,
          maxScore:       Math.max(s.spawned * 10, 10),
          correctAnswers: s.sliced,
          totalQuestions:  s.spawned,
          duration:       Math.ceil(elapsed),
        });
        return;
      }

      const video  = videoRef.current;
      const canvas = canvasRef.current;
      const fl     = faceLandmarkerRef.current;
      if (!video || !canvas || !fl) {
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      // match canvas to actual video resolution
      if (video.videoWidth && canvas.width !== video.videoWidth) {
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const ctx = canvas.getContext("2d")!;
      const W   = canvas.width  || 640;
      const H   = canvas.height || 480;

      /* ── face detection ── */
      if (video.readyState >= 2) {
        try {
          const res = fl.detectForVideo(video, now);
          if (res.faceLandmarks?.length) {
            const nose = res.faceLandmarks[0][4]; // nose tip
            s.noseX  = 1 - nose.x;               // mirror
            s.noseY  = nose.y;
            s.noseOk = true;
            s.trail.push({ x: s.noseX, y: s.noseY, t: now });
            if (s.trail.length > 20) s.trail.shift();
          } else {
            s.noseOk = false;
          }
        } catch { /* swallow */ }
      }

      /* ── spawn ── */
      if (now - s.lastSpawn > cf.spawnInterval) {
        s.lastSpawn = now;
        const bomb = Math.random() < cf.bombChance;
        s.fruits.push({
          id: s.nextId++,
          x: 0.08 + Math.random() * 0.84,
          y: -0.08,
          emoji: bomb ? "💣" : FRUIT_EMOJIS[Math.floor(Math.random() * FRUIT_EMOJIS.length)],
          speed: cf.fallSpeed * (0.85 + Math.random() * 0.30),
          isBomb: bomb,
          sliced: false,
          size: cf.fruitSize,
          wobble: Math.random() * Math.PI * 2,
        });
        if (!bomb) s.spawned++;
      }

      /* ── update fruits ── */
      for (let i = s.fruits.length - 1; i >= 0; i--) {
        const f = s.fruits[i];
        f.y += f.speed * dt;
        f.wobble += 2.5 * dt;

        // collision with nose
        if (!f.sliced && s.noseOk) {
          const dx = s.noseX - f.x;
          const dy = s.noseY - f.y;
          if (Math.sqrt(dx * dx + dy * dy) < 0.07) {
            f.sliced = true;
            if (f.isBomb) {
              s.score = Math.max(0, s.score - 15);
              s.effects.push({ id: s.nextId++, x: f.x, y: f.y, emoji: "💥", age: 0, isBomb: true });
            } else {
              s.score += 10;
              s.sliced++;
              s.effects.push({ id: s.nextId++, x: f.x, y: f.y, emoji: f.emoji, age: 0, isBomb: false });
            }
            s.fruits.splice(i, 1);
            continue;
          }
        }
        // off-screen
        if (f.y > 1.15) {
          if (!f.sliced && !f.isBomb) s.missed++;
          s.fruits.splice(i, 1);
        }
      }

      /* ── update effects ── */
      for (let i = s.effects.length - 1; i >= 0; i--) {
        s.effects[i].age += dt;
        if (s.effects[i].age > 0.6) s.effects.splice(i, 1);
      }

      /* ── prune trail ── */
      s.trail = s.trail.filter((p) => now - p.t < 300);

      /* ═══════════════════ DRAW ═══════════════════ */
      ctx.clearRect(0, 0, W, H);

      // camera feed (mirrored)
      ctx.save();
      ctx.translate(W, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, W, H);
      ctx.restore();

      // subtle overlay so game elements pop
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      ctx.fillRect(0, 0, W, H);

      // ── nose trail ──
      if (s.trail.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255,255,100,0.5)";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        for (let i = 0; i < s.trail.length; i++) {
          const p = s.trail[i];
          if (i === 0) ctx.moveTo(p.x * W, p.y * H);
          else ctx.lineTo(p.x * W, p.y * H);
        }
        ctx.stroke();
      }

      // ── nose cursor ──
      if (s.noseOk) {
        const nx = s.noseX * W;
        const ny = s.noseY * H;
        ctx.beginPath(); ctx.arc(nx, ny, 22, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,0,0.15)"; ctx.fill();
        ctx.beginPath(); ctx.arc(nx, ny, 12, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,0,0.7)"; ctx.fill();
        ctx.strokeStyle = "#FFA500"; ctx.lineWidth = 2; ctx.stroke();
      }

      // ── fruits ──
      for (const f of s.fruits) {
        const fx = f.x * W + Math.sin(f.wobble) * 4;
        const fy = f.y * H;
        ctx.save();
        ctx.shadowColor  = "rgba(0,0,0,0.35)";
        ctx.shadowBlur   = 8;
        ctx.shadowOffsetY = 4;
        ctx.font         = `${f.size}px serif`;
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(f.emoji, fx, fy);
        ctx.restore();
      }

      // ── slice effects ──
      for (const e of s.effects) {
        const ex = e.x * W;
        const ey = e.y * H;
        const p  = e.age / 0.6;           // 0→1 progress
        ctx.save();
        ctx.globalAlpha = 1 - p;
        if (e.isBomb) {
          ctx.font = `${60 + p * 20}px serif`;
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText("💥", ex, ey);
        } else {
          // score popup
          ctx.font      = "bold 24px sans-serif";
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.strokeStyle = "black"; ctx.lineWidth = 3;
          ctx.strokeText("+10", ex, ey - 30 * p);
          ctx.fillStyle = "#00FF00";
          ctx.fillText("+10", ex, ey - 30 * p);
          // sparkles
          for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2 + p * 2;
            const d = p * 35;
            ctx.font = "16px serif";
            ctx.fillText("✨", ex + Math.cos(a) * d, ey + Math.sin(a) * d);
          }
        }
        ctx.restore();
      }

      // ── HUD ──
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      ctx.font         = "bold 18px sans-serif";

      // score pill
      pill(ctx, W / 2 - 60, 10, 120, 36, "rgba(0,0,0,0.5)");
      ctx.fillStyle = "#fff";
      ctx.fillText(`⭐ ${s.score}`, W / 2, 30);

      // timer pill
      const timerBg = remaining < 10 ? "rgba(255,50,50,0.6)" : "rgba(0,0,0,0.5)";
      pill(ctx, W - 95, 10, 85, 36, timerBg);
      ctx.fillStyle = "#fff";
      ctx.fillText(`⏱ ${Math.ceil(remaining)}с`, W - 52, 30);

      // fruit count
      pill(ctx, 10, 10, 85, 36, "rgba(0,0,0,0.5)");
      ctx.fillStyle = "#fff";
      ctx.fillText(`🍎 ${s.sliced}`, 52, 30);

      // "show face" warning
      if (!s.noseOk) {
        pill(ctx, W / 2 - 130, H / 2 - 22, 260, 44, "rgba(255,120,0,0.75)");
        ctx.font = "bold 16px sans-serif";
        ctx.fillStyle = "#fff";
        ctx.fillText("👃 Покажи лицо камере!", W / 2, H / 2);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    }

    animFrameRef.current = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(animFrameRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /* ────────────────────────────────────────────────────────────────── */
  /*  Render                                                           */
  /* ────────────────────────────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-indigo-950 to-purple-950 flex items-center justify-center overflow-hidden">
      {/* video — always in DOM */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={
          phase === "ready" || phase === "countdown"
            ? "absolute inset-0 w-full h-full object-cover"
            : "fixed top-0 left-0 w-px h-px opacity-0"
        }
        style={{ transform: "scaleX(-1)" }}
      />

      {/* game canvas */}
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className={phase === "playing" ? "max-w-full max-h-full rounded-lg" : "hidden"}
      />

      {/* ── Loading ── */}
      {phase === "loading" && (
        <div className="text-center text-white z-10">
          <div className="text-7xl mb-6 animate-bounce-gentle">📸</div>
          <h2 className="font-display text-3xl font-bold mb-2">Загружаем AI...</h2>
          <p className="text-white/60 mb-4">Подготовка камеры и отслеживания лица</p>
          <div className="w-48 h-2 bg-white/20 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-yellow-400 rounded-full animate-pulse" style={{ width: "60%" }} />
          </div>
        </div>
      )}

      {/* ── Camera error ── */}
      {phase === "camera-error" && (
        <div className="text-center text-white z-10 p-6">
          <div className="text-7xl mb-6">📷❌</div>
          <h2 className="font-display text-3xl font-bold mb-2">Камера недоступна</h2>
          <p className="text-white/60 mb-2 max-w-sm">{errorMsg}</p>
          <p className="text-white/40 text-sm mb-6">Разреши доступ к камере в настройках браузера</p>
          <button
            onClick={onExit}
            className="px-8 py-3 bg-white/20 rounded-full hover:bg-white/30 transition font-semibold"
          >← Назад</button>
        </div>
      )}

      {/* ── Ready ── */}
      {phase === "ready" && (
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10 p-6">
          <div className="text-7xl mb-4 animate-float">🍎</div>
          <h2 className="font-display text-4xl font-bold text-white mb-2">Фруктовый Ниндзя</h2>
          <p className="text-white/80 text-lg mb-1">Разрезай фрукты носом! 👃</p>
          <p className="text-white/50 text-sm mb-8 max-w-xs text-center">
            Двигай головой, чтобы навести нос на падающие фрукты. Не трогай бомбы! 💣
          </p>
          <div className="flex gap-4">
            <button onClick={onExit} className="px-6 py-3 bg-white/20 text-white rounded-full hover:bg-white/30 transition font-semibold">
              ← Назад
            </button>
            <button onClick={startGame} className="px-8 py-3 bg-yellow-500 text-black font-bold rounded-full hover:bg-yellow-400 transition shadow-lg text-lg">
              🚀 Начать!
            </button>
          </div>
        </div>
      )}

      {/* ── Countdown ── */}
      {phase === "countdown" && (
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center z-10">
          <div className="text-[10rem] font-display font-bold text-white drop-shadow-lg animate-pop" key={countdown}>
            {countdown}
          </div>
          <p className="text-white/70 text-xl mt-4">Приготовься! 🍎</p>
        </div>
      )}

      {/* ── Exit button (during play) ── */}
      {phase === "playing" && (
        <>
          <button
            onClick={onExit}
            className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition text-lg"
          >✕</button>
          {/* live HUD (React‑side, throttled) */}
          <div className="absolute top-4 right-4 z-20 flex gap-2 text-white text-sm font-semibold">
            <span className="bg-black/50 px-3 py-1 rounded-full">⭐ {displayScore}</span>
            <span className={`px-3 py-1 rounded-full ${displayTime <= 10 ? "bg-red-600/70 animate-pulse" : "bg-black/50"}`}>
              ⏱ {displayTime}с
            </span>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper: rounded‑rect pill                                          */
/* ------------------------------------------------------------------ */
function pill(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  fill: string,
) {
  const r = h / 2;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

