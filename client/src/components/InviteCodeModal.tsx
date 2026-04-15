import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Loader2, ExternalLink } from "lucide-react";
import { SiX } from "react-icons/si";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import btcLogo from "@assets/bitcoin-sign-3d-icon-png-download-4466132_1766014388601.png";

interface InviteCodeModalProps {
  onClose: () => void;
}

type SuccessPhase = "idle" | "confetti" | "checkmark" | "focus";

export function InviteCodeModal({ onClose }: InviteCodeModalProps) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [successPhase, setSuccessPhase] = useState<SuccessPhase>("idle");
  const hashrateRef = useRef<HTMLDivElement>(null);

  // Drive the success animation sequence
  useEffect(() => {
    if (status !== "success") return;
    setSuccessPhase("confetti");
    // After confetti plays (~2.5s), switch to checkmark
    const t1 = setTimeout(() => setSuccessPhase("checkmark"), 2500);
    // After checkmark briefly shows, switch to focus card
    const t2 = setTimeout(() => setSuccessPhase("focus"), 3800);
    // Then close
    const t3 = setTimeout(onClose, 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [status, onClose]);

  // Scroll hashrate card into view during focus phase
  useEffect(() => {
    if (successPhase === "focus" && hashrateRef.current) {
      hashrateRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [successPhase]);

  const handleRedeem = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setStatus("loading");
    setMessage("");

    try {
      let idToken: string | null = null;
      try {
        const { auth } = await import("@/lib/firebase");
        if (auth?.currentUser) {
          idToken = await auth.currentUser.getIdToken();
        }
      } catch {
        // ignore
      }

      const res = await fetch("/api/invite/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ code: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Failed to redeem code");
        return;
      }

      setStatus("success");
      setMessage("Your free Bitcoin miner is now active!");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  const handleDismiss = () => {
    if (status !== "loading") onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
        onClick={(e) => e.target === e.currentTarget && handleDismiss()}
      >
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 340, damping: 28 }}
          className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #0d1117 0%, #111827 60%, #0c1a0e 100%)",
            border: "1px solid rgba(16,185,129,0.18)",
            boxShadow: "0 0 60px rgba(16,185,129,0.12), 0 24px 64px rgba(0,0,0,0.6)",
          }}
        >
          {/* Ambient glow */}
          <div
            className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-40 pointer-events-none"
            style={{ background: "radial-gradient(ellipse, rgba(16,185,129,0.15) 0%, transparent 70%)" }}
          />

          {/* Close button — liquid glass circle, top-right */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 z-10 flex items-center justify-center w-9 h-9 rounded-full transition-all active:scale-95"
            style={{
              background: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <X size={16} className="text-white/70" />
          </button>

          <div className="relative p-6 pb-8">
            {/* Header Lottie — gift/treasure animation */}
            <div className="flex justify-center mb-4 mt-2">
              <div
                className="relative flex items-center justify-center rounded-[28px] overflow-hidden"
                style={{
                  width: 96,
                  height: 96,
                  background: "radial-gradient(circle, #1c3320 0%, #0d1a10 60%, #0a1410 100%)",
                  border: "1px solid rgba(16,185,129,0.15)",
                }}
              >
                <DotLottieReact
                  src="https://lottie.host/8cc8cc0a-c895-4a97-828f-e0a191db0bdc/2vjW9J2usZ.lottie"
                  autoplay
                  loop
                  style={{ width: 92, height: 92 }}
                />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-center text-xl font-bold text-white mb-2">
              Claim Your Free Bitcoin Miner
            </h2>

            {/* Giveaway notice — pinned post */}
            <div
              className="flex items-start gap-2 mx-auto mb-5 px-3 py-2.5 rounded-xl text-xs leading-snug"
              style={{
                background: "rgba(251,191,36,0.07)",
                border: "1px solid rgba(251,191,36,0.2)",
              }}
            >
              <span className="text-amber-400 shrink-0 mt-0.5">📌</span>
              <span className="text-amber-200/80">
                This is a <span className="text-amber-300 font-semibold">limited giveaway</span>. Find the{" "}
                <span className="text-amber-300 font-semibold">pinned post</span> on our X page, follow the
                instructions, and enter your unique code below to activate your free miner.
              </span>
            </div>

            {/* Steps */}
            <div className="flex gap-3 mb-5">
              <div
                className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl text-center"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-500/15 text-sky-400">
                  <SiX size={14} />
                </div>
                <p className="text-xs text-zinc-400 leading-snug">
                  Follow us on <span className="text-white">X</span> &amp; find the pinned post
                </p>
              </div>
              <div className="flex items-center text-zinc-600">
                <Zap size={14} />
              </div>
              <div
                className="flex-1 flex flex-col items-center gap-2 p-3 rounded-xl text-center"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/15">
                  <img src={btcLogo} alt="BTC" className="w-5 h-5 object-contain" />
                </div>
                <p className="text-xs text-zinc-400 leading-snug">
                  Enter your code &amp; <span className="text-white">start earning</span>
                </p>
              </div>
            </div>

            {/* Follow CTA */}
            <a
              href="https://x.com/BlockMiningApp"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl mb-4 text-sm font-medium transition-all"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#e4e4e7",
              }}
            >
              <SiX size={14} />
              Follow @BlockMiningApp on X
              <ExternalLink size={12} className="text-zinc-500" />
            </a>

            {/* Code input */}
            {status !== "success" ? (
              <div className="space-y-3">
                <div
                  className="flex rounded-xl overflow-hidden"
                  style={{ border: "1px solid rgba(16,185,129,0.25)" }}
                >
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
                    placeholder="ENTER CODE"
                    maxLength={32}
                    className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none tracking-widest font-mono"
                  />
                  <button
                    onClick={handleRedeem}
                    disabled={!code.trim() || status === "loading"}
                    className="flex items-center justify-center gap-1.5 px-4 text-sm font-semibold transition-all disabled:opacity-40"
                    style={{
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      color: "#fff",
                      minWidth: 80,
                    }}
                  >
                    {status === "loading" ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      "Redeem"
                    )}
                  </button>
                </div>

                {message && status === "error" && (
                  <p className="text-xs text-red-400 text-center">{message}</p>
                )}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="flex flex-col items-center gap-1 py-2"
              >
                {/* Phase 1: Confetti */}
                {successPhase === "confetti" && (
                  <div className="w-52 h-52 -my-4">
                    <DotLottieReact
                      src="https://lottie.host/812c3a43-4448-4902-8e57-999ce7c25764/gUUYa1wxrh.lottie"
                      autoplay
                      loop={false}
                    />
                  </div>
                )}

                {/* Phase 2: Checkmark */}
                {successPhase === "checkmark" && (
                  <>
                    <div className="w-40 h-40 -my-4">
                      <DotLottieReact
                        src="https://lottie.host/5e08e3b9-c9ea-4c7f-b6f1-82f3b8f74d2d/IDLqVb6fcn.lottie"
                        autoplay
                        loop={false}
                      />
                    </div>
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="text-emerald-400 font-bold text-base text-center"
                    >
                      {message}
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-zinc-500 text-xs text-center"
                    >
                      Your miner is now active — heading to dashboard…
                    </motion.p>
                  </>
                )}

                {/* Phase 3: Hashrate focus card */}
                {successPhase === "focus" && (
                  <motion.div
                    ref={hashrateRef}
                    initial={{ opacity: 0, scale: 0.88, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="w-full rounded-2xl p-5 text-center"
                    style={{
                      background: "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(251,191,36,0.08) 100%)",
                      border: "2px solid rgba(16,185,129,0.4)",
                      boxShadow: "0 0 32px rgba(16,185,129,0.22)",
                    }}
                  >
                    <p className="text-[10px] text-zinc-400 mb-1 uppercase tracking-wider">Your Hashpower</p>
                    <p className="text-4xl font-black bg-gradient-to-r from-emerald-400 to-amber-300 bg-clip-text text-transparent">
                      0.4 TH/s
                    </p>
                    <p className="text-xs text-zinc-500 mt-1.5">SHA-256 · Bitcoin (BTC) · 365 days</p>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="text-emerald-400 text-xs font-medium mt-2"
                    >
                      ✓ Miner is live and earning
                    </motion.p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Skip — styled as a prominent secondary button */}
            {status !== "success" && (
              <button
                onClick={handleDismiss}
                className="mt-4 w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#a1a1aa",
                }}
              >
                I don't have a code — skip for now
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
