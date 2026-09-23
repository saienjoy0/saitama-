import {
  useEffect,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Compass,
  ShoppingBag,
  BookOpen,
  MessageCircle,
  Heart,
  RotateCcw,
  SlidersHorizontal,
  Leaf,
  ChevronRight,
  Wallet,
  Scale,
  Mail,
  ShieldCheck,
  Pause,
  Sparkles,
  X,
  Flag,
} from "lucide-react";
import {
  initialState,
  reducer,
  products,
  replyKinds,
  replyExamples,
  canParentRead,
  canGrandRead,
  type State,
  type Action,
  type Choice,
  type ReplyKind,
  type Card,
} from "./state";
type Role = "child" | "parent" | "grand";
const roles = {
  child: { name: "子ども", job: "自分で選ぶ", person: "はる", icon: Compass },
  parent: {
    name: "親",
    job: "共有を見守る",
    person: "おうちの人",
    icon: ShieldCheck,
  },
  grand: {
    name: "祖父母",
    job: "経験を返す",
    person: "おばあちゃん",
    icon: Mail,
  },
};
const labels = ["見つける", "予想する", "比べる", "理由を残す", "発見カード"];
const reasons = [
  "飲みきれる量を選びたい",
  "お金を残しておきたい",
  "同じ量あたりの値段で選びたい",
  "今は必要ない",
  "まだうまく言えない",
];
function Button({
  children,
  onClick,
  secondary = false,
  disabled = false,
  ...props
}: {
  children: ReactNode;
  onClick: () => void;
  secondary?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  return (
    <button
      className={secondary ? "button secondary" : "button primary"}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
function Badge({ children }: { children: ReactNode }) {
  return <span className="badge">{children}</span>;
}
function DrinkGraphic({ choice }: { choice: Choice }) {
  if (choice === "none")
    return (
      <div className="drink-graphic no-buy">
        <Wallet size={54} />
        <span>300円を残す</span>
      </div>
    );
  return (
    <div className={`drink-graphic drink-${choice}`} aria-hidden="true">
      <div className="quantity" style={{ height: choice === "A" ? 86 : 126 }}>
        <span>{choice}</span>
        <small>{products[choice].ml}ml</small>
      </div>
    </div>
  );
}
function RecordCard({
  card,
  compact = false,
}: {
  card: Card;
  compact?: boolean;
}) {
  const p = products[card.choice];
  return (
    <article className={`record ${compact ? "compact" : ""}`}>
      <div className="record-top">
        <span>はるの発見帳</span>
        <span>No. 01</span>
      </div>
      <div className="record-title">
        <span className="record-icon">
          <ShoppingBag size={26} />
        </span>
        <h2>300円で、何を選ぶ？</h2>
      </div>
      <div className="record-facts">
        <div>
          <small>はじめの予想</small>
          <p>{card.prediction}</p>
        </div>
        <div>
          <small>選んだこと</small>
          <p>{p.name}</p>
        </div>
      </div>
      <blockquote>「{card.reason}」</blockquote>
      <div className="record-bottom">
        <span>
          使うお金 <b>{p.price}円</b>
        </span>
        <span>
          残るお金 <b>{300 - p.price}円</b>
        </span>
      </div>
      <small className="record-id">
        発見カード 01 · 第{card.revision}版 · 架空の買い物
      </small>
    </article>
  );
}
function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [role, setRole] = useState<Role>("child");
  const [step, setStep] = useState(0);
  const [prediction, setPrediction] = useState("");
  const [choice, setChoice] = useState<Choice | null>(null);
  const [reason, setReason] = useState("");
  const [axis, setAxis] = useState<"price" | "unit" | "left">("price");
  const [assist, setAssist] = useState(false);
  const [small, setSmall] = useState(false);
  const [hint, setHint] = useState(false);
  const [settings, setSettings] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [large, setLarge] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    main.current?.focus();
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [role, step, paused]);
  const changeRole = (r: Role) => {
    setRole(r);
    setAssist(false);
  };
  const reset = () => {
    dispatch({ type: "reset" });
    setRole("child");
    setStep(0);
    setPrediction("");
    setChoice(null);
    setReason("");
    setAxis("price");
    setAssist(false);
    setSmall(false);
    setHint(false);
    setPaused(false);
    setReduce(false);
    setLarge(false);
    setSettings(false);
    setResetOpen(false);
  };
  const record = () => {
    if (choice && reason.trim()) {
      dispatch({ type: "record", prediction, choice, reason });
      setStep(4);
    }
  };
  const onRole = roles[role];
  const Icon = onRole.icon;
  return (
    <div
      className={`app role-${role} ${reduce ? "reduce-motion" : ""} ${large ? "large-text" : ""}`}
    >
      <a className="skip-link" href="#main">
        本文へ移動
      </a>
      <div className="presenter">
        <div className="presenter-label">
          <span className="live-mark" /> 発表用デモ{" "}
          <span className="divider">/</span>
          <span>役割プレビュー</span>
        </div>
        <div className="role-tabs" aria-label="役割プレビュー">
          {(Object.keys(roles) as Role[]).map((r) => (
            <button
              key={r}
              aria-pressed={role === r}
              onClick={() => changeRole(r)}
            >
              <span>{roles[r].name}</span>
              <small>{roles[r].job}</small>
            </button>
          ))}
        </div>
        <div className="presenter-tools">
          <button
            aria-label="表示設定"
            aria-expanded={settings}
            onClick={() => setSettings(!settings)}
          >
            <SlidersHorizontal size={19} />
          </button>
          <button onClick={() => setResetOpen(!resetOpen)}>
            <RotateCcw size={17} />
            <span>最初から</span>
          </button>
        </div>
      </div>
      {settings && (
        <div className="settings">
          <label>
            <input
              type="checkbox"
              checked={reduce}
              onChange={(e) => setReduce(e.target.checked)}
            />
            動きを減らす
          </label>
          <label>
            <input
              type="checkbox"
              checked={large}
              onChange={(e) => setLarge(e.target.checked)}
            />
            文字を200%にする
          </label>
          <button onClick={() => setSettings(false)}>閉じる</button>
        </div>
      )}
      {resetOpen && (
        <div className="reset-panel" role="alert">
          <span>このデモの記録と返信を消して、最初に戻ります。</span>
          <Button onClick={reset}>リセットする</Button>
          <Button secondary onClick={() => setResetOpen(false)}>
            戻る
          </Button>
        </div>
      )}
      <header className="header">
        <div className="brand">
          <span className="brand-symbol">
            <Compass size={27} />
          </span>
          <div>
            やってみ<span>クエスト</span>
            <small>暮らしのなかに、発見がある。</small>
          </div>
        </div>
        <div className="profile">
          <span className="avatar">
            <Icon size={22} />
          </span>
          <span>
            {onRole.person}
            <small>
              {role === "child"
                ? "わたしの探検帳"
                : role === "parent"
                  ? "家族の見守り"
                  : "家族のおたより"}
            </small>
          </span>
        </div>
      </header>
      <main id="main" ref={main} tabIndex={-1} className="main">
        {role === "child" ? (
          <>
            <div className="child-heading">
              <div>
                <p className="eyebrow">MY LITTLE ADVENTURE</p>
                <h1>
                  {step === 0
                    ? "今日は、どんな発見がある？"
                    : step === 1
                      ? "まずは、直感で予想しよう。"
                      : step === 2
                        ? "見方を変えると、どう見える？"
                        : step === 3
                          ? "きみは、どうして選ぶ？"
                          : step === 4
                            ? "きみの「考えた」が、一枚に。"
                            : "次の「なんで？」を見つけよう。"}
                </h1>
              </div>
              <span className="chapter">
                くらしの探検 <b>01</b>
              </span>
            </div>
            {step < 5 && (
              <ol className="progress" aria-label="探検の進み具合">
                {labels.map((l, i) => (
                  <li
                    key={l}
                    className={i === step ? "current" : i < step ? "done" : ""}
                    aria-current={i === step ? "step" : undefined}
                  >
                    <span>
                      {i < step ? (
                        <Check size={16} />
                      ) : (
                        String(i + 1).padStart(2, "0")
                      )}
                    </span>
                    {l}
                  </li>
                ))}
              </ol>
            )}
            {paused ? (
              <section className="empty">
                <Pause size={42} />
                <h2>つづきは、いつでも。</h2>
                <p>この画面を開いている間は、途中の選択を残しています。</p>
                <Button onClick={() => setPaused(false)}>
                  探検を再開する <ArrowRight size={18} />
                </Button>
              </section>
            ) : step === 0 ? (
              <div className="adventure-grid">
                <section className="quest-board">
                  <div className="quest-caption">
                    <Badge>お店を探検</Badge>
                    <span>購入しなくても遊べる</span>
                  </div>
                  <div className="quest-copy">
                    <p className="eyebrow">TODAY'S QUEST</p>
                    <h2>
                      300円あったら、
                      <br />
                      きみはどう選ぶ？
                    </h2>
                    <p>
                      安いほう？ たっぷりのほう？
                      <br />
                      「自分なら」を見つけにいこう。
                    </p>
                    <Button onClick={() => setStep(1)}>
                      この探検をはじめる <ArrowRight size={20} />
                    </Button>
                  </div>
                  <div className="quest-visual">
                    <span className="budget-ticket">
                      今日の予算{" "}
                      <strong>
                        300<small>円</small>
                      </strong>
                    </span>
                    <div className="shop-display">
                      <div>
                        <DrinkGraphic choice="A" />
                        <b>180円</b>
                      </div>
                      <span className="versus">or</span>
                      <div>
                        <DrinkGraphic choice="B" />
                        <b>260円</b>
                      </div>
                    </div>
                    <div className="little-note">
                      <Scale size={18} />
                      「お得」って、ひとつだけ？
                    </div>
                  </div>
                </section>
                <aside className="explore-rail">
                  <p className="eyebrow">探検の見取り図</p>
                  <h2>
                    選んだ先に、
                    <br />
                    発見が待っている。
                  </h2>
                  <ol className="route-map">
                    <li>
                      <span>
                        <Compass />
                      </span>
                      <div>
                        <b>自分で選ぶ</b>
                        <small>予想して、比べてみる</small>
                      </div>
                    </li>
                    <li>
                      <span>
                        <BookOpen />
                      </span>
                      <div>
                        <b>発見を残す</b>
                        <small>きみの理由が一枚になる</small>
                      </div>
                    </li>
                    <li>
                      <span>
                        <MessageCircle />
                      </span>
                      <div>
                        <b>家族の話を聞く</b>
                        <small>見せたいときだけで大丈夫</small>
                      </div>
                    </li>
                    <li>
                      <span>
                        <Leaf />
                      </span>
                      <div>
                        <b>次の「なんで？」へ</b>
                        <small>新しい問いを自分で選ぶ</small>
                      </div>
                    </li>
                  </ol>
                </aside>
              </div>
            ) : step === 1 ? (
              <section className="workspace">
                <div className="section-heading">
                  <div>
                    <Badge>01 予想</Badge>
                    <h2>飲み物を選ぶなら、どれがよさそう？</h2>
                    <p>今の予想で大丈夫。あとで変えてもいいよ。</p>
                  </div>
                  <span className="budget-pill">
                    <Wallet size={19} /> 予算 300円
                  </span>
                </div>
                <div className="product-grid">
                  {(["A", "B", "none"] as Choice[]).map((c) => (
                    <button
                      className={`product ${prediction === products[c].name ? "selected" : ""}`}
                      key={c}
                      onClick={() => setPrediction(products[c].name)}
                      aria-pressed={prediction === products[c].name}
                    >
                      <DrinkGraphic choice={c} />
                      <h3>{products[c].name}</h3>
                      <p>
                        {c === "none"
                          ? "今は買わずに考える"
                          : `${products[c].price}円 / ${products[c].ml}ml`}
                      </p>
                      <span className="select-mark">
                        {prediction === products[c].name ? (
                          <Check size={18} />
                        ) : (
                          <span />
                        )}
                      </span>
                    </button>
                  ))}
                </div>
                <button
                  className="text-button"
                  onClick={() => setPrediction("まだ分からない")}
                  aria-pressed={prediction === "まだ分からない"}
                >
                  {prediction === "まだ分からない" ? "✓ " : ""}まだ分からない
                </button>
                <div className="action-row">
                  <Button secondary onClick={() => setStep(0)}>
                    <ArrowLeft size={18} />
                    戻る
                  </Button>
                  <Button onClick={() => setStep(2)} disabled={!prediction}>
                    比べてみる <ArrowRight size={18} />
                  </Button>
                </div>
              </section>
            ) : step === 2 ? (
              <section className="workspace">
                <div className="section-heading">
                  <div>
                    <Badge>02 比較と選択</Badge>
                    <h2>何を大切にすると、選び方が変わる？</h2>
                    <p>ものさしを切り替えて、違いを見つけよう。</p>
                  </div>
                  <span className="budget-pill">予想：{prediction}</span>
                </div>
                <div className="axis-tabs" aria-label="比較のものさし">
                  {(
                    [
                      ["price", "支払う値段"],
                      ["unit", "100mlあたり"],
                      ["left", "残るお金"],
                    ] as const
                  ).map(([a, l]) => (
                    <button
                      key={a}
                      onClick={() => setAxis(a)}
                      aria-pressed={axis === a}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <div className="product-grid compare">
                  {(["A", "B", "none"] as Choice[]).map((c) => {
                    const p = products[c];
                    const val =
                      axis === "price"
                        ? p.price
                        : axis === "left"
                          ? 300 - p.price
                          : c === "none"
                            ? null
                            : (p.price / p.ml) * 100;
                    return (
                      <button
                        key={c}
                        className={`product ${choice === c ? "selected" : ""}`}
                        aria-pressed={choice === c}
                        onClick={() => setChoice(c)}
                      >
                        <div className="compare-top">
                          <h3>{c === "none" ? "買わない" : `飲み物 ${c}`}</h3>
                          <span>{p.ml ? p.ml + "ml" : "今回は見送る"}</span>
                        </div>
                        <DrinkGraphic choice={c} />
                        <div className="metric">
                          <strong>{val ?? "—"}</strong>
                          {val !== null && <span>円</span>}
                        </div>
                        <p>
                          {axis === "unit"
                            ? c === "none"
                              ? "買わないので比較なし"
                              : "100mlあたり"
                            : axis === "left"
                              ? "買ったあとに残るお金"
                              : "今回、支払うお金"}
                        </p>
                        <div className="compare-detail">
                          {c === "none"
                            ? "300円はそのまま"
                            : `支払 ${p.price}円 · 残り ${300 - p.price}円`}
                        </div>
                        <span className="choice-caption">
                          {choice === c
                            ? "✓ これを選んだ"
                            : c === "none"
                              ? "今日は買わない"
                              : `${c}を選ぶ`}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="insight" aria-live="polite">
                  <Scale size={20} />
                  <span>
                    {axis === "price"
                      ? "Aは支払うお金が少ないね。必要な量も考えてみよう。"
                      : axis === "unit"
                        ? "同じ100mlならBが安い。でも、全部飲みきれるかな？"
                        : "残るお金はAなら120円、Bなら40円。どう使いたい？"}
                  </span>
                </div>
                <div className="help-row">
                  <button
                    className="text-button"
                    aria-expanded={hint}
                    onClick={() => setHint(!hint)}
                  >
                    固定ヒントを見る
                  </button>
                  <button
                    className="assist-trigger"
                    aria-expanded={assist}
                    onClick={() => setAssist(!assist)}
                  >
                    <Sparkles size={17} />
                    どう比べたらよい？
                  </button>
                </div>
                {hint && (
                  <div className="hint">
                    <Badge>固定ヒント</Badge>
                    <p>
                      値段・量・残るお金のうち、今の自分が大事にしたいものを一つ選んでみよう。
                    </p>
                  </div>
                )}
                {assist && (
                  <div className="assist-panel">
                    <div className="assist-title">
                      <Sparkles size={20} />
                      <b>大きな「どうしよう」を、小さな一歩に。</b>
                      <button
                        aria-label="手順提案を閉じる"
                        onClick={() => setAssist(false)}
                      >
                        <X size={20} />
                      </button>
                    </div>
                    <small>AIによる手順提案の表示例（模擬・API通信なし）</small>
                    <p>
                      「どう比べたらよい？」を選んだので、この3つの手順を表示しています。使うかどうかは、きみが決めてね。
                    </p>
                    <ol className="assist-steps">
                      <li>
                        <b>お金を確かめる</b>
                        <small>手順 budget</small>
                      </li>
                      <li>
                        <b>値段と量を比べる</b>
                        <small>手順 compare</small>
                      </li>
                      <li>
                        <b>理由をつけて選ぶ</b>
                        <small>手順 reason</small>
                      </li>
                    </ol>
                    {small && (
                      <p className="hint">
                        いまの一歩：まずAの「180円」と「200ml」を見つけよう。次にBの表示を見てみよう。
                      </p>
                    )}
                    <div className="small-actions">
                      <button onClick={() => setSmall(!small)}>
                        もっと小さく
                      </button>
                      <button onClick={() => setHint(true)}>
                        ヒントを見る
                      </button>
                      <button
                        onClick={() => {
                          setAssist(false);
                          setHint(false);
                        }}
                      >
                        自分で進む
                      </button>
                      <button
                        onClick={() => {
                          setAssist(false);
                          setPaused(true);
                        }}
                      >
                        やめる
                      </button>
                    </div>
                  </div>
                )}
                <div className="action-row">
                  <Button secondary onClick={() => setStep(1)}>
                    <ArrowLeft size={18} />
                    戻る
                  </Button>
                  <Button
                    disabled={!choice}
                    onClick={() => {
                      setAssist(false);
                      setStep(3);
                    }}
                  >
                    選んだ理由へ <ArrowRight size={18} />
                  </Button>
                </div>
              </section>
            ) : step === 3 ? (
              <section className="workspace reason-layout">
                <div>
                  <Badge>03 きみの理由</Badge>
                  <h2>選んだ理由を、残しておこう。</h2>
                  <p>正解を当てる問題じゃない。大切にしたことを教えて。</p>
                  <div className="reason-options">
                    {reasons.map((r) => (
                      <button
                        key={r}
                        onClick={() => setReason(r)}
                        aria-pressed={reason === r}
                      >
                        {r}
                        {reason === r && <Check size={18} />}
                      </button>
                    ))}
                  </div>
                  <label className="field-label" htmlFor="reason">
                    自分の言葉で書いてもいいよ
                  </label>
                  <textarea
                    id="reason"
                    maxLength={160}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="たとえば、今日は少しだけ飲みたいから。"
                  />
                  <div className="action-row">
                    <Button secondary onClick={() => setStep(2)}>
                      <ArrowLeft size={18} />
                      戻る
                    </Button>
                    <Button disabled={!reason.trim()} onClick={record}>
                      発見カードをつくる <BookOpen size={18} />
                    </Button>
                  </div>
                </div>
                <aside className="choice-summary">
                  <p className="eyebrow">YOUR CHOICE</p>
                  <DrinkGraphic choice={choice ?? "A"} />
                  <h2>{products[choice ?? "A"].name}</h2>
                  <dl>
                    <dt>はじめの予想</dt>
                    <dd>{prediction}</dd>
                    <dt>残るお金</dt>
                    <dd>{300 - products[choice ?? "A"].price}円</dd>
                  </dl>
                  <p>
                    予想と違っても、
                    <br />
                    同じでも。それがきみの選択。
                  </p>
                </aside>
              </section>
            ) : step === 4 && state.card ? (
              <div className="share-layout">
                <RecordCard card={state.card} />
                <section className="share-panel">
                  <Badge>
                    <Check size={15} />
                    発見カードができた
                  </Badge>
                  <h2>
                    この発見、
                    <br />
                    家族に見せる？
                  </h2>
                  <p>
                    選んだことと、きみの理由を見せます。
                    <br />
                    共有しなくても、この探検は完了だよ。
                  </p>
                  <div className="audience">
                    <ShieldCheck />
                    <span>
                      まず、おうちの人が確認
                      <small>承認後の共有先：おばあちゃん</small>
                    </span>
                  </div>
                  <Button
                    onClick={() => {
                      dispatch({ type: "share" });
                      setStep(5);
                    }}
                  >
                    この内容を共有する <ArrowRight size={18} />
                  </Button>
                  <Button secondary onClick={() => setStep(5)}>
                    共有しないで次へ
                  </Button>
                  <button className="text-button" onClick={() => setStep(3)}>
                    理由を直す
                  </button>
                </section>
              </div>
            ) : (
              <NextChild
                state={state}
                dispatch={dispatch}
                goParent={() => changeRole("parent")}
              />
            )}
          </>
        ) : role === "parent" ? (
          <Parent state={state} dispatch={dispatch} />
        ) : (
          <Grandparent state={state} dispatch={dispatch} />
        )}
      </main>
      <footer className="footer">
        <span>架空データ・発表用デモ</span>
        <span>外部への保存・送信・実AI通信なし</span>
        <span>再読み込みで最初に戻ります</span>
      </footer>
    </div>
  );
}
function NextChild({
  state,
  dispatch,
  goParent,
}: {
  state: State;
  dispatch: Dispatch<Action>;
  goParent: () => void;
}) {
  const [seed, setSeed] = useState(0);
  const [ended, setEnded] = useState(false);
  const seeds = [
    {
      title: "容器が違うと、何が変わる？",
      step: "家にある空の飲み物容器を2つ探して、量と素材の表示を比べてみよう。",
    },
    {
      title: "同じ量なら、値段はどう違う？",
      step: "飲み物の表示を2つ見つけて、100mlあたりの値段を書き出してみよう。",
    },
  ];
  return (
    <div className="next-layout">
      <section className="next-main">
        {state.reply ? (
          <div className="family-reply">
            <span className="avatar">
              <Heart size={23} />
            </span>
            <div>
              <Badge>
                {state.reply.author}の{replyKinds[state.reply.kind]}
              </Badge>
              <blockquote>「{state.reply.text}」</blockquote>
              <small>発見カード01への返信 · 本人の言葉（デモ）</small>
            </div>
          </div>
        ) : (
          <div className="quiet-message">
            <BookOpen size={23} />
            <div>
              <b>
                {state.sharing === "private"
                  ? "自分の発見帳に残したよ。"
                  : state.sharing === "pending"
                    ? "おうちの人に確認をお願いしたよ。"
                    : state.sharing === "held"
                      ? "おうちの人が共有を保留しているよ。"
                      : "家族の返事を待たずに、進めるよ。"}
              </b>
              <p>
                この探検は完了。次に進むのも、今日はここまでにするのも自由。
              </p>
            </div>
          </div>
        )}
        {state.next ? (
          <div className="next-result">
            <p className="eyebrow">NEXT ADVENTURE</p>
            <Leaf size={38} />
            <h2>{state.next.title}</h2>
            <Badge>{state.next.source}</Badge>
            <h3>次の一歩</h3>
            <p>{state.next.step}</p>
            <small>
              購入は不要。次の記録を家族へ自動共有することはありません。
            </small>
            <button
              className="text-button"
              onClick={() => {
                dispatch({
                  type: "next",
                  ...seeds[1 - seed],
                  fromReply: false,
                });
                setSeed(1 - seed);
              }}
            >
              別の問いに変える
            </button>
          </div>
        ) : ended ? (
          <section className="empty">
            <Flag size={36} />
            <h2>今日はここまで。発見、ひとつ。</h2>
            <p>次は、きみが気になったときに。</p>
            <Button secondary onClick={() => setEnded(false)}>
              次の問いを見てみる
            </Button>
          </section>
        ) : (
          <>
            <div className="section-heading">
              <div>
                <p className="eyebrow">NEXT SEED</p>
                <h2>
                  {state.reply
                    ? "家族の話から、何が気になった？"
                    : "次は、何を確かめたい？"}
                </h2>
              </div>
            </div>
            <div className="seed-grid">
              {seeds.map((s, i) => (
                <button
                  className={seed === i ? "seed selected" : "seed"}
                  onClick={() => setSeed(i)}
                  aria-pressed={seed === i}
                  key={s.title}
                >
                  <Leaf size={23} />
                  <b>{s.title}</b>
                  <small>
                    {i === 0 && state.reply
                      ? "家族の返信をきっかけに"
                      : "自分で選べる問い"}
                  </small>
                  {seed === i && <Check size={18} />}
                </button>
              ))}
            </div>
            <div className="action-row">
              <Button secondary onClick={() => setEnded(true)}>
                今日はここまで
              </Button>
              <Button
                onClick={() =>
                  dispatch({
                    type: "next",
                    ...seeds[seed],
                    fromReply: seed === 0 && !!state.reply,
                  })
                }
              >
                この問いを確かめたい <ArrowRight size={18} />
              </Button>
            </div>
          </>
        )}
      </section>
      <aside className="next-aside">
        {state.card && <RecordCard card={state.card} compact />}
        {state.sharing === "pending" && (
          <button className="presenter-next" onClick={goParent}>
            発表者：親の画面へ <ChevronRight size={18} />
          </button>
        )}
        {state.sharing !== "private" && (
          <button
            className="text-button"
            onClick={() => dispatch({ type: "revoke" })}
          >
            共有を取り消す
          </button>
        )}
      </aside>
    </div>
  );
}
function Parent({
  state,
  dispatch,
}: {
  state: State;
  dispatch: Dispatch<Action>;
}) {
  const visible = canParentRead(state);
  return (
    <>
      <div className="parent-heading">
        <div>
          <p className="eyebrow">FAMILY INBOX</p>
          <h1>はるの「自分で」を、見守る。</h1>
          <p>確認するのは、家族に共有するときだけ。</p>
        </div>
        <div className="inbox-count">
          <b>{visible && state.sharing !== "approved" ? 1 : 0}</b>
          <span>確認すること</span>
        </div>
      </div>
      <div className="inbox-nav">
        <span>
          <Mail size={20} />
          共有の確認
        </span>
        <span>本人の言葉を、そのまま。</span>
      </div>
      {!visible ? (
        <section className="empty">
          <Mail size={46} />
          <h2>今、確認することはありません。</h2>
          <p>はるが共有を選んだ発見カードが、ここに届きます。</p>
        </section>
      ) : (
        <div className="parent-layout">
          <RecordCard card={state.card!} />
          <section className="approval-panel">
            <Badge>
              {state.sharing === "approved"
                ? "✓ 承認済み"
                : state.sharing === "held"
                  ? "保留中"
                  : "共有の確認待ち"}
            </Badge>
            <h2>
              {state.sharing === "approved"
                ? "この内容を、おたよりに。"
                : "この発見を、家族に共有しますか？"}
            </h2>
            <dl className="approval-list">
              <dt>共有する人</dt>
              <dd>おばあちゃん</dd>
              <dt>共有する内容</dt>
              <dd>予想・選択・本人の理由</dd>
              <dt>本人の意思</dt>
              <dd>
                <Check size={17} />
                はるが共有を選択
              </dd>
              <dt>内容の版</dt>
              <dd>発見カード01 · 第{state.card!.revision}版</dd>
            </dl>
            <p className="quiet-note">
              写真・実際の家計情報は含まれません。選び方を採点する必要はありません。
            </p>
            {state.sharing !== "approved" ? (
              <>
                <Button
                  onClick={() =>
                    dispatch({
                      type: "approve",
                      revision: state.card!.revision,
                    })
                  }
                >
                  この内容・宛先で承認する <Check size={18} />
                </Button>
                <Button secondary onClick={() => dispatch({ type: "hold" })}>
                  {state.sharing === "held"
                    ? "保留を続ける"
                    : "いったん保留する"}
                </Button>
                {state.sharing === "held" && (
                  <p role="status">祖父母の画面には、まだ表示されません。</p>
                )}
              </>
            ) : (
              <>
                <div className="success-note" role="status">
                  <Check />
                  おばあちゃんの画面で、おたよりを読める状態になりました。
                </div>
                <Button secondary onClick={() => dispatch({ type: "hold" })}>
                  承認を取り消して保留にする
                </Button>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
function Grandparent({
  state,
  dispatch,
}: {
  state: State;
  dispatch: Dispatch<Action>;
}) {
  const [kind, setKind] = useState<ReplyKind | null>(null);
  const [text, setText] = useState("");
  if (!canGrandRead(state))
    return (
      <section className="empty grand-empty">
        <Mail size={50} />
        <p className="eyebrow">FAMILY LETTER</p>
        <h1>おたよりが届いたら、ここに。</h1>
        <p>
          今は、新しいおたよりはありません。
          <br />
          また気が向いたときに、のぞいてみてください。
        </p>
      </section>
    );
  return (
    <>
      <article className="newspaper">
        <div className="paper-meta">
          <span>はるから おばあちゃんへ</span>
          <span>発見だより 第01号</span>
        </div>
        <div className="paper-masthead">
          <Leaf size={30} />
          <h1>くらしの発見だより</h1>
          <Leaf size={30} />
        </div>
        <div className="paper-deck">
          今日の小さな選択が、家族の話のはじまりに。
        </div>
        <div className="paper-story">
          <div className="story-visual">
            <DrinkGraphic choice={state.card!.choice} />
            <span>はるが選んだのは</span>
            <b>{products[state.card!.choice].name}</b>
            <small>架空の買い物体験</small>
          </div>
          <div className="story-text">
            <Badge>はるの お買い物探検</Badge>
            <h2>
              「何が安い？」から、
              <br />
              「自分ならどうする？」へ。
            </h2>
            <p>
              300円の予算で、飲み物を比べました。
              <br />
              はじめの予想は「{state.card!.prediction}」。
              <br />
              最後は「{products[state.card!.choice].name}」を選びました。
            </p>
            <blockquote>
              「{state.card!.reason}」<cite>― はるが選んだ理由</cite>
            </blockquote>
          </div>
        </div>
        <div className="paper-bottom">
          発見カード01 · 第{state.card!.revision}版 ·
          はるの共有意思と親の承認を確認済み（デモ）
        </div>
      </article>
      <section className="reply-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A LITTLE REPLY</p>
            <h2>あなたの話も、ひとこと。</h2>
            <p>返信は自由です。読むだけでも大丈夫。</p>
          </div>
          <MessageCircle size={36} />
        </div>
        {state.reply ? (
          <div className="reply-done">
            <Check size={28} />
            <div>
              <b>{replyKinds[state.reply.kind]}を返しました（デモ）</b>
              <p>「{state.reply.text}」</p>
              <small>はるが読むと、次の問いを選ぶきっかけになります。</small>
            </div>
          </div>
        ) : state.skippedReply ? (
          <div className="reply-done">
            <BookOpen size={28} />
            <div>
              <b>今日は、読むだけ。</b>
              <p>返事がなくても、はるの探検は続きます。</p>
              <button
                className="text-button"
                onClick={() => {
                  setKind("experience");
                  setText(replyExamples.experience);
                }}
              >
                返信を書く
              </button>
            </div>
          </div>
        ) : null}
        {!state.reply && (!state.skippedReply || kind) && (
          <>
            <div className="reply-types">
              {(Object.keys(replyKinds) as ReplyKind[]).map((k) => (
                <button
                  key={k}
                  aria-pressed={kind === k}
                  onClick={() => {
                    setKind(k);
                    setText(replyExamples[k]);
                  }}
                >
                  <span>
                    {k === "experience" ? (
                      <BookOpen />
                    ) : k === "question" ? (
                      <MessageCircle />
                    ) : (
                      <Heart />
                    )}
                  </span>
                  <b>
                    {k === "experience"
                      ? "経験を伝える"
                      : k === "question"
                        ? "質問する"
                        : "応援する"}
                  </b>
                </button>
              ))}
            </div>
            {kind && (
              <div className="reply-compose">
                <label htmlFor="reply-text">
                  おばあちゃんの{replyKinds[kind]}
                </label>
                <textarea
                  id="reply-text"
                  value={text}
                  maxLength={240}
                  onChange={(e) => setText(e.target.value)}
                />
                <small>架空の返信例です。自由に直せます。</small>
                <Button
                  disabled={!text.trim()}
                  onClick={() => {
                    dispatch({ type: "reply", kind, text });
                    setKind(null);
                  }}
                >
                  この言葉を返す <ArrowRight size={21} />
                </Button>
              </div>
            )}
            <button
              className="text-button"
              onClick={() => {
                dispatch({ type: "skipReply" });
                setKind(null);
              }}
            >
              今回は返信しない
            </button>
          </>
        )}
      </section>
    </>
  );
}
export default App;
