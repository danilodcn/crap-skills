const SCRIPT_BLOCK = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
const LANG_ATTRIBUTE = /\blang\s*=\s*["']([^"']+)["']/i;
const OPENING_TAG_OVERHEAD = "<script".length + ">".length;
const TYPED = new Set(["ts", "tsx"]);

export const isSingleFileComponent = (filePath) => filePath.endsWith(".vue");

export function scriptOf(sourceText) {
  const characters = sourceText.replace(/[^\n]/g, " ").split("");
  let lang = null;
  for (const block of sourceText.matchAll(SCRIPT_BLOCK)) {
    const [, attributes, body] = block;
    const bodyStart = block.index + OPENING_TAG_OVERHEAD + attributes.length;
    for (let offset = 0; offset < body.length; offset += 1) {
      characters[bodyStart + offset] = body[offset];
    }
    const declared = LANG_ATTRIBUTE.exec(attributes)?.[1].toLowerCase() ?? null;
    if (declared !== null && (lang === null || !TYPED.has(lang))) {
      lang = declared;
    }
  }
  return { text: characters.join(""), lang: lang ?? "js" };
}
