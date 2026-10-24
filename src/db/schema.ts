import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  index,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ─────────────────────────── Enums ─────────────────────────── */

export const userRoleEnum = pgEnum("user_role", ["user", "creator", "admin"]);

export const placeTypeEnum = pgEnum("place_type", [
  "attraction",
  "museum",
  "hotel",
  "hostel",
  "restaurant",
  "cafe",
  "street_food",
  "activity",
  "beach",
  "park",
  "market",
  "nightlife",
  "viewpoint",
  "neighborhood",
  "airport",
  "train_station",
  "bus_station",
  "ferry_port",
  "hospital",
  "police",
  "embassy",
]);

export const sourceTypeEnum = pgEnum("source_type", [
  "government",
  "tourism_authority",
  "airline",
  "rail_operator",
  "airport",
  "hotel",
  "restaurant",
  "health_authority",
  "embassy",
  "transport_authority",
  "trusted_provider",
  "community",
]);

export const verificationStatusEnum = pgEnum("verification_status", [
  "verified",
  "needs_review",
  "expired",
  "disputed",
]);

export const visaTypeEnum = pgEnum("visa_type", [
  "visa_free",
  "visa_on_arrival",
  "evisa",
  "visa_required",
  "transit_visa",
  "special",
]);

export const tripStatusEnum = pgEnum("trip_status", [
  "draft",
  "planned",
  "active",
  "completed",
]);

export const alertSeverityEnum = pgEnum("alert_severity", [
  "info",
  "advisory",
  "warning",
  "critical",
]);

export const postTypeEnum = pgEnum("post_type", [
  "story",
  "tip",
  "question",
  "route",
  "budget",
  "review",
]);

export const factCategoryEnum = pgEnum("fact_category", [
  "safety",
  "scam",
  "law",
  "sim",
  "internet",
  "food",
  "tip",
  "transport",
  "money",
  "health",
]);

export const budgetCategoryEnum = pgEnum("budget_category", [
  "flights",
  "accommodation",
  "food",
  "transport",
  "activities",
  "visa",
  "insurance",
  "sim",
  "shopping",
  "emergency",
  "other",
]);

/* ─────────────────────────── Auth & users ─────────────────────────── */

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    role: userRoleEnum("role").notNull().default("user"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

export const sessions = pgTable(
  "sessions",
  {
    token: varchar("token", { length: 128 }).primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const profiles = pgTable("profiles", {
  userId: integer("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  homeCountryCode: varchar("home_country_code", { length: 2 }),
  nationalityCode: varchar("nationality_code", { length: 2 }),
  travelStyle: varchar("travel_style", { length: 40 }),
  budgetPreference: varchar("budget_preference", { length: 40 }),
  bio: text("bio"),
  avatarSeed: varchar("avatar_seed", { length: 60 }),
  isCreator: boolean("is_creator").notNull().default(false),
  socials: jsonb("socials").$type<{
    youtube?: string;
    tiktok?: string;
    instagram?: string;
    website?: string;
  }>(),
  interests: jsonb("interests").$type<string[]>(),
});

/* ─────────────────────────── Sources / verification ─────────────────────────── */

export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  url: text("url").notNull(),
  type: sourceTypeEnum("type").notNull(),
  lastCheckedAt: timestamp("last_checked_at"),
  lastUpdatedAt: timestamp("last_updated_at"),
  verificationStatus: verificationStatusEnum("verification_status")
    .notNull()
    .default("needs_review"),
  confidence: integer("confidence").notNull().default(50), // 0-100
  notes: text("notes"),
});

/* ─────────────────────────── Geography ─────────────────────────── */

export const countries = pgTable(
  "countries",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 2 }).notNull(), // ISO alpha-2
    slug: varchar("slug", { length: 80 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    continent: varchar("continent", { length: 40 }).notNull(),
    capital: varchar("capital", { length: 120 }).notNull(),
    flagEmoji: varchar("flag_emoji", { length: 10 }).notNull(),
    currencyCode: varchar("currency_code", { length: 3 }).notNull(),
    currencyName: varchar("currency_name", { length: 60 }).notNull(),
    languages: jsonb("languages").$type<string[]>().notNull(),
    timezone: varchar("timezone", { length: 60 }).notNull(),
    callingCode: varchar("calling_code", { length: 8 }).notNull(),
    bestTime: varchar("best_time", { length: 160 }),
    avgDailyBudgetUsd: integer("avg_daily_budget_usd"),
    safetyLevel: integer("safety_level"), // 1 (very safe) - 5 (avoid)
    visaAccessibility: integer("visa_accessibility"), // rough openness score 1-5
    summary: text("summary"),
    heroImage: text("hero_image"),
    emergency: jsonb("emergency").$type<{
      police?: string;
      ambulance?: string;
      fire?: string;
      general?: string;
    }>(),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    popular: boolean("popular").notNull().default(false),
    sourceId: integer("source_id").references(() => sources.id),
  },
  (t) => [
    uniqueIndex("countries_slug_idx").on(t.slug),
    uniqueIndex("countries_code_idx").on(t.code),
    index("countries_continent_idx").on(t.continent),
  ],
);

export const cities = pgTable(
  "cities",
  {
    id: serial("id").primaryKey(),
    countryId: integer("country_id")
      .notNull()
      .references(() => countries.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 80 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    kind: varchar("kind", { length: 20 }).notNull().default("city"), // city | island
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    timezone: varchar("timezone", { length: 60 }),
    summary: text("summary"),
    heroImage: text("hero_image"),
    avgDailyBudgetUsd: integer("avg_daily_budget_usd"),
    bestTime: varchar("best_time", { length: 160 }),
    popular: boolean("popular").notNull().default(false),
  },
  (t) => [
    uniqueIndex("cities_slug_idx").on(t.slug),
    index("cities_country_idx").on(t.countryId),
  ],
);

export const places = pgTable(
  "places",
  {
    id: serial("id").primaryKey(),
    cityId: integer("city_id")
      .notNull()
      .references(() => cities.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 120 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    type: placeTypeEnum("type").notNull(),
    area: varchar("area", { length: 100 }), // neighborhood / district for geo-grouping
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    description: text("description"),
    priceLevel: integer("price_level"), // 1-4
    estCostUsd: integer("est_cost_usd"),
    rating: doublePrecision("rating"),
    reviewCount: integer("review_count").notNull().default(0),
    durationMin: integer("duration_min"),
    openingHours: varchar("opening_hours", { length: 160 }),
    image: text("image"),
    tags: jsonb("tags").$type<string[]>(),
    amenities: jsonb("amenities").$type<string[]>(),
    website: text("website"),
    sourceId: integer("source_id").references(() => sources.id),
  },
  (t) => [
    uniqueIndex("places_slug_idx").on(t.slug),
    index("places_city_idx").on(t.cityId),
    index("places_type_idx").on(t.type),
  ],
);

/* ─────────────────────────── Travel knowledge ─────────────────────────── */

export const visaRules = pgTable(
  "visa_rules",
  {
    id: serial("id").primaryKey(),
    fromCountryCode: varchar("from_country_code", { length: 2 }).notNull(),
    toCountryCode: varchar("to_country_code", { length: 2 }).notNull(),
    passportType: varchar("passport_type", { length: 30 })
      .notNull()
      .default("ordinary"),
    visaType: visaTypeEnum("visa_type").notNull(),
    maxStayDays: integer("max_stay_days"),
    requirements: jsonb("requirements").$type<string[]>(),
    notes: text("notes"),
    sourceId: integer("source_id").references(() => sources.id),
    lastVerifiedAt: timestamp("last_verified_at"),
    verificationStatus: verificationStatusEnum("verification_status")
      .notNull()
      .default("needs_review"),
  },
  (t) => [
    index("visa_from_to_idx").on(t.fromCountryCode, t.toCountryCode),
  ],
);

export const travelFacts = pgTable(
  "travel_facts",
  {
    id: serial("id").primaryKey(),
    countryId: integer("country_id")
      .notNull()
      .references(() => countries.id, { onDelete: "cascade" }),
    category: factCategoryEnum("category").notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    body: text("body").notNull(),
    sourceId: integer("source_id").references(() => sources.id),
  },
  (t) => [index("facts_country_idx").on(t.countryId)],
);

export const phrases = pgTable(
  "phrases",
  {
    id: serial("id").primaryKey(),
    countryId: integer("country_id")
      .notNull()
      .references(() => countries.id, { onDelete: "cascade" }),
    english: varchar("english", { length: 160 }).notNull(),
    original: varchar("original", { length: 200 }).notNull(),
    pronunciation: varchar("pronunciation", { length: 200 }),
    category: varchar("category", { length: 40 }).notNull().default("basics"),
  },
  (t) => [index("phrases_country_idx").on(t.countryId)],
);

export const exchangeRates = pgTable(
  "exchange_rates",
  {
    id: serial("id").primaryKey(),
    base: varchar("base", { length: 3 }).notNull(),
    quote: varchar("quote", { length: 3 }).notNull(),
    rate: doublePrecision("rate").notNull(),
    sourceName: varchar("source_name", { length: 100 }).notNull(),
    isLive: boolean("is_live").notNull().default(false),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("rates_pair_idx").on(t.base, t.quote)],
);

export const travelAlerts = pgTable(
  "travel_alerts",
  {
    id: serial("id").primaryKey(),
    countryId: integer("country_id").references(() => countries.id, {
      onDelete: "cascade",
    }),
    title: varchar("title", { length: 220 }).notNull(),
    body: text("body").notNull(),
    severity: alertSeverityEnum("severity").notNull().default("info"),
    category: varchar("category", { length: 60 }).notNull(),
    isSample: boolean("is_sample").notNull().default(true),
    publishedAt: timestamp("published_at").notNull().defaultNow(),
    lastCheckedAt: timestamp("last_checked_at"),
    sourceId: integer("source_id").references(() => sources.id),
  },
  (t) => [index("alerts_country_idx").on(t.countryId)],
);

export const transportRoutes = pgTable(
  "transport_routes",
  {
    id: serial("id").primaryKey(),
    fromCityId: integer("from_city_id")
      .notNull()
      .references(() => cities.id, { onDelete: "cascade" }),
    toCityId: integer("to_city_id")
      .notNull()
      .references(() => cities.id, { onDelete: "cascade" }),
    mode: varchar("mode", { length: 20 }).notNull(), // flight | train | bus | ferry
    operator: varchar("operator", { length: 120 }),
    typicalDurationMin: integer("typical_duration_min"),
    typicalPriceUsdMin: integer("typical_price_usd_min"),
    typicalPriceUsdMax: integer("typical_price_usd_max"),
    frequency: varchar("frequency", { length: 100 }),
    notes: text("notes"),
    sourceId: integer("source_id").references(() => sources.id),
  },
  (t) => [index("routes_from_idx").on(t.fromCityId)],
);

/* ─────────────────────────── Trips ─────────────────────────── */

export const trips = pgTable(
  "trips",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 180 }).notNull(),
    originLabel: varchar("origin_label", { length: 160 }),
    destinationCityId: integer("destination_city_id")
      .notNull()
      .references(() => cities.id),
    startDate: varchar("start_date", { length: 10 }).notNull(), // YYYY-MM-DD
    endDate: varchar("end_date", { length: 10 }).notNull(),
    travelers: integer("travelers").notNull().default(1),
    nationalityCode: varchar("nationality_code", { length: 2 }),
    budgetUsd: integer("budget_usd"),
    travelStyle: varchar("travel_style", { length: 40 }).notNull().default("mid-range"),
    interests: jsonb("interests").$type<string[]>(),
    status: tripStatusEnum("status").notNull().default("planned"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("trips_user_idx").on(t.userId)],
);

export const itineraryDays = pgTable(
  "itinerary_days",
  {
    id: serial("id").primaryKey(),
    tripId: integer("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    dayIndex: integer("day_index").notNull(),
    date: varchar("date", { length: 10 }).notNull(),
    title: varchar("title", { length: 160 }).notNull(),
  },
  (t) => [index("days_trip_idx").on(t.tripId)],
);

export const itineraryItems = pgTable(
  "itinerary_items",
  {
    id: serial("id").primaryKey(),
    dayId: integer("day_id")
      .notNull()
      .references(() => itineraryDays.id, { onDelete: "cascade" }),
    orderIndex: integer("order_index").notNull(),
    placeId: integer("place_id").references(() => places.id, {
      onDelete: "set null",
    }),
    title: varchar("title", { length: 200 }).notNull(),
    kind: varchar("kind", { length: 30 }).notNull().default("activity"),
    startTime: varchar("start_time", { length: 5 }), // HH:MM
    durationMin: integer("duration_min"),
    estCostUsd: integer("est_cost_usd"),
    transportMode: varchar("transport_mode", { length: 30 }),
    transportMin: integer("transport_min"),
    transportKm: doublePrecision("transport_km"),
    notes: text("notes"),
  },
  (t) => [index("items_day_idx").on(t.dayId)],
);

export const budgetItems = pgTable(
  "budget_items",
  {
    id: serial("id").primaryKey(),
    tripId: integer("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    category: budgetCategoryEnum("category").notNull(),
    label: varchar("label", { length: 160 }).notNull(),
    amountUsd: doublePrecision("amount_usd").notNull(),
    isEstimate: boolean("is_estimate").notNull().default(true),
  },
  (t) => [index("budget_trip_idx").on(t.tripId)],
);

export const checklistItems = pgTable(
  "checklist_items",
  {
    id: serial("id").primaryKey(),
    tripId: integer("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    category: varchar("category", { length: 60 }).notNull(),
    label: varchar("label", { length: 200 }).notNull(),
    done: boolean("done").notNull().default(false),
  },
  (t) => [index("checklist_trip_idx").on(t.tripId)],
);

/* ─────────────────────────── Saved & social ─────────────────────────── */

export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const savedPlaces = pgTable(
  "saved_places",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    placeId: integer("place_id").references(() => places.id, {
      onDelete: "cascade",
    }),
    cityId: integer("city_id").references(() => cities.id, {
      onDelete: "cascade",
    }),
    collectionId: integer("collection_id").references(() => collections.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("saved_user_idx").on(t.userId)],
);

export const reviews = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    placeId: integer("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    body: text("body"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("reviews_place_idx").on(t.placeId)],
);

export const communityPosts = pgTable(
  "community_posts",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cityId: integer("city_id").references(() => cities.id, {
      onDelete: "set null",
    }),
    type: postTypeEnum("type").notNull().default("story"),
    title: varchar("title", { length: 220 }).notNull(),
    body: text("body").notNull(),
    image: text("image"),
    likesCount: integer("likes_count").notNull().default(0),
    commentsCount: integer("comments_count").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("posts_city_idx").on(t.cityId)],
);

export const postComments = pgTable(
  "post_comments",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id")
      .notNull()
      .references(() => communityPosts.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("comments_post_idx").on(t.postId)],
);

export const postLikes = pgTable(
  "post_likes",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => communityPosts.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.userId] })],
);

export const follows = pgTable(
  "follows",
  {
    followerId: integer("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followingId: integer("following_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.followerId, t.followingId] })],
);

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    body: text("body"),
    href: varchar("href", { length: 200 }),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("notifications_user_idx").on(t.userId)],
);

export const creatorStories = pgTable(
  "creator_stories",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cityId: integer("city_id")
      .notNull()
      .references(() => cities.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 220 }).notNull(),
    summary: text("summary").notNull(),
    totalSpendUsd: integer("total_spend_usd"),
    days: integer("days"),
    highlights: jsonb("highlights").$type<string[]>(),
    mistakes: jsonb("mistakes").$type<string[]>(),
    videoUrl: text("video_url"),
    coverImage: text("cover_image"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("stories_city_idx").on(t.cityId)],
);

/* ─────────────────────────── Relations ─────────────────────────── */

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
  trips: many(trips),
  posts: many(communityPosts),
}));

export const countriesRelations = relations(countries, ({ many, one }) => ({
  cities: many(cities),
  facts: many(travelFacts),
  phrases: many(phrases),
  alerts: many(travelAlerts),
  source: one(sources, { fields: [countries.sourceId], references: [sources.id] }),
}));

export const citiesRelations = relations(cities, ({ one, many }) => ({
  country: one(countries, { fields: [cities.countryId], references: [countries.id] }),
  places: many(places),
}));

export const placesRelations = relations(places, ({ one, many }) => ({
  city: one(cities, { fields: [places.cityId], references: [cities.id] }),
  source: one(sources, { fields: [places.sourceId], references: [sources.id] }),
  reviews: many(reviews),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  user: one(users, { fields: [trips.userId], references: [users.id] }),
  destination: one(cities, {
    fields: [trips.destinationCityId],
    references: [cities.id],
  }),
  days: many(itineraryDays),
  budgetItems: many(budgetItems),
  checklistItems: many(checklistItems),
}));

export const budgetItemsRelations = relations(budgetItems, ({ one }) => ({
  trip: one(trips, { fields: [budgetItems.tripId], references: [trips.id] }),
}));

export const checklistItemsRelations = relations(checklistItems, ({ one }) => ({
  trip: one(trips, { fields: [checklistItems.tripId], references: [trips.id] }),
}));

export const itineraryDaysRelations = relations(itineraryDays, ({ one, many }) => ({
  trip: one(trips, { fields: [itineraryDays.tripId], references: [trips.id] }),
  items: many(itineraryItems),
}));

export const itineraryItemsRelations = relations(itineraryItems, ({ one }) => ({
  day: one(itineraryDays, {
    fields: [itineraryItems.dayId],
    references: [itineraryDays.id],
  }),
  place: one(places, { fields: [itineraryItems.placeId], references: [places.id] }),
}));

export const communityPostsRelations = relations(communityPosts, ({ one, many }) => ({
  user: one(users, { fields: [communityPosts.userId], references: [users.id] }),
  city: one(cities, { fields: [communityPosts.cityId], references: [cities.id] }),
  comments: many(postComments),
}));

export const postCommentsRelations = relations(postComments, ({ one }) => ({
  post: one(communityPosts, {
    fields: [postComments.postId],
    references: [communityPosts.id],
  }),
  user: one(users, { fields: [postComments.userId], references: [users.id] }),
}));

export const visaRulesRelations = relations(visaRules, ({ one }) => ({
  source: one(sources, { fields: [visaRules.sourceId], references: [sources.id] }),
}));

export const travelFactsRelations = relations(travelFacts, ({ one }) => ({
  country: one(countries, {
    fields: [travelFacts.countryId],
    references: [countries.id],
  }),
  source: one(sources, { fields: [travelFacts.sourceId], references: [sources.id] }),
}));

export const travelAlertsRelations = relations(travelAlerts, ({ one }) => ({
  country: one(countries, {
    fields: [travelAlerts.countryId],
    references: [countries.id],
  }),
  source: one(sources, { fields: [travelAlerts.sourceId], references: [sources.id] }),
}));

export const creatorStoriesRelations = relations(creatorStories, ({ one }) => ({
  user: one(users, { fields: [creatorStories.userId], references: [users.id] }),
  city: one(cities, { fields: [creatorStories.cityId], references: [cities.id] }),
}));

export const savedPlacesRelations = relations(savedPlaces, ({ one }) => ({
  place: one(places, { fields: [savedPlaces.placeId], references: [places.id] }),
  city: one(cities, { fields: [savedPlaces.cityId], references: [cities.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  place: one(places, { fields: [reviews.placeId], references: [places.id] }),
}));
