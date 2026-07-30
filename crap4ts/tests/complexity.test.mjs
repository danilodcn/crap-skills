import assert from "node:assert/strict";
import test from "node:test";

import { extractFunctions } from "../scripts/lib/complexity.mjs";

const find = (functions, name) => functions.find((entry) => entry.name === name);

test("counts decision points and adds one", () => {
  const source = `
export function messy(a: number, b: number[]) {
  if (a && b) {
    return 1;
  }
  for (const item of b) {
    if (item > 2) return item;
  }
  switch (a) {
    case 1:
      return 1;
    default:
      return 0;
  }
}
`;
  const messy = find(extractFunctions("sample.ts", source), "messy");

  assert.equal(messy.complexity, 6);
});

test("nullish and ternary operators count", () => {
  const source = `const pick = (a?: number) => (a ?? 0) > 1 ? "big" : "small";`;

  assert.equal(find(extractFunctions("sample.ts", source), "pick").complexity, 3);
});

test("default clause does not count", () => {
  const source = `
function only(a: number) {
  switch (a) {
    default:
      return 0;
  }
}
`;

  assert.equal(find(extractFunctions("sample.ts", source), "only").complexity, 1);
});

test("nested functions are separate entries and do not inflate the parent", () => {
  const source = `
export function outer(values: number[]) {
  return values.map((value) => {
    if (value > 0) return value;
    return 0;
  });
}
`;
  const functions = extractFunctions("sample.ts", source);

  assert.equal(find(functions, "outer").complexity, 1);
  assert.equal(functions.length, 2);
  assert.equal(functions[1].complexity, 2);
});

test("methods are qualified by their class", () => {
  const source = `
export class Order {
  process(amount: number) {
    if (amount > 0) return amount;
    return 0;
  }
}
`;
  const method = find(extractFunctions("sample.ts", source), "Order.process");

  assert.equal(method.complexity, 2);
});

test("arrow assigned to a const takes the variable name", () => {
  const source = `const compute = (a: number) => a + 1;`;

  assert.ok(find(extractFunctions("sample.ts", source), "compute"));
});

test("anonymous functions are named by line", () => {
  const source = `[1, 2].forEach(function () { return 1; });`;
  const functions = extractFunctions("sample.ts", source);

  assert.equal(functions[0].name, "<anonymous>:1");
});

test("line range spans the whole function", () => {
  const source = `
function spans() {
  return 1;
}
`;
  const spans = find(extractFunctions("sample.ts", source), "spans");

  assert.equal(spans.startLine, 2);
  assert.equal(spans.endLine, 4);
});

test("single file component functions keep their line numbers in the .vue file", () => {
  const source = `<template>
  <p @click="bump">{{ label }}</p>
</template>

<script setup lang="ts">
const props = defineProps<{ score: number }>();

function grade(n: number) {
  if (n > 90) return "A";
  if (n > 80) return "B";
  return "F";
}
</script>
`;
  const grade = find(extractFunctions("src/Widget.vue", source), "grade");

  assert.equal(grade.startLine, 8);
  assert.equal(grade.endLine, 12);
  assert.equal(grade.complexity, 3);
});

test("markup never leaks into the parsed script of a component", () => {
  const source = `<template>
  <p>Use the \` character to quote code</p>
</template>

<script setup lang="ts">
function classify(n: number) {
  if (n > 10) return "big";
  return "small";
}
</script>
`;
  const functions = extractFunctions("src/Backtick.vue", source);

  assert.equal(functions.length, 1);
  assert.equal(find(functions, "classify").complexity, 2);
});

test("an untyped component script parses as javascript", () => {
  const source = `<script setup>
function half(n) {
  return n > 0 ? n / 2 : 0;
}
</script>
`;
  const half = find(extractFunctions("src/Plain.vue", source), "half");

  assert.equal(half.complexity, 2);
});
