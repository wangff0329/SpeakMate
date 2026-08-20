import * as Label from "@radix-ui/react-label";
import * as Progress from "@radix-ui/react-progress";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import * as Tabs from "@radix-ui/react-tabs";
import * as Toast from "@radix-ui/react-toast";
import {
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  LogOut,
  MessageSquareText,
  Mic2,
  Plus,
  RefreshCcw,
  Send,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { api, type AuthResult, type PracticeRecord } from "./api";
import logoUrl from "../../../images/logo.jpg";

const TOKEN_KEY = "speakmate.accessToken";
const DIFFICULTIES: Array<PracticeRecord["difficulty"]> = ["beginner", "intermediate", "advanced"];

const difficultyLabels: Record<PracticeRecord["difficulty"], string> = {
  beginner: "入门",
  intermediate: "进阶",
  advanced: "高阶",
};

type ToastState = {
  title: string;
  description?: string;
};

export function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthResult["user"] | null>(null);
  const [practices, setPractices] = useState<PracticeRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const selectedPractice = useMemo(
    () => practices.find((practice) => practice.id === selectedId) ?? practices[0] ?? null,
    [practices, selectedId],
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    void bootstrap(token);
  }, [token]);

  async function bootstrap(currentToken: string) {
    setLoading(true);

    try {
      const [{ user: currentUser }, { items }] = await Promise.all([
        api.me(currentToken),
        api.listPractices(currentToken),
      ]);

      setUser(currentUser);
      setPractices(items);
      setSelectedId((current) => current ?? items[0]?.id ?? null);
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
      showToast("登录已失效", errorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  function handleAuth(result: AuthResult) {
    localStorage.setItem(TOKEN_KEY, result.accessToken);
    setToken(result.accessToken);
    setUser(result.user);
    showToast("欢迎回来", result.user.email);
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setPractices([]);
    setSelectedId(null);
  }

  function showToast(title: string, description?: string) {
    setToast({ title, description });
  }

  async function refreshPractices() {
    if (!token) {
      return;
    }

    setLoading(true);

    try {
      const { items } = await api.listPractices(token);
      setPractices(items);
      setSelectedId((current) => current ?? items[0]?.id ?? null);
    } catch (error) {
      showToast("刷新失败", errorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function createPractice(input: {
    topic: string;
    difficulty: PracticeRecord["difficulty"];
    durationMinutes: number;
  }) {
    if (!token) {
      return;
    }

    setLoading(true);

    try {
      const practice = await api.createPractice(token, input);
      setPractices((items) => [practice, ...items]);
      setSelectedId(practice.id);
      showToast("练习已生成", practice.topic);
    } catch (error) {
      showToast("生成失败", errorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function evaluatePractice(transcript: string) {
    if (!token || !selectedPractice) {
      return;
    }

    setLoading(true);

    try {
      const evaluated = await api.evaluatePractice(token, selectedPractice.id, transcript);
      setPractices((items) => items.map((item) => (item.id === evaluated.id ? evaluated : item)));
      setSelectedId(evaluated.id);
      showToast("反馈已生成", `评分 ${evaluated.lastResult?.score ?? 0}`);
    } catch (error) {
      showToast("评分失败", errorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Toast.Provider swipeDirection="right">
      <main className="min-h-screen bg-[#f6f8fb] text-[#182230]">
        <div className="mx-auto grid min-h-screen max-w-7xl grid-rows-[auto_1fr] px-4 py-4 sm:px-6 lg:px-8">
          <Header user={user} loading={loading} onLogout={handleLogout} />
          {token && user ? (
            <Workspace
              practices={practices}
              selectedPractice={selectedPractice}
              loading={loading}
              onSelect={setSelectedId}
              onCreate={createPractice}
              onEvaluate={evaluatePractice}
              onRefresh={refreshPractices}
            />
          ) : (
            <AuthPanel onAuth={handleAuth} />
          )}
        </div>
      </main>
      <Toast.Root
        className="rounded-md border border-[#d8dee9] bg-white px-4 py-3 shadow-lg"
        duration={2600}
        open={toast !== null}
        onOpenChange={(open) => !open && setToast(null)}
      >
        <Toast.Title className="text-sm font-semibold text-[#182230]">{toast?.title}</Toast.Title>
        {toast?.description ? (
          <Toast.Description className="mt-1 text-sm text-[#5b6575]">{toast.description}</Toast.Description>
        ) : null}
      </Toast.Root>
      <Toast.Viewport className="fixed right-4 top-4 z-50 w-[min(360px,calc(100vw-32px))]" />
    </Toast.Provider>
  );
}

function Header({
  user,
  loading,
  onLogout,
}: {
  user: AuthResult["user"] | null;
  loading: boolean;
  onLogout: () => void;
}) {
  return (
    <header className="flex min-h-16 items-center justify-between border-b border-[#d8dee9]">
      <div className="flex items-center gap-3">
        <img src={logoUrl} alt="SpeakMate" className="h-10 w-10 rounded-md object-cover" />
        <div>
          <h1 className="text-xl font-semibold tracking-normal text-[#111827]">SpeakMate</h1>
          <p className="text-sm text-[#687386]">口语练习工作台</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {loading ? <span className="text-sm text-[#687386]">同步中</span> : null}
        {user ? (
          <>
            <span className="hidden text-sm text-[#465366] sm:inline">{user.email}</span>
            <button className="icon-button" type="button" onClick={onLogout} title="退出登录">
              <LogOut size={18} />
            </button>
          </>
        ) : null}
      </div>
    </header>
  );
}

function AuthPanel({ onAuth }: { onAuth: (result: AuthResult) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = mode === "login" ? await api.login(email, password) : await api.register(email, password);
      onAuth(result);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="grid min-h-[calc(100vh-96px)] place-items-center py-8">
      <div className="w-full max-w-md rounded-md border border-[#d8dee9] bg-white p-6 shadow-sm">
        <Tabs.Root value={mode} onValueChange={(value) => setMode(value as "login" | "register")}>
          <Tabs.List className="grid grid-cols-2 rounded-md bg-[#eef2f7] p-1">
            <Tabs.Trigger className="tab-trigger" value="login">
              登录
            </Tabs.Trigger>
            <Tabs.Trigger className="tab-trigger" value="register">
              注册
            </Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <Field label="邮箱" value={email} onChange={setEmail} type="email" autoComplete="email" />
          <Field
            label="密码"
            value={password}
            onChange={setPassword}
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
          {error ? <p className="rounded-md bg-[#fff1f0] px-3 py-2 text-sm text-[#b42318]">{error}</p> : null}
          <button className="primary-button w-full" disabled={loading} type="submit">
            <CheckCircle2 size={18} />
            {loading ? "处理中" : mode === "login" ? "登录" : "创建账号"}
          </button>
        </form>
      </div>
    </section>
  );
}

function Workspace({
  practices,
  selectedPractice,
  loading,
  onSelect,
  onCreate,
  onEvaluate,
  onRefresh,
}: {
  practices: PracticeRecord[];
  selectedPractice: PracticeRecord | null;
  loading: boolean;
  onSelect: (id: string) => void;
  onCreate: (input: {
    topic: string;
    difficulty: PracticeRecord["difficulty"];
    durationMinutes: number;
  }) => Promise<void>;
  onEvaluate: (transcript: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}) {
  return (
    <section className="grid gap-4 py-4 lg:grid-cols-[360px_1fr]">
      <aside className="min-h-[420px] rounded-md border border-[#d8dee9] bg-white">
        <div className="flex items-center justify-between border-b border-[#e4e9f0] px-4 py-3">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-[#2563eb]" />
            <h2 className="text-base font-semibold">练习历史</h2>
          </div>
          <button className="icon-button" type="button" onClick={onRefresh} disabled={loading} title="刷新">
            <RefreshCcw size={17} />
          </button>
        </div>
        <ScrollArea.Root className="h-[320px] lg:h-[calc(100vh-170px)]">
          <ScrollArea.Viewport className="h-full">
            <div className="space-y-2 p-3">
              {practices.length === 0 ? (
                <p className="px-2 py-6 text-sm text-[#687386]">还没有练习记录。</p>
              ) : (
                practices.map((practice) => (
                  <button
                    className={`history-item ${practice.id === selectedPractice?.id ? "history-item-active" : ""}`}
                    key={practice.id}
                    type="button"
                    onClick={() => onSelect(practice.id)}
                  >
                    <span className="line-clamp-1 text-sm font-semibold">{practice.topic}</span>
                    <span className="mt-1 flex items-center justify-between text-xs text-[#687386]">
                      <span>{difficultyLabels[practice.difficulty]}</span>
                      <span>{practice.lastResult ? `${practice.lastResult.score} 分` : "未评分"}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar className="flex w-2 bg-transparent p-0.5" orientation="vertical">
            <ScrollArea.Thumb className="flex-1 rounded-md bg-[#c3cad6]" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      </aside>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <PracticeDetail practice={selectedPractice} onEvaluate={onEvaluate} loading={loading} />
        <CreatePracticeForm loading={loading} onCreate={onCreate} />
      </div>
    </section>
  );
}

function PracticeDetail({
  practice,
  onEvaluate,
  loading,
}: {
  practice: PracticeRecord | null;
  onEvaluate: (transcript: string) => Promise<void>;
  loading: boolean;
}) {
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    setTranscript(practice?.lastResult?.transcript ?? "");
  }, [practice?.id]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!transcript.trim()) {
      return;
    }

    await onEvaluate(transcript);
  }

  if (!practice) {
    return (
      <section className="grid min-h-[520px] place-items-center rounded-md border border-[#d8dee9] bg-white p-6">
        <div className="text-center">
          <Sparkles className="mx-auto text-[#2563eb]" size={32} />
          <p className="mt-3 text-sm text-[#687386]">创建一个练习后开始。</p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-md border border-[#d8dee9] bg-white">
      <div className="border-b border-[#e4e9f0] px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="status-pill">
            <MessageSquareText size={14} />
            {difficultyLabels[practice.difficulty]}
          </span>
          <span className="status-pill">{practice.durationMinutes} 分钟</span>
        </div>
        <h2 className="mt-3 text-xl font-semibold text-[#111827]">{practice.topic}</h2>
      </div>

      <div className="space-y-5 p-5">
        <div>
          <h3 className="section-title">
            <Sparkles size={17} />
            练习题
          </h3>
          <p className="mt-2 rounded-md bg-[#f4f7fb] p-4 text-sm leading-6 text-[#334155]">{practice.prompt}</p>
          <p className="mt-2 text-sm text-[#687386]">{practice.instructions}</p>
        </div>

        <form className="space-y-3" onSubmit={submit}>
          <Label.Root className="section-title" htmlFor="transcript">
            <Mic2 size={17} />
            回答文本
          </Label.Root>
          <textarea
            id="transcript"
            className="min-h-36 w-full resize-y rounded-md border border-[#cfd7e3] bg-white px-3 py-2 text-sm leading-6 outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe]"
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
          />
          <button className="primary-button" disabled={loading || !transcript.trim()} type="submit">
            <Send size={18} />
            生成反馈
          </button>
        </form>

        {practice.lastResult ? <ReviewPanel result={practice.lastResult} /> : null}
      </div>
    </section>
  );
}

function ReviewPanel({ result }: { result: NonNullable<PracticeRecord["lastResult"]> }) {
  return (
    <div className="rounded-md border border-[#d8dee9] bg-[#fbfcfe] p-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="section-title">
          <ClipboardCheck size={17} />
          复盘
        </h3>
        <span className="text-lg font-semibold text-[#0f766e]">{result.score}</span>
      </div>
      <Progress.Root className="mt-3 h-2 overflow-hidden rounded-md bg-[#dbe4ef]" value={result.score}>
        <Progress.Indicator
          className="h-full bg-[#0f766e] transition-transform"
          style={{ transform: `translateX(-${100 - result.score}%)` }}
        />
      </Progress.Root>
      <p className="mt-3 text-sm leading-6 text-[#334155]">{result.feedback}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <FeedbackList title="亮点" items={result.strengths} />
        <FeedbackList title="改进" items={result.improvements} />
      </div>
      <p className="mt-4 rounded-md bg-white p-3 text-sm text-[#334155]">{result.nextAction}</p>
    </div>
  );
}

function FeedbackList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-[#182230]">{title}</h4>
      <ul className="mt-2 space-y-1 text-sm text-[#5b6575]">
        {items.map((item) => (
          <li className="flex gap-2" key={item}>
            <CheckCircle2 className="mt-0.5 shrink-0 text-[#0f766e]" size={15} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CreatePracticeForm({
  loading,
  onCreate,
}: {
  loading: boolean;
  onCreate: (input: {
    topic: string;
    difficulty: PracticeRecord["difficulty"];
    durationMinutes: number;
  }) => Promise<void>;
}) {
  const [topic, setTopic] = useState("Daily Conversation");
  const [difficulty, setDifficulty] = useState<PracticeRecord["difficulty"]>("intermediate");
  const [durationMinutes, setDurationMinutes] = useState(10);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onCreate({
      topic,
      difficulty,
      durationMinutes,
    });
  }

  return (
    <section className="h-fit rounded-md border border-[#d8dee9] bg-white p-5">
      <div className="flex items-center gap-2">
        <Plus size={18} className="text-[#2563eb]" />
        <h2 className="text-base font-semibold">新练习</h2>
      </div>
      <form className="mt-4 space-y-4" onSubmit={submit}>
        <Field label="场景" value={topic} onChange={setTopic} />
        <div>
          <Label.Root className="field-label">难度</Label.Root>
          <div className="mt-2 grid grid-cols-3 rounded-md bg-[#eef2f7] p-1">
            {DIFFICULTIES.map((item) => (
              <button
                className={`segmented-button ${difficulty === item ? "segmented-button-active" : ""}`}
                key={item}
                type="button"
                onClick={() => setDifficulty(item)}
              >
                {difficultyLabels[item]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label.Root className="field-label" htmlFor="duration">
            时长：{durationMinutes} 分钟
          </Label.Root>
          <input
            id="duration"
            className="mt-2 w-full accent-[#2563eb]"
            max={30}
            min={5}
            step={5}
            type="range"
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(Number(event.target.value))}
          />
        </div>
        <button className="primary-button w-full" disabled={loading || !topic.trim()} type="submit">
          <Sparkles size={18} />
          生成练习
        </button>
      </form>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  const id = label.toLowerCase();

  return (
    <div>
      <Label.Root className="field-label" htmlFor={id}>
        {label}
      </Label.Root>
      <input
        autoComplete={autoComplete}
        className="mt-2 h-10 w-full rounded-md border border-[#cfd7e3] bg-white px-3 text-sm outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe]"
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "操作失败";
}
