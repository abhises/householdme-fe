export const usd = (n: number) => "$" + n.toLocaleString("en-US");
export const score = (n: number) => n.toFixed(1);
export const pct = (n: number) => `${Math.max(0, Math.min(100, n))}%`;
export const stars = (n: number) => {
  const r = Math.round(n);
  return "★★★★★".slice(0, r) + "☆☆☆☆☆".slice(0, 5 - r);
};
export const firstName = (name: string) => name.split(" ")[0];
