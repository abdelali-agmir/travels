/**
 * Wanderly database seed.
 *
 * Seeds a realistic SAMPLE dataset: 12 countries, ~20 cities and a few
 * hundred places, visa rules, facts, phrases, alerts, demo users and
 * community content. It does NOT claim global coverage — the schema is
 * built to scale to it. Run with:  npm run db:seed
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { randomBytes, scryptSync } from "crypto";
import * as s from "../src/db/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: {
    ca: process.env.DATABASE_CA_CERT,
    rejectUnauthorized: true,
  }, });
const db = drizzle(pool, { schema: s });

function hash(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

const IMG = {
  tokyo: "https://images.pexels.com/photos/30933060/pexels-photo-30933060.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  tokyoGinza: "https://images.pexels.com/photos/33901684/pexels-photo-33901684.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  paris: "https://images.pexels.com/photos/29395092/pexels-photo-29395092.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  parisDusk: "https://images.pexels.com/photos/34207006/pexels-photo-34207006.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  marrakech: "https://images.pexels.com/photos/22711555/pexels-photo-22711555.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  marrakechSouk: "https://images.pexels.com/photos/31273768/pexels-photo-31273768.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  essaouira: "https://images.pexels.com/photos/38785630/pexels-photo-38785630.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  krabi: "https://images.pexels.com/photos/35126795/pexels-photo-35126795.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  mayaBay: "https://images.pexels.com/photos/35126737/pexels-photo-35126737.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  krabiBeach: "https://images.pexels.com/photos/35126792/pexels-photo-35126792.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  rome: "https://images.pexels.com/photos/33009008/pexels-photo-33009008.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  romeSunset: "https://images.pexels.com/photos/15958028/pexels-photo-15958028.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  london: "https://images.pexels.com/photos/1227808/pexels-photo-1227808.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  sydney: "https://images.pexels.com/photos/31466707/pexels-photo-31466707.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  pisa: "https://images.pexels.com/photos/18109526/pexels-photo-18109526.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  greatwall: "https://images.pexels.com/photos/7897564/pexels-photo-7897564.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  parisStreet: "https://images.pexels.com/photos/13799693/pexels-photo-13799693.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  tokyoStreet: "https://images.pexels.com/photos/32549998/pexels-photo-32549998.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
};

async function main() {
  const existing = await db.select({ n: sql<number>`count(*)` }).from(s.countries);
  if (Number(existing[0].n) > 0) {
    console.log("Database already seeded — skipping.");
    await pool.end();
    return;
  }

  console.log("Seeding sources…");
  const srcRows = await db
    .insert(s.sources)
    .values([
      { name: "Japan Ministry of Foreign Affairs", url: "https://www.mofa.go.jp/j_info/visit/visa/", type: "government", verificationStatus: "verified", confidence: 95, lastCheckedAt: new Date("2026-01-10"), lastUpdatedAt: new Date("2025-11-02") },
      { name: "France-Visas (Official)", url: "https://france-visas.gouv.fr", type: "government", verificationStatus: "verified", confidence: 95, lastCheckedAt: new Date("2026-01-08"), lastUpdatedAt: new Date("2025-10-15") },
      { name: "U.S. Department of State", url: "https://travel.state.gov", type: "government", verificationStatus: "verified", confidence: 95, lastCheckedAt: new Date("2026-01-05"), lastUpdatedAt: new Date("2025-12-01") },
      { name: "UK Government (gov.uk)", url: "https://www.gov.uk/check-uk-visa", type: "government", verificationStatus: "verified", confidence: 95, lastCheckedAt: new Date("2026-01-11"), lastUpdatedAt: new Date("2025-12-20") },
      { name: "Royal Thai Government / Thai MFA", url: "https://consular.mfa.go.th", type: "government", verificationStatus: "verified", confidence: 90, lastCheckedAt: new Date("2026-01-09"), lastUpdatedAt: new Date("2025-09-30") },
      { name: "Türkiye MFA e-Visa portal", url: "https://www.evisa.gov.tr", type: "government", verificationStatus: "verified", confidence: 92, lastCheckedAt: new Date("2026-01-07"), lastUpdatedAt: new Date("2025-11-11") },
      { name: "UAE Federal Authority ICP", url: "https://icp.gov.ae", type: "government", verificationStatus: "needs_review", confidence: 70, lastCheckedAt: new Date("2025-10-02"), lastUpdatedAt: new Date("2025-08-14") },
      { name: "Saudi eVisa portal", url: "https://visa.visitsaudi.com", type: "government", verificationStatus: "needs_review", confidence: 70, lastCheckedAt: new Date("2025-09-20"), lastUpdatedAt: new Date("2025-07-01") },
      { name: "Brazil Ministry of Foreign Affairs", url: "https://www.gov.br/mre/en", type: "government", verificationStatus: "needs_review", confidence: 65, lastCheckedAt: new Date("2025-08-15"), lastUpdatedAt: new Date("2025-06-10") },
      { name: "Moroccan National Tourist Office", url: "https://www.visitmorocco.com", type: "tourism_authority", verificationStatus: "verified", confidence: 85, lastCheckedAt: new Date("2026-01-12"), lastUpdatedAt: new Date("2025-12-05") },
      { name: "Japan National Tourism Organization", url: "https://www.japan.travel", type: "tourism_authority", verificationStatus: "verified", confidence: 88, lastCheckedAt: new Date("2026-01-06"), lastUpdatedAt: new Date("2025-12-18") },
      { name: "Paris Je t'aime (Official CVB)", url: "https://parisjetaime.com", type: "tourism_authority", verificationStatus: "verified", confidence: 85, lastCheckedAt: new Date("2026-01-04"), lastUpdatedAt: new Date("2025-11-28") },
      { name: "Tourism Authority of Thailand", url: "https://www.tourismthailand.org", type: "tourism_authority", verificationStatus: "verified", confidence: 85, lastCheckedAt: new Date("2026-01-03"), lastUpdatedAt: new Date("2025-12-01") },
      { name: "RATP (Paris transport authority)", url: "https://www.ratp.fr", type: "transport_authority", verificationStatus: "verified", confidence: 90, lastCheckedAt: new Date("2026-01-10"), lastUpdatedAt: new Date("2026-01-02") },
      { name: "JR East (rail operator)", url: "https://www.jreast.co.jp/multi/en/", type: "rail_operator", verificationStatus: "verified", confidence: 90, lastCheckedAt: new Date("2026-01-10"), lastUpdatedAt: new Date("2025-12-25") },
      { name: "ONCF (Moroccan railways)", url: "https://www.oncf.ma", type: "rail_operator", verificationStatus: "verified", confidence: 88, lastCheckedAt: new Date("2026-01-09"), lastUpdatedAt: new Date("2025-12-15") },
      { name: "Wanderly editorial team", url: "https://wanderly.example/editorial", type: "trusted_provider", verificationStatus: "verified", confidence: 75, lastCheckedAt: new Date("2026-01-12"), lastUpdatedAt: new Date("2026-01-12") },
      { name: "Wanderly community", url: "https://wanderly.example/community", type: "community", verificationStatus: "needs_review", confidence: 40, lastCheckedAt: new Date("2026-01-12") },
      { name: "Open-Meteo", url: "https://open-meteo.com", type: "trusted_provider", verificationStatus: "verified", confidence: 90, lastCheckedAt: new Date("2026-01-12"), lastUpdatedAt: new Date("2026-01-12") },
      { name: "European Central Bank via Frankfurter", url: "https://frankfurter.dev", type: "trusted_provider", verificationStatus: "verified", confidence: 92, lastCheckedAt: new Date("2026-01-12"), lastUpdatedAt: new Date("2026-01-12") },
    ])
    .returning();
  const src = (name: string) => srcRows.find((r) => r.name.includes(name))!.id;
  const editorial = src("editorial");

  console.log("Seeding countries…");
  const countryRows = await db
    .insert(s.countries)
    .values([
      { code: "MA", slug: "morocco", name: "Morocco", continent: "Africa", capital: "Rabat", flagEmoji: "🇲🇦", currencyCode: "MAD", currencyName: "Moroccan Dirham", languages: ["Arabic", "Amazigh", "French"], timezone: "Africa/Casablanca", callingCode: "+212", bestTime: "March–May & September–November", avgDailyBudgetUsd: 55, safetyLevel: 2, visaAccessibility: 3, popular: true, lat: 31.79, lng: -7.09, heroImage: IMG.marrakech, emergency: { police: "19", ambulance: "15", fire: "15", general: "112" }, summary: "Souks, Atlas mountains, Atlantic surf towns and Saharan dunes — Morocco packs deserts, medinas and mountains into one affordable country.", sourceId: src("Moroccan National") },
      { code: "FR", slug: "france", name: "France", continent: "Europe", capital: "Paris", flagEmoji: "🇫🇷", currencyCode: "EUR", currencyName: "Euro", languages: ["French"], timezone: "Europe/Paris", callingCode: "+33", bestTime: "April–June & September–October", avgDailyBudgetUsd: 160, safetyLevel: 2, visaAccessibility: 3, popular: true, lat: 46.6, lng: 2.2, heroImage: IMG.paris, emergency: { police: "17", ambulance: "15", fire: "18", general: "112" }, summary: "The world's most visited country: Paris, Provence, alpine peaks and a food culture with UNESCO status.", sourceId: src("Paris Je t'aime") },
      { code: "ES", slug: "spain", name: "Spain", continent: "Europe", capital: "Madrid", flagEmoji: "🇪🇸", currencyCode: "EUR", currencyName: "Euro", languages: ["Spanish", "Catalan", "Basque", "Galician"], timezone: "Europe/Madrid", callingCode: "+34", bestTime: "April–June & September–October", avgDailyBudgetUsd: 130, safetyLevel: 2, visaAccessibility: 3, popular: true, lat: 40.46, lng: -3.75, emergency: { police: "091", ambulance: "061", fire: "080", general: "112" }, summary: "Tapas culture, Moorish palaces, Mediterranean beaches and some of Europe's best nightlife.", sourceId: editorial },
      { code: "IT", slug: "italy", name: "Italy", continent: "Europe", capital: "Rome", flagEmoji: "🇮🇹", currencyCode: "EUR", currencyName: "Euro", languages: ["Italian"], timezone: "Europe/Rome", callingCode: "+39", bestTime: "April–June & September–October", avgDailyBudgetUsd: 140, safetyLevel: 2, visaAccessibility: 3, popular: true, lat: 41.87, lng: 12.57, heroImage: IMG.rome, emergency: { police: "113", ambulance: "118", fire: "115", general: "112" }, summary: "Two millennia of art and empire, plus the food regions of Emilia-Romagna, Tuscany and Sicily.", sourceId: editorial },
      { code: "GB", slug: "united-kingdom", name: "United Kingdom", continent: "Europe", capital: "London", flagEmoji: "🇬🇧", currencyCode: "GBP", currencyName: "Pound Sterling", languages: ["English"], timezone: "Europe/London", callingCode: "+44", bestTime: "May–September", avgDailyBudgetUsd: 170, safetyLevel: 2, visaAccessibility: 3, popular: true, lat: 55.37, lng: -3.43, heroImage: IMG.london, emergency: { general: "999" }, summary: "London's museums and markets, Scottish highlands, Welsh coast and centuries of layered history.", sourceId: src("gov.uk") },
      { code: "US", slug: "united-states", name: "United States", continent: "North America", capital: "Washington, D.C.", flagEmoji: "🇺🇸", currencyCode: "USD", currencyName: "US Dollar", languages: ["English"], timezone: "America/New_York", callingCode: "+1", bestTime: "Varies by region — May–October for most", avgDailyBudgetUsd: 200, safetyLevel: 2, visaAccessibility: 4, popular: true, lat: 37.09, lng: -95.71, emergency: { general: "911" }, summary: "Continental-scale variety: national parks, road trips and world cities from NYC to LA.", sourceId: src("Department of State") },
      { code: "JP", slug: "japan", name: "Japan", continent: "Asia", capital: "Tokyo", flagEmoji: "🇯🇵", currencyCode: "JPY", currencyName: "Japanese Yen", languages: ["Japanese"], timezone: "Asia/Tokyo", callingCode: "+81", bestTime: "March–May (sakura) & October–November", avgDailyBudgetUsd: 120, safetyLevel: 1, visaAccessibility: 3, popular: true, lat: 36.2, lng: 138.25, heroImage: IMG.tokyo, emergency: { police: "110", ambulance: "119", fire: "119" }, summary: "Ultra-modern cities, ancient temples, bullet trains and a food scene that rewards every budget.", sourceId: src("Japan National Tourism") },
      { code: "TR", slug: "turkey", name: "Türkiye", continent: "Asia", capital: "Ankara", flagEmoji: "🇹🇷", currencyCode: "TRY", currencyName: "Turkish Lira", languages: ["Turkish"], timezone: "Europe/Istanbul", callingCode: "+90", bestTime: "April–May & September–October", avgDailyBudgetUsd: 75, safetyLevel: 2, visaAccessibility: 4, popular: true, lat: 38.96, lng: 35.24, emergency: { general: "112" }, summary: "Where Europe meets Asia: Istanbul's bazaars, Cappadocia's balloons and the turquoise coast.", sourceId: src("e-Visa portal") },
      { code: "SA", slug: "saudi-arabia", name: "Saudi Arabia", continent: "Asia", capital: "Riyadh", flagEmoji: "🇸🇦", currencyCode: "SAR", currencyName: "Saudi Riyal", languages: ["Arabic"], timezone: "Asia/Riyadh", callingCode: "+966", bestTime: "November–February", avgDailyBudgetUsd: 150, safetyLevel: 2, visaAccessibility: 3, popular: false, lat: 23.89, lng: 45.08, emergency: { police: "999", ambulance: "997", fire: "998" }, summary: "AlUla's rock tombs, Red Sea diving and a fast-changing tourism scene.", sourceId: src("Saudi eVisa") },
      { code: "AE", slug: "united-arab-emirates", name: "United Arab Emirates", continent: "Asia", capital: "Abu Dhabi", flagEmoji: "🇦🇪", currencyCode: "AED", currencyName: "UAE Dirham", languages: ["Arabic", "English"], timezone: "Asia/Dubai", callingCode: "+971", bestTime: "November–March", avgDailyBudgetUsd: 180, safetyLevel: 1, visaAccessibility: 4, popular: true, lat: 23.42, lng: 53.85, emergency: { police: "999", ambulance: "998", fire: "997" }, summary: "Dubai's skyline, desert safaris and a global stopover hub between East and West.", sourceId: src("ICP") },
      { code: "TH", slug: "thailand", name: "Thailand", continent: "Asia", capital: "Bangkok", flagEmoji: "🇹🇭", currencyCode: "THB", currencyName: "Thai Baht", languages: ["Thai"], timezone: "Asia/Bangkok", callingCode: "+66", bestTime: "November–February", avgDailyBudgetUsd: 60, safetyLevel: 2, visaAccessibility: 5, popular: true, lat: 15.87, lng: 100.99, heroImage: IMG.krabi, emergency: { police: "191", ambulance: "1669", fire: "199" }, summary: "Temples, island hopping, night markets and the best street food on the planet.", sourceId: src("Tourism Authority of Thailand") },
      { code: "BR", slug: "brazil", name: "Brazil", continent: "South America", capital: "Brasília", flagEmoji: "🇧🇷", currencyCode: "BRL", currencyName: "Brazilian Real", languages: ["Portuguese"], timezone: "America/Sao_Paulo", callingCode: "+55", bestTime: "September–March (varies by region)", avgDailyBudgetUsd: 85, safetyLevel: 3, visaAccessibility: 4, popular: false, lat: -14.24, lng: -51.93, emergency: { police: "190", ambulance: "192", fire: "193" }, summary: "Rio's beaches, the Amazon, Iguaçu Falls and carnival energy year-round.", sourceId: src("Brazil Ministry") },
    ])
    .returning();
  const C = (code: string) => countryRows.find((c) => c.code === code)!.id;

  console.log("Seeding cities…");
  const cityRows = await db
    .insert(s.cities)
    .values([
      { countryId: C("MA"), slug: "marrakech", name: "Marrakech", lat: 31.6295, lng: -7.9811, timezone: "Africa/Casablanca", popular: true, avgDailyBudgetUsd: 55, bestTime: "March–May & October–November", heroImage: IMG.marrakech, summary: "The Red City — a labyrinthine medina, Jemaa el-Fnaa's nightly food theatre and Majorelle blue." },
      { countryId: C("MA"), slug: "casablanca", name: "Casablanca", lat: 33.5731, lng: -7.5898, timezone: "Africa/Casablanca", popular: true, avgDailyBudgetUsd: 60, bestTime: "April–June & September–November", heroImage: IMG.essaouira, summary: "Morocco's economic capital and main international gateway, home to the Hassan II Mosque." },
      { countryId: C("MA"), slug: "essaouira", name: "Essaouira", lat: 31.5085, lng: -9.7595, timezone: "Africa/Casablanca", avgDailyBudgetUsd: 45, bestTime: "April–October", heroImage: IMG.essaouira, summary: "Windsurf capital of Africa — a laid-back fortified port town on the Atlantic." },
      { countryId: C("FR"), slug: "paris", name: "Paris", lat: 48.8566, lng: 2.3522, timezone: "Europe/Paris", popular: true, avgDailyBudgetUsd: 180, bestTime: "April–June & September–October", heroImage: IMG.paris, summary: "The City of Light — world-class museums, café terraces and 20 walkable arrondissements." },
      { countryId: C("FR"), slug: "nice", name: "Nice", lat: 43.7102, lng: 7.262, timezone: "Europe/Paris", avgDailyBudgetUsd: 150, bestTime: "May–September", heroImage: IMG.parisDusk, summary: "Riviera capital with the Promenade des Anglais and easy day trips to Monaco and Èze." },
      { countryId: C("ES"), slug: "barcelona", name: "Barcelona", lat: 41.3874, lng: 2.1686, timezone: "Europe/Madrid", popular: true, avgDailyBudgetUsd: 130, bestTime: "May–June & September–October", summary: "Gaudí's fantasy architecture, Gothic lanes and city beaches." },
      { countryId: C("ES"), slug: "madrid", name: "Madrid", lat: 40.4168, lng: -3.7038, timezone: "Europe/Madrid", avgDailyBudgetUsd: 120, bestTime: "April–June & September–October", summary: "Spain's capital of art — the Prado triangle, tapas crawls and late nights." },
      { countryId: C("IT"), slug: "rome", name: "Rome", lat: 41.9028, lng: 12.4964, timezone: "Europe/Rome", popular: true, avgDailyBudgetUsd: 140, bestTime: "April–June & September–October", heroImage: IMG.rome, summary: "The Eternal City — 2,700 years of layered history you can walk through in a day." },
      { countryId: C("IT"), slug: "florence", name: "Florence", lat: 43.7696, lng: 11.2558, timezone: "Europe/Rome", avgDailyBudgetUsd: 130, bestTime: "April–June & September–October", heroImage: IMG.pisa, summary: "Cradle of the Renaissance, with Tuscany's hills at the doorstep." },
      { countryId: C("GB"), slug: "london", name: "London", lat: 51.5074, lng: -0.1278, timezone: "Europe/London", popular: true, avgDailyBudgetUsd: 190, bestTime: "May–September", heroImage: IMG.london, summary: "A world in one city — free museums, royal parks, markets and 300+ languages." },
      { countryId: C("US"), slug: "new-york", name: "New York", lat: 40.7128, lng: -74.006, timezone: "America/New_York", popular: true, avgDailyBudgetUsd: 250, bestTime: "April–June & September–November", summary: "The city that never sleeps: five boroughs, endless food and skyline icons." },
      { countryId: C("JP"), slug: "tokyo", name: "Tokyo", lat: 35.6762, lng: 139.6503, timezone: "Asia/Tokyo", popular: true, avgDailyBudgetUsd: 130, bestTime: "March–May & October–November", heroImage: IMG.tokyo, summary: "The world's largest metropolis — neon districts, serene shrines and Michelin-starred ramen." },
      { countryId: C("JP"), slug: "kyoto", name: "Kyoto", lat: 35.0116, lng: 135.7681, timezone: "Asia/Tokyo", popular: true, avgDailyBudgetUsd: 110, bestTime: "March–May & October–November", heroImage: IMG.greatwall, summary: "1,600 temples, geisha districts and Japan's most beautiful gardens." },
      { countryId: C("TR"), slug: "istanbul", name: "Istanbul", lat: 41.0082, lng: 28.9784, timezone: "Europe/Istanbul", popular: true, avgDailyBudgetUsd: 80, bestTime: "April–May & September–October", summary: "One city, two continents — Byzantine domes, Ottoman palaces and the Grand Bazaar." },
      { countryId: C("SA"), slug: "riyadh", name: "Riyadh", lat: 24.7136, lng: 46.6753, timezone: "Asia/Riyadh", avgDailyBudgetUsd: 150, bestTime: "November–February", summary: "Saudi Arabia's fast-changing capital — Diriyah, Boulevard City and desert edges." },
      { countryId: C("AE"), slug: "dubai", name: "Dubai", lat: 25.2048, lng: 55.2708, timezone: "Asia/Dubai", popular: true, avgDailyBudgetUsd: 180, bestTime: "November–March", summary: "Superlative city of the Gulf — Burj Khalifa, souks, beaches and desert dunes." },
      { countryId: C("TH"), slug: "bangkok", name: "Bangkok", lat: 13.7563, lng: 100.5018, timezone: "Asia/Bangkok", popular: true, avgDailyBudgetUsd: 55, bestTime: "November–February", heroImage: IMG.mayaBay, summary: "Temples and tuk-tuks, khlong boats and the world's best street food scene." },
      { countryId: C("TH"), slug: "phuket", name: "Phuket", kind: "island", lat: 7.8804, lng: 98.3923, timezone: "Asia/Bangkok", popular: true, avgDailyBudgetUsd: 65, bestTime: "November–April", heroImage: IMG.krabiBeach, summary: "Thailand's largest island — beaches, ferry hops to Phi Phi and a lively old town." },
      { countryId: C("BR"), slug: "rio-de-janeiro", name: "Rio de Janeiro", lat: -22.9068, lng: -43.1729, timezone: "America/Sao_Paulo", popular: true, avgDailyBudgetUsd: 90, bestTime: "September–March", summary: "The Marvelous City — Copacabana, Christ the Redeemer and samba till sunrise." },
    ])
    .returning();
  const city = (slug: string) => cityRows.find((c) => c.slug === slug)!.id;

  console.log("Seeding places…");
  type P = Omit<typeof s.places.$inferInsert, "cityId"> & { city: string };
  const placeData: P[] = [
    /* ── Tokyo ── */
    { city: "tokyo", slug: "haneda-airport", name: "Haneda Airport (HND)", type: "airport", area: "Ota", lat: 35.5494, lng: 139.7798, description: "Tokyo's closest international airport, 30 min from the center by monorail or Keikyu line.", durationMin: 60, image: IMG.tokyoStreet, sourceId: src("JR East") },
    { city: "tokyo", slug: "tokyo-station", name: "Tokyo Station", type: "train_station", area: "Marunouchi", lat: 35.6812, lng: 139.7671, description: "Main shinkansen hub in a restored 1914 red-brick building.", sourceId: src("JR East") },
    { city: "tokyo", slug: "senso-ji", name: "Sensō-ji Temple", type: "attraction", area: "Asakusa", lat: 35.7148, lng: 139.7967, description: "Tokyo's oldest temple (645 AD), approached through the Kaminarimon gate and Nakamise shopping street.", estCostUsd: 0, rating: 4.7, durationMin: 90, openingHours: "Grounds 24h · Main hall 06:00–17:00", tags: ["history", "temple", "photography"], image: IMG.tokyoGinza, sourceId: src("Japan National Tourism") },
    { city: "tokyo", slug: "meiji-jingu", name: "Meiji Jingu Shrine", type: "attraction", area: "Shibuya", lat: 35.6764, lng: 139.6993, description: "Forested Shinto shrine dedicated to Emperor Meiji, next to Harajuku.", estCostUsd: 0, rating: 4.6, durationMin: 90, openingHours: "Sunrise–sunset", tags: ["nature", "shrine", "history"], sourceId: src("Japan National Tourism") },
    { city: "tokyo", slug: "shibuya-crossing", name: "Shibuya Crossing & Sky", type: "viewpoint", area: "Shibuya", lat: 35.6595, lng: 139.7004, description: "The world's busiest pedestrian scramble; Shibuya Sky rooftop offers a 360° view.", estCostUsd: 18, rating: 4.6, durationMin: 75, openingHours: "Sky 10:00–22:30", tags: ["photography", "nightlife", "views"], image: IMG.tokyo, sourceId: editorial },
    { city: "tokyo", slug: "teamlab-planets", name: "teamLab Planets", type: "activity", area: "Toyosu", lat: 35.6493, lng: 139.7891, description: "Immersive barefoot digital-art museum in Toyosu.", estCostUsd: 27, rating: 4.7, durationMin: 120, openingHours: "09:00–22:00", tags: ["art", "photography", "family"], sourceId: editorial },
    { city: "tokyo", slug: "tsukiji-outer-market", name: "Tsukiji Outer Market", type: "market", area: "Chuo", lat: 35.6654, lng: 139.7707, description: "Street-food alleys of the former fish market — tamagoyaki, tuna bowls, knives.", estCostUsd: 15, rating: 4.5, durationMin: 90, openingHours: "05:00–14:00, many stalls close Wed/Sun", tags: ["food", "local markets"], sourceId: editorial },
    { city: "tokyo", slug: "ueno-park", name: "Ueno Park & Museums", type: "park", area: "Ueno", lat: 35.7156, lng: 139.7745, description: "Cherry-blossom central, plus the Tokyo National Museum cluster.", estCostUsd: 7, rating: 4.5, durationMin: 120, tags: ["nature", "museums", "history"], sourceId: editorial },
    { city: "tokyo", slug: "shinjuku-gyoen", name: "Shinjuku Gyoen Garden", type: "park", area: "Shinjuku", lat: 35.6852, lng: 139.71, description: "Three gardens in one — Japanese, French and English landscapes.", estCostUsd: 3, rating: 4.6, durationMin: 90, openingHours: "09:00–17:30, closed Mon", tags: ["nature", "photography"], sourceId: editorial },
    { city: "tokyo", slug: "golden-gai", name: "Golden Gai", type: "nightlife", area: "Shinjuku", lat: 35.6938, lng: 139.7044, description: "200 tiny bars packed into six lantern-lit alleys.", estCostUsd: 30, rating: 4.4, durationMin: 120, openingHours: "From ~19:00", tags: ["nightlife", "bars"], image: IMG.tokyoStreet, sourceId: editorial },
    { city: "tokyo", slug: "ichiran-shibuya", name: "Ichiran Ramen Shibuya", type: "restaurant", area: "Shibuya", lat: 35.6613, lng: 139.7006, description: "Solo-booth tonkotsu ramen institution, open around the clock.", estCostUsd: 10, priceLevel: 1, rating: 4.4, durationMin: 45, openingHours: "24h", tags: ["food", "ramen"], sourceId: editorial },
    { city: "tokyo", slug: "sushi-dai", name: "Sushi Dai (Toyosu)", type: "restaurant", area: "Toyosu", lat: 35.6421, lng: 139.7864, description: "Legendary omakase breakfast — arrive very early.", estCostUsd: 45, priceLevel: 3, rating: 4.8, durationMin: 60, openingHours: "05:30–14:00", tags: ["food", "sushi"], sourceId: editorial },
    { city: "tokyo", slug: "afuri-harajuku", name: "AFURI Harajuku", type: "restaurant", area: "Shibuya", lat: 35.6702, lng: 139.7026, description: "Famous yuzu-shio ramen in a bright modern shop.", estCostUsd: 12, priceLevel: 2, rating: 4.3, durationMin: 45, tags: ["food", "ramen"], sourceId: editorial },
    { city: "tokyo", slug: "park-hyatt-tokyo", name: "Park Hyatt Tokyo", type: "hotel", area: "Shinjuku", lat: 35.6852, lng: 139.6904, description: "Lost-in-Translation skyline luxury above Shinjuku.", estCostUsd: 550, priceLevel: 4, rating: 4.7, amenities: ["Pool", "Spa", "Sky bar", "Gym"], sourceId: editorial },
    { city: "tokyo", slug: "hotel-gracery-shinjuku", name: "Hotel Gracery Shinjuku", type: "hotel", area: "Shinjuku", lat: 35.6952, lng: 139.7019, description: "Godzilla-topped mid-range hotel in the heart of Kabukicho.", estCostUsd: 130, priceLevel: 2, rating: 4.2, amenities: ["24h desk", "Restaurant"], sourceId: editorial },
    { city: "tokyo", slug: "unplan-shinjuku", name: "UNPLAN Shinjuku", type: "hostel", area: "Shinjuku", lat: 35.7014, lng: 139.7005, description: "Design hostel with a lively lounge and café.", estCostUsd: 35, priceLevel: 1, rating: 4.5, amenities: ["Café", "Lounge", "Lockers"], sourceId: editorial },
    { city: "tokyo", slug: "st-lukes-hospital", name: "St. Luke's International Hospital", type: "hospital", area: "Chuo", lat: 35.6673, lng: 139.7776, description: "Major hospital with English-speaking staff and international desk.", openingHours: "24h emergency", sourceId: editorial },
    { city: "tokyo", slug: "tokyo-police-kbn", name: "Shibuya Police Station", type: "police", area: "Shibuya", lat: 35.6614, lng: 139.7038, description: "Central police station; kōbans (police boxes) are on most corners.", openingHours: "24h", sourceId: editorial },

    /* ── Kyoto ── */
    { city: "kyoto", slug: "fushimi-inari", name: "Fushimi Inari Taisha", type: "attraction", area: "Fushimi", lat: 34.9671, lng: 135.7727, description: "10,000 vermilion torii gates winding up Mount Inari.", estCostUsd: 0, rating: 4.8, durationMin: 150, openingHours: "24h", tags: ["history", "hiking", "photography"], sourceId: src("Japan National Tourism") },
    { city: "kyoto", slug: "kinkaku-ji", name: "Kinkaku-ji (Golden Pavilion)", type: "attraction", area: "Kita", lat: 35.0394, lng: 135.7292, description: "Gold-leaf Zen pavilion reflected in a mirror pond.", estCostUsd: 4, rating: 4.6, durationMin: 75, openingHours: "09:00–17:00", tags: ["history", "photography"], sourceId: src("Japan National Tourism") },
    { city: "kyoto", slug: "arashiyama-bamboo", name: "Arashiyama Bamboo Grove", type: "park", area: "Arashiyama", lat: 35.0094, lng: 135.6668, description: "Towering bamboo path beside the Katsura river; go at dawn.", estCostUsd: 0, rating: 4.5, durationMin: 90, tags: ["nature", "photography"], sourceId: editorial },
    { city: "kyoto", slug: "nishiki-market", name: "Nishiki Market", type: "market", area: "Nakagyo", lat: 35.005, lng: 135.7649, description: "Kyoto's kitchen — 400 m of food stalls and knife shops.", estCostUsd: 15, rating: 4.4, durationMin: 90, openingHours: "09:30–18:00", tags: ["food", "local markets"], sourceId: editorial },
    { city: "kyoto", slug: "gion-district", name: "Gion District", type: "neighborhood", area: "Higashiyama", lat: 35.0037, lng: 135.7752, description: "Geisha district of wooden machiya teahouses — evening strolls along Hanamikoji.", estCostUsd: 0, rating: 4.6, durationMin: 90, tags: ["history", "photography", "nightlife"], sourceId: editorial },
    { city: "kyoto", slug: "kyoto-station", name: "Kyoto Station", type: "train_station", area: "Shimogyo", lat: 34.9858, lng: 135.7585, description: "Futuristic steel hub — 15 min to Osaka, 2h15 to Tokyo by shinkansen.", sourceId: src("JR East") },

    /* ── Paris ── */
    { city: "paris", slug: "cdg-airport", name: "Charles de Gaulle Airport (CDG)", type: "airport", area: "Roissy", lat: 49.0097, lng: 2.5479, description: "France's main hub, 35 min to central Paris by RER B.", sourceId: src("RATP") },
    { city: "paris", slug: "gare-de-lyon", name: "Gare de Lyon", type: "train_station", area: "12th arr.", lat: 48.8443, lng: 2.3743, description: "TGV gateway to Lyon, Provence and the Alps.", sourceId: src("RATP") },
    { city: "paris", slug: "eiffel-tower", name: "Eiffel Tower", type: "attraction", area: "7th arr.", lat: 48.8584, lng: 2.2945, description: "Gustave Eiffel's 330 m icon. Book summit tickets weeks ahead, or climb the stairs to level 2.", estCostUsd: 24, rating: 4.7, durationMin: 120, openingHours: "09:30–23:00", tags: ["photography", "views", "history"], image: IMG.paris, website: "https://www.toureiffel.paris", sourceId: src("Paris Je t'aime") },
    { city: "paris", slug: "louvre", name: "Louvre Museum", type: "museum", area: "1st arr.", lat: 48.8606, lng: 2.3376, description: "The world's largest art museum — Mona Lisa, Winged Victory and 35,000 works.", estCostUsd: 24, rating: 4.7, durationMin: 180, openingHours: "09:00–18:00, closed Tue", tags: ["art", "museums", "history"], website: "https://www.louvre.fr", sourceId: src("Paris Je t'aime") },
    { city: "paris", slug: "musee-dorsay", name: "Musée d'Orsay", type: "museum", area: "7th arr.", lat: 48.86, lng: 2.3266, description: "Impressionist masterpieces in a Beaux-Arts railway station.", estCostUsd: 17, rating: 4.7, durationMin: 150, openingHours: "09:30–18:00, closed Mon", tags: ["art", "museums"], sourceId: src("Paris Je t'aime") },
    { city: "paris", slug: "montmartre", name: "Montmartre & Sacré-Cœur", type: "neighborhood", area: "18th arr.", lat: 48.8867, lng: 2.3431, description: "Hilltop village of artists, winding stairs and the white basilica's city view.", estCostUsd: 0, rating: 4.6, durationMin: 150, tags: ["photography", "history", "views"], image: IMG.parisStreet, sourceId: editorial },
    { city: "paris", slug: "le-marais", name: "Le Marais", type: "neighborhood", area: "4th arr.", lat: 48.8575, lng: 2.3622, description: "Medieval lanes, falafel row on Rue des Rosiers, galleries and Place des Vosges.", estCostUsd: 0, rating: 4.6, durationMin: 120, tags: ["shopping", "food", "history"], sourceId: editorial },
    { city: "paris", slug: "seine-cruise", name: "Seine River Cruise", type: "activity", area: "7th arr.", lat: 48.8606, lng: 2.2977, description: "One-hour boat loop past Notre-Dame, the Louvre and the Eiffel Tower.", estCostUsd: 17, rating: 4.4, durationMin: 70, openingHours: "10:00–22:30", tags: ["views", "family", "photography"], sourceId: editorial },
    { city: "paris", slug: "luxembourg-gardens", name: "Luxembourg Gardens", type: "park", area: "6th arr.", lat: 48.8462, lng: 2.3372, description: "Chairs by the fountain, chess players and pony rides — the classic Paris pause.", estCostUsd: 0, rating: 4.7, durationMin: 75, tags: ["nature", "family"], sourceId: editorial },
    { city: "paris", slug: "marche-aligre", name: "Marché d'Aligre", type: "market", area: "12th arr.", lat: 48.8493, lng: 2.3781, description: "Boisterous everyday food market beloved by locals.", estCostUsd: 10, rating: 4.4, durationMin: 75, openingHours: "Tue–Sun mornings", tags: ["food", "local markets"], sourceId: editorial },
    { city: "paris", slug: "bouillon-chartier", name: "Bouillon Chartier", type: "restaurant", area: "9th arr.", lat: 48.8721, lng: 2.3431, description: "1896 workers' canteen serving classic French dishes at fair prices.", estCostUsd: 22, priceLevel: 2, rating: 4.3, durationMin: 90, openingHours: "11:30–24:00", tags: ["food", "history"], sourceId: editorial },
    { city: "paris", slug: "las-du-fallafel", name: "L'As du Fallafel", type: "street_food", area: "4th arr.", lat: 48.8576, lng: 2.359, description: "The Marais falafel queue that's always worth it.", estCostUsd: 10, priceLevel: 1, rating: 4.5, durationMin: 30, openingHours: "Closed Sat", tags: ["food", "cheap eats"], sourceId: editorial },
    { city: "paris", slug: "septime", name: "Septime", type: "restaurant", area: "11th arr.", lat: 48.8534, lng: 2.3809, description: "Modern neo-bistro with a Michelin star — book a month out.", estCostUsd: 120, priceLevel: 4, rating: 4.7, durationMin: 120, tags: ["food", "fine dining"], sourceId: editorial },
    { city: "paris", slug: "hotel-lutetia", name: "Hôtel Lutetia", type: "hotel", area: "6th arr.", lat: 48.8512, lng: 2.3269, description: "Art-deco palace hotel on the Left Bank.", estCostUsd: 900, priceLevel: 4, rating: 4.7, amenities: ["Spa", "Pool", "Bar", "Gym"], sourceId: editorial },
    { city: "paris", slug: "hotel-fabric", name: "Hôtel Fabric", type: "hotel", area: "11th arr.", lat: 48.8635, lng: 2.3778, description: "Boutique loft hotel in a former textile factory, Oberkampf nightlife at the door.", estCostUsd: 220, priceLevel: 3, rating: 4.6, amenities: ["Sauna", "Bar", "AC"], sourceId: editorial },
    { city: "paris", slug: "generator-paris", name: "Generator Paris", type: "hostel", area: "10th arr.", lat: 48.8785, lng: 2.3705, description: "Design hostel with a rooftop bar near Canal Saint-Martin.", estCostUsd: 40, priceLevel: 1, rating: 4.2, amenities: ["Rooftop bar", "Café", "Lockers"], sourceId: editorial },
    { city: "paris", slug: "rex-club", name: "Rex Club", type: "nightlife", area: "2nd arr.", lat: 48.8709, lng: 2.3474, description: "Paris's historic techno institution under the Grand Rex cinema.", estCostUsd: 20, rating: 4.3, durationMin: 180, openingHours: "Thu–Sat from 23:00", tags: ["nightlife", "music"], sourceId: editorial },
    { city: "paris", slug: "hopital-hotel-dieu", name: "Hôtel-Dieu Hospital", type: "hospital", area: "4th arr.", lat: 48.854, lng: 2.3486, description: "Central public hospital beside Notre-Dame.", openingHours: "24h emergency", sourceId: editorial },

    /* ── Marrakech ── */
    { city: "marrakech", slug: "rak-airport", name: "Marrakech Menara Airport (RAK)", type: "airport", area: "Menara", lat: 31.6069, lng: -8.0363, description: "15 min from the medina by taxi or bus 19.", sourceId: src("Moroccan National") },
    { city: "marrakech", slug: "marrakech-train-station", name: "Marrakech Train Station", type: "train_station", area: "Gueliz", lat: 31.6318, lng: -8.0203, description: "ONCF trains to Casablanca (2h40) connecting to the Al Boraq high-speed line.", sourceId: src("ONCF") },
    { city: "marrakech", slug: "jemaa-el-fnaa", name: "Jemaa el-Fnaa", type: "attraction", area: "Medina", lat: 31.6258, lng: -7.9891, description: "The great square: storytellers by day, a smoke-wreathed open-air food court by night.", estCostUsd: 0, rating: 4.6, durationMin: 120, openingHours: "24h · food stalls from ~17:00", tags: ["food", "history", "photography", "nightlife"], image: IMG.marrakech, sourceId: src("Moroccan National") },
    { city: "marrakech", slug: "bahia-palace", name: "Bahia Palace", type: "attraction", area: "Medina", lat: 31.6217, lng: -7.9825, description: "19th-century palace of zellige courtyards and painted cedar ceilings.", estCostUsd: 10, rating: 4.5, durationMin: 90, openingHours: "09:00–17:00", tags: ["history", "architecture", "photography"], sourceId: src("Moroccan National") },
    { city: "marrakech", slug: "jardin-majorelle", name: "Jardin Majorelle", type: "park", area: "Gueliz", lat: 31.6414, lng: -8.0033, description: "Yves Saint Laurent's cobalt-blue garden and Berber museum. Book online.", estCostUsd: 17, rating: 4.6, durationMin: 90, openingHours: "08:00–18:30", tags: ["nature", "photography", "art"], sourceId: editorial },
    { city: "marrakech", slug: "souk-semmarine", name: "Souk Semmarine", type: "market", area: "Medina", lat: 31.628, lng: -7.9884, description: "Main artery of the souks — lanterns, leather, spices. Haggle with a smile.", estCostUsd: 0, rating: 4.4, durationMin: 120, tags: ["shopping", "local markets"], image: IMG.marrakechSouk, sourceId: editorial },
    { city: "marrakech", slug: "ben-youssef-madrasa", name: "Ben Youssef Madrasa", type: "attraction", area: "Medina", lat: 31.6318, lng: -7.9861, description: "Exquisitely restored 14th-century Quranic school.", estCostUsd: 5, rating: 4.6, durationMin: 60, openingHours: "09:00–18:00", tags: ["history", "architecture"], sourceId: editorial },
    { city: "marrakech", slug: "le-jardin-secret", name: "Le Jardin Secret", type: "park", area: "Medina", lat: 31.6304, lng: -7.9899, description: "Restored riad gardens with a tower view over the medina rooftops.", estCostUsd: 8, rating: 4.4, durationMin: 60, tags: ["nature", "views"], sourceId: editorial },
    { city: "marrakech", slug: "nomad-restaurant", name: "Nomad", type: "restaurant", area: "Medina", lat: 31.6296, lng: -7.9873, description: "Modern Moroccan on a rooftop over the spice square.", estCostUsd: 25, priceLevel: 2, rating: 4.5, durationMin: 90, openingHours: "12:00–23:00", tags: ["food", "views"], sourceId: editorial },
    { city: "marrakech", slug: "mechoui-alley", name: "Mechoui Alley", type: "street_food", area: "Medina", lat: 31.6265, lng: -7.9886, description: "Whole-roasted lamb by the quarter-kilo, sold from pit ovens before it runs out.", estCostUsd: 8, priceLevel: 1, rating: 4.5, durationMin: 45, openingHours: "~11:00 until sold out", tags: ["food", "local specialties"], sourceId: editorial },
    { city: "marrakech", slug: "dar-yacout", name: "Dar Yacout", type: "restaurant", area: "Medina", lat: 31.6349, lng: -7.9942, description: "Palatial riad dinner experience — a Marrakech classic.", estCostUsd: 65, priceLevel: 3, rating: 4.4, durationMin: 150, tags: ["food", "fine dining"], sourceId: editorial },
    { city: "marrakech", slug: "royal-mansour", name: "Royal Mansour", type: "hotel", area: "Hivernage", lat: 31.6236, lng: -7.9986, description: "Riad-style suites with private plunge pools — Morocco's most opulent address.", estCostUsd: 1200, priceLevel: 4, rating: 4.9, amenities: ["Spa", "Pool", "3 restaurants"], sourceId: editorial },
    { city: "marrakech", slug: "riad-yasmine", name: "Riad Yasmine", type: "hotel", area: "Medina", lat: 31.6338, lng: -7.9922, description: "Instagram-famous green-tiled courtyard pool riad.", estCostUsd: 140, priceLevel: 2, rating: 4.6, amenities: ["Pool", "Rooftop", "Breakfast"], sourceId: editorial },
    { city: "marrakech", slug: "equity-point-hostel", name: "Equity Point Marrakech", type: "hostel", area: "Medina", lat: 31.6289, lng: -7.9926, description: "Sprawling riad hostel with pool, 5 min from Jemaa el-Fnaa.", estCostUsd: 18, priceLevel: 1, rating: 4.3, amenities: ["Pool", "Terrace", "Bar"], sourceId: editorial },
    { city: "marrakech", slug: "atlas-day-trip", name: "Atlas Mountains & Berber Villages Day Trip", type: "activity", area: "Atlas", lat: 31.2167, lng: -7.9167, description: "Imlil valley hike, mint tea in a Berber home, views of Mt Toubkal.", estCostUsd: 45, rating: 4.7, durationMin: 480, tags: ["nature", "hiking", "culture"], sourceId: editorial },
    { city: "marrakech", slug: "hammam-de-la-rose", name: "Hammam de la Rose", type: "activity", area: "Medina", lat: 31.6301, lng: -7.9915, description: "Traditional steam bath and black-soap scrub, spa style.", estCostUsd: 35, rating: 4.5, durationMin: 90, openingHours: "10:00–20:00", tags: ["wellness", "culture"], sourceId: editorial },
    { city: "marrakech", slug: "ibn-tofail-hospital", name: "Ibn Tofail Hospital", type: "hospital", area: "Gueliz", lat: 31.6423, lng: -8.0089, description: "Main public hospital; private clinics in Gueliz have English/French-speaking staff.", openingHours: "24h emergency", sourceId: editorial },
    { city: "marrakech", slug: "tourist-police-jemaa", name: "Tourist Police (Jemaa el-Fnaa)", type: "police", area: "Medina", lat: 31.6252, lng: -7.9896, description: "Dedicated tourist police brigade on the main square.", openingHours: "24h", sourceId: editorial },

    /* ── Casablanca ── */
    { city: "casablanca", slug: "cmn-airport", name: "Mohammed V International (CMN)", type: "airport", area: "Nouaceur", lat: 33.3675, lng: -7.5898, description: "Morocco's biggest hub; train to city center every hour.", sourceId: src("ONCF") },
    { city: "casablanca", slug: "hassan-ii-mosque", name: "Hassan II Mosque", type: "attraction", area: "Corniche", lat: 33.6086, lng: -7.6327, description: "One of the world's largest mosques, minaret 210 m, built over the Atlantic. Non-Muslims may join guided tours.", estCostUsd: 14, rating: 4.8, durationMin: 90, openingHours: "Tours 09:00–15:00 (times vary Fri)", tags: ["architecture", "history"], sourceId: src("Moroccan National") },
    { city: "casablanca", slug: "casa-voyageurs", name: "Casa Voyageurs Station", type: "train_station", area: "Centre", lat: 33.589, lng: -7.5833, description: "Al Boraq high-speed rail to Tangier (2h10) and lines to Marrakech.", sourceId: src("ONCF") },
    { city: "casablanca", slug: "rick-s-cafe", name: "Rick's Café", type: "restaurant", area: "Old Medina", lat: 33.6069, lng: -7.6256, description: "A faithful recreation of the movie legend — piano and all.", estCostUsd: 40, priceLevel: 3, rating: 4.3, durationMin: 120, openingHours: "12:00–15:00, 18:30–24:00", tags: ["food", "history"], sourceId: editorial },
    { city: "casablanca", slug: "corniche-ain-diab", name: "Corniche Aïn Diab", type: "beach", area: "Aïn Diab", lat: 33.5946, lng: -7.6706, description: "Ocean promenade of beach clubs and café terraces.", estCostUsd: 0, rating: 4.2, durationMin: 120, tags: ["beaches", "nightlife"], sourceId: editorial },

    /* ── Essaouira ── */
    { city: "essaouira", slug: "essaouira-medina", name: "Essaouira Medina & Skala", type: "attraction", area: "Medina", lat: 31.5125, lng: -9.77, description: "UNESCO-listed ramparts, blue boats and gull-swept sea walls.", estCostUsd: 0, rating: 4.6, durationMin: 150, tags: ["history", "photography"], image: IMG.essaouira, sourceId: src("Moroccan National") },
    { city: "essaouira", slug: "essaouira-beach", name: "Essaouira Beach", type: "beach", area: "Bay", lat: 31.5027, lng: -9.7668, description: "Wide crescent bay — Africa's windsurf and kitesurf capital.", estCostUsd: 0, rating: 4.5, durationMin: 180, tags: ["beaches", "sports"], sourceId: editorial },
    { city: "essaouira", slug: "port-fish-grills", name: "Port Fish Grills", type: "street_food", area: "Port", lat: 31.5108, lng: -9.7716, description: "Pick your catch at the port, grilled on the spot.", estCostUsd: 10, priceLevel: 1, rating: 4.3, durationMin: 60, tags: ["food", "local specialties"], sourceId: editorial },

    /* ── Rome ── */
    { city: "rome", slug: "fco-airport", name: "Fiumicino Airport (FCO)", type: "airport", area: "Fiumicino", lat: 41.8003, lng: 12.2389, description: "Leonardo Express train to Termini in 32 min.", sourceId: editorial },
    { city: "rome", slug: "colosseum", name: "Colosseum", type: "attraction", area: "Centro", lat: 41.8902, lng: 12.4922, description: "The 50,000-seat Flavian Amphitheatre. Book the underground tour if you can.", estCostUsd: 20, rating: 4.7, durationMin: 150, openingHours: "08:30–19:00", tags: ["history", "photography"], image: IMG.rome, sourceId: editorial },
    { city: "rome", slug: "vatican-museums", name: "Vatican Museums & Sistine Chapel", type: "museum", area: "Vatican", lat: 41.9065, lng: 12.4536, description: "Seven km of galleries ending at Michelangelo's ceiling.", estCostUsd: 22, rating: 4.6, durationMin: 210, openingHours: "08:00–19:00, closed Sun (mostly)", tags: ["art", "museums", "history"], sourceId: editorial },
    { city: "rome", slug: "trastevere", name: "Trastevere", type: "neighborhood", area: "Trastevere", lat: 41.8897, lng: 12.4694, description: "Ivy-draped lanes, aperitivo crowds and Rome's best evening wander.", estCostUsd: 0, rating: 4.6, durationMin: 120, tags: ["food", "nightlife", "photography"], image: IMG.romeSunset, sourceId: editorial },
    { city: "rome", slug: "pantheon", name: "Pantheon", type: "attraction", area: "Centro", lat: 41.8986, lng: 12.4769, description: "The best-preserved Roman building — 2,000-year-old concrete dome.", estCostUsd: 5, rating: 4.8, durationMin: 60, openingHours: "09:00–19:00", tags: ["history", "architecture"], sourceId: editorial },
    { city: "rome", slug: "roscioli", name: "Roscioli", type: "restaurant", area: "Centro", lat: 41.8938, lng: 12.4735, description: "Deli-restaurant hybrid; the carbonara benchmark.", estCostUsd: 40, priceLevel: 3, rating: 4.5, durationMin: 90, tags: ["food"], sourceId: editorial },
    { city: "rome", slug: "termini-station", name: "Roma Termini", type: "train_station", area: "Esquilino", lat: 41.9009, lng: 12.5023, description: "Italy's busiest station — high-speed rail to Florence in 1h32.", sourceId: editorial },
    { city: "rome", slug: "hotel-de-russie", name: "Hotel de Russie", type: "hotel", area: "Centro", lat: 41.9109, lng: 12.4769, description: "Terraced secret garden between Piazza del Popolo and the Spanish Steps.", estCostUsd: 750, priceLevel: 4, rating: 4.7, amenities: ["Spa", "Garden", "Bar"], sourceId: editorial },
    { city: "rome", slug: "the-yellow-hostel", name: "The Yellow", type: "hostel", area: "Termini", lat: 41.9042, lng: 12.4988, description: "Party hostel with 24h bar near Termini.", estCostUsd: 30, priceLevel: 1, rating: 4.2, amenities: ["Bar", "Events", "Lockers"], sourceId: editorial },

    /* ── Florence ── */
    { city: "florence", slug: "uffizi", name: "Uffizi Gallery", type: "museum", area: "Centro", lat: 43.7678, lng: 11.2553, description: "Botticelli's Venus and the Renaissance canon.", estCostUsd: 27, rating: 4.7, durationMin: 180, openingHours: "08:15–18:30, closed Mon", tags: ["art", "museums"], sourceId: editorial },
    { city: "florence", slug: "duomo-florence", name: "Florence Duomo & Brunelleschi's Dome", type: "attraction", area: "Centro", lat: 43.7731, lng: 11.2566, description: "Climb 463 steps inside the double-shell dome.", estCostUsd: 32, rating: 4.8, durationMin: 120, tags: ["history", "architecture", "views"], image: IMG.pisa, sourceId: editorial },
    { city: "florence", slug: "mercato-centrale", name: "Mercato Centrale", type: "market", area: "San Lorenzo", lat: 43.7764, lng: 11.2531, description: "Iron-and-glass food hall — lampredotto downstairs, wine bars upstairs.", estCostUsd: 15, rating: 4.4, durationMin: 90, tags: ["food", "local markets"], sourceId: editorial },

    /* ── Barcelona ── */
    { city: "barcelona", slug: "sagrada-familia", name: "Sagrada Família", type: "attraction", area: "Eixample", lat: 41.4036, lng: 2.1744, description: "Gaudí's unfinished basilica — book tower access at sunset.", estCostUsd: 28, rating: 4.8, durationMin: 120, openingHours: "09:00–20:00", tags: ["architecture", "photography"], sourceId: editorial },
    { city: "barcelona", slug: "park-guell", name: "Park Güell", type: "park", area: "Gràcia", lat: 41.4145, lng: 2.1527, description: "Mosaic terraces with the whole city below.", estCostUsd: 11, rating: 4.5, durationMin: 120, tags: ["nature", "photography"], sourceId: editorial },
    { city: "barcelona", slug: "barceloneta-beach", name: "Barceloneta Beach", type: "beach", area: "Barceloneta", lat: 41.3784, lng: 2.1925, description: "The city beach — chiringuitos, volleyball and vermouth.", estCostUsd: 0, rating: 4.3, durationMin: 180, tags: ["beaches", "nightlife"], sourceId: editorial },
    { city: "barcelona", slug: "el-xampanyet", name: "El Xampanyet", type: "restaurant", area: "El Born", lat: 41.3853, lng: 2.1807, description: "Standing-room cava and anchovies since 1929.", estCostUsd: 20, priceLevel: 2, rating: 4.5, durationMin: 60, tags: ["food", "tapas"], sourceId: editorial },
    { city: "barcelona", slug: "bcn-airport", name: "Barcelona–El Prat (BCN)", type: "airport", area: "El Prat", lat: 41.2974, lng: 2.0833, description: "Aerobús to Plaça Catalunya in 35 min.", sourceId: editorial },

    /* ── Madrid ── */
    { city: "madrid", slug: "prado-museum", name: "Museo del Prado", type: "museum", area: "Retiro", lat: 40.4138, lng: -3.6921, description: "Velázquez, Goya and Bosch — free entry final 2 hours daily.", estCostUsd: 16, rating: 4.7, durationMin: 180, openingHours: "10:00–20:00", tags: ["art", "museums"], sourceId: editorial },
    { city: "madrid", slug: "retiro-park", name: "El Retiro Park", type: "park", area: "Retiro", lat: 40.4153, lng: -3.6845, description: "Rowboats, the Crystal Palace and Sunday drummers.", estCostUsd: 0, rating: 4.7, durationMin: 120, tags: ["nature", "family"], sourceId: editorial },
    { city: "madrid", slug: "mercado-san-miguel", name: "Mercado de San Miguel", type: "market", area: "Centro", lat: 40.4154, lng: -3.7089, description: "Iron-framed gourmet tapas market by Plaza Mayor.", estCostUsd: 20, rating: 4.3, durationMin: 75, tags: ["food", "local markets"], sourceId: editorial },

    /* ── London ── */
    { city: "london", slug: "lhr-airport", name: "Heathrow Airport (LHR)", type: "airport", area: "Hounslow", lat: 51.47, lng: -0.4543, description: "Elizabeth line to central London in ~35 min.", sourceId: editorial },
    { city: "london", slug: "british-museum", name: "British Museum", type: "museum", area: "Bloomsbury", lat: 51.5194, lng: -0.1269, description: "The Rosetta Stone and 8 million objects. Free entry.", estCostUsd: 0, rating: 4.7, durationMin: 180, openingHours: "10:00–17:00", tags: ["museums", "history"], sourceId: editorial },
    { city: "london", slug: "tower-bridge", name: "Tower Bridge & Tower of London", type: "attraction", area: "Tower Hamlets", lat: 51.5055, lng: -0.0754, description: "The Crown Jewels and Victorian engineering above the Thames.", estCostUsd: 42, rating: 4.6, durationMin: 180, openingHours: "09:00–17:30", tags: ["history", "photography"], image: IMG.london, sourceId: editorial },
    { city: "london", slug: "borough-market", name: "Borough Market", type: "market", area: "Southwark", lat: 51.5055, lng: -0.091, description: "1,000-year-old food market — cheese toasties to oysters.", estCostUsd: 18, rating: 4.6, durationMin: 90, openingHours: "Tue–Sat, limited Sun/Mon", tags: ["food", "local markets"], sourceId: editorial },
    { city: "london", slug: "st-pancras", name: "St Pancras International", type: "train_station", area: "Camden", lat: 51.5306, lng: -0.1253, description: "Eurostar to Paris (2h16) and Brussels under a Victorian glass roof.", sourceId: editorial },
    { city: "london", slug: "hoxton-shoreditch", name: "The Hoxton, Shoreditch", type: "hotel", area: "Shoreditch", lat: 51.5265, lng: -0.0813, description: "Industrial-chic base in London's street-art quarter.", estCostUsd: 260, priceLevel: 3, rating: 4.4, amenities: ["Restaurant", "Bar", "Lounge"], sourceId: editorial },

    /* ── New York ── */
    { city: "new-york", slug: "jfk-airport", name: "JFK International Airport", type: "airport", area: "Queens", lat: 40.6413, lng: -73.7781, description: "AirTrain + subway or LIRR into Manhattan.", sourceId: editorial },
    { city: "new-york", slug: "central-park", name: "Central Park", type: "park", area: "Manhattan", lat: 40.7829, lng: -73.9654, description: "843 acres of lakes, lawns and skyline frames.", estCostUsd: 0, rating: 4.8, durationMin: 180, tags: ["nature", "photography", "family"], sourceId: editorial },
    { city: "new-york", slug: "the-met", name: "The Metropolitan Museum of Art", type: "museum", area: "Manhattan", lat: 40.7794, lng: -73.9632, description: "5,000 years of art on Museum Mile.", estCostUsd: 30, rating: 4.8, durationMin: 210, openingHours: "10:00–17:00, closed Wed", tags: ["art", "museums"], sourceId: editorial },
    { city: "new-york", slug: "brooklyn-bridge", name: "Brooklyn Bridge Walk", type: "attraction", area: "Brooklyn", lat: 40.7061, lng: -73.9969, description: "Walk Brooklyn → Manhattan at golden hour.", estCostUsd: 0, rating: 4.7, durationMin: 75, tags: ["photography", "views"], sourceId: editorial },
    { city: "new-york", slug: "katzs-deli", name: "Katz's Delicatessen", type: "restaurant", area: "Lower East Side", lat: 40.7223, lng: -73.9874, description: "Pastrami on rye since 1888.", estCostUsd: 28, priceLevel: 2, rating: 4.5, durationMin: 60, openingHours: "08:00–23:00", tags: ["food", "history"], sourceId: editorial },

    /* ── Istanbul ── */
    { city: "istanbul", slug: "ist-airport", name: "Istanbul Airport (IST)", type: "airport", area: "Arnavutköy", lat: 41.2753, lng: 28.7519, description: "One of the world's biggest hubs; metro M11 + M2 to the center.", sourceId: editorial },
    { city: "istanbul", slug: "hagia-sophia", name: "Hagia Sophia", type: "attraction", area: "Sultanahmet", lat: 41.0086, lng: 28.9802, description: "Byzantine cathedral, Ottoman mosque, modern icon — 1,500 years of history under one dome.", estCostUsd: 28, rating: 4.7, durationMin: 90, openingHours: "09:00–19:30 (closed to visitors at prayer times)", tags: ["history", "architecture"], sourceId: editorial },
    { city: "istanbul", slug: "blue-mosque", name: "Blue Mosque (Sultan Ahmed)", type: "attraction", area: "Sultanahmet", lat: 41.0054, lng: 28.9768, description: "Six minarets and 20,000 İznik tiles. Free entry outside prayer times.", estCostUsd: 0, rating: 4.7, durationMin: 60, tags: ["history", "architecture"], sourceId: editorial },
    { city: "istanbul", slug: "grand-bazaar", name: "Grand Bazaar", type: "market", area: "Fatih", lat: 41.0106, lng: 28.968, description: "4,000 shops under painted vaults — one of the world's oldest covered markets.", estCostUsd: 0, rating: 4.5, durationMin: 120, openingHours: "09:00–19:00, closed Sun", tags: ["shopping", "local markets", "history"], sourceId: editorial },
    { city: "istanbul", slug: "topkapi-palace", name: "Topkapı Palace", type: "attraction", area: "Sultanahmet", lat: 41.0115, lng: 28.9834, description: "Ottoman seat of power for 400 years; don't skip the Harem.", estCostUsd: 45, rating: 4.6, durationMin: 180, openingHours: "09:00–18:00, closed Tue", tags: ["history", "museums"], sourceId: editorial },
    { city: "istanbul", slug: "bosphorus-cruise", name: "Bosphorus Ferry Cruise", type: "activity", area: "Eminönü", lat: 41.0175, lng: 28.9709, description: "Public ferry between two continents for pocket change.", estCostUsd: 3, rating: 4.7, durationMin: 120, tags: ["views", "photography"], sourceId: editorial },
    { city: "istanbul", slug: "karakoy-lokantasi", name: "Karaköy Lokantası", type: "restaurant", area: "Karaköy", lat: 41.0225, lng: 28.9744, description: "Turquoise-tiled meyhane — mezes done right.", estCostUsd: 25, priceLevel: 2, rating: 4.5, durationMin: 90, tags: ["food"], sourceId: editorial },
    { city: "istanbul", slug: "ciya-sofrasi", name: "Çiya Sofrası", type: "restaurant", area: "Kadıköy", lat: 40.9901, lng: 29.0243, description: "Anatolian regional cooking worth the ferry to the Asian side.", estCostUsd: 15, priceLevel: 1, rating: 4.6, durationMin: 75, tags: ["food", "local specialties"], sourceId: editorial },
    { city: "istanbul", slug: "pera-palace", name: "Pera Palace Hotel", type: "hotel", area: "Beyoğlu", lat: 41.0318, lng: 28.9744, description: "1892 Orient Express grande dame; Agatha Christie's room 411.", estCostUsd: 320, priceLevel: 4, rating: 4.6, amenities: ["Spa", "Bar", "Afternoon tea"], sourceId: editorial },
    { city: "istanbul", slug: "eminonu-ferry", name: "Eminönü Ferry Terminal", type: "ferry_port", area: "Eminönü", lat: 41.0177, lng: 28.9739, description: "Hub for Bosphorus and Golden Horn ferries.", sourceId: editorial },

    /* ── Riyadh ── */
    { city: "riyadh", slug: "diriyah", name: "Diriyah (At-Turaif)", type: "attraction", area: "Diriyah", lat: 24.7343, lng: 46.5729, description: "UNESCO mud-brick birthplace of the Saudi state, now a flagship heritage district.", estCostUsd: 27, rating: 4.6, durationMin: 180, tags: ["history", "architecture"], sourceId: editorial },
    { city: "riyadh", slug: "edge-of-the-world", name: "Edge of the World", type: "attraction", area: "Tuwaiq", lat: 24.9351, lng: 45.9905, description: "Sheer cliffs over an ancient sea bed, 90 min from the city (4x4 tour recommended).", estCostUsd: 60, rating: 4.8, durationMin: 360, tags: ["nature", "hiking", "photography"], sourceId: editorial },
    { city: "riyadh", slug: "ruh-airport", name: "King Khalid International (RUH)", type: "airport", area: "North", lat: 24.9576, lng: 46.6988, description: "35 km north of the center.", sourceId: editorial },

    /* ── Dubai ── */
    { city: "dubai", slug: "dxb-airport", name: "Dubai International (DXB)", type: "airport", area: "Deira", lat: 25.2532, lng: 55.3657, description: "The world's busiest international airport; metro Red line into town.", sourceId: editorial },
    { city: "dubai", slug: "burj-khalifa", name: "Burj Khalifa — At the Top", type: "attraction", area: "Downtown", lat: 25.1972, lng: 55.2744, description: "828 m up; book sunset slots weeks ahead.", estCostUsd: 45, rating: 4.6, durationMin: 120, openingHours: "08:30–23:00", tags: ["views", "photography"], sourceId: editorial },
    { city: "dubai", slug: "dubai-old-souks", name: "Deira Gold & Spice Souks + Abra ride", type: "market", area: "Deira", lat: 25.2676, lng: 55.2963, description: "Cross the creek by wooden abra for 1 AED, then wander the souks.", estCostUsd: 2, rating: 4.4, durationMin: 120, tags: ["local markets", "history"], sourceId: editorial },
    { city: "dubai", slug: "desert-safari", name: "Desert Safari & Bedouin Camp", type: "activity", area: "Al Marmoom", lat: 24.9, lng: 55.4, description: "Dune bashing, camel rides and BBQ under the stars.", estCostUsd: 65, rating: 4.5, durationMin: 360, tags: ["adventure", "nature"], sourceId: editorial },
    { city: "dubai", slug: "jumeirah-public-beach", name: "Jumeirah Public Beach", type: "beach", area: "Jumeirah", lat: 25.2048, lng: 55.2382, description: "Free white-sand beach with Burj Al Arab views.", estCostUsd: 0, rating: 4.5, durationMin: 180, tags: ["beaches"], sourceId: editorial },

    /* ── Bangkok ── */
    { city: "bangkok", slug: "bkk-airport", name: "Suvarnabhumi Airport (BKK)", type: "airport", area: "Samut Prakan", lat: 13.69, lng: 100.7501, description: "Airport Rail Link to the center in 26 min.", sourceId: src("Tourism Authority of Thailand") },
    { city: "bangkok", slug: "grand-palace", name: "Grand Palace & Wat Phra Kaew", type: "attraction", area: "Rattanakosin", lat: 13.75, lng: 100.4913, description: "Thailand's holiest site — the Emerald Buddha. Dress code enforced.", estCostUsd: 15, rating: 4.6, durationMin: 150, openingHours: "08:30–15:30", tags: ["history", "architecture"], sourceId: src("Tourism Authority of Thailand") },
    { city: "bangkok", slug: "wat-arun", name: "Wat Arun", type: "attraction", area: "Thonburi", lat: 13.7437, lng: 100.4889, description: "Porcelain-encrusted Temple of Dawn — cross by 5-baht ferry, best at sunset.", estCostUsd: 3, rating: 4.6, durationMin: 90, openingHours: "08:00–18:00", tags: ["history", "photography"], sourceId: editorial },
    { city: "bangkok", slug: "wat-pho", name: "Wat Pho (Reclining Buddha)", type: "attraction", area: "Rattanakosin", lat: 13.7465, lng: 100.493, description: "46 m gilded Buddha and the birthplace of Thai massage.", estCostUsd: 8, rating: 4.7, durationMin: 90, openingHours: "08:00–18:30", tags: ["history"], sourceId: editorial },
    { city: "bangkok", slug: "chatuchak-market", name: "Chatuchak Weekend Market", type: "market", area: "Chatuchak", lat: 13.7999, lng: 100.5502, description: "15,000 stalls — the world's largest weekend market.", estCostUsd: 10, rating: 4.5, durationMin: 180, openingHours: "Sat–Sun 09:00–18:00", tags: ["shopping", "local markets", "food"], sourceId: editorial },
    { city: "bangkok", slug: "chinatown-yaowarat", name: "Yaowarat (Chinatown) Street Food", type: "street_food", area: "Samphanthawong", lat: 13.7398, lng: 100.5096, description: "Neon-lit food crawl — go hungry after 18:00.", estCostUsd: 8, priceLevel: 1, rating: 4.7, durationMin: 150, openingHours: "18:00–24:00", tags: ["food", "nightlife", "cheap eats"], sourceId: editorial },
    { city: "bangkok", slug: "jay-fai", name: "Jay Fai", type: "restaurant", area: "Phra Nakhon", lat: 13.7527, lng: 100.5045, description: "Michelin-starred crab omelette cooked over charcoal by the goggle-wearing legend.", estCostUsd: 30, priceLevel: 3, rating: 4.4, durationMin: 90, openingHours: "Wed–Sat 09:00–19:00", tags: ["food", "street food"], sourceId: editorial },
    { city: "bangkok", slug: "khao-san-road", name: "Khao San Road", type: "nightlife", area: "Banglamphu", lat: 13.7588, lng: 100.4972, description: "Backpacker bacchanal — buckets, pad thai carts and live music.", estCostUsd: 15, rating: 4.1, durationMin: 150, tags: ["nightlife", "backpacker"], sourceId: editorial },
    { city: "bangkok", slug: "lebua-sky-bar", name: "Sky Bar at Lebua", type: "nightlife", area: "Bang Rak", lat: 13.7217, lng: 100.5158, description: "Vertigo-inducing golden dome bar 63 floors up. Dress code.", estCostUsd: 25, rating: 4.3, durationMin: 90, openingHours: "17:00–01:00", tags: ["nightlife", "views"], sourceId: editorial },
    { city: "bangkok", slug: "mandarin-oriental-bkk", name: "Mandarin Oriental Bangkok", type: "hotel", area: "Bang Rak", lat: 13.7244, lng: 100.5145, description: "149-year-old riverside legend, consistently ranked among the world's best.", estCostUsd: 450, priceLevel: 4, rating: 4.8, amenities: ["Pool", "Spa", "River shuttle"], sourceId: editorial },
    { city: "bangkok", slug: "lub-d-siam", name: "Lub d Bangkok Siam", type: "hostel", area: "Pathumwan", lat: 13.7466, lng: 100.5285, description: "Social hostel steps from BTS National Stadium.", estCostUsd: 16, priceLevel: 1, rating: 4.4, amenities: ["Bar", "Co-working", "Lockers"], sourceId: editorial },
    { city: "bangkok", slug: "bumrungrad-hospital", name: "Bumrungrad International Hospital", type: "hospital", area: "Watthana", lat: 13.7437, lng: 100.5548, description: "World-renowned private hospital with full English service.", openingHours: "24h emergency", sourceId: editorial },
    { city: "bangkok", slug: "hua-lamphong", name: "Hua Lamphong / Krung Thep Aphiwat Station", type: "train_station", area: "Pathum Wan", lat: 13.7373, lng: 100.517, description: "Rail gateway for night trains to Chiang Mai and the south.", sourceId: editorial },

    /* ── Phuket ── */
    { city: "phuket", slug: "hkt-airport", name: "Phuket International (HKT)", type: "airport", area: "Thalang", lat: 8.1132, lng: 98.3169, description: "Direct flights across Asia; ~45 min to Patong.", sourceId: editorial },
    { city: "phuket", slug: "kata-beach", name: "Kata Beach", type: "beach", area: "Kata", lat: 7.8204, lng: 98.2985, description: "Family-friendly crescent with surfable waves May–October.", estCostUsd: 0, rating: 4.6, durationMin: 240, tags: ["beaches", "family"], image: IMG.krabiBeach, sourceId: editorial },
    { city: "phuket", slug: "phi-phi-day-trip", name: "Phi Phi Islands Speedboat Trip", type: "activity", area: "Rassada Pier", lat: 7.8804, lng: 98.4008, description: "Maya Bay, Pileh Lagoon and snorkeling — pick a morning departure.", estCostUsd: 55, rating: 4.5, durationMin: 480, tags: ["beaches", "adventure", "photography"], image: IMG.mayaBay, sourceId: editorial },
    { city: "phuket", slug: "old-phuket-town", name: "Old Phuket Town", type: "neighborhood", area: "Old Town", lat: 7.8859, lng: 98.3888, description: "Sino-Portuguese shophouses, Sunday walking-street market.", estCostUsd: 0, rating: 4.5, durationMin: 150, tags: ["history", "photography", "food"], sourceId: editorial },
    { city: "phuket", slug: "big-buddha-phuket", name: "Big Buddha Viewpoint", type: "viewpoint", area: "Karon", lat: 7.8276, lng: 98.3129, description: "45 m marble Buddha with 360° island views.", estCostUsd: 0, rating: 4.6, durationMin: 90, tags: ["views", "photography"], sourceId: editorial },
    { city: "phuket", slug: "rassada-pier", name: "Rassada Pier", type: "ferry_port", area: "Phuket Town", lat: 7.8703, lng: 98.4023, description: "Main ferry port for Phi Phi and Krabi.", sourceId: editorial },

    /* ── Rio ── */
    { city: "rio-de-janeiro", slug: "gig-airport", name: "Galeão International (GIG)", type: "airport", area: "Ilha do Governador", lat: -22.8089, lng: -43.2436, description: "Rio's international gateway, 20 km from the Zona Sul.", sourceId: editorial },
    { city: "rio-de-janeiro", slug: "christ-the-redeemer", name: "Christ the Redeemer", type: "attraction", area: "Corcovado", lat: -22.9519, lng: -43.2105, description: "Ride the cog train up Corcovado for the world's most famous open arms.", estCostUsd: 25, rating: 4.7, durationMin: 180, openingHours: "08:00–19:00", tags: ["views", "photography", "history"], sourceId: editorial },
    { city: "rio-de-janeiro", slug: "sugarloaf", name: "Sugarloaf Cable Car", type: "attraction", area: "Urca", lat: -22.9492, lng: -43.1545, description: "Two-stage cable car; go an hour before sunset.", estCostUsd: 28, rating: 4.7, durationMin: 150, tags: ["views", "photography"], sourceId: editorial },
    { city: "rio-de-janeiro", slug: "copacabana", name: "Copacabana Beach", type: "beach", area: "Copacabana", lat: -22.9711, lng: -43.1822, description: "4 km of sand, caipirinha kiosks and beach football.", estCostUsd: 0, rating: 4.6, durationMin: 240, tags: ["beaches", "nightlife"], sourceId: editorial },
    { city: "rio-de-janeiro", slug: "confeitaria-colombo", name: "Confeitaria Colombo", type: "cafe", area: "Centro", lat: -22.9051, lng: -43.1774, description: "Belle-époque café serving pastéis since 1894.", estCostUsd: 12, priceLevel: 2, rating: 4.5, durationMin: 60, tags: ["food", "history"], sourceId: editorial },
  ];
  const placeRows = await db
    .insert(s.places)
    .values(placeData.map(({ city: citySlug, ...rest }) => ({ ...rest, cityId: city(citySlug) })))
    .returning();
  const place = (slug: string) => placeRows.find((p) => p.slug === slug)!.id;

  console.log("Seeding visa rules (sample matrix — always verify officially)…");
  await db.insert(s.visaRules).values([
    { fromCountryCode: "MA", toCountryCode: "JP", visaType: "visa_required", maxStayDays: 90, requirements: ["Passport valid for stay", "Visa application form", "Flight itinerary", "Proof of funds", "Hotel bookings"], notes: "Moroccan citizens must obtain a visa from a Japanese embassy before travel.", sourceId: src("Japan Ministry"), lastVerifiedAt: new Date("2026-01-10"), verificationStatus: "verified" },
    { fromCountryCode: "MA", toCountryCode: "FR", visaType: "visa_required", maxStayDays: 90, requirements: ["Schengen visa application", "Biometrics", "Travel insurance (€30,000)", "Proof of accommodation", "Proof of funds"], notes: "Schengen short-stay visa (Type C) required; apply via France-Visas.", sourceId: src("France-Visas"), lastVerifiedAt: new Date("2026-01-08"), verificationStatus: "verified" },
    { fromCountryCode: "MA", toCountryCode: "TR", visaType: "visa_free", maxStayDays: 90, requirements: ["Passport valid 6 months"], notes: "Visa-free for stays up to 90 days in any 180-day period.", sourceId: src("e-Visa portal"), lastVerifiedAt: new Date("2026-01-07"), verificationStatus: "verified" },
    { fromCountryCode: "MA", toCountryCode: "TH", visaType: "visa_free", maxStayDays: 60, requirements: ["Passport valid 6 months", "Proof of onward travel may be requested"], notes: "Thailand's visa-exemption scheme was expanded in July 2024 to 93 nationalities including Morocco (60 days). Verify before travel.", sourceId: src("Thai MFA"), lastVerifiedAt: new Date("2026-01-09"), verificationStatus: "verified" },
    { fromCountryCode: "MA", toCountryCode: "GB", visaType: "visa_required", maxStayDays: 180, requirements: ["Standard Visitor visa", "Biometrics", "Proof of funds", "Accommodation details"], notes: "Apply online via gov.uk; decisions typically within 3 weeks.", sourceId: src("gov.uk"), lastVerifiedAt: new Date("2026-01-11"), verificationStatus: "verified" },
    { fromCountryCode: "MA", toCountryCode: "AE", visaType: "visa_required", maxStayDays: 30, requirements: ["Pre-arranged visa via airline/hotel/sponsor"], notes: "Status can vary with bilateral agreements — needs re-verification.", sourceId: src("ICP"), lastVerifiedAt: new Date("2025-10-02"), verificationStatus: "needs_review" },
    { fromCountryCode: "MA", toCountryCode: "BR", visaType: "visa_free", maxStayDays: 90, requirements: ["Passport valid 6 months"], notes: "Bilateral exemption reported; requires official re-verification.", sourceId: src("Brazil Ministry"), lastVerifiedAt: new Date("2025-08-15"), verificationStatus: "needs_review" },
    { fromCountryCode: "US", toCountryCode: "JP", visaType: "visa_free", maxStayDays: 90, requirements: ["Passport valid for stay", "Onward ticket"], notes: "Visa exemption for short-term stays (tourism/business).", sourceId: src("Japan Ministry"), lastVerifiedAt: new Date("2026-01-10"), verificationStatus: "verified" },
    { fromCountryCode: "US", toCountryCode: "FR", visaType: "visa_free", maxStayDays: 90, requirements: ["Passport valid 3 months beyond departure"], notes: "90 days in any 180-day Schengen period. EES/ETIAS changes rolling out — check before travel.", sourceId: src("France-Visas"), lastVerifiedAt: new Date("2026-01-08"), verificationStatus: "verified" },
    { fromCountryCode: "US", toCountryCode: "TH", visaType: "visa_free", maxStayDays: 60, requirements: ["Passport valid 6 months"], notes: "60-day visa exemption.", sourceId: src("Thai MFA"), lastVerifiedAt: new Date("2026-01-09"), verificationStatus: "verified" },
    { fromCountryCode: "US", toCountryCode: "TR", visaType: "visa_free", maxStayDays: 90, requirements: ["Passport valid 6 months"], notes: "Türkiye removed the e-Visa requirement for US ordinary passports — verify current status.", sourceId: src("e-Visa portal"), lastVerifiedAt: new Date("2025-11-20"), verificationStatus: "needs_review" },
    { fromCountryCode: "GB", toCountryCode: "JP", visaType: "visa_free", maxStayDays: 90, requirements: ["Passport valid for stay"], notes: "Visa exemption for short stays.", sourceId: src("Japan Ministry"), lastVerifiedAt: new Date("2026-01-10"), verificationStatus: "verified" },
    { fromCountryCode: "GB", toCountryCode: "US", visaType: "special", maxStayDays: 90, requirements: ["ESTA authorisation before boarding", "e-Passport"], notes: "Visa Waiver Program with ESTA (apply at least 72h before travel).", sourceId: src("Department of State"), lastVerifiedAt: new Date("2026-01-05"), verificationStatus: "verified" },
    { fromCountryCode: "FR", toCountryCode: "US", visaType: "special", maxStayDays: 90, requirements: ["ESTA authorisation", "e-Passport"], notes: "Visa Waiver Program with ESTA.", sourceId: src("Department of State"), lastVerifiedAt: new Date("2026-01-05"), verificationStatus: "verified" },
    { fromCountryCode: "FR", toCountryCode: "MA", visaType: "visa_free", maxStayDays: 90, requirements: ["Passport valid for stay"], notes: "Visa-free for stays up to 90 days.", sourceId: src("Moroccan National"), lastVerifiedAt: new Date("2026-01-12"), verificationStatus: "verified" },
    { fromCountryCode: "GB", toCountryCode: "MA", visaType: "visa_free", maxStayDays: 90, requirements: ["Passport valid for stay"], notes: "Visa-free for stays up to 90 days.", sourceId: src("Moroccan National"), lastVerifiedAt: new Date("2026-01-12"), verificationStatus: "verified" },
    { fromCountryCode: "US", toCountryCode: "SA", visaType: "evisa", maxStayDays: 90, requirements: ["eVisa application", "Passport valid 6 months", "Photo"], notes: "Tourist eVisa (1-year multiple entry).", sourceId: src("Saudi eVisa"), lastVerifiedAt: new Date("2025-09-20"), verificationStatus: "needs_review" },
    { fromCountryCode: "GB", toCountryCode: "AE", visaType: "visa_on_arrival", maxStayDays: 30, requirements: ["Passport valid 6 months"], notes: "Visa on arrival, extendable.", sourceId: src("ICP"), lastVerifiedAt: new Date("2025-10-02"), verificationStatus: "needs_review" },
  ]);

  console.log("Seeding facts, phrases, alerts, routes, rates…");
  await db.insert(s.travelFacts).values([
    { countryId: C("JP"), category: "sim", title: "eSIM is the easiest option", body: "Major carriers (Docomo, KDDI, SoftBank) have excellent coverage. Tourist eSIMs typically cost $10–25 for 10–20 GB. Physical SIMs are sold at airport vending machines.", sourceId: editorial },
    { countryId: C("JP"), category: "money", title: "Cash still matters", body: "Cards are widely accepted in cities but many small restaurants and shrines are cash-only. 7-Eleven ATMs accept foreign cards reliably.", sourceId: editorial },
    { countryId: C("JP"), category: "transport", title: "Get an IC card (Suica/Pasmo)", body: "Digital Suica works in Apple/Google Wallet. The Japan Rail Pass is only worth it for multiple long-distance shinkansen trips.", sourceId: src("JR East") },
    { countryId: C("JP"), category: "law", title: "Carry your passport", body: "Foreign visitors are legally required to carry their passport at all times.", sourceId: src("Japan Ministry") },
    { countryId: C("JP"), category: "food", title: "What to eat in Japan", body: "Ramen, sushi, okonomiyaki, tonkatsu, yakitori, kaiseki, onigiri and convenience-store egg sandwiches — trust the konbini.", sourceId: editorial },
    { countryId: C("MA"), category: "scam", title: "Faux guides in the medina", body: "Unofficial 'guides' may insist a street is closed and offer to lead you. Politely decline (la, shukran) and keep walking; use official badge-carrying guides only.", sourceId: editorial },
    { countryId: C("MA"), category: "money", title: "The dirham is a closed currency", body: "You can't legally import/export large amounts of MAD. Exchange on arrival or withdraw from ATMs; keep receipts to convert back.", sourceId: editorial },
    { countryId: C("MA"), category: "sim", title: "Cheap fast data", body: "Maroc Telecom, Orange and inwi sell tourist SIMs at airports (~$10 for 20 GB). eSIM support is growing.", sourceId: editorial },
    { countryId: C("MA"), category: "food", title: "What to eat in Morocco", body: "Tagine, couscous (Fridays), pastilla, harira, mechoui, msemen with honey, and fresh orange juice at Jemaa el-Fnaa.", sourceId: editorial },
    { countryId: C("FR"), category: "transport", title: "Navigo Easy for the metro", body: "Buy a Navigo Easy card (€2) and load a carnet of 10 t+ tickets — cheaper than singles. The metro runs 05:30–01:15 (02:15 Fri/Sat).", sourceId: src("RATP") },
    { countryId: C("FR"), category: "scam", title: "Petition & bracelet scams", body: "Around Montmartre and the Eiffel Tower, ignore clipboard petitions and 'free' friendship bracelets — they're distraction tactics for pickpocketing.", sourceId: editorial },
    { countryId: C("FR"), category: "food", title: "What to eat in France", body: "Croissants from award-winning boulangeries, steak-frites, duck confit, galettes, macarons, and cheese — try a fromagerie plateau.", sourceId: editorial },
    { countryId: C("TH"), category: "scam", title: "Grand Palace 'closed' scam", body: "Tuk-tuk drivers near major temples may claim they're closed and offer a 'special tour' to gem shops. The palace is almost never closed — walk to the ticket gate.", sourceId: src("Tourism Authority of Thailand") },
    { countryId: C("TH"), category: "law", title: "Respect royal and religious imagery", body: "Lèse-majesté laws are strictly enforced. Dress modestly at temples: covered shoulders and knees.", sourceId: editorial },
    { countryId: C("TH"), category: "food", title: "What to eat in Thailand", body: "Pad kra pao, som tam, khao soi, boat noodles, mango sticky rice, and anything from a busy Yaowarat stall.", sourceId: editorial },
    { countryId: C("TR"), category: "transport", title: "Istanbulkart everything", body: "One card covers metro, tram, funicular and ferries. Buy at any station kiosk and share between travelers.", sourceId: editorial },
    { countryId: C("TR"), category: "food", title: "What to eat in Türkiye", body: "Simit, menemen, İskender kebap, mezes, balık ekmek by the Galata bridge, künefe and Turkish tea in tulip glasses.", sourceId: editorial },
    { countryId: C("AE"), category: "law", title: "Public conduct rules", body: "Public intoxication and offensive gestures can carry serious penalties. During Ramadan, avoid eating in public during daylight in some areas.", sourceId: editorial },
    { countryId: C("US"), category: "money", title: "Tipping is expected", body: "15–20% at restaurants, $1–2 per drink at bars, and sales tax is added at checkout — sticker prices exclude it.", sourceId: editorial },
    { countryId: C("BR"), category: "safety", title: "Beach smarts in Rio", body: "Carry only what you need to the beach, avoid empty areas after dark, and use registered taxis or ride-hailing at night.", sourceId: editorial },
  ]);

  await db.insert(s.phrases).values([
    { countryId: C("JP"), english: "Hello", original: "こんにちは", pronunciation: "kon-nee-chee-wah" },
    { countryId: C("JP"), english: "Thank you", original: "ありがとうございます", pronunciation: "ah-ree-gah-toh go-zai-mas" },
    { countryId: C("JP"), english: "How much?", original: "いくらですか？", pronunciation: "ee-koo-rah des-ka" },
    { countryId: C("JP"), english: "Where is…?", original: "…はどこですか？", pronunciation: "…wa doh-koh des-ka" },
    { countryId: C("JP"), english: "Help!", original: "助けて！", pronunciation: "tas-keh-teh", category: "emergency" },
    { countryId: C("JP"), english: "I need a doctor", original: "医者が必要です", pronunciation: "ee-sha ga hits-yoh des", category: "emergency" },
    { countryId: C("JP"), english: "I don't understand", original: "わかりません", pronunciation: "wah-kah-ree-mah-sen" },
    { countryId: C("JP"), english: "Do you speak English?", original: "英語を話せますか？", pronunciation: "ay-go o ha-nah-seh-mas-ka" },
    { countryId: C("MA"), english: "Hello", original: "السلام عليكم", pronunciation: "sa-laam a-lay-kum" },
    { countryId: C("MA"), english: "Thank you", original: "شكرا", pronunciation: "shuk-ran" },
    { countryId: C("MA"), english: "How much?", original: "بشحال؟", pronunciation: "b-sh-hal" },
    { countryId: C("MA"), english: "No, thank you", original: "لا شكرا", pronunciation: "la, shuk-ran" },
    { countryId: C("MA"), english: "Help!", original: "عتقوني!", pronunciation: "at-qu-ni", category: "emergency" },
    { countryId: C("MA"), english: "Where is…?", original: "فين كاين…؟", pronunciation: "feen ka-yen…" },
    { countryId: C("FR"), english: "Hello", original: "Bonjour", pronunciation: "bon-zhoor" },
    { countryId: C("FR"), english: "Thank you", original: "Merci", pronunciation: "mehr-see" },
    { countryId: C("FR"), english: "How much?", original: "C'est combien ?", pronunciation: "say kom-byan" },
    { countryId: C("FR"), english: "Where is…?", original: "Où est… ?", pronunciation: "oo eh…" },
    { countryId: C("FR"), english: "Help!", original: "Au secours !", pronunciation: "oh skoor", category: "emergency" },
    { countryId: C("FR"), english: "Do you speak English?", original: "Parlez-vous anglais ?", pronunciation: "par-lay voo on-glay" },
    { countryId: C("TH"), english: "Hello", original: "สวัสดี", pronunciation: "sa-wat-dee (krap/ka)" },
    { countryId: C("TH"), english: "Thank you", original: "ขอบคุณ", pronunciation: "khop-khun (krap/ka)" },
    { countryId: C("TH"), english: "How much?", original: "เท่าไหร่", pronunciation: "tao-rai" },
    { countryId: C("TH"), english: "Help!", original: "ช่วยด้วย!", pronunciation: "chuay duay", category: "emergency" },
    { countryId: C("TR"), english: "Hello", original: "Merhaba", pronunciation: "mehr-ha-ba" },
    { countryId: C("TR"), english: "Thank you", original: "Teşekkürler", pronunciation: "teh-shek-kur-ler" },
    { countryId: C("TR"), english: "How much?", original: "Ne kadar?", pronunciation: "neh ka-dar" },
    { countryId: C("IT"), english: "Hello", original: "Ciao / Buongiorno", pronunciation: "chow / bwon-jor-no" },
    { countryId: C("IT"), english: "Thank you", original: "Grazie", pronunciation: "grah-tsyeh" },
    { countryId: C("ES"), english: "Hello", original: "Hola", pronunciation: "oh-la" },
    { countryId: C("ES"), english: "Thank you", original: "Gracias", pronunciation: "grah-syas" },
    { countryId: C("BR"), english: "Hello", original: "Olá", pronunciation: "oh-lah" },
    { countryId: C("BR"), english: "Thank you", original: "Obrigado / Obrigada", pronunciation: "oh-bree-gah-doo/dah" },
    { countryId: C("SA"), english: "Hello", original: "السلام عليكم", pronunciation: "as-sa-laam a-lay-kum" },
    { countryId: C("SA"), english: "Thank you", original: "شكرا", pronunciation: "shuk-ran" },
    { countryId: C("AE"), english: "Hello", original: "مرحبا", pronunciation: "mar-ha-ba" },
    { countryId: C("GB"), english: "Cheers (thanks)", original: "Cheers", pronunciation: "cheerz" },
    { countryId: C("US"), english: "Hello", original: "Hi / Hello", pronunciation: "hai" },
  ]);

  await db.insert(s.travelAlerts).values([
    { countryId: C("FR"), title: "Sample: Metro line 1 weekend maintenance", body: "This is sample content demonstrating the alert system. Connect an official feed (e.g. government advisories) to publish real alerts.", severity: "info", category: "transport", isSample: true, publishedAt: new Date("2026-01-05"), lastCheckedAt: new Date("2026-01-12"), sourceId: src("RATP") },
    { countryId: C("JP"), title: "Sample: Typhoon season advisory (Aug–Oct)", body: "Sample seasonal advisory. Wanderly ships with alert architecture; live feeds must come from official sources such as JMA.", severity: "advisory", category: "weather", isSample: true, publishedAt: new Date("2025-12-20"), lastCheckedAt: new Date("2026-01-10"), sourceId: src("Japan National Tourism") },
    { countryId: C("TH"), title: "Sample: Burning season haze in the north (Feb–Apr)", body: "Sample health advisory demonstrating severity levels. Verify current AQI with official monitors before travel.", severity: "warning", category: "health", isSample: true, publishedAt: new Date("2025-12-01"), lastCheckedAt: new Date("2026-01-08"), sourceId: src("Tourism Authority of Thailand") },
  ]);

  await db.insert(s.transportRoutes).values([
    { fromCityId: city("casablanca"), toCityId: city("marrakech"), mode: "train", operator: "ONCF Al Atlas", typicalDurationMin: 160, typicalPriceUsdMin: 10, typicalPriceUsdMax: 22, frequency: "Every 2 hours, 06:00–21:00", notes: "1st class is worth the small premium.", sourceId: src("ONCF") },
    { fromCityId: city("casablanca"), toCityId: city("paris"), mode: "flight", operator: "Royal Air Maroc / Air France / Transavia", typicalDurationMin: 190, typicalPriceUsdMin: 120, typicalPriceUsdMax: 400, frequency: "10+ daily", sourceId: editorial },
    { fromCityId: city("paris"), toCityId: city("london"), mode: "train", operator: "Eurostar", typicalDurationMin: 136, typicalPriceUsdMin: 60, typicalPriceUsdMax: 250, frequency: "Hourly", notes: "Arrive 60–90 min early for border checks.", sourceId: editorial },
    { fromCityId: city("paris"), toCityId: city("barcelona"), mode: "train", operator: "TGV INOUI / Renfe", typicalDurationMin: 400, typicalPriceUsdMin: 45, typicalPriceUsdMax: 180, frequency: "2–4 daily", sourceId: editorial },
    { fromCityId: city("paris"), toCityId: city("rome"), mode: "flight", operator: "Air France / ITA / easyJet / Vueling", typicalDurationMin: 125, typicalPriceUsdMin: 60, typicalPriceUsdMax: 220, frequency: "15+ daily", sourceId: editorial },
    { fromCityId: city("tokyo"), toCityId: city("kyoto"), mode: "train", operator: "JR Tōkaidō Shinkansen (Nozomi)", typicalDurationMin: 135, typicalPriceUsdMin: 90, typicalPriceUsdMax: 110, frequency: "Every ~10 min", notes: "Reserve seats in cherry-blossom season.", sourceId: src("JR East") },
    { fromCityId: city("bangkok"), toCityId: city("phuket"), mode: "flight", operator: "Thai Airways / AirAsia / Nok Air", typicalDurationMin: 85, typicalPriceUsdMin: 25, typicalPriceUsdMax: 90, frequency: "30+ daily", sourceId: editorial },
    { fromCityId: city("bangkok"), toCityId: city("phuket"), mode: "bus", operator: "Transport Co. VIP bus", typicalDurationMin: 780, typicalPriceUsdMin: 20, typicalPriceUsdMax: 35, frequency: "Evening departures", notes: "Overnight sleeper buses from Mo Chit terminal.", sourceId: editorial },
    { fromCityId: city("istanbul"), toCityId: city("paris"), mode: "flight", operator: "Turkish Airlines / Air France / Pegasus", typicalDurationMin: 230, typicalPriceUsdMin: 90, typicalPriceUsdMax: 320, frequency: "8+ daily", sourceId: editorial },
    { fromCityId: city("marrakech"), toCityId: city("essaouira"), mode: "bus", operator: "Supratours / CTM", typicalDurationMin: 180, typicalPriceUsdMin: 8, typicalPriceUsdMax: 14, frequency: "6+ daily", sourceId: editorial },
    { fromCityId: city("phuket"), toCityId: city("bangkok"), mode: "ferry", operator: "(via Krabi) + connections", typicalDurationMin: 120, typicalPriceUsdMin: 12, typicalPriceUsdMax: 30, frequency: "Ferries to Phi Phi/Krabi 2–4 daily", notes: "Ferry legs serve the islands; combine with bus/flight to Bangkok.", sourceId: editorial },
    { fromCityId: city("london"), toCityId: city("new-york"), mode: "flight", operator: "BA / Virgin / Delta / JetBlue", typicalDurationMin: 480, typicalPriceUsdMin: 350, typicalPriceUsdMax: 900, frequency: "20+ daily", sourceId: editorial },
  ]);

  await db.insert(s.exchangeRates).values([
    { base: "USD", quote: "MAD", rate: 10.05, sourceName: "Reference snapshot", isLive: false },
    { base: "USD", quote: "JPY", rate: 155.2, sourceName: "Reference snapshot", isLive: false },
    { base: "USD", quote: "EUR", rate: 0.93, sourceName: "Reference snapshot", isLive: false },
    { base: "USD", quote: "THB", rate: 34.6, sourceName: "Reference snapshot", isLive: false },
    { base: "USD", quote: "TRY", rate: 36.5, sourceName: "Reference snapshot", isLive: false },
    { base: "USD", quote: "GBP", rate: 0.79, sourceName: "Reference snapshot", isLive: false },
    { base: "USD", quote: "AED", rate: 3.67, sourceName: "Reference snapshot", isLive: false },
    { base: "USD", quote: "SAR", rate: 3.75, sourceName: "Reference snapshot", isLive: false },
    { base: "USD", quote: "BRL", rate: 5.6, sourceName: "Reference snapshot", isLive: false },
  ]);

  console.log("Seeding demo users & community…");
  const userRows = await db
    .insert(s.users)
    .values([
      { email: "demo@wanderly.app", passwordHash: hash("demo1234"), name: "Demo Traveler", role: "user" },
      { email: "admin@wanderly.app", passwordHash: hash("admin1234"), name: "Wanderly Admin", role: "admin" },
      { email: "abdelali@wanderly.app", passwordHash: hash("creator1234"), name: "Abdelali", role: "creator" },
      { email: "maya@wanderly.app", passwordHash: hash("creator1234"), name: "Maya Chen", role: "creator" },
    ])
    .returning();
  const U = (email: string) => userRows.find((u) => u.email === email)!.id;

  await db.insert(s.profiles).values([
    { userId: U("demo@wanderly.app"), homeCountryCode: "MA", nationalityCode: "MA", travelStyle: "mid-range", budgetPreference: "balanced", avatarSeed: "demo", interests: ["Food", "History", "Photography"] },
    { userId: U("admin@wanderly.app"), homeCountryCode: "GB", nationalityCode: "GB", travelStyle: "business", avatarSeed: "admin" },
    { userId: U("abdelali@wanderly.app"), homeCountryCode: "MA", nationalityCode: "MA", travelStyle: "backpacker", isCreator: true, avatarSeed: "abdelali", bio: "Moroccan backpacker documenting honest budgets across 40+ countries.", socials: { youtube: "https://youtube.com/@abdelali-travels", instagram: "https://instagram.com/abdelali.travels", tiktok: "https://tiktok.com/@abdelali.travels" }, interests: ["Food", "Local markets", "Photography"] },
    { userId: U("maya@wanderly.app"), homeCountryCode: "US", nationalityCode: "US", travelStyle: "photography", isCreator: true, avatarSeed: "maya", bio: "Slow travel & film photography. Currently somewhere along the old Silk Road.", socials: { youtube: "https://youtube.com/@mayachen", website: "https://mayachen.example" }, interests: ["Photography", "Nature", "Architecture"] },
  ]);

  const posts = await db
    .insert(s.communityPosts)
    .values([
      { userId: U("abdelali@wanderly.app"), cityId: city("tokyo"), type: "budget", title: "Tokyo on $65/day as a Moroccan backpacker — full breakdown", body: "12 nights in Tokyo, total $780 excluding flights.\n\nHostel (UNPLAN Shinjuku): $35/night\nFood: $18/day — konbini breakfasts, ramen lunches, one splurge sushi night\nTransport: $6/day with a Suica\nSights: mostly free (Meiji Jingu, Senso-ji, crossing) + teamLab $27\n\nBiggest surprise: how cheap eating WELL is. Biggest mistake: buying a JR Pass I didn't need — I never left Kanto.", image: IMG.tokyoStreet, likesCount: 214, commentsCount: 2, createdAt: new Date("2025-12-18") },
      { userId: U("maya@wanderly.app"), cityId: city("kyoto"), type: "tip", title: "Fushimi Inari at 6am is a different universe", body: "Everyone photographs the gates at noon with 5,000 other people. Go at sunrise: you'll share the mountain with cats, crows and a few runners. The full loop takes ~2.5h. Bring coins for the tiny shrines.", likesCount: 158, commentsCount: 1, createdAt: new Date("2025-12-22") },
      { userId: U("demo@wanderly.app"), cityId: city("marrakech"), type: "question", title: "Is 4 days enough for Marrakech + Atlas day trip?", body: "First time in Morocco in March with my partner. Thinking 3 days in the medina + 1 day Imlil hike. Doable without rushing?", likesCount: 12, commentsCount: 2, createdAt: new Date("2026-01-04") },
      { userId: U("abdelali@wanderly.app"), cityId: city("istanbul"), type: "story", title: "48 hours in Istanbul between flights — worth it?", body: "Turkish Airlines' free stopover program gave me two days. Sultanahmet at dawn, ferry to Kadıköy for lunch at Çiya, Grand Bazaar haggling masterclass, and a hammam. Verdict: absolutely book the long layover.", likesCount: 87, commentsCount: 1, createdAt: new Date("2025-11-30") },
      { userId: U("maya@wanderly.app"), cityId: city("bangkok"), type: "route", title: "Bangkok → islands without flying: my slow route", body: "Night train Bangkok → Surat Thani (2nd class sleeper, ~$25), bus + ferry to Koh Phangan, island-hop to Koh Tao, ferry + bus back via Chumphon. Slower, cheaper, and the train sunrise over the palms beats any airport.", likesCount: 96, commentsCount: 1, createdAt: new Date("2026-01-02") },
    ])
    .returning();

  await db.insert(s.postComments).values([
    { postId: posts[0].id, userId: U("maya@wanderly.app"), body: "The JR Pass trap gets everyone once. Great breakdown!", createdAt: new Date("2025-12-19") },
    { postId: posts[0].id, userId: U("demo@wanderly.app"), body: "Saving this for my October trip — thank you!", createdAt: new Date("2025-12-20") },
    { postId: posts[1].id, userId: U("abdelali@wanderly.app"), body: "Can confirm. Sunrise there was a highlight of my whole Japan trip.", createdAt: new Date("2025-12-23") },
    { postId: posts[2].id, userId: U("abdelali@wanderly.app"), body: "4 days is perfect. Do Imlil on day 3 so you end the trip relaxed in the medina.", createdAt: new Date("2026-01-05") },
    { postId: posts[2].id, userId: U("maya@wanderly.app"), body: "Book the hammam for the evening after the hike — you'll thank yourself.", createdAt: new Date("2026-01-05") },
    { postId: posts[3].id, userId: U("demo@wanderly.app"), body: "Doing this exact layover in May, thanks for the Çiya rec!", createdAt: new Date("2025-12-01") },
    { postId: posts[4].id, userId: U("abdelali@wanderly.app"), body: "That sleeper train is criminally underrated.", createdAt: new Date("2026-01-03") },
  ]);

  await db.insert(s.creatorStories).values([
    { userId: U("abdelali@wanderly.app"), cityId: city("tokyo"), title: "Abdelali's Tokyo Journey", summary: "12 days, $780, one very unnecessary JR Pass. An honest look at Tokyo for African-passport travelers: the visa process from Rabat, where I actually ate, and what I'd change.", totalSpendUsd: 780, days: 12, highlights: ["Sunrise at Senso-ji before the crowds", "Sushi Dai omakase — worth the 4:50am alarm", "Golden Gai bar crawl with strangers who became friends"], mistakes: ["Bought a JR Pass and never left Kanto", "Booked a hotel in Roppongi the first night — moved next day", "Didn't reserve teamLab and lost a morning"], videoUrl: "https://youtube.com/@abdelali-travels", coverImage: IMG.tokyo, createdAt: new Date("2025-12-15") },
    { userId: U("abdelali@wanderly.app"), cityId: city("marrakech"), title: "My hometown, tourist mode", summary: "I grew up 3 hours from Marrakech. Here's the city like a local: which souk entrances to use, real tagine prices, and the rooftops nobody posts about.", totalSpendUsd: 240, days: 5, highlights: ["Mechoui Alley before noon", "Sunset from Le Jardin Secret tower", "Bargaining lesson: start at 30%"], mistakes: ["Took a taxi without agreeing a price — rookie error even for me"], coverImage: IMG.marrakechSouk, createdAt: new Date("2025-10-20") },
    { userId: U("maya@wanderly.app"), cityId: city("kyoto"), title: "Kyoto on film — a slow week", summary: "Seven days, six rolls of Portra, zero rushing. Temples at dawn, kissaten coffee afternoons, and why Kyoto rewards staying put.", totalSpendUsd: 1100, days: 7, highlights: ["Arashiyama at 7am, fog still on the river", "A tea ceremony I almost skipped", "Nishiki market knife shopping"], mistakes: ["Overpacked — Kyoto is a laundry-friendly city", "Tried to see 5 temples in one day; 2 is the max that feels good"], videoUrl: "https://youtube.com/@mayachen", coverImage: IMG.greatwall, createdAt: new Date("2025-11-10") },
  ]);

  await db.insert(s.reviews).values([
    { userId: U("abdelali@wanderly.app"), placeId: place("senso-ji"), rating: 5, body: "Go before 7am. The contrast with the daytime crowds is unreal.", createdAt: new Date("2025-12-16") },
    { userId: U("maya@wanderly.app"), placeId: place("fushimi-inari"), rating: 5, body: "The upper loop past the crossroads is where it gets magical.", createdAt: new Date("2025-11-12") },
    { userId: U("demo@wanderly.app"), placeId: place("jemaa-el-fnaa"), rating: 4, body: "Chaotic in the best way. Stall 32 for grilled meats.", createdAt: new Date("2026-01-06") },
    { userId: U("abdelali@wanderly.app"), placeId: place("ichiran-shibuya"), rating: 4, body: "Touristy? Yes. Still slaps at 2am.", createdAt: new Date("2025-12-17") },
  ]);

  await db.insert(s.notifications).values([
    { userId: U("demo@wanderly.app"), title: "Welcome to Wanderly 👋", body: "Plan your first trip — try Marrakech → Tokyo to see the full planner in action.", href: "/plan" },
    { userId: U("demo@wanderly.app"), title: "Visa data updated", body: "Morocco → Thailand rule re-verified against the Royal Thai MFA.", href: "/visa" },
  ]);

  console.log("Seed complete.");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
