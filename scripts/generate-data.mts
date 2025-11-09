import wiki from 'wikijs';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch'; // node-fetchをインポート

// 国データの型定義 (src/store/countries.ts と同期)
interface CountryData {
  id: string;
  name: string;
  capital: string;
  continent: string;
  flag_image_url: string;
  map_image_url: string;
  description: string;
  summary: string;
}

// 画像保存ディレクトリ
const FLAGS_DIR = path.resolve(process.cwd(), 'public', 'flags');
const MAPS_DIR = path.resolve(process.cwd(), 'public', 'maps');

// Wikidataから首都を取得
const getCapitalFromWikidata = async (countryName: string, lang: 'ja' | 'en' = 'en'): Promise<string> => {
  try {
    // WikipediaページからWikidata IDを取得
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(countryName)}&prop=pageprops&format=json&origin=*`;
    const searchRes = await fetch(searchUrl);
    const searchData: any = await searchRes.json();
    
    const pages = searchData.query.pages;
    const pageId = Object.keys(pages)[0];
    const wikidataId = pages[pageId]?.pageprops?.wikibase_item;
    
    if (!wikidataId) return '';

    // Wikidataから首都情報を取得 (P36 = capital)
    const wikidataUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${wikidataId}&props=claims&format=json&origin=*`;
    const wikidataRes = await fetch(wikidataUrl);
    const wikidataData: any = await wikidataRes.json();
    
    const claims = wikidataData.entities[wikidataId]?.claims;
    if (claims && claims.P36) {
      // preferredランクの首都を探す（現在の首都）
      let capitalClaim = claims.P36.find((claim: any) => claim.rank === 'preferred');
      // preferredがない場合は、normalランクの最初の首都を使用
      if (!capitalClaim) {
        capitalClaim = claims.P36.find((claim: any) => claim.rank === 'normal');
      }
      // それでもない場合は最初のものを使用
      if (!capitalClaim) {
        capitalClaim = claims.P36[0];
      }

      const capitalId = capitalClaim?.mainsnak?.datavalue?.value?.id;
      if (!capitalId) return '';
      
      // 首都のIDからラベル（名前）を取得
      const capitalLabelUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${capitalId}&props=labels&languages=${lang}&format=json&origin=*`;
      const capitalLabelRes = await fetch(capitalLabelUrl);
      const capitalLabelData: any = await capitalLabelRes.json();
      
      const capitalName = capitalLabelData.entities[capitalId]?.labels?.[lang]?.value || '';
      return capitalName;
    }
  } catch (e: any) {
    console.warn(`  - Error getting capital from Wikidata: ${e.message}`);
  }
  
  return '';
};

// WikidataからContinentを取得
const getContinentFromWikidata = async (countryName: string, lang: 'ja' | 'en' = 'en'): Promise<string> => {
  try {
    // WikipediaページからWikidata IDを取得
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(countryName)}&prop=pageprops&format=json&origin=*`;
    const searchRes = await fetch(searchUrl);
    const searchData: any = await searchRes.json();
    
    const pages = searchData.query.pages;
    const pageId = Object.keys(pages)[0];
    const wikidataId = pages[pageId]?.pageprops?.wikibase_item;
    
    if (!wikidataId) return '';

    // Wikidataから大陸情報を取得 (P30 = continent)
    const wikidataUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${wikidataId}&props=claims&format=json&origin=*`;
    const wikidataRes = await fetch(wikidataUrl);
    const wikidataData: any = await wikidataRes.json();
    
    const claims = wikidataData.entities[wikidataId]?.claims;
    if (claims && claims.P30) {
      const continentId = claims.P30[0]?.mainsnak?.datavalue?.value?.id;
      
      if (lang === 'ja') {
        // 日本語版の大陸名
        const continentMapJa: Record<string, string> = {
          'Q15': 'アフリカ',
          'Q48': 'アジア',
          'Q46': 'ヨーロッパ',
          'Q49': '北アメリカ',
          'Q18': '南アメリカ',
          'Q538': 'オセアニア',
          'Q51': '南極',
        };
        return continentMapJa[continentId] || '';
      } else {
        // 英語版の大陸名
        const continentMapEn: Record<string, string> = {
          'Q15': 'Africa',
          'Q48': 'Asia',
          'Q46': 'Europe',
          'Q49': 'North America',
          'Q18': 'South America',
          'Q538': 'Oceania',
          'Q51': 'Antarctica',
        };
        return continentMapEn[continentId] || '';
      }
    }
  } catch (e: any) {
    console.warn(`  - Error getting continent from Wikidata: ${e.message}`);
  }
  
  return '';
};

// infoboxから地図画像を取得
const getMapImageFromInfobox = async (countryName: string, lang: 'ja' | 'en'): Promise<string> => {
  const apiUrl = lang === 'ja' ? 'https://ja.wikipedia.org/w/api.php' : 'https://en.wikipedia.org/w/api.php';
  
  try {
    const infoboxUrl = `${apiUrl}?action=parse&page=${encodeURIComponent(countryName)}&prop=text&format=json&origin=*`;
    const response = await fetch(infoboxUrl);
    const data: any = await response.json();
    
    if (data.parse && data.parse.text) {
      const htmlText = data.parse.text['*'];
      
      // HTML内の地図画像URLを直接探す
      const imgRegex = /upload\.wikimedia\.org\/wikipedia\/commons\/[^"']+\.(svg|png)/gi;
      const imgMatches = htmlText.match(imgRegex);
      
      if (imgMatches) {
        // 地図関連の画像を優先
        const mapKeywords = ['orthographic', 'location', 'locator', 'map'];
        
        for (const keyword of mapKeywords) {
          const mapImages = imgMatches.filter((url: string) => 
            url.toLowerCase().includes(keyword.toLowerCase())
          );
          if (mapImages.length > 0) {
            return `https://${mapImages[0]}`;
          }
        }
      }
    }
  } catch (e: any) {
    console.warn(`  - Error getting map image: ${e.message}`);
  }
  
  return '';
};

// 国旗ページから説明を取得
const getFlagDescription = async (countryName: string, lang: 'ja' | 'en'): Promise<string> => {
  const apiUrl = lang === 'ja' ? 'https://ja.wikipedia.org/w/api.php' : 'https://en.wikipedia.org/w/api.php';
  
  try {
    // 国旗専用ページ名
    const flagPageName = lang === 'ja' 
      ? `${countryName}の国旗`
      : `Flag of ${countryName}`;
    
    // ページの要約を取得
    const summaryUrl = `${apiUrl}?action=query&titles=${encodeURIComponent(flagPageName)}&prop=extracts&exintro=1&explaintext=1&format=json&origin=*`;
    const response = await fetch(summaryUrl);
    const data: any = await response.json();
    
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    
    if (pageId !== '-1') {
      const extract = pages[pageId]?.extract;
      if (extract && extract.length > 50) {
        return extract;
      }
    }
  } catch (e: any) {
    console.warn(`  - Error getting flag description: ${e.message}`);
  }
  
  return '';
};

// 画像をダウンロードしてローカルパスを返す関数（汎用）
const downloadImage = async (url: string, countryId: string, imageType: 'flag' | 'map' = 'flag'): Promise<string> => {
  if (!url) return '';

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`  - Failed to download ${imageType} image from ${url.substring(0, 80)}...`);
      return '';
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    // URLから拡張子を取得（thumb URLの場合も考慮）
    let ext = path.extname(url.split('?')[0].split('/').pop() || '');
    if (!ext || ext.length > 5) {
      ext = '.svg'; // デフォルト
    }
    
    const dir = imageType === 'flag' ? FLAGS_DIR : MAPS_DIR;
    const subPath = imageType === 'flag' ? 'flags' : 'maps';
    const filename = `${countryId}${ext}`;
    const filePath = path.join(dir, filename);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, buffer);

    return `/${subPath}/${filename}`;
  } catch (e: any) {
    console.warn(`  - Error downloading ${imageType} image: ${e.message}`);
    return '';
  }
};

// Wikipediaから国データを取得する関数
const getCountryDataFromWiki = async (
  countryName: string,
  lang: 'ja' | 'en'
): Promise<Partial<CountryData> | null> => {
  const apiUrl = lang === 'ja' ? 'https://ja.wikipedia.org/w/api.php' : 'https://en.wikipedia.org/w/api.php';
  const wikiInstance = wiki({ apiUrl }) as any;

  try {
    const page = await wikiInstance.page(countryName);
    
    // WikiAPIを直接呼び出してinfoboxデータを取得
    let capital = 'N/A';
    let flagImageUrlFromInfobox = '';
    try {
      const infoboxUrl = `${apiUrl}?action=parse&page=${encodeURIComponent(countryName)}&prop=text&format=json&origin=*`;
      const response = await fetch(infoboxUrl);
      const data: any = await response.json();
      
      if (data.parse && data.parse.text) {
        const htmlText = data.parse.text['*'];
        
        // 首都を抽出（HTMLから）- infoboxの該当行を探す
        const capitalRegex = lang === 'ja' 
          ? /<th[^>]*>(?:首都|最大都市)<\/th>[\s\S]*?<td[^>]*>(.*?)<\/td>/i
          : /<th[^>]*>[^<]*capital[^<]*<\/th>[\s\S]*?<td[^>]*>(.*?)<\/td>/i;
        const capitalMatch = htmlText.match(capitalRegex);
        if (capitalMatch && capitalMatch[1]) {
          // HTMLタグを削除して最初の単語を取得
          let cleanCapital = capitalMatch[1].replace(/<[^>]+>/g, '').trim();
          // ブラケットやカンマの前で切る
          cleanCapital = cleanCapital.split(/\[|\(|,|<br/)[0].trim();
          if (cleanCapital && cleanCapital.length > 0) {
            capital = cleanCapital;
          }
        }
        
        // 国旗画像を抽出
        const flagRegex = /Flag.*?\.svg/i;
        const flagMatch = htmlText.match(flagRegex);
        if (flagMatch) {
          flagImageUrlFromInfobox = `https://commons.wikimedia.org/wiki/Special:FilePath/${flagMatch[0].replace(/ /g, '_')}`;
        }
      }
    } catch (e: any) {
      console.warn(`  - Error fetching infobox for "${countryName}" in ${lang}:`, e.message);
    }
    
    let summary = '';
    try {
      summary = await page.summary();
    } catch (e: any) {
      console.warn(`  - Error getting summary for "${countryName}" in ${lang}:`, e.message);
    }

    // summaryから首都を抽出（capitalがN/Aの場合）
    if (capital === 'N/A' && summary) {
      if (lang === 'ja') {
        // 「首都は○○」「首都○○」のパターンを検索
        const capitalMatch = summary.match(/首都は?([^\s。、]+)/);
        if (capitalMatch && capitalMatch[1]) {
          capital = capitalMatch[1].trim();
        }
      } else {
        // "capital [is] CITY" or "capital CITY" のパターンを検索（スペースや改行を考慮）
        // "the capital CITY is" のパターンも対応
        let capitalMatch = summary.match(/\bcapital\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+is/i);
        if (capitalMatch && capitalMatch[1]) {
          capital = capitalMatch[1].trim();
        } else {
          capitalMatch = summary.match(/\bcapital\s+(?:and\s+[^\s]+\s+)?(?:city\s+)?(?:is\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
          if (capitalMatch && capitalMatch[1]) {
            capital = capitalMatch[1].trim();
          }
        }
      }
    } else if (capital !== 'N/A') {
      // infoboxから取得した首都が間違っている場合のチェック（summaryで上書き）
      if (summary) {
        if (lang === 'ja') {
          const capitalMatch = summary.match(/首都は?([^\s。、]+)/);
          if (capitalMatch && capitalMatch[1]) {
            capital = capitalMatch[1].trim();
          }
        } else {
          const capitalMatch = summary.match(/\bcapital\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+is/i);
          if (capitalMatch && capitalMatch[1] && !capitalMatch[1].toLowerCase().includes('city')) {
            capital = capitalMatch[1].trim();
          }
        }
      }
    }

    // 国旗画像URLの取得（infoboxから取得できなかった場合のフォールバック）
    let flagImageUrlWiki = flagImageUrlFromInfobox;
    if (!flagImageUrlWiki) {
      try {
        const images = await page.images();
        const flagImage = images.find((img: string) => img.toLowerCase().includes('flag'));
        if (flagImage) {
          flagImageUrlWiki = flagImage;
        }
      } catch (e: any) {
        console.warn(`  - Error getting images for "${countryName}" in ${lang}:`, e.message);
      }
    }

    // 国旗の成り立ち (セクションを取得)
    let description = '';
    try {
      const sections = await page.sections();
      const flagSection = sections.find((s: any) => s.title.toLowerCase().includes('flag') || s.title.toLowerCase().includes('design') || s.title === '国旗');
      if (flagSection) {
        try {
          const sectionContent = await page.section(flagSection.title);
          description = sectionContent || '';
        } catch (e: any) {
          console.warn(`  - Error getting section content for "${countryName}" in ${lang}:`, e.message);
        }
      }
    } catch (e: any) {
      console.warn(`  - Error getting sections for "${countryName}" in ${lang}:`, e.message);
    }

    return {
      name: countryName,
      capital: capital,
      flag_image_url: flagImageUrlWiki,
      description: description || '',
      summary: summary || '',
    };
  } catch (error: any) {
    if (error.message.includes('No article found')) {
      console.warn(`  - No Wikipedia article found for "${countryName}" in ${lang}.`);
    } else {
      console.warn(`  - Error fetching data for "${countryName}" in ${lang}:`, error.message);
    }
    return null;
  }
};

const main = async () => {
  // コマンドライン引数から国名を取得（指定された場合）
  const targetCountry = process.argv[2];
  
  // 国名リストを読み込む
  let countryNamesJa: string[] = JSON.parse(await fs.readFile(path.resolve(process.cwd(), 'scripts', 'country-list.json'), 'utf-8'));
  
  // 特定の国が指定された場合、そのリストに絞る
  if (targetCountry) {
    const filtered = countryNamesJa.filter(name => name.includes(targetCountry));
    if (filtered.length === 0) {
      console.error(`国名 "${targetCountry}" が見つかりませんでした。`);
      process.exit(1);
    }
    countryNamesJa = filtered;
    console.log(`\n指定された国: ${filtered.join(', ')}\n`);
  }

  // public ディレクトリへのパスを解決
  const outputPathJa = path.resolve(process.cwd(), 'public', 'countries.ja.json');
  const outputPathEn = path.resolve(process.cwd(), 'public', 'countries.en.json');

  // 既存のデータを読み込む（存在する場合）
  let allDataJa: CountryData[] = [];
  let allDataEn: CountryData[] = [];
  try {
    const existingJa = await fs.readFile(outputPathJa, 'utf-8');
    allDataJa = JSON.parse(existingJa);
    console.log(`Loaded ${allDataJa.length} existing countries from countries.ja.json`);
  } catch (e) {
    console.log('No existing countries.ja.json found, starting fresh');
  }
  try {
    const existingEn = await fs.readFile(outputPathEn, 'utf-8');
    allDataEn = JSON.parse(existingEn);
    console.log(`Loaded ${allDataEn.length} existing countries from countries.en.json`);
  } catch (e) {
    console.log('No existing countries.en.json found, starting fresh');
  }

  for (const countryNameJa of countryNamesJa) {
    console.log(`Processing ${countryNameJa}...`);

    // 日本語データを取得してから英語名を取得し、それをIDに使用
    const dataJaTmp = await getCountryDataFromWiki(countryNameJa, 'ja');
    if (!dataJaTmp) {
      console.warn(`  - Skipping ${countryNameJa} (Japanese data not found).`);
      continue;
    }

    // 英語データを取得 (日本語名から英語ページを推測)
    let countryNameEn = dataJaTmp.name || countryNameJa; // 日本語版で取得した英語名があればそれを使う
    if (countryNameEn === countryNameJa) { // 英語名が日本語名と同じなら、英語版Wikipediaで検索しやすい名前に変換を試みる
      try {
        const jaPageInstance = await (wiki({ apiUrl: 'https://ja.wikipedia.org/w/api.php' }) as any).page(countryNameJa);
        const langlinks = await jaPageInstance.langlinks();
        const enLink = langlinks.find((link: any) => link.lang === 'en');
        if (enLink) {
          countryNameEn = enLink.title;
        } else {
          // 言語間リンクが見つからない場合は、元のロジックで検索を試みる
          const enPageSearch = await (wiki({ apiUrl: 'https://en.wikipedia.org/w/api.php' }) as any).search(countryNameJa, 1);
          if (enPageSearch.results.length > 0) {
            countryNameEn = enPageSearch.results[0];
          }
        }
      } catch (error: any) {
        console.warn(`  - Error getting langlinks for "${countryNameJa}":`, error.message);
        // エラーが発生した場合も元のロジックで検索を試みる
        const enPageSearch = await (wiki({ apiUrl: 'https://en.wikipedia.org/w/api.php' }) as any).search(countryNameJa, 1);
        if (enPageSearch.results.length > 0) {
          countryNameEn = enPageSearch.results[0];
        }
      }
    }

    // 英語名からIDを生成（英語名の方が適切）
    const countryId = countryNameEn.toLowerCase().replace(/ /g, '_').replace(/[^a-z0-9_]/g, '');

    // 日本語データを再取得（最初の取得と同じ）
    const dataJa = dataJaTmp;
    const dataEn = await getCountryDataFromWiki(countryNameEn, 'en');
    if (!dataEn) {
      console.warn(`  - Skipping ${countryNameJa} (English data not found).`);
      continue;
    }

    // 国旗画像をダウンロード
    const localFlagPath = await downloadImage((dataEn?.flag_image_url || dataJa?.flag_image_url) || '', countryId);
    if (!localFlagPath) {
      console.warn(`  - Skipping ${countryNameJa} (Flag image not found/downloaded).`);
      continue;
    }

    // 追加データの取得（エラーが発生しても処理を続行）
    let mapImageUrl = '';
    let localMapPath = '';
    let descriptionJa = dataJa?.description || '';
    let descriptionEn = dataEn?.description || '';

    // 首都をWikidataから取得（最も正確）
    let capitalJa = dataJa?.capital || '';
    let capitalEn = dataEn?.capital || '';
    try {
      const capitalFromWikidataJa = await getCapitalFromWikidata(countryNameEn as string, 'ja');
      const capitalFromWikidataEn = await getCapitalFromWikidata(countryNameEn as string, 'en');
      
      if (capitalFromWikidataJa) {
        capitalJa = capitalFromWikidataJa;
        console.log(`  ✓ Capital (JA): ${capitalJa}`);
      }
      if (capitalFromWikidataEn) {
        capitalEn = capitalFromWikidataEn;
        console.log(`  ✓ Capital (EN): ${capitalEn}`);
      }
    } catch (e) {
      // エラーは既にログ出力されている
      // Wikidataから取得できない場合は、既存のデータを使用
    }

    // 大陸をWikidataから取得（日本語版と英語版）
    let continentJa = 'N/A';
    let continentEn = 'N/A';
    try {
      const continentFromWikidataJa = await getContinentFromWikidata(countryNameEn as string, 'ja');
      const continentFromWikidataEn = await getContinentFromWikidata(countryNameEn as string, 'en');
      
      if (continentFromWikidataJa) {
        continentJa = continentFromWikidataJa;
        console.log(`  ✓ Continent (JA): ${continentJa}`);
      }
      if (continentFromWikidataEn) {
        continentEn = continentFromWikidataEn;
        console.log(`  ✓ Continent (EN): ${continentEn}`);
      }
    } catch (e) {
      // エラーは既にログ出力されている
    }

    // 地図画像を取得してダウンロード（英語版を優先）
    try {
      if (countryNameEn) {
        const mapImageEn = await getMapImageFromInfobox(countryNameEn as string, 'en');
        if (mapImageEn) {
          mapImageUrl = mapImageEn;
          console.log(`  ✓ Map image found`);
        } else if (countryNameJa) {
          const mapImageJa = await getMapImageFromInfobox(countryNameJa as string, 'ja');
          if (mapImageJa) {
            mapImageUrl = mapImageJa;
            console.log(`  ✓ Map image found (ja)`);
          }
        }
      }

      // 地図画像をローカルにダウンロード
      if (mapImageUrl) {
        localMapPath = await downloadImage(mapImageUrl, countryId, 'map');
        if (localMapPath) {
          console.log(`  ✓ Map image downloaded: ${localMapPath}`);
        }
      }
    } catch (e) {
      // エラーは既にログ出力されている
    }

    // 国旗の説明を専用ページから取得（既存のdescriptionが空または短い場合）
    try {
      if ((!descriptionJa || descriptionJa.length < 50) && countryNameJa) {
        const flagDescJa = await getFlagDescription(countryNameJa as string, 'ja');
        if (flagDescJa && flagDescJa.length > descriptionJa.length) {
          descriptionJa = flagDescJa;
          console.log(`  ✓ Flag description (ja): ${flagDescJa.length} chars`);
        }
      }

      if ((!descriptionEn || descriptionEn.length < 50) && countryNameEn) {
        const flagDescEn = await getFlagDescription(countryNameEn as string, 'en');
        if (flagDescEn && flagDescEn.length > descriptionEn.length) {
          descriptionEn = flagDescEn;
          console.log(`  ✓ Flag description (en): ${flagDescEn.length} chars`);
        }
      }
    } catch (e) {
      // エラーは既にログ出力されている
    }

    // 最終的なデータオブジェクトを構築
    const finalDataJa: CountryData = {
      id: countryId,
      name: countryNameJa, // 日本語名
      capital: capitalJa,
      continent: continentJa,
      flag_image_url: localFlagPath,
      map_image_url: localMapPath,
      description: descriptionJa,
      summary: dataJa?.summary || '',
    };

    const finalDataEn: CountryData = {
      id: countryId,
      name: (dataEn?.name || countryNameEn) as string, // 英語名
      capital: capitalEn,
      continent: continentEn,
      flag_image_url: localFlagPath,
      map_image_url: localMapPath,
      description: descriptionEn,
      summary: dataEn?.summary || '',
    };

    // 既存データから同じIDの国を探して更新、なければ追加
    const existingJaIndex = allDataJa.findIndex(c => c.id === countryId);
    if (existingJaIndex >= 0) {
      allDataJa[existingJaIndex] = finalDataJa;
      console.log(`  ✓ Updated ${countryNameJa} in countries.ja.json`);
    } else {
      allDataJa.push(finalDataJa);
      console.log(`  ✓ Added ${countryNameJa} to countries.ja.json`);
    }

    const existingEnIndex = allDataEn.findIndex(c => c.id === countryId);
    if (existingEnIndex >= 0) {
      allDataEn[existingEnIndex] = finalDataEn;
      console.log(`  ✓ Updated ${(dataEn?.name || countryNameEn) as string} in countries.en.json`);
    } else {
      allDataEn.push(finalDataEn);
      console.log(`  ✓ Added ${(dataEn?.name || countryNameEn) as string} to countries.en.json`);
    }

    // 各国処理後にファイルに保存
    await fs.writeFile(outputPathJa, JSON.stringify(allDataJa, null, 2));
    await fs.writeFile(outputPathEn, JSON.stringify(allDataEn, null, 2));
    console.log(`  ✓ Saved to files (Total: ${allDataJa.length} countries)`);

    // APIへの負荷を考慮し、ウェイトを入れる
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\nSuccessfully generated countries.ja.json with ${allDataJa.length} countries.`);
  console.log(`Successfully generated countries.en.json with ${allDataEn.length} countries.`);
};

main();
