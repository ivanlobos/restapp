export async function translateText(text: string, targetLang: string): Promise<string> {
  if (!text || targetLang === "es") return text;

  try {
    const langMap: Record<string, string> = {
      en: "en",
      pt: "pt",
      zh: "zh-CN",
    };
    const target = langMap[targetLang] || targetLang;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=es|${target}`;
    
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return text;
    const data = await res.json();
    return data.responseData?.translatedText || text;
  } catch {
    return text;
  }
}

export async function translateCategories(
  categories: any[],
  targetLang: string
): Promise<any[]> {
  if (targetLang === "es") return categories;

  return Promise.all(
    categories.map(async (cat) => ({
      ...cat,
      name: await translateText(cat.name, targetLang),
      products: await Promise.all(
        cat.products.map(async (product: any) => ({
          ...product,
          description: product.description
            ? await translateText(product.description, targetLang)
            : null,
        }))
      ),
    }))
  );
}
