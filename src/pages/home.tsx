import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  useSendLetter,
  useGetLetterCount,
  useGetRandomLetter,
  useGetInbox,
  useLogin,
  getGetLetterCountQueryKey,
  getGetRandomLetterQueryKey,
  getGetInboxQueryKey,
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X, Mail, LogOut, Globe, Lock } from "lucide-react";
import owlSendSrc from "../assets/owl-send.png";
import owlReceiveSrc from "../assets/owl-receive.png";

// ---------------------------------------------------------------------------
// Floating candles
// ---------------------------------------------------------------------------
const FloatingCandles = () => {
  const candles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: 3 + i * 5.5 + Math.sin(i * 1.7) * 2,
    height: 28 + (i % 5) * 8,
    duration: 12 + (i % 7) * 3,
    delay: -(i * 2.1),
  }));
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {candles.map((c) => (
        <div
          key={c.id}
          className="floating-candle"
          style={{ left: `${c.x}%`, animationDuration: `${c.duration}s`, animationDelay: `${c.delay}s` }}
        >
          <div className="candle-flame" />
          <div className="candle-wick" />
          <div className="candle-body" style={{ height: c.height }}>
            <div className="candle-drip" />
          </div>
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Login modal
// ---------------------------------------------------------------------------
function LoginModal({ onClose }: { onClose?: () => void }) {
  const { login } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();
  const [name, setName] = useState("");

  const handleLogin = () => {
    if (!name.trim()) return;
    loginMutation.mutate(
      { data: { name: name.trim() } },
      {
        onSuccess: (data) => {
          login({ name: data.name, token: data.token });
          toast({ title: `欢迎回来，${data.name}！`, description: "猫头鹰们已在等候您的指令。" });
          onClose?.();
        },
        onError: () => {
          toast({ title: "登录失败", description: "魔法出了点问题，请重试。", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="parchment rounded-sm p-8 flex flex-col gap-6 w-full max-w-sm shadow-2xl">
      <div className="text-center">
        <div className="text-4xl mb-2">🦉</div>
        <h2 className="font-serif text-2xl text-card-foreground/80 tracking-widest">猫头鹰塔楼</h2>
        <p className="font-sans text-sm text-card-foreground/50 mt-1">请输入您的巫师名字</p>
      </div>
      <Input
        placeholder="例：赫敏·格兰杰"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        className="bg-transparent border-b border-t-0 border-l-0 border-r-0 border-card-foreground/30 rounded-none shadow-none focus-visible:ring-0 focus-visible:border-card-foreground/60 text-card-foreground font-sans placeholder:text-card-foreground/30 px-0 text-lg text-center"
        autoFocus
        data-testid="input-wizard-name"
      />
      <Button
        onClick={handleLogin}
        disabled={!name.trim() || loginMutation.isPending}
        className="font-serif text-base tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(200,150,50,0.4)] border border-primary/50"
        data-testid="button-wizard-login"
      >
        {loginMutation.isPending ? "施法中..." : "进入塔楼"}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inbox modal
// ---------------------------------------------------------------------------
function InboxModal({ name, onClose }: { name: string; onClose: () => void }) {
  const { data, isLoading, error } = useGetInbox(
    { name },
    { query: { queryKey: getGetInboxQueryKey({ name }), enabled: true } }
  );

  const letters = data?.letters ?? [];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="fixed inset-0 z-30 flex items-center justify-center p-4"
      >
        <div className="parchment rounded-sm p-8 flex flex-col gap-4 w-full max-w-lg max-h-[80vh] shadow-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-card-foreground/40 hover:text-card-foreground/80 transition-colors"
          >
            <X size={18} />
          </button>
          <h2 className="font-serif text-xl text-card-foreground/70 tracking-widest text-center">
            — {name} 的专属信箱 —
          </h2>

          {isLoading && (
            <p className="text-center text-card-foreground/50 font-sans py-8">猫头鹰正在取信...</p>
          )}

          {error && (
            <p className="text-center text-red-500/70 font-sans py-8 text-sm">无法读取信件，请重新登录。</p>
          )}

          {!isLoading && !error && letters.length === 0 && (
            <div className="text-center py-10">
              <div className="text-5xl mb-3">📭</div>
              <p className="font-sans text-card-foreground/50 text-sm">还没有人给您写信</p>
              <p className="font-sans text-card-foreground/30 text-xs mt-1">告诉朋友们您的巫师名字吧</p>
            </div>
          )}

          <div className="overflow-y-auto flex flex-col gap-4 pr-1">
            {letters.map((letter, idx) => (
              <motion.div
                key={letter.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="border border-card-foreground/15 rounded-sm p-4 flex flex-col gap-2 bg-card-foreground/5"
              >
                <div className="flex items-center gap-2 text-xs text-card-foreground/40 font-sans">
                  {letter.isPublic ? (
                    <Globe size={12} className="shrink-0" />
                  ) : (
                    <Lock size={12} className="shrink-0" />
                  )}
                  <span>{letter.isPublic ? "公开信（也寄给了您）" : "专属私信"}</span>
                  <span className="ml-auto">{new Date(letter.createdAt).toLocaleDateString("zh-CN")}</span>
                </div>
                <p className="font-sans text-base leading-relaxed whitespace-pre-wrap text-card-foreground">
                  {letter.content}
                </p>
                <p className="font-sans text-right text-sm text-card-foreground/60">
                  — {letter.senderName || "匿名巫师"}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();

  const { data: countData } = useGetLetterCount();
  const sendLetterMutation = useSendLetter();
  const {
    data: randomLetter,
    refetch: fetchRandomLetter,
    isFetching: isFetchingRandom,
  } = useGetRandomLetter({
    query: { enabled: false, queryKey: getGetRandomLetterQueryKey() },
  });

  // Compose state
  const [isComposing, setIsComposing] = useState(false);
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [recipient, setRecipient] = useState("");

  // Owl animation states
  const [sendOwlState, setSendOwlState] = useState<"idle" | "sending" | "gone">("idle");
  const [receiveOwlState, setReceiveOwlState] = useState<"idle" | "flying-in" | "landed">("idle");
  const [showReceivedLetter, setShowReceivedLetter] = useState(false);

  // UI state
  const [showLogin, setShowLogin] = useState(false);
  const [showInbox, setShowInbox] = useState(false);

  const handleSend = () => {
    if (!content.trim()) return;
    if (!isPublic && !recipient.trim()) {
      toast({ title: "请填写收件人", description: "私信需要指定收件巫师的名字。", variant: "destructive" });
      return;
    }
    setSendOwlState("sending");

    setTimeout(() => {
      sendLetterMutation.mutate(
        {
          data: {
            content,
            senderName: user?.name || undefined,
            recipient: recipient.trim() || undefined,
            isPublic,
          },
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetLetterCountQueryKey() });
            if (user && recipient.trim() === user.name) {
              queryClient.invalidateQueries({ queryKey: getGetInboxQueryKey({ name: user.name }) });
            }
            toast({
              title: isPublic ? "信件已投入公共信箱！" : `私信已寄给 ${recipient}！`,
              description: "海瑟薇已经带着您的信飞走了。",
            });
            setContent("");
            setRecipient("");
            setIsPublic(true);
            setIsComposing(false);
            setSendOwlState("gone");
            setTimeout(() => setSendOwlState("idle"), 3000);
          },
          onError: () => {
            setSendOwlState("idle");
            toast({ title: "发送失败", description: "魔法出了点问题，请重试。", variant: "destructive" });
          },
        }
      );
    }, 1200);
  };

  const handleReadLetter = async () => {
    setShowReceivedLetter(false);
    setReceiveOwlState("flying-in");
    const result = await fetchRandomLetter();
    setTimeout(() => {
      setReceiveOwlState("landed");
      if (result.data) {
        setShowReceivedLetter(true);
      } else {
        toast({ title: "鸟巢里还没有信件...", description: "稍后再来看看吧！" });
        setTimeout(() => setReceiveOwlState("idle"), 2000);
      }
    }, 1000);
  };

  return (
    <div className="min-h-[100dvh] relative w-full flex flex-col items-center justify-center p-4 overflow-hidden bg-transparent">
      {/* SVG noise filter */}
      <svg className="absolute w-0 h-0 overflow-hidden" aria-hidden="true">
        <defs>
          <filter id="parchment-noise" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="4" stitchTiles="stitch" result="noise" />
            <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
            <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" result="blended" />
            <feComponentTransfer in="blended">
              <feFuncR type="linear" slope="1.05" intercept="-0.02" />
              <feFuncG type="linear" slope="0.98" intercept="0.01" />
              <feFuncB type="linear" slope="0.88" intercept="-0.01" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>

      <FloatingCandles />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[600px] candle-glow rounded-full pointer-events-none z-0" />

      {/* Header */}
      <div className="z-10 absolute top-6 left-1/2 -translate-x-1/2 text-center flex flex-col items-center gap-2 w-full px-4">
        <h1 className="font-serif text-3xl md:text-5xl text-primary font-bold tracking-widest drop-shadow-lg">
          Hogwarts Owl Tower
        </h1>
        <div className="bg-secondary/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-primary/30 text-sm text-secondary-foreground" data-testid="text-letter-count">
          塔楼共收到 {countData?.count ?? 0} 封信
        </div>

        {/* Auth bar */}
        <div className="flex items-center gap-2 mt-1">
          {user ? (
            <>
              <button
                onClick={() => setShowInbox(true)}
                className="flex items-center gap-1.5 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 px-3 py-1 rounded-full text-sm font-sans transition-colors backdrop-blur-sm"
                data-testid="button-open-inbox"
              >
                <Mail size={13} />
                我的信箱（{user.name}）
              </button>
              <button
                onClick={logout}
                className="text-primary/50 hover:text-primary/80 transition-colors p-1"
                title="退出"
                data-testid="button-logout"
              >
                <LogOut size={14} />
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="flex items-center gap-1.5 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 px-3 py-1 rounded-full text-sm font-sans transition-colors backdrop-blur-sm"
              data-testid="button-open-login"
            >
              <Mail size={13} />
              登录查看专属信箱
            </button>
          )}
        </div>
      </div>

      {/* Owl buttons */}
      <div className="z-10 flex items-end justify-center gap-16 md:gap-32">
        {/* Send owl */}
        <div className="flex flex-col items-center gap-3">
          <AnimatePresence mode="wait">
            {sendOwlState === "idle" && (
              <motion.button
                key="send-owl-idle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, rotate: [0, -2, 2, -1, 0] }}
                exit={{ opacity: 0, x: 400, y: -300, scale: 0.3, rotate: 20 }}
                transition={{ rotate: { repeat: Infinity, repeatType: "loop", duration: 4, delay: 1 }, opacity: { duration: 0.4 } }}
                whileHover={{ scale: 1.08, filter: "drop-shadow(0 0 20px rgba(255,220,100,0.7))" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsComposing(true)}
                className="cursor-pointer focus:outline-none"
                data-testid="button-compose"
              >
                <img src={owlSendSrc} alt="寄信猫头鹰" className="w-36 h-36 md:w-48 md:h-48 object-contain drop-shadow-2xl" />
              </motion.button>
            )}
            {sendOwlState === "sending" && (
              <motion.div
                key="send-owl-flying"
                initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                animate={{ opacity: [1, 1, 0], x: [0, 200, 600], y: [0, -150, -400], scale: [1, 1.2, 0.4] }}
                transition={{ duration: 1.2, ease: "easeIn" }}
                className="pointer-events-none"
              >
                <img src={owlSendSrc} alt="" className="w-36 h-36 md:w-48 md:h-48 object-contain drop-shadow-2xl" />
              </motion.div>
            )}
            {sendOwlState === "gone" && (
              <motion.div
                key="send-owl-return"
                initial={{ opacity: 0, x: 300, y: -200, scale: 0.2 }}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 2 }}
                onAnimationComplete={() => setSendOwlState("idle")}
                className="pointer-events-none"
              >
                <img src={owlSendSrc} alt="" className="w-36 h-36 md:w-48 md:h-48 object-contain drop-shadow-2xl opacity-60" />
              </motion.div>
            )}
          </AnimatePresence>
          <span className="font-serif text-primary text-xl tracking-widest drop-shadow-md select-none">寄 信</span>
        </div>

        {/* Receive owl */}
        <div className="flex flex-col items-center gap-3">
          <AnimatePresence mode="wait">
            {receiveOwlState === "idle" && (
              <motion.button
                key="receive-owl-idle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: [0, -6, 0], scale: [1, 1.02, 1] }}
                exit={{ opacity: 0 }}
                transition={{ y: { repeat: Infinity, duration: 3, ease: "easeInOut" }, opacity: { duration: 0.4 } }}
                whileHover={{ scale: 1.08, filter: "drop-shadow(0 0 20px rgba(255,220,100,0.7))" }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReadLetter}
                disabled={isFetchingRandom}
                className="cursor-pointer focus:outline-none disabled:opacity-60 disabled:cursor-wait"
                data-testid="button-read"
              >
                <img src={owlReceiveSrc} alt="读取来信猫头鹰" className="w-36 h-36 md:w-48 md:h-48 object-contain drop-shadow-2xl" />
              </motion.button>
            )}
            {receiveOwlState === "flying-in" && (
              <motion.div
                key="receive-owl-flying"
                initial={{ opacity: 0, x: -500, y: -200, scale: 0.3, rotate: -15 }}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
                transition={{ duration: 1.0, ease: "easeOut" }}
                className="pointer-events-none"
              >
                <img src={owlReceiveSrc} alt="" className="w-36 h-36 md:w-48 md:h-48 object-contain drop-shadow-2xl" />
              </motion.div>
            )}
            {receiveOwlState === "landed" && (
              <motion.button
                key="receive-owl-landed"
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => { setReceiveOwlState("idle"); setShowReceivedLetter(false); }}
                className="cursor-pointer focus:outline-none"
              >
                <img src={owlReceiveSrc} alt="" className="w-36 h-36 md:w-48 md:h-48 object-contain drop-shadow-2xl" style={{ filter: "drop-shadow(0 0 12px rgba(255,200,80,0.6))" }} />
              </motion.button>
            )}
          </AnimatePresence>
          <span className="font-serif text-primary text-xl tracking-widest drop-shadow-md select-none">读取来信</span>
        </div>
      </div>

      {/* Received letter card */}
      <div className="z-10 w-full flex justify-center mt-8">
        <AnimatePresence mode="wait">
          {showReceivedLetter && randomLetter && (
            <motion.div
              key={randomLetter.id}
              initial={{ opacity: 0, y: 40, rotate: -2 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="w-full max-w-md parchment rounded-sm p-6 flex flex-col gap-4 text-card-foreground shadow-2xl"
              data-testid={`card-received-letter-${randomLetter.id}`}
            >
              <div className="font-sans italic text-sm text-card-foreground/70 pb-3 border-b border-card-foreground/10">
                {randomLetter.recipient ? `To: ${randomLetter.recipient}` : "To: 有缘人"}
              </div>
              <div className="font-sans text-base leading-relaxed whitespace-pre-wrap min-h-[80px]">
                {randomLetter.content}
              </div>
              <div className="font-sans text-right pt-3 border-t border-card-foreground/10 text-card-foreground/80">
                — {randomLetter.senderName || "匿名巫师"}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Compose modal */}
      <AnimatePresence>
        {isComposing && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20"
              onClick={() => setIsComposing(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="fixed inset-0 z-30 flex items-center justify-center p-4"
            >
              <div className="parchment rounded-sm p-8 flex flex-col gap-5 w-full max-w-lg shadow-2xl relative">
                <button
                  onClick={() => setIsComposing(false)}
                  className="absolute top-4 right-4 text-card-foreground/40 hover:text-card-foreground/80 transition-colors"
                  data-testid="button-close-compose"
                >
                  <X size={18} />
                </button>

                <h2 className="font-serif text-xl text-card-foreground/70 tracking-widest text-center mb-1">
                  — 猫头鹰邮件 —
                </h2>

                {/* Destination toggle */}
                <div className="flex rounded-sm overflow-hidden border border-card-foreground/20">
                  <button
                    onClick={() => { setIsPublic(true); setRecipient(""); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-sans transition-colors ${
                      isPublic
                        ? "bg-primary/20 text-primary border-r border-card-foreground/20"
                        : "bg-transparent text-card-foreground/40 hover:text-card-foreground/60 border-r border-card-foreground/20"
                    }`}
                    data-testid="toggle-public"
                  >
                    <Globe size={13} />
                    投入公共信箱
                  </button>
                  <button
                    onClick={() => setIsPublic(false)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-sans transition-colors ${
                      !isPublic
                        ? "bg-primary/20 text-primary"
                        : "bg-transparent text-card-foreground/40 hover:text-card-foreground/60"
                    }`}
                    data-testid="toggle-private"
                  >
                    <Lock size={13} />
                    寄给特定巫师
                  </button>
                </div>

                <AnimatePresence>
                  {!isPublic && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <Input
                        placeholder="收件巫师的名字（必填）"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        className="bg-transparent border-b border-t-0 border-l-0 border-r-0 border-card-foreground/20 rounded-none shadow-none focus-visible:ring-0 focus-visible:border-card-foreground/50 text-card-foreground font-sans placeholder:text-card-foreground/40 px-0"
                        data-testid="input-recipient"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Sender */}
                {!user && (
                  <Input
                    placeholder="寄件人（可选，不填则为匿名巫师）"
                    className="bg-transparent border-b border-t-0 border-l-0 border-r-0 border-card-foreground/20 rounded-none shadow-none focus-visible:ring-0 focus-visible:border-card-foreground/50 text-card-foreground font-sans placeholder:text-card-foreground/40 px-0"
                    readOnly
                    disabled
                  />
                )}
                {user && (
                  <div className="text-xs text-card-foreground/40 font-sans -mt-2">
                    寄件人：{user.name}
                  </div>
                )}

                <Textarea
                  placeholder="亲爱的..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="bg-transparent border-none shadow-none focus-visible:ring-0 resize-none font-sans text-lg text-card-foreground placeholder:text-card-foreground/30 p-0 leading-relaxed min-h-[180px]"
                  data-testid="input-content"
                  autoFocus
                />

                <div className="flex justify-center pt-2">
                  <Button
                    size="lg"
                    onClick={handleSend}
                    disabled={!content.trim() || sendOwlState === "sending" || sendLetterMutation.isPending}
                    className="font-serif text-lg tracking-widest px-12 py-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(200,150,50,0.4)] border border-primary/50"
                    data-testid="button-send"
                  >
                    {sendOwlState === "sending" ? "送出中..." : "寄 出"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Login modal */}
      <AnimatePresence>
        {showLogin && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20"
              onClick={() => setShowLogin(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="fixed inset-0 z-30 flex items-center justify-center p-4"
            >
              <div className="relative">
                <button
                  onClick={() => setShowLogin(false)}
                  className="absolute top-4 right-4 text-card-foreground/40 hover:text-card-foreground/80 transition-colors z-10"
                >
                  <X size={18} />
                </button>
                <LoginModal onClose={() => setShowLogin(false)} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Inbox modal */}
      <AnimatePresence>
        {showInbox && user && (
          <InboxModal name={user.name} onClose={() => setShowInbox(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
