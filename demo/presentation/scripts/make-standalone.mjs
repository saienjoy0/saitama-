import { readFile, writeFile, readdir } from "node:fs/promises";
const files = await readdir(new URL("../dist/assets/", import.meta.url));
const js = await readFile(
  new URL(
    "../dist/assets/" + files.find((f) => f.endsWith(".js")),
    import.meta.url,
  ),
  "utf8",
);
const css = await readFile(
  new URL(
    "../dist/assets/" + files.find((f) => f.endsWith(".css")),
    import.meta.url,
  ),
  "utf8",
);
const html =
  '<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>やってみクエスト｜発表用デモ</title><style>' +
  css.replaceAll("</style", "<\\/style") +
  '</style></head><body><div id="root"></div><script type="module">' +
  js.replaceAll("</script", "<\\/script") +
  "</script></body></html>";
await writeFile(new URL("../presentation-offline.html", import.meta.url), html);
await writeFile(
  new URL("../dist/presentation-offline.html", import.meta.url),
  html,
);
console.log("presentation-offline.html: self-contained, no external assets");
