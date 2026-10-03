interface VotdResponse {
  status: string;
  data: {
    date?: {
      gregorian?: string;
      ethiopian?: { formattedAm?: string };
    };
    liturgical?: { occasion?: string; occasionAm?: string };
    verse: {
      book?: string;
      reference: string;
      text: string;
    };
    url?: string;
  };
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function getVerse(): Promise<string> {
  const res = await fetch(process.env.VOTD_URL!, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Verse API returned ${res.status}`);

  const json = (await res.json()) as VotdResponse;
  if (json.status !== "success" || !json.data?.verse?.text) {
    throw new Error("Unexpected API response: " + JSON.stringify(json).slice(0, 300));
  }

  const { date, liturgical, verse, url } = json.data;
  const lines: string[] = [];

  lines.push("📖 <b>የዕለቱ የመጽሐፍ ቅዱስ ቃል</b>"); // "Verse of the Day"

  const ethDate = date?.ethiopian?.formattedAm;
  if (ethDate) lines.push(`📅 ${esc(ethDate)}`);

  const occasion = liturgical?.occasionAm ?? liturgical?.occasion;
  if (occasion) lines.push(`🕊 ${esc(occasion)}`);

  lines.push("", `<i>${esc(verse.text)}</i>`, "", `— <b>${esc(verse.reference)}</b>`);

  if (url) lines.push("", `🔗 <a href="${esc(url)}">ሙሉውን ያንብቡ</a>`); // "Read the full chapter"

  return lines.join("\n");
}
