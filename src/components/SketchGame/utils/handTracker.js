// Webcam + MediaPipe Hands, kept alive between rounds (GameRound remounts every round).

let listeners = new Set();
let startPromise = null;
let session = 0;
let ready = false;
let stream = null;
let hands = null;
let rafId = null;

export const handTracker = {
  isReady: () => ready,

  // fn(results, videoElement) is called for every processed frame
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  // idempotent: a failure (e.g. camera denied) is cached until stop(), so it won't re-prompt every round
  start() {
    if (startPromise) return startPromise;
    const mySession = ++session;

    startPromise = (async () => {
      if (!window.Hands) throw new Error("MediaPipe Hands script not loaded");
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)
        throw new Error("Camera API unavailable (needs https or localhost)");

      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false
      });
      if (mySession !== session) { s.getTracks().forEach(t => t.stop()); return; }
      stream = s;

      const vid = document.createElement("video");
      vid.playsInline = true;
      vid.muted = true;
      vid.srcObject = s;
      await vid.play();

      const h = new window.Hands({
        locateFile: f => process.env.PUBLIC_URL + "/mediapipe/" + f
      });
      hands = h;
      h.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5
      });
      h.onResults(r => listeners.forEach(fn => fn(r, vid)));
      await h.initialize();
      if (mySession !== session) return;

      ready = true;
      const loop = async () => {
        if (mySession !== session) return;
        if (vid.readyState >= 2) {
          try { await h.send({ image: vid }); } catch (e) { /* skip frame */ }
        }
        rafId = requestAnimationFrame(loop);
      };
      loop();
    })();

    return startPromise;
  },

  stop() {
    session++;
    ready = false;
    startPromise = null;
    if (rafId) cancelAnimationFrame(rafId);
    if (stream) stream.getTracks().forEach(t => t.stop());
    if (hands) { try { hands.close(); } catch (e) { /* already closed */ } }
    stream = hands = rafId = null;
  }
};
