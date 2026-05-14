export function createRepoFingerprint(input: string) {
  let hash = 2166136261;

  for (const char of input) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  const rows: string[] = [];

  for (let row = 0; row < 6; row += 1) {
    let line = "";

    for (let column = 0; column < 10; column += 1) {
      const bit = (hash >> ((row * 10 + column) % 24)) & 1;
      line += bit ? "█" : "·";
    }

    rows.push(line);
  }

  return rows;
}
