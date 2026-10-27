export const packages = {
  quick: {
    id: "quick",
    name: "Mini sjút",
    eyebrow: "Stutt og þægileg myndataka",
    price: 50000,
    duration: "30 mínútur",
    images: "3 fullunnar myndir",
    includes: ["3 prentaðar myndir · 10 × 15 cm", "Ein staðsetning", "Leiðsögn í pósum og tjáningu", "Netgallerí til að velja úr"]
  },
  editorial: {
    id: "editorial",
    name: "Snjókallinn sjút",
    eyebrow: "Klassíska Snjókallinn-upplifunin",
    price: 85000,
    duration: "60 til 75 mínútur",
    images: "10 fullunnar myndir",
    includes: ["3 prentaðar myndir · 10 × 15 cm", "Ein staðsetning", "1 til 2 look eða fataskipti", "Hugmyndavinna fyrir töku", "Leiðsögn allan tímann", "Netgallerí til að velja úr"]
  },
  iconic: {
    id: "iconic",
    name: "Main Character sjút",
    eyebrow: "Þegar þú vilt gera meira úr þessu",
    price: 130000,
    duration: "1,5 til 2 klukkustundir",
    images: "20 fullunnar myndir",
    includes: ["3 prentaðar myndir · 10 × 15 cm", "1 til 2 nálægar staðsetningar", "2 til 3 look eða fataskipti", "Hugmyndavinna og moodboard", "Leiðsögn allan tímann", "Netgallerí til að velja úr"]
  },
  custom: {
    id: "custom",
    name: "Sérsniðið verkefni",
    eyebrow: "Fyrir fyrirtæki og vörumerki",
    price: null,
    duration: "Samið eftir umfangi",
    images: "Afhending skilgreind í tilboði",
    includes: ["Fyrirtæki, herferðir og stærri hópar", "Verð eftir umfangi og notkun", "Skýr afhending og tímalína"]
  }
};

const extraImagePrices = {
  "0": null,
  "1": { label: "1 aukamynd", value: 4000 },
  "5": { label: "5 aukamyndir", value: 15000 },
  "10": { label: "10 aukamyndir", value: 25000 }
};

export const money = value => `${Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")} kr.`;

export function recommendation({ goal, energy, timing, bts, extraImages = "0" }) {
  if (goal === "business") {
    return {
      packageId: "custom",
      total: null,
      additions: [],
      note: "Segðu mér frá verkefninu og ég set saman tilboð eftir umfangi og notkun. Verð í tilboðinu er sýnt með VSK."
    };
  }

  let packageId = energy === "quick" ? "quick" : energy === "production" ? "iconic" : "editorial";
  const additions = [];
  let total = packages[packageId].price;

  if (timing === "evening") {
    const surcharge = Math.round(packages[packageId].price * 0.2);
    total += surcharge;
    additions.push({ label: "Kvöld eða helgi · 20%", value: surcharge });
  }

  const extraImageOption = extraImagePrices[extraImages] || null;
  if (extraImageOption) {
    total += extraImageOption.value;
    additions.push(extraImageOption);
  }

  if (bts) {
    total += 20000;
    additions.push({ label: "BTS viðbót", value: 20000 });
  }

  return {
    packageId,
    total,
    additions,
    note: packageId === "iconic"
      ? "Þetta hentar þegar þú vilt meiri tíma, fleiri föt og góða hugmyndavinnu fyrir tökuna."
      : packageId === "editorial"
        ? "Hér höfum við nægan tíma til að finna taktinn og prófa nokkrar hugmyndir án þess að vera að flýta okkur."
        : "Stutt og þægileg myndataka þegar þig vantar nokkrar virkilega góðar myndir."
  };
}

export function inquiryText(result, answers) {
  const chosen = packages[result.packageId];
  const estimate = result.total === null ? "tilboð eftir umfangi, með VSK" : money(result.total);
  return [
    "Hæ! Ég prófaði verðleiðarann hjá Snjókallinum.",
    `Hann mælti með: ${chosen.name}`,
    ...(result.total === null ? [] : ["Innifalið: 3 prent · 10 × 15 cm"]),
    `Ég er að leita að: ${answers.goalLabel}`,
    `Tímasetning: ${answers.timingLabel}`,
    `Aukamyndir: ${answers.extraImages === "0" ? "engar" : answers.extraImages}`,
    `BTS: ${answers.bts ? "já" : "nei"}`,
    `Áætlað verð: ${estimate}`,
    "Geturðu sagt mér aðeins meira og hvaða tímar eru lausir?"
  ].join("\n");
}
