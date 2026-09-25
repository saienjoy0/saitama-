/**
 * GAKU∞STA保護者インタビュー受付フォーム生成。
 * Google Apps Script に貼り付け、本人のアカウントで createIntakeForm() を一度実行する。
 * 初期状態は非公開・回答停止。生成済みIDを Script Properties に保存する。
 * 実URL・編集URL・回答シートURLを公開リポジトリへ記録しない。
 */
const CONFIG = {
  publicContactEmail: '',
  availabilityJst: '',
  honorariumTerms: '',
  closingDateJst: ''
};

function requireSettings() {
  const missing = Object.keys(CONFIG).filter((key) => !String(CONFIG[key]).trim());
  if (missing.length) {
    throw new Error('公開前の設定が足りません: ' + missing.join(', '));
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(CONFIG.publicContactEmail)) {
    throw new Error('公開用メールアドレスを確認してください');
  }
}

function createIntakeForm() {
  requireSettings();
  const props = PropertiesService.getScriptProperties();
  const existingId = props.getProperty('GAKUSTA_INTAKE_FORM_ID');
  if (existingId) {
    const existing = FormApp.openById(existingId);
    if (existing.getItems().length !== 11) {
      throw new Error('前回の作成が途中で止まりました。編集先: ' + existing.getEditUrl() + '。未完成フォームを確認してから手動で復旧してください。自動で重複作成はしません。');
    }
    console.log('既存フォームの編集先: ' + existing.getEditUrl());
    console.log('回答者向けURL: ' + existing.getPublishedUrl());
    return existingId;
  }

  const sheet = SpreadsheetApp.create('GAKU∞STA保護者インタビュー応募回答・非公開');
  const form = FormApp.create('保護者インタビューへの応募', false);
  // 途中で権限エラーが出ても新規フォームを何度も作らないよう先に記録する。
  props.setProperty('GAKUSTA_INTAKE_FORM_ID', form.getId());
  props.setProperty('GAKUSTA_INTAKE_SHEET_ID', sheet.getId());
  form.setDescription(
    '武田怜雨がGAKU∞STA参加者として個人の事業検討のため実施します。' +
    '小学5〜6年生の保護者の方に、家庭でのお金の話や親子のやり取りについて、' +
    'オンラインで20〜30分、最近の実際の経験を伺います。困っていない方も歓迎します。' +
    'お子さんの参加・商品の購入・録音録画は不要。日時は応募後に調整します。\n' +
    '面談可能枠（日本時間）: ' + CONFIG.availabilityJst + '\n' +
    '謝礼: ' + CONFIG.honorariumTerms + '\n' +
    '募集終了: ' + CONFIG.closingDateJst + '\n' +
    '回答・メールアドレスは応募確認と日程調整、匿名化した調査結果の整理に使い、' +
    '本人の非公開アカウントで管理します。連絡先と詳細メモは2026年11月16日を目安に削除します。' +
    '面談はいつでも辞退でき、答えにくい質問は飛ばせます。販促には使用しません。' +
    '修正・辞退の連絡先: ' + CONFIG.publicContactEmail
  );
  form.setCollectEmail(false);
  form.setLimitOneResponsePerUser(false);
  form.setPublishingSummary(false);
  form.setAllowResponseEdits(false);
  form.setIsQuiz(false);
  form.setShuffleQuestions(false);
  form.setShowLinkToRespondAgain(false);
  form.setConfirmationMessage(
    'ご回答ありがとうございます。メールアドレスを入力して応募された方には、内容を確認し原則48時間以内にご連絡します。' +
    'これは日程確定ではありません。対象や日程によりお願いできない場合もあります。' +
    '対象外として終了しメールアドレスを入力していない方への日程連絡は行いません。' +
    '修正・辞退は ' + CONFIG.publicContactEmail + ' へご連絡ください。'
  );

  const q1 = form.addMultipleChoiceItem()
    .setTitle('Q1 お子さんの学年を教えてください').setRequired(true);
  const main = form.addPageBreakItem().setTitle('保護者の方へ');

  form.addMultipleChoiceItem().setTitle('Q2 お子さんとのご関係を教えてください')
    .setChoiceValues(['父親', '母親', 'その他の保護者']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('Q3 お子さんとの暮らし方に近いものを選んでください')
    .setChoiceValues(['自分が同居', '自分が仕事等で別居', 'その他', '回答しない']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('Q4 直近1か月にお子さんとお金や買い物について話したことはありますか')
    .setChoiceValues(['ある', 'ない', '思い出せない']).setRequired(true);
  form.addMultipleChoiceItem().setTitle('Q5 お子さんとお金や買い物について話すとき、今のやり方をどう感じていますか')
    .setChoiceValues(['おおむね十分', '一部気になる', '困っている', '分からない']);
  form.addTextItem().setTitle('Q6 お話しできそうな日時を日本時間で2〜3つ教えてください')
    .setHelpText('まだ分からない場合は「まだ分からない」と記入できます').setRequired(true);
  form.addTextItem().setTitle('Q7 日程調整のメールアドレスを教えてください')
    .setValidation(FormApp.createTextValidation().requireTextIsEmail().build()).setRequired(true);
  form.addCheckboxItem().setTitle('Q8 下記を確認し、同意いただけますか')
    .setChoiceValues(['私は18歳以上の保護者です。調査目的と情報の取扱いを確認し、応募の確認・日程調整にメールアドレスを使うことに同意します'])
    .setRequired(true);
  form.addMultipleChoiceItem().setTitle('Q9 この募集をどこで知りましたか')
    .setChoiceValues(['知人からの紹介', 'GAKU∞STAのつながり', 'X', 'その他', '回答しない']);

  const outOfScope = form.addPageBreakItem().setTitle('対象外のご案内')
    .setHelpText('今回は小学5〜6年生の保護者の方を対象としています。この条件では日程調整のご連絡は行いません。ご確認ありがとうございました。');
  // PageBreak の移動設定は、その区切りの直前のページに適用される。
  // Q2〜Q9を終えた後、対象外案内のページへ進ませずそのまま送信する。
  outOfScope.setGoToPage(FormApp.PageNavigationType.SUBMIT);
  q1.setChoices([
    q1.createChoice('小学5年生', main),
    q1.createChoice('小学6年生', main),
    q1.createChoice('どちらもいる', main),
    q1.createChoice('その他', outOfScope)
  ]);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());
  form.setAcceptingResponses(false);
  console.log('編集先: ' + form.getEditUrl());
  console.log('回答者向けURL: ' + form.getPublishedUrl());
  console.log('回答シート: ' + sheet.getUrl());
  console.log('初期状態は非公開・回答停止。アクセス設定と合成回答を確認するまで募集に使用しないでください。');
  return form.getId();
}
