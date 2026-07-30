import assert from "node:assert/strict";
import test from "node:test";

import { isSingleFileComponent, scriptOf } from "../scripts/lib/sfc.mjs";

const lineOf = (text, needle) => text.slice(0, text.indexOf(needle)).split("\n").length;

test("only .vue files are single file components", () => {
  assert.equal(isSingleFileComponent("src/Widget.vue"), true);
  assert.equal(isSingleFileComponent("src/widget.ts"), false);
});

test("script content keeps its original line numbers", () => {
  const source = `<template>
  <p>{{ label }}</p>
</template>

<script setup lang="ts">
const label = "hi";
</script>
`;
  const { text } = scriptOf(source);

  assert.equal(lineOf(text, 'const label = "hi";'), 6);
  assert.equal(text.split("\n").length, source.split("\n").length);
});

test("template and style content is blanked out", () => {
  const source = `<template>
  <p>keep out</p>
</template>

<script lang="ts">
export const kept = 1;
</script>

<style scoped>
p { color: red; }
</style>
`;
  const { text } = scriptOf(source);

  assert.ok(!text.includes("keep out"));
  assert.ok(!text.includes("color: red"));
  assert.ok(text.includes("export const kept = 1;"));
});

test("the lang attribute selects the dialect", () => {
  assert.equal(scriptOf(`<script lang="ts">const a = 1;</script>`).lang, "ts");
  assert.equal(scriptOf(`<script lang='tsx'>const a = 1;</script>`).lang, "tsx");
  assert.equal(scriptOf(`<script>const a = 1;</script>`).lang, "js");
  assert.equal(scriptOf(`<script setup>const a = 1;</script>`).lang, "js");
});

test("a typed block wins over an untyped one", () => {
  const source = `<script lang="ts">
export const a = 1;
</script>

<script setup>
const b = 2;
</script>
`;
  const { text, lang } = scriptOf(source);

  assert.equal(lang, "ts");
  assert.ok(text.includes("export const a = 1;"));
  assert.ok(text.includes("const b = 2;"));
});

test("a component without a script block yields blank text", () => {
  const { text } = scriptOf(`<template>\n  <p>only markup</p>\n</template>\n`);

  assert.equal(text.trim(), "");
});
