import { useEffect, useState } from "react";

import { useLocalStorage } from ".";
import { handTracker } from "../utils/handTracker";
import { GameSFX } from "../utils/sounds.js";
import { clearCanvas } from "../components/Canvas";

const MARGIN = 0.12;   // unused border of the camera view, so canvas edges are reachable
const SMOOTH = 0.5;    // 0..1, higher = more responsive, lower = steadier
const MIN_DIST = 3;    // px, ignore jitter smaller than this
const CLEAR_MS = 1000; // hold an open palm this long to clear
const FINGERS = [[8, 6], [12, 10], [16, 14], [20, 18]]; // [tip, pip] for index, middle, ring, pinky

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp01 = t => Math.min(1, Math.max(0, t));
// finger is extended when its tip is farther from the wrist than its middle joint (works at any hand rotation)
const extended = (lm, [tip, pip]) => dist(lm[tip], lm[0]) > dist(lm[pip], lm[0]);

function stroke(canvas, from, to) {
  const ctx = canvas.getContext("2d");
  ctx.strokeStyle = "#000000"; // same pen the mouse uses: the model expects black on white
  ctx.lineWidth = 12;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
}

function drawPreview(pv, video, lm, ratio) {
  if (!pv) return;
  const c = pv.getContext("2d");
  const W = pv.width, H = pv.height;
  c.drawImage(video, 0, 0, W, H);

  // the part of the camera view that maps onto the drawing box
  const half = (0.5 - MARGIN) / ratio;
  c.strokeStyle = "#81B29A";
  c.lineWidth = 2;
  c.strokeRect((0.5 - half) * W, MARGIN * H, 2 * half * W, (1 - 2 * MARGIN) * H);

  if (lm) {
    c.fillStyle = "#F9F6F0";
    lm.forEach(p => { c.beginPath(); c.arc(p.x * W, p.y * H, 3, 0, 7); c.fill(); });
  }
}

// Draw in the air:  1 finger = draw | 2 fingers = move without drawing | open palm (1s) = clear
export const useAirDrawing = ({ canvasRef, cursorRef, previewRef }) => {
  const [ soundOn ] = useLocalStorage("soundOn");
  const [ status, setStatus ] = useState(handTracker.isReady() ? "ready" : "loading"); // loading | ready | error

  useEffect(() => {
    let alive = true;
    let pen = null;        // last point drawn
    let smooth = null;     // smoothed fingertip, in canvas px
    let palmSince = null;

    const unsubscribe = handTracker.subscribe((results, video) => {
      const lm = results.multiHandLandmarks && results.multiHandLandmarks[0];
      const ratio = video.videoWidth / video.videoHeight || 4 / 3;
      drawPreview(previewRef.current, video, lm, ratio);

      const canvas = canvasRef.current;
      const cursor = cursorRef.current;
      if (!canvas || !cursor) return;

      const hide = () => { cursor.style.display = "none"; pen = smooth = null; };
      if (!lm) { palmSince = null; return hide(); }

      const [ idx, mid, rng, pnk ] = FINGERS.map(f => extended(lm, f));
      const mode =
        idx && !mid && !rng && !pnk ? "draw" :
        idx && mid && !rng && !pnk ? "move" :
        idx && mid && rng && pnk ? "clear" : "none";

      if (mode === "clear") {
        const now = Date.now();
        if (palmSince === null) palmSince = now;
        else if (now - palmSince > CLEAR_MS) {
          clearCanvas(canvasRef);
          GameSFX.play("clear", soundOn);
          palmSince = Infinity; // once per gesture
        }
      } else {
        palmSince = null;
      }
      if (mode === "none" || mode === "clear") return hide();

      // fingertip -> canvas: mirror x, crop the camera view to a square, apply margin
      const tip = lm[8];
      const u = 0.5 + ((1 - tip.x) - 0.5) * ratio;
      const rect = canvas.getBoundingClientRect();
      const displayX = clamp01((u - MARGIN) / (1 - 2 * MARGIN)) * rect.width;
      const displayY = clamp01((tip.y - MARGIN) / (1 - 2 * MARGIN)) * rect.height;
      const target = {
        x: displayX * canvas.width / rect.width,
        y: displayY * canvas.height / rect.height
      };
      smooth = smooth
        ? { x: smooth.x + (target.x - smooth.x) * SMOOTH, y: smooth.y + (target.y - smooth.y) * SMOOTH }
        : target;

      cursor.style.display = "block";
      cursor.style.left = smooth.x * rect.width / canvas.width + "px";
      cursor.style.top = smooth.y * rect.height / canvas.height + "px";
      cursor.style.borderColor = mode === "draw" ? "#E07A5F" : "#81B29A";

      if (mode === "draw") {
        if (!pen || dist(pen, smooth) > MIN_DIST) {
          stroke(canvas, pen || smooth, smooth); // first point = a dot
          pen = { ...smooth };
        }
      } else {
        pen = null; // pen up
      }
    });

    handTracker.start()
      .then(() => { if (alive) setStatus("ready"); })
      .catch(e => { console.warn("AirSketch:", e); if (alive) setStatus("error"); });

    return () => { alive = false; unsubscribe(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status };
};
