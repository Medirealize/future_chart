/** 合言葉・本文中の四字熟語に意味を付与する（表示用） */
export const CORE_VALUE_MEANINGS: Record<string, string> = {
  初志貫徹: "最初に決めた志を最後まで突き通すこと",
  着眼大局: "目先ではなく大きな目的を見て判断すること",
  一期一会: "一生に一度しかない出会いを大切にすること",
  虚心坦懐: "心を開いて素直に向き合うこと",
  不撓不屈: "くじけず最後まで努力し続けること",
  明朗快活: "明るく前向きで元気に振る舞うこと",
  自他共栄: "自分も相手も、ともに栄えること",
  迅速果断: "素早く決断し行動すること",
  質実剛健: "飾らずに堅実で、心身を強く保つこと",
  温故知新: "古い知識を学び、そこから新しい知恵を得ること",
};

export function enrichFourCharIdioms(text: string) {
  let out = text;
  for (const [idiom, meaning] of Object.entries(CORE_VALUE_MEANINGS)) {
    const re = new RegExp(`${idiom}(?!（)`);
    out = out.replace(re, `${idiom}（${meaning}）`);
  }
  return out;
}
