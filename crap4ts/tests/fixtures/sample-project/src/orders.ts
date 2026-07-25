export function process(amount: number, discount: number): number {
  if (amount > 0 && discount) {
    return amount - discount;
  }
  for (let index = 0; index < amount; index += 1) {
    if (amount > 10) {
      return 10;
    }
  }
  return 0;
}

export function describe(amount: number): string {
  return `order of ${amount}`;
}
