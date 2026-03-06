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
/*  Config                                                             */
/* ------------------------------------------------------------------ */
const GAME_CONFIG = {
  easy:   { numPoses: 4, poseTime: 15, matchThreshold: 0.65, fillRate: 90,  drainRate: 60  },
  medium: { numPoses: 5, poseTime: 12, matchThreshold: 0.70, fillRate: 100, drainRate: 70  },
  hard:   { numPoses: 6, poseTime: 9,  matchThreshold: 0.75, fillRate: 110, drainRate: 80  },
};

/* ------------------------------------------------------------------ */
/*  Pose definitions                                                   */
/* ------------------------------------------------------------------ */
interface Lm { x: number; y: number; z: number; visibility?: number }

interface PoseChallenge {
  id: string;
  name: string;
  emoji: string;
  instruction: string;
  check: (lm: Lm[]) => number;   // returns 0‑1 match score
}

const ALL_POSES: PoseChallenge[] = [
  {
    id: "hands-up",
    name: "Руки вверх!",
    emoji: "🙌",
    instruction: "Подними обе руки высоко вверх!",
    check: (lm) => {
      const nose = lm[0], lw = lm[15], rw = lm[16];
      if (!nose || !lw || !rw) return 0;
      let s = 0;
      if (lw.y < nose.y - 0.05) s += 0.5;
      if (rw.y < nose.y - 0.05) s += 0.5;
      return s;
    },
  },
  {
    id: "t-pose",
    name: "Самолётик!",
    emoji: "✈️",
    instruction: "Расправь руки в стороны как самолёт!",
    check: (lm) => {
      const ls = lm[11], rs = lm[12], lw = lm[15], rw = lm[16];
      if (!ls || !rs || !lw || !rw) return 0;
      const sw = Math.abs(rs.x - ls.x);
      const aw = Math.abs(rw.x - lw.x);
      let s = 0;
      if (aw > sw * 1.8) s += 0.5;
      if (Math.abs(lw.y - ls.y) < 0.15 && Math.abs(rw.y - rs.y) < 0.15) s += 0.5;
      return s;
    },
  },
  {
    id: "hands-head",
    name: "Руки на голову!",
    emoji: "🤯",
    instruction: "Положи обе руки себе на голову!",
    check: (lm) => {
      const nose = lm[0], lw = lm[15], rw = lm[16];
      if (!nose || !lw || !rw) return 0;
      const ld = Math.hypot(lw.x - nose.x, lw.y - nose.y);
      const rd = Math.hypot(rw.x - nose.x, rw.y - nose.y);
      let s = 0;
      if (ld < 0.18) s += 0.5;
      if (rd < 0.18) s += 0.5;
      return s;
    },
  },
  {
    id: "wave",
    name: "Помаши рукой!",
    emoji: "👋",
    instruction: "Подними и помаши любой рукой!",
    check: (lm) => {
      const ls = lm[11], rs = lm[12], lw = lm[15], rw = lm[16];
      if (!ls || !rs || !lw || !rw) return 0;
      if (lw.y < ls.y - 0.15 || rw.y < rs.y - 0.15) return 1;
      if (lw.y < ls.y - 0.05 || rw.y < rs.y - 0.05) return 0.5;
      return 0;
    },
  },
  {
    id: "hands-hips",
    name: "Супергерой!",
    emoji: "🦸",
    instruction: "Поставь руки на пояс как супергерой!",
    check: (lm) => {
      const lh = lm[23], rh = lm[24], lw = lm[15], rw = lm[16];
      if (!lh || !rh || !lw || !rw) return 0;
      const ld = Math.hypot(lw.x - lh.x, lw.y - lh.y);
      const rd = Math.hypot(rw.x - rh.x, rw.y - rh.y);
      let s = 0;
      if (ld < 0.18) s += 0.5;
      if (rd < 0.18) s += 0.5;
      return s;
    },
  },
  {
    id: "hands-together",
    name: "Хлопай!",
    emoji: "👏",
    instruction: "Сложи ладони вместе перед собой!",
    check: (lm) => {
      const lw = lm[15], rw = lm[16];
      if (!lw || !rw) return 0;
      const d = Math.hypot(lw.x - rw.x, lw.y - rw.y);
      if (d < 0.08) return 1;
      if (d < 0.15) return 0.5;
      return 0;
    },
  },
];

/* Skeleton connections for drawing */
const SKELETON_CONNECTIONS: [number, number, string][] = [
  // [fromIdx, toIdx, color]
  [11, 12, "#00FFAA"],   // shoulders
  [11, 13, "#00DDFF"],   // left upper arm
  [13, 15, "#00DDFF"],   // left forearm
  [12, 14, "#FF88DD"],   // right upper arm
  [14, 16, "#FF88DD"],   // right forearm
  [11, 23, "#88FF88"],   // left torso
  [12, 24, "#88FF88"],   // right torso
  [23, 24, "#88FF88"],   // hips
  [23, 25, "#AAAAFF"],   // left thigh
  [25, 27, "#AAAAFF"],   // left shin
  [24, 26, "#FFAAFF"],   // right thigh
  [26, 28, "#FFAAFF"],   // right shin
];

const JOINT_INDICES = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];

type Phase = "loading" | "camera-error" | "ready" | "countdown" | "playing";

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */
export default function PoseMatchGame({ difficulty, onComplete, onExit }: Props) {
  const config = GAME_CONFIG[difficulty];

  /* refs */
  const videoRef         = useRef<HTMLVideoElement>(null);
  const canvasRef        = useRef<HTMLCanvasElement>(null);
  const poseLandmarkerRef = useRef<any>(null);
  const animFrameRef     = useRef(0);
  const streamRef        = useRef<MediaStream | null>(null);
  const onCompleteRef    = useRef(onComplete);
  const configRef        = useRef(config);

  /* mutable game state */
  const gs = useRef({
    poses: [] as PoseChallenge[],
    poseIdx: 0,
    matchProgress: 0,         // 0‑100
    poseTimeLeft: 0,
    posePhase: "active" as "active" | "success" | "fail" | "transition",
    phaseTimer: 0,
    score: 0,
    matched: 0,
    landmarks: null as Lm[] | null,
    startT: 0,
    lastFrame: 0,
  });

  /* React state */
  const [phase, setPhase]           = useState<Phase>("loading");
  const [countdown, setCountdown]   = useState(3);
  const [errorMsg, setErrorMsg]     = useState("");
  const [displayInfo, setDisplayInfo] = useState({
    poseIdx: 0, total: 0, timeLeft: 0, score: 0, matched: 0,
    progress: 0, poseName: "", poseEmoji: "", poseInstruction: "",
    posePhase: "active" as string,
  });

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { configRef.current = config; }, [config]);

  /* ────────────────────────────────────────────────────────────────── */
  /*  1. Init MediaPipe Pose + Camera                                  */
  /* ────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { PoseLandmarker, FilesetResolver } =
          await import("@mediapipe/tasks-vision");
        if (cancelled) return;

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
        );
        if (cancelled) return;

        const pl = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        });
        if (cancelled) return;
        poseLandmarkerRef.current = pl;

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
          setErrorMsg(err instanceof Error ? err.message : "Camera init failed");
          setPhase("camera-error");
        }
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      poseLandmarkerRef.current?.close();
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  /* ────────────────────────────────────────────────────────────────── */
  /*  2. Countdown                                                     */
  /* ────────────────────────────────────────────────────────────────── */
  const startGame = useCallback(() => {
    setPhase("countdown");
    setCountdown(3);

    // pick random poses
    const shuffled = [...ALL_POSES].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, configRef.current.numPoses);
    const s = gs.current;
    s.poses = selected;
    s.poseIdx = 0;
    s.matchProgress = 0;
    s.poseTimeLeft = configRef.current.poseTime;
    s.posePhase = "active";
    s.phaseTimer = 0;
    s.score = 0;
    s.matched = 0;
    s.landmarks = null;

    let c = 3;
    const iv = setInterval(() => {
      c -= 1;
      if (c <= 0) {
        clearInterval(iv);
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
    s.poseTimeLeft = cf.poseTime;
    s.matchProgress = 0;
    s.posePhase = "active";

    let alive = true;
    let displayTick = 0;

    function loop(now: number) {
      if (!alive) return;

      const dt = Math.min((now - s.lastFrame) / 1000, 0.1);
      s.lastFrame = now;

      const video  = videoRef.current;
      const canvas = canvasRef.current;
      const pl     = poseLandmarkerRef.current;
      if (!video || !canvas || !pl) {
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      if (video.videoWidth && canvas.width !== video.videoWidth) {
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const ctx = canvas.getContext("2d")!;
      const W   = canvas.width  || 640;
      const H   = canvas.height || 480;
      const curPose = s.poses[s.poseIdx];

      /* ── pose detection ── */
      if (video.readyState >= 2) {
        try {
          const res = pl.detectForVideo(video, now);
          s.landmarks = res.landmarks?.length ? res.landmarks[0] : null;
        } catch { /* swallow */ }
      }

      /* ── game logic by posePhase ── */
      if (s.posePhase === "active" && curPose) {
        s.poseTimeLeft -= dt;

        // check pose match
        if (s.landmarks) {
          const matchScore = curPose.check(s.landmarks);
          if (matchScore >= cf.matchThreshold) {
            s.matchProgress = Math.min(100, s.matchProgress + cf.fillRate * dt);
          } else {
            s.matchProgress = Math.max(0, s.matchProgress - cf.drainRate * dt);
          }
        } else {
          s.matchProgress = Math.max(0, s.matchProgress - cf.drainRate * dt * 0.5);
        }

        // matched!
        if (s.matchProgress >= 100) {
          s.posePhase = "success";
          s.phaseTimer = 1.5;
          const timeBonus = Math.round((s.poseTimeLeft / cf.poseTime) * 10);
          s.score += 20 + timeBonus;
          s.matched++;
        }
        // time out
        else if (s.poseTimeLeft <= 0) {
          s.posePhase = "fail";
          s.phaseTimer = 1.2;
        }
      } else if (s.posePhase === "success" || s.posePhase === "fail") {
        s.phaseTimer -= dt;
        if (s.phaseTimer <= 0) {
          // advance pose
          s.poseIdx++;
          if (s.poseIdx >= s.poses.length) {
            // game over
            alive = false;
            const duration = Math.ceil((now - s.startT) / 1000);
            onCompleteRef.current({
              score:          s.score,
              maxScore:       s.poses.length * 30,
              correctAnswers: s.matched,
              totalQuestions:  s.poses.length,
              duration,
            });
            return;
          }
          s.posePhase = "active";
          s.matchProgress = 0;
          s.poseTimeLeft = cf.poseTime;
        }
      }

      /* ── throttled React display updates ── */
      displayTick += dt;
      if (displayTick > 0.15) {
        displayTick = 0;
        const cp = s.poses[s.poseIdx];
        setDisplayInfo({
          poseIdx:  s.poseIdx,
          total:    s.poses.length,
          timeLeft: Math.max(0, Math.ceil(s.poseTimeLeft)),
          score:    s.score,
          matched:  s.matched,
          progress: Math.round(s.matchProgress),
          poseName: cp?.name ?? "",
          poseEmoji: cp?.emoji ?? "",
          poseInstruction: cp?.instruction ?? "",
          posePhase: s.posePhase,
        });
      }

      /* ═══════════════════ DRAW ═══════════════════ */
      ctx.clearRect(0, 0, W, H);

      // camera (mirrored)
      ctx.save();
      ctx.translate(W, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, W, H);
      ctx.restore();

      ctx.fillStyle = "rgba(0,0,0,0.1)";
      ctx.fillRect(0, 0, W, H);

      /* ── skeleton ── */
      if (s.landmarks) {
        const lm = s.landmarks;
        // connections
        for (const [a, b, color] of SKELETON_CONNECTIONS) {
          const la = lm[a], lb = lm[b];
          if (!la || !lb) continue;
          const ax = (1 - la.x) * W, ay = la.y * H;
          const bx = (1 - lb.x) * W, by = lb.y * H;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.strokeStyle = color;
          ctx.lineWidth = 4;
          ctx.lineCap = "round";
          ctx.stroke();
        }
        // joints
        for (const idx of JOINT_INDICES) {
          const l = lm[idx];
          if (!l) continue;
          const jx = (1 - l.x) * W, jy = l.y * H;
          ctx.beginPath();
          ctx.arc(jx, jy, 6, 0, Math.PI * 2);
          ctx.fillStyle = "#FFFF00";
          ctx.fill();
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      /* ── pose instruction overlay (top) ── */
      if (curPose) {
        // background bar
        pill(ctx, W / 2 - 180, 8, 360, 56, "rgba(0,0,0,0.55)");

        // progress ring
        const cx = W / 2 - 140;
        const cy = 36;
        const radius = 18;
        // background
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 5;
        ctx.stroke();
        // progress arc
        const startAngle = -Math.PI / 2;
        const endAngle   = startAngle + (Math.PI * 2 * s.matchProgress / 100);
        ctx.beginPath();
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.strokeStyle = s.matchProgress > 75 ? "#00FF88" : s.matchProgress > 40 ? "#FFFF00" : "#FF8800";
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.stroke();
        // emoji in center
        ctx.font = "22px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(curPose.emoji, cx, cy);

        // pose name
        ctx.font = "bold 20px sans-serif";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "left";
        ctx.fillText(curPose.name, cx + 30, 30);

        // instruction
        ctx.font = "14px sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fillText(curPose.instruction, cx + 30, 50);
      }

      /* ── timer ── */
      const tl = Math.max(0, Math.ceil(s.poseTimeLeft));
      const timerColor = tl <= 3 ? "rgba(255,50,50,0.7)" : "rgba(0,0,0,0.5)";
      pill(ctx, W - 85, 8, 75, 36, timerColor);
      ctx.font = "bold 18px sans-serif";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`⏱ ${tl}с`, W - 48, 28);

      /* ── score & count ── */
      pill(ctx, 10, 8, 100, 36, "rgba(0,0,0,0.5)");
      ctx.fillText(`⭐ ${s.score}`, 60, 28);
      pill(ctx, 10, 50, 100, 30, "rgba(0,0,0,0.4)");
      ctx.font = "bold 14px sans-serif";
      ctx.fillText(`🎯 ${s.poseIdx + 1}/${s.poses.length}`, 60, 66);

      /* ── match progress bar (bottom) ── */
      const barY = H - 30;
      const barW = W - 40;
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(20, barY, barW, 16);
      const prog = s.matchProgress / 100;
      const barColor = prog > 0.75 ? "#00FF88" : prog > 0.4 ? "#FFFF00" : "#FF8800";
      ctx.fillStyle = barColor;
      ctx.fillRect(20, barY, barW * prog, 16);
      // border
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(20, barY, barW, 16);

      /* ── success / fail flash ── */
      if (s.posePhase === "success") {
        const alpha = Math.min(1, s.phaseTimer / 1.5) * 0.3;
        ctx.fillStyle = `rgba(0,255,100,${alpha})`;
        ctx.fillRect(0, 0, W, H);
        ctx.font = "bold 60px sans-serif";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("✅ Отлично!", W / 2, H / 2);
      }
      if (s.posePhase === "fail") {
        const alpha = Math.min(1, s.phaseTimer / 1.2) * 0.3;
        ctx.fillStyle = `rgba(255,50,0,${alpha})`;
        ctx.fillRect(0, 0, W, H);
        ctx.font = "bold 48px sans-serif";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("⏰ Время вышло!", W / 2, H / 2);
      }

      /* ── no body warning ── */
      if (!s.landmarks && s.posePhase === "active") {
        pill(ctx, W / 2 - 140, H / 2 + 40, 280, 44, "rgba(255,120,0,0.75)");
        ctx.font = "bold 16px sans-serif";
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🧍 Встань так, чтобы тебя было видно!", W / 2, H / 2 + 62);
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
    <div className="fixed inset-0 bg-gradient-to-b from-teal-950 to-emerald-950 flex items-center justify-center overflow-hidden">
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

      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className={phase === "playing" ? "max-w-full max-h-full rounded-lg" : "hidden"}
      />

      {/* ── Loading ── */}
      {phase === "loading" && (
        <div className="text-center text-white z-10">
          <div className="text-7xl mb-6 animate-bounce-gentle">🧍</div>
          <h2 className="font-display text-3xl font-bold mb-2">Загружаем AI...</h2>
          <p className="text-white/60 mb-4">Подготовка камеры и распознавания позы</p>
          <div className="w-48 h-2 bg-white/20 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full animate-pulse" style={{ width: "55%" }} />
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
          <button onClick={onExit} className="px-8 py-3 bg-white/20 rounded-full hover:bg-white/30 transition font-semibold">
            ← Назад
          </button>
        </div>
      )}

      {/* ── Ready ── */}
      {phase === "ready" && (
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10 p-6">
          <div className="text-7xl mb-4 animate-float">🧍</div>
          <h2 className="font-display text-4xl font-bold text-white mb-2">Повтори Позу!</h2>
          <p className="text-white/80 text-lg mb-1">Покажи позу которую просит экран!</p>
          <p className="text-white/50 text-sm mb-8 max-w-xs text-center">
            Встань перед камерой в полный рост. Повторяй позы, которые появляются на экране! 🏃
          </p>
          <div className="flex gap-4">
            <button onClick={onExit} className="px-6 py-3 bg-white/20 text-white rounded-full hover:bg-white/30 transition font-semibold">
              ← Назад
            </button>
            <button onClick={startGame} className="px-8 py-3 bg-emerald-500 text-white font-bold rounded-full hover:bg-emerald-400 transition shadow-lg text-lg">
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
          <p className="text-white/70 text-xl mt-4">Встань перед камерой! 🧍</p>
        </div>
      )}

      {/* ── Exit + HUD during play ── */}
      {phase === "playing" && (
        <>
          <button
            onClick={onExit}
            className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition text-lg"
          >✕</button>

          {/* React‑side HUD overlay */}
          <div className="absolute bottom-12 left-0 right-0 z-20 flex justify-center">
            <div className="bg-black/50 backdrop-blur-sm rounded-2xl px-6 py-3 flex items-center gap-4 text-white text-sm font-semibold">
              <span>⭐ {displayInfo.score}</span>
              <span className="text-white/40">|</span>
              <span>🎯 {displayInfo.matched}/{displayInfo.total}</span>
              <span className="text-white/40">|</span>
              <span className={displayInfo.timeLeft <= 3 ? "text-red-400 animate-pulse" : ""}>
                ⏱ {displayInfo.timeLeft}с
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper                                                             */
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

