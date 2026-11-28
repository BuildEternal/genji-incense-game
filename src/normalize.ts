// Light normalization so a hook (e.g. 雁, かざし) can be found in historical-kana poem text.
// Approximate by design: it only feeds the echo check, never the stored transcription.
const KANJI: Record<string, string> = {"涙": "なみた", "鴬": "うくひす", "鶯": "うくひす", "花": "はな", "月": "つき", "袖": "そて", "露": "つゆ", "秋": "あき", "春": "はる", "風": "かせ", "雲": "くも", "夢": "ゆめ", "人": "ひと", "世": "よ", "心": "こころ", "身": "み", "宿": "やと", "松": "まつ", "山": "やま", "色": "いろ", "雪": "ゆき", "桜": "さくら", "梅": "うめ", "竹": "たけ", "藤": "ふち", "河": "かは", "川": "かは", "笛": "ふえ", "香": "か", "名": "な", "君": "きみ", "思": "おも", "見": "み", "声": "こゑ", "音": "ね", "我": "われ", "今": "いま", "昔": "むかし", "里": "さと", "浦": "うら", "浪": "なみ", "波": "なみ", "水": "みつ", "空": "そら", "日": "ひ", "夜": "よ", "木": "き", "草": "くさ", "野": "の", "峰": "みね", "滝": "たき", "煙": "けふり", "衣": "ころも", "島": "しま", "海": "うみ", "舟": "ふね", "船": "ふね", "神": "かみ", "鳥": "とり", "虫": "むし", "菊": "きく", "霜": "しも", "霞": "かすみ", "都": "みやこ", "影": "かけ", "跡": "あと", "道": "みち", "中": "なか", "上": "うへ", "下": "した", "物": "もの", "事": "こと", "言": "こと", "行": "ゆ", "来": "く", "知": "し", "待": "ま", "頃": "ころ", "後": "のち", "又": "また", "哉": "かな", "捨": "す", "落": "おち", "立": "た", "入": "い", "白": "しら", "紅葉": "もみち", "葉": "は", "根": "ね", "枝": "えた", "岩": "いは", "緒": "を", "玉": "たま", "糸": "いと", "恋": "こひ", "死": "し", "命": "いのち", "雨": "あめ", "嶺": "みね", "間": "ま", "程": "ほと", "方": "かた", "大": "おほ", "小": "こ", "若": "わか", "深": "ふか", "長": "なか", "久": "ひさ", "千": "ち", "代": "よ", "一": "ひと", "八重": "やへ", "九重": "ここのへ", "伊勢": "いせ", "須磨": "すま"};
const HOOK_EXTRA: Record<string, string> = {"雁": "かり", "鹿": "しか", "蕨": "わらひ", "橘": "たちはな", "榊": "さかき", "薪": "たきき", "鶴": "たつ", "鏡": "かかみ", "綱": "つな", "帯": "おひ", "弓": "ゆみ", "霧": "きり", "荻": "をき", "菊": "きく", "巣": "す", "関": "せき", "淵": "ふち", "鴬": "うくひす", "蛍": "ほたる", "杉": "すき", "嵐": "あらし", "汀": "みきは", "氷": "こほり", "若菜": "わかな", "宿り木": "やとりき", "宿": "やと", "常陸": "ひたち", "住吉": "すみよし", "住の江": "すみのえ", "明石": "あかし", "伊勢": "いせ", "須磨": "すま", "竹河": "たけかは", "松島": "まつしま", "布留川": "ふるかは", "小塩山": "をしほやま", "妹背山": "いもせやま", "宇治橋": "うちはし", "橋姫": "はしひめ", "葉守の神": "はもりのかみ", "真木の柱": "まきのはしら", "石間の水": "いしまのみつ", "山吹": "やまふき", "朝顔": "あさかほ", "夕顔": "ゆふかほ", "末摘花": "すゑつむはな", "浅茅": "あさち", "小萩": "こはき", "小松": "こまつ", "小櫛": "をくし", "煙": "けふり", "光": "ひかり", "鏡の神": "かかみのかみ", "千鳥": "ちとり", "薄": "すすき", "藤衣": "ふちころも", "から衣": "からころも", "涙の河": "なみたのかは", "身を投げ": "みをなけ", "身をすつ": "みをはすつ", "恋ふる涙": "こふるなみた", "かすみの衣": "かすみのころも", "花の香": "はなのか", "梅のはつ花": "うめのはつはな"};
const DAKUTEN_FROM = 'がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ';
const DAKUTEN_TO = 'かきくけこさしすせそたちつてとはひふへほはひふへほ';
const byLength = (map: Record<string, string>) => Object.keys(map).sort((a, b) => b.length - a.length);
const KANJI_KEYS = byLength(KANJI);
const HOOK_KEYS = byLength(HOOK_EXTRA);

function replaceAll(value: string, keys: string[], map: Record<string, string>): string {
  for (const key of keys) value = value.split(key).join(map[key]);
  return value;
}

export function normalizeText(value: string): string {
  value = replaceAll(value.replaceAll('/', ''), KANJI_KEYS, KANJI);
  const out: string[] = [];
  for (const ch of value) {
    if ((ch === 'ゝ' || ch === 'ゞ') && out.length) out.push(out[out.length - 1]);
    else if (ch === '〱' && out.length >= 2) out.push(out[out.length - 2], out[out.length - 1]);
    else out.push(ch);
  }
  return out.join('')
    .replace(/[がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ]/g, ch => DAKUTEN_TO[DAKUTEN_FROM.indexOf(ch)])
    .replace(/[^\u3041-\u3096\u4e00-\u9fff]/g, '');
}

/** Searchable tokens of a hook such as "竹河・ふし" → ["たけかは", "ふし"]. Tokens under 2 characters are dropped. */
export function hookTokens(hook: string): string[] {
  return hook.split(/[・/（）()]/).map(part => part.trim()).filter(Boolean)
    .map(part => normalizeText(replaceAll(part, HOOK_KEYS, HOOK_EXTRA)))
    .filter(token => token.length >= 2);
}
