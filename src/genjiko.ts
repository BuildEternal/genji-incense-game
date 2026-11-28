// The 52 Genji-kō patterns (源氏香之図), chapters 2–53 of The Tale of Genji.
// Positions 1–5 are the order of burning (here: of reading). On the diagram the first
// position is the rightmost line (Kotobank, 世界大百科事典). Partitions follow
// Oran Looney, "The Art and Mathematics of Genji-Kō", Appendix C
// (https://www.oranlooney.com/post/genji-ko/). English chapter names are plain literal glosses
// written for this project. Diagrams are drawn in code, not images.

export type GenjiPattern = { chapter: number; ja: string; romaji: string; english: string; groups: number[][] };

const P = (chapter: number, ja: string, romaji: string, english: string, groups: number[][]): GenjiPattern =>
  ({ chapter, ja, romaji, english, groups });

export const PATTERNS: readonly GenjiPattern[] = [
  P(2, '帚木', 'Hahakigi', 'The Broom Tree', [[1], [2], [3], [4], [5]]),
  P(3, '空蝉', 'Utsusemi', 'The Cicada Shell', [[1], [2], [3], [4, 5]]),
  P(4, '夕顔', 'Yūgao', 'Evening Faces', [[1], [2], [3, 4], [5]]),
  P(5, '若紫', 'Wakamurasaki', 'Young Murasaki', [[1], [2, 3], [4, 5]]),
  P(6, '末摘花', 'Suetsumuhana', 'The Safflower', [[1, 2, 3, 4], [5]]),
  P(7, '紅葉賀', 'Momiji no Ga', 'Autumn Leaf Celebration', [[1], [2, 3, 5], [4]]),
  P(8, '花宴', 'Hana no En', 'The Flower Banquet', [[1], [2], [3, 5], [4]]),
  P(9, '葵', 'Aoi', 'Heartvine', [[1, 2], [3], [4], [5]]),
  P(10, '賢木', 'Sakaki', 'The Sacred Tree', [[1, 2, 3], [4, 5]]),
  P(11, '花散里', 'Hanachirusato', 'Village of Falling Flowers', [[1], [2, 4], [3, 5]]),
  P(12, '須磨', 'Suma', 'Suma', [[1, 3, 4], [2, 5]]),
  P(13, '明石', 'Akashi', 'Akashi', [[1], [2, 3], [4], [5]]),
  P(14, '澪標', 'Miotsukushi', 'Channel Markers', [[1], [2, 4, 5], [3]]),
  P(15, '蓬生', 'Yomogiu', 'The Wormwood Patch', [[1, 2, 3], [4], [5]]),
  P(16, '関屋', 'Sekiya', 'The Barrier House', [[1], [2, 3, 4], [5]]),
  P(17, '絵合', 'Eawase', 'The Picture Contest', [[1, 3], [2, 5], [4]]),
  P(18, '松風', 'Matsukaze', 'Wind in the Pines', [[1, 2], [3, 4], [5]]),
  P(19, '薄雲', 'Usugumo', 'Thin Clouds', [[1], [2, 3, 4, 5]]),
  P(20, '朝顔', 'Asagao', 'Morning Glory', [[1, 3, 4], [2], [5]]),
  P(21, '少女', 'Otome', 'The Maidens', [[1, 3], [2], [4], [5]]),
  P(22, '玉鬘', 'Tamakazura', 'The Jeweled Garland', [[1, 2], [3, 4, 5]]),
  P(23, '初音', 'Hatsune', 'The First Song', [[1, 3], [2, 4], [5]]),
  P(24, '胡蝶', 'Kochō', 'Butterflies', [[1, 4], [2, 3, 5]]),
  P(25, '蛍', 'Hotaru', 'Fireflies', [[1, 2, 4], [3], [5]]),
  P(26, '常夏', 'Tokonatsu', 'Pinks', [[1], [2], [3, 4, 5]]),
  P(27, '篝火', 'Kagaribi', 'Cressets', [[1], [2, 4], [3], [5]]),
  P(28, '野分', 'Nowaki', 'The Typhoon', [[1, 2], [3], [4, 5]]),
  P(29, '行幸', 'Miyuki', 'The Royal Outing', [[1, 3], [2, 4, 5]]),
  P(30, '藤袴', 'Fujibakama', 'Purple Trousers', [[1, 4], [2], [3], [5]]),
  P(31, '真木柱', 'Makibashira', 'The Cypress Pillar', [[1, 5], [2, 4], [3]]),
  P(32, '梅枝', 'Umegae', 'The Plum Branch', [[1, 2, 3, 5], [4]]),
  P(33, '藤裏葉', 'Fuji no Uraba', 'Wisteria Leaves', [[1], [2, 5], [3, 4]]),
  P(34, '若菜上', 'Wakana Jō', 'Young Herbs I', [[1, 2, 5], [3, 4]]),
  P(35, '若菜下', 'Wakana Ge', 'Young Herbs II', [[1, 3], [2], [4, 5]]),
  P(36, '柏木', 'Kashiwagi', 'The Oak Tree', [[1, 3, 5], [2], [4]]),
  P(37, '横笛', 'Yokobue', 'The Flute', [[1, 4, 5], [2], [3]]),
  P(38, '鈴虫', 'Suzumushi', 'The Bell Cricket', [[1, 5], [2], [3, 4]]),
  P(39, '夕霧', 'Yūgiri', 'Evening Mist', [[1, 4], [2], [3, 5]]),
  P(40, '御法', 'Minori', 'The Law', [[1, 4], [2, 5], [3]]),
  P(41, '幻', 'Maboroshi', 'Phantom', [[1, 5], [2], [3], [4]]),
  P(42, '匂宮', 'Niou Miya', 'The Fragrant Prince', [[1, 2, 4], [3, 5]]),
  P(43, '紅梅', 'Kōbai', 'Red Plum', [[1], [2, 5], [3], [4]]),
  P(44, '竹河', 'Takekawa', 'Bamboo River', [[1, 5], [2, 3, 4]]),
  P(45, '橋姫', 'Hashihime', 'Lady of the Bridge', [[1, 3, 4, 5], [2]]),
  P(46, '椎本', 'Shii ga Moto', 'Beneath the Oak', [[1, 4], [2, 3], [5]]),
  P(47, '総角', 'Agemaki', 'Trefoil Knots', [[1, 4, 5], [2, 3]]),
  P(48, '早蕨', 'Sawarabi', 'Early Bracken', [[1, 2], [3, 5], [4]]),
  P(49, '宿木', 'Yadorigi', 'Mistletoe', [[1, 2, 4, 5], [3]]),
  P(50, '東屋', 'Azumaya', 'The Eastern Cottage', [[1, 2, 5], [3], [4]]),
  P(51, '浮舟', 'Ukifune', 'A Drifting Boat', [[1, 5], [2, 3], [4]]),
  P(52, '蜻蛉', 'Kagerō', 'The Mayfly', [[1, 3, 5], [2, 4]]),
  P(53, '手習', 'Tenarai', 'Writing Practice', [[1, 2, 3, 4, 5]]),
];

/** Canonical labels for five positions, by first appearance: e.g. "ABACB". */
export function canonicalKey(labels: readonly (string | number)[]): string {
  const map = new Map<string | number, string>();
  return labels.map(v => { if (!map.has(v)) map.set(v, String.fromCharCode(65 + map.size)); return map.get(v)!; }).join('');
}

export function patternKey(pattern: GenjiPattern): string {
  const labels = Array<number>(5);
  pattern.groups.forEach((group, index) => group.forEach(position => { labels[position - 1] = index; }));
  return canonicalKey(labels);
}

const byKey = new Map(PATTERNS.map(pattern => [patternKey(pattern), pattern]));

/** The Genji-kō pattern for five group labels, e.g. ['A','B','A','C','B'] → 花散里's mirror, etc. */
export function patternFor(labels: readonly (string | number)[]): GenjiPattern {
  const pattern = byKey.get(canonicalKey(labels));
  if (!pattern) throw new Error(`No Genji-kō pattern for ${labels.join('')}`);
  return pattern;
}

/**
 * The real procedure: five incenses, five packets of each (25 packets), shuffled; five are drawn.
 * Returns the five drawn incense numbers in order of burning. Each pattern therefore has its
 * real-life odds (e.g. 2+1+1+1 shapes 47%, all different 5.9%, all the same 0.009%).
 */
export function drawPackets(random: () => number): number[] {
  const packets = Array.from({ length: 25 }, (_, i) => i % 5);
  for (let i = 0; i < 5; i++) {
    const j = i + Math.floor(random() * (25 - i));
    [packets[i], packets[j]] = [packets[j], packets[i]];
  }
  return packets.slice(0, 5);
}

/**
 * SVG of a Genji-kō diagram: five vertical lines, the first position on the right.
 * Lines of one group are joined by a bar across their tops. A bar that spans a line of
 * another group sits lower than that group's bar, and lines passing under a bar are cut short.
 */
export function patternSvg(groups: readonly (readonly number[])[], label = ''): string {
  const W = 60, H = 60, top = 8, step = 9, gap = 11;
  const x = (p: number) => W - 8 - (p - 1) * gap;
  const multi = groups.filter(g => g.length > 1).map(g => [...g].sort((a, b) => a - b));
  // Level 0 is the top. A group sits below any group with a line inside its span, wider groups first.
  const level = new Map<readonly number[], number>();
  const sorted = [...multi].sort((a, b) => (b[b.length - 1] - b[0]) - (a[a.length - 1] - a[0]) || a[0] - b[0]);
  for (const g of sorted) {
    const [lo, hi] = [g[0], g[g.length - 1]];
    let lvl = 0;
    for (const h of sorted) {
      if (h === g || !level.has(h)) continue;
      const [hlo, hhi] = [h[0], h[h.length - 1]];
      const overlaps = h.some(p => p > lo && p < hi) || g.some(p => p > hlo && p < hhi);
      if (overlaps) lvl = Math.max(lvl, level.get(h)! + 1);
    }
    level.set(g, lvl);
  }
  const y = (lvl: number) => top + lvl * step;
  const parts: string[] = [];
  for (let p = 1; p <= 5; p++) {
    const own = multi.find(g => g.includes(p));
    let start = own ? y(level.get(own)!) : top;
    for (const g of multi) if (g !== own && p > g[0] && p < g[g.length - 1]) start = Math.max(start, y(level.get(g)!) + step - 2);
    parts.push(`<line x1="${x(p)}" y1="${start}" x2="${x(p)}" y2="${H - 6}"/>`);
  }
  for (const g of multi) {
    const yy = y(level.get(g)!);
    parts.push(`<line x1="${x(g[g.length - 1])}" y1="${yy}" x2="${x(g[0])}" y2="${yy}"/>`);
  }
  const title = label ? `<title>${label}</title>` : '';
  return `<svg class="genjiko" viewBox="0 0 ${W} ${H}" role="img"${label ? ` aria-label="${label}"` : ' aria-hidden="true"'}>${title}<g stroke="currentColor" stroke-width="3.2" stroke-linecap="square" fill="none">${parts.join('')}</g></svg>`;
}
