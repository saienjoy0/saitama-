import { test } from "node:test";
import assert from "node:assert/strict";
import {
  initialState,
  reducer,
  canParentRead,
  canGrandRead,
} from "../src/state.ts";
const recorded = () =>
  reducer(initialState, {
    type: "record",
    prediction: "Bがよさそう",
    choice: "A",
    reason: "飲みきれる量を選びたい",
  });
test("非共有カードは親にも祖父母にも表示されない", () => {
  const s = recorded();
  assert.equal(canParentRead(s), false);
  assert.equal(canGrandRead(s), false);
  assert.equal(reducer(s, { type: "approve", revision: 1 }), s);
});
test("親が保留中は祖父母には非表示、原文は不変", () => {
  const s = reducer(reducer(recorded(), { type: "share" }), { type: "hold" });
  assert.equal(canParentRead(s), true);
  assert.equal(canGrandRead(s), false);
  assert.equal(s.card?.reason, "飲みきれる量を選びたい");
});
test("承認した版のみ閲覧、返信の出所が次の一歩まで残る", () => {
  let s = reducer(recorded(), { type: "share" });
  assert.equal(reducer(s, { type: "approve", revision: 99 }), s);
  s = reducer(s, { type: "approve", revision: 1 });
  assert.equal(canGrandRead(s), true);
  s = reducer(s, {
    type: "reply",
    kind: "experience",
    text: "瓶で買っていたよ",
  });
  s = reducer(s, {
    type: "next",
    title: "容器を比べる",
    step: "家にある容器を2つ探す",
    fromReply: true,
  });
  assert.match(s.next!.source, /おばあちゃんの経験/);
  assert.equal(s.reply?.cardRevision, 1);
});
test("無返信でも次の問いを選べる", () => {
  let s = reducer(reducer(recorded(), { type: "share" }), {
    type: "approve",
    revision: 1,
  });
  s = reducer(s, { type: "skipReply" });
  s = reducer(s, {
    type: "next",
    title: "量を比べる",
    step: "ラベルを見る",
    fromReply: false,
  });
  assert.equal(s.next?.source, "自分で選んだ問い");
});
test("撤回・新しい版は承認、返信、派生を失効させる", () => {
  let s = reducer(reducer(recorded(), { type: "share" }), {
    type: "approve",
    revision: 1,
  });
  s = reducer(s, { type: "reply", kind: "question", text: "容器は？" });
  const revoked = reducer(s, { type: "revoke" });
  assert.equal(canGrandRead(revoked), false);
  assert.equal(revoked.reply, null);
  const edited = reducer(s, {
    type: "record",
    prediction: "B",
    choice: "none",
    reason: "今はいらない",
  });
  assert.equal(edited.card?.revision, 2);
  assert.equal(canParentRead(edited), false);
  assert.equal(edited.approvedRevision, null);
});
test("リセットはすべての一時状態を消去", () =>
  assert.deepEqual(reducer(recorded(), { type: "reset" }), initialState));
