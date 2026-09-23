export type Choice = "A" | "B" | "none";
export type ReplyKind = "experience" | "question" | "cheer";
export const products = {
  A: { name: "A：ちいさい飲み物", price: 180, ml: 200 },
  B: { name: "B：おおきい飲み物", price: 260, ml: 400 },
  none: { name: "今日は買わない", price: 0, ml: 0 },
} as const;
export const replyKinds = {
  experience: "経験",
  question: "質問",
  cheer: "応援",
} as const;
export const replyExamples = {
  experience: "私が子どものころは、飲み物を瓶で買っていたよ。",
  question: "容器が違うと、選び方も変わるかな？",
  cheer: "値段だけでなく、飲みきれる量まで考えたんだね。",
};
export type Card = {
  id: string;
  revision: number;
  prediction: string;
  choice: Choice;
  reason: string;
  audience: "おばあちゃん";
};
export type State = {
  card: Card | null;
  sharing: "private" | "pending" | "held" | "approved";
  approvedRevision: number | null;
  reply: {
    id: string;
    kind: ReplyKind;
    text: string;
    author: string;
    cardRevision: number;
  } | null;
  skippedReply: boolean;
  next: { title: string; step: string; source: string } | null;
};
export const initialState: State = {
  card: null,
  sharing: "private",
  approvedRevision: null,
  reply: null,
  skippedReply: false,
  next: null,
};
export type Action =
  | { type: "record"; prediction: string; choice: Choice; reason: string }
  | { type: "share" }
  | { type: "hold" }
  | { type: "approve"; revision: number }
  | { type: "reply"; kind: ReplyKind; text: string }
  | { type: "skipReply" }
  | { type: "next"; title: string; step: string; fromReply: boolean }
  | { type: "revoke" }
  | { type: "reset" };
export const canParentRead = (s: State) => !!s.card && s.sharing !== "private";
export const canGrandRead = (s: State) =>
  !!s.card &&
  s.sharing === "approved" &&
  s.approvedRevision === s.card.revision;
export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "record":
      if (!a.reason.trim()) return s;
      return {
        ...initialState,
        card: {
          id: "DISCOVERY-01",
          revision: (s.card?.revision ?? 0) + 1,
          prediction: a.prediction,
          choice: a.choice,
          reason: a.reason.trim(),
          audience: "おばあちゃん",
        },
      };
    case "share":
      return s.card
        ? {
            ...s,
            sharing: "pending",
            approvedRevision: null,
            reply: null,
            skippedReply: false,
            next: null,
          }
        : s;
    case "hold":
      return canParentRead(s)
        ? {
            ...s,
            sharing: "held",
            approvedRevision: null,
            reply: null,
            skippedReply: false,
            next: null,
          }
        : s;
    case "approve":
      return canParentRead(s) && s.card?.revision === a.revision
        ? { ...s, sharing: "approved", approvedRevision: a.revision }
        : s;
    case "reply":
      return canGrandRead(s) && a.text.trim()
        ? {
            ...s,
            reply: {
              id: "REPLY-01",
              kind: a.kind,
              text: a.text.trim(),
              author: "おばあちゃん",
              cardRevision: s.card!.revision,
            },
            skippedReply: false,
            next: null,
          }
        : s;
    case "skipReply":
      return canGrandRead(s)
        ? { ...s, reply: null, skippedReply: true, next: null }
        : s;
    case "next":
      return s.card
        ? {
            ...s,
            next: {
              title: a.title,
              step: a.step,
              source:
                a.fromReply && s.reply
                  ? `${s.reply.author}の${replyKinds[s.reply.kind]} / ${s.reply.id}`
                  : "自分で選んだ問い",
            },
          }
        : s;
    case "revoke":
      return {
        ...s,
        sharing: "private",
        approvedRevision: null,
        reply: null,
        skippedReply: false,
        next: null,
      };
    case "reset":
      return { ...initialState };
  }
}
