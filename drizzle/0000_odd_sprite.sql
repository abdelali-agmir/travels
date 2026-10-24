CREATE TYPE "public"."alert_severity" AS ENUM('info', 'advisory', 'warning', 'critical');--> statement-breakpoint
CREATE TYPE "public"."budget_category" AS ENUM('flights', 'accommodation', 'food', 'transport', 'activities', 'visa', 'insurance', 'sim', 'shopping', 'emergency', 'other');--> statement-breakpoint
CREATE TYPE "public"."fact_category" AS ENUM('safety', 'scam', 'law', 'sim', 'internet', 'food', 'tip', 'transport', 'money', 'health');--> statement-breakpoint
CREATE TYPE "public"."place_type" AS ENUM('attraction', 'museum', 'hotel', 'hostel', 'restaurant', 'cafe', 'street_food', 'activity', 'beach', 'park', 'market', 'nightlife', 'viewpoint', 'neighborhood', 'airport', 'train_station', 'bus_station', 'ferry_port', 'hospital', 'police', 'embassy');--> statement-breakpoint
CREATE TYPE "public"."post_type" AS ENUM('story', 'tip', 'question', 'route', 'budget', 'review');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('government', 'tourism_authority', 'airline', 'rail_operator', 'airport', 'hotel', 'restaurant', 'health_authority', 'embassy', 'transport_authority', 'trusted_provider', 'community');--> statement-breakpoint
CREATE TYPE "public"."trip_status" AS ENUM('draft', 'planned', 'active', 'completed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'creator', 'admin');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('verified', 'needs_review', 'expired', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."visa_type" AS ENUM('visa_free', 'visa_on_arrival', 'evisa', 'visa_required', 'transit_visa', 'special');--> statement-breakpoint
CREATE TABLE "budget_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"trip_id" integer NOT NULL,
	"category" "budget_category" NOT NULL,
	"label" varchar(160) NOT NULL,
	"amount_usd" double precision NOT NULL,
	"is_estimate" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checklist_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"trip_id" integer NOT NULL,
	"category" varchar(60) NOT NULL,
	"label" varchar(200) NOT NULL,
	"done" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_id" integer NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" varchar(120) NOT NULL,
	"kind" varchar(20) DEFAULT 'city' NOT NULL,
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"timezone" varchar(60),
	"summary" text,
	"hero_image" text,
	"avg_daily_budget_usd" integer,
	"best_time" varchar(160),
	"popular" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(120) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"city_id" integer,
	"type" "post_type" DEFAULT 'story' NOT NULL,
	"title" varchar(220) NOT NULL,
	"body" text NOT NULL,
	"image" text,
	"likes_count" integer DEFAULT 0 NOT NULL,
	"comments_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(2) NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" varchar(120) NOT NULL,
	"continent" varchar(40) NOT NULL,
	"capital" varchar(120) NOT NULL,
	"flag_emoji" varchar(10) NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"currency_name" varchar(60) NOT NULL,
	"languages" jsonb NOT NULL,
	"timezone" varchar(60) NOT NULL,
	"calling_code" varchar(8) NOT NULL,
	"best_time" varchar(160),
	"avg_daily_budget_usd" integer,
	"safety_level" integer,
	"visa_accessibility" integer,
	"summary" text,
	"hero_image" text,
	"emergency" jsonb,
	"lat" double precision,
	"lng" double precision,
	"popular" boolean DEFAULT false NOT NULL,
	"source_id" integer
);
--> statement-breakpoint
CREATE TABLE "creator_stories" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"city_id" integer NOT NULL,
	"title" varchar(220) NOT NULL,
	"summary" text NOT NULL,
	"total_spend_usd" integer,
	"days" integer,
	"highlights" jsonb,
	"mistakes" jsonb,
	"video_url" text,
	"cover_image" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exchange_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"base" varchar(3) NOT NULL,
	"quote" varchar(3) NOT NULL,
	"rate" double precision NOT NULL,
	"source_name" varchar(100) NOT NULL,
	"is_live" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"follower_id" integer NOT NULL,
	"following_id" integer NOT NULL,
	CONSTRAINT "follows_follower_id_following_id_pk" PRIMARY KEY("follower_id","following_id")
);
--> statement-breakpoint
CREATE TABLE "itinerary_days" (
	"id" serial PRIMARY KEY NOT NULL,
	"trip_id" integer NOT NULL,
	"day_index" integer NOT NULL,
	"date" varchar(10) NOT NULL,
	"title" varchar(160) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "itinerary_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"day_id" integer NOT NULL,
	"order_index" integer NOT NULL,
	"place_id" integer,
	"title" varchar(200) NOT NULL,
	"kind" varchar(30) DEFAULT 'activity' NOT NULL,
	"start_time" varchar(5),
	"duration_min" integer,
	"est_cost_usd" integer,
	"transport_mode" varchar(30),
	"transport_min" integer,
	"transport_km" double precision,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"body" text,
	"href" varchar(200),
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "phrases" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_id" integer NOT NULL,
	"english" varchar(160) NOT NULL,
	"original" varchar(200) NOT NULL,
	"pronunciation" varchar(200),
	"category" varchar(40) DEFAULT 'basics' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" serial PRIMARY KEY NOT NULL,
	"city_id" integer NOT NULL,
	"slug" varchar(120) NOT NULL,
	"name" varchar(160) NOT NULL,
	"type" "place_type" NOT NULL,
	"area" varchar(100),
	"lat" double precision NOT NULL,
	"lng" double precision NOT NULL,
	"description" text,
	"price_level" integer,
	"est_cost_usd" integer,
	"rating" double precision,
	"review_count" integer DEFAULT 0 NOT NULL,
	"duration_min" integer,
	"opening_hours" varchar(160),
	"image" text,
	"tags" jsonb,
	"amenities" jsonb,
	"website" text,
	"source_id" integer
);
--> statement-breakpoint
CREATE TABLE "post_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_likes" (
	"post_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	CONSTRAINT "post_likes_post_id_user_id_pk" PRIMARY KEY("post_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"home_country_code" varchar(2),
	"nationality_code" varchar(2),
	"travel_style" varchar(40),
	"budget_preference" varchar(40),
	"bio" text,
	"avatar_seed" varchar(60),
	"is_creator" boolean DEFAULT false NOT NULL,
	"socials" jsonb,
	"interests" jsonb
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"place_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"body" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_places" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"place_id" integer,
	"city_id" integer,
	"collection_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"token" varchar(128) PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"url" text NOT NULL,
	"type" "source_type" NOT NULL,
	"last_checked_at" timestamp,
	"last_updated_at" timestamp,
	"verification_status" "verification_status" DEFAULT 'needs_review' NOT NULL,
	"confidence" integer DEFAULT 50 NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "transport_routes" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_city_id" integer NOT NULL,
	"to_city_id" integer NOT NULL,
	"mode" varchar(20) NOT NULL,
	"operator" varchar(120),
	"typical_duration_min" integer,
	"typical_price_usd_min" integer,
	"typical_price_usd_max" integer,
	"frequency" varchar(100),
	"notes" text,
	"source_id" integer
);
--> statement-breakpoint
CREATE TABLE "travel_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_id" integer,
	"title" varchar(220) NOT NULL,
	"body" text NOT NULL,
	"severity" "alert_severity" DEFAULT 'info' NOT NULL,
	"category" varchar(60) NOT NULL,
	"is_sample" boolean DEFAULT true NOT NULL,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"last_checked_at" timestamp,
	"source_id" integer
);
--> statement-breakpoint
CREATE TABLE "travel_facts" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_id" integer NOT NULL,
	"category" "fact_category" NOT NULL,
	"title" varchar(200) NOT NULL,
	"body" text NOT NULL,
	"source_id" integer
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(180) NOT NULL,
	"origin_label" varchar(160),
	"destination_city_id" integer NOT NULL,
	"start_date" varchar(10) NOT NULL,
	"end_date" varchar(10) NOT NULL,
	"travelers" integer DEFAULT 1 NOT NULL,
	"nationality_code" varchar(2),
	"budget_usd" integer,
	"travel_style" varchar(40) DEFAULT 'mid-range' NOT NULL,
	"interests" jsonb,
	"status" "trip_status" DEFAULT 'planned' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(120) NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visa_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_country_code" varchar(2) NOT NULL,
	"to_country_code" varchar(2) NOT NULL,
	"passport_type" varchar(30) DEFAULT 'ordinary' NOT NULL,
	"visa_type" "visa_type" NOT NULL,
	"max_stay_days" integer,
	"requirements" jsonb,
	"notes" text,
	"source_id" integer,
	"last_verified_at" timestamp,
	"verification_status" "verification_status" DEFAULT 'needs_review' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "countries" ADD CONSTRAINT "countries_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_stories" ADD CONSTRAINT "creator_stories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_stories" ADD CONSTRAINT "creator_stories_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_users_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itinerary_days" ADD CONSTRAINT "itinerary_days_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itinerary_items" ADD CONSTRAINT "itinerary_items_day_id_itinerary_days_id_fk" FOREIGN KEY ("day_id") REFERENCES "public"."itinerary_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itinerary_items" ADD CONSTRAINT "itinerary_items_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phrases" ADD CONSTRAINT "phrases_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_places" ADD CONSTRAINT "saved_places_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_places" ADD CONSTRAINT "saved_places_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_places" ADD CONSTRAINT "saved_places_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_places" ADD CONSTRAINT "saved_places_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_routes" ADD CONSTRAINT "transport_routes_from_city_id_cities_id_fk" FOREIGN KEY ("from_city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_routes" ADD CONSTRAINT "transport_routes_to_city_id_cities_id_fk" FOREIGN KEY ("to_city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transport_routes" ADD CONSTRAINT "transport_routes_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_alerts" ADD CONSTRAINT "travel_alerts_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_alerts" ADD CONSTRAINT "travel_alerts_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_facts" ADD CONSTRAINT "travel_facts_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "travel_facts" ADD CONSTRAINT "travel_facts_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_destination_city_id_cities_id_fk" FOREIGN KEY ("destination_city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visa_rules" ADD CONSTRAINT "visa_rules_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "budget_trip_idx" ON "budget_items" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "checklist_trip_idx" ON "checklist_items" USING btree ("trip_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cities_slug_idx" ON "cities" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "cities_country_idx" ON "cities" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "posts_city_idx" ON "community_posts" USING btree ("city_id");--> statement-breakpoint
CREATE UNIQUE INDEX "countries_slug_idx" ON "countries" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "countries_code_idx" ON "countries" USING btree ("code");--> statement-breakpoint
CREATE INDEX "countries_continent_idx" ON "countries" USING btree ("continent");--> statement-breakpoint
CREATE INDEX "stories_city_idx" ON "creator_stories" USING btree ("city_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rates_pair_idx" ON "exchange_rates" USING btree ("base","quote");--> statement-breakpoint
CREATE INDEX "days_trip_idx" ON "itinerary_days" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "items_day_idx" ON "itinerary_items" USING btree ("day_id");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "phrases_country_idx" ON "phrases" USING btree ("country_id");--> statement-breakpoint
CREATE UNIQUE INDEX "places_slug_idx" ON "places" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "places_city_idx" ON "places" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "places_type_idx" ON "places" USING btree ("type");--> statement-breakpoint
CREATE INDEX "comments_post_idx" ON "post_comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "reviews_place_idx" ON "reviews" USING btree ("place_id");--> statement-breakpoint
CREATE INDEX "saved_user_idx" ON "saved_places" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "routes_from_idx" ON "transport_routes" USING btree ("from_city_id");--> statement-breakpoint
CREATE INDEX "alerts_country_idx" ON "travel_alerts" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "facts_country_idx" ON "travel_facts" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "trips_user_idx" ON "trips" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "visa_from_to_idx" ON "visa_rules" USING btree ("from_country_code","to_country_code");