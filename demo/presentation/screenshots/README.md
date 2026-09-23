# 画面バックアップ

この環境ではブラウザのURLポリシーによりlocalhost/file:が開けず、スクリーンショットは未取得。

ブラウザを利用できるCodex環境で:

```
npm ci
npx playwright install chromium
npm run build
npm run test:browser
```

`automated/` にPC1280×720とスマホ390×844の画面が出力される。
子ホーム、親確認、おたより、次の一歩、模擬AI、文字200%のPNG。
自動生成画像・レポートはgitignore対象。発表前に実画像を目視してから、ZIPや発表資料のバックアップへ保存する。
生成・目視確認していない画像を「完成画面」として提示しない。
