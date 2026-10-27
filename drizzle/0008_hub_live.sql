create table "hub_auth_user" ("id" text not null primary key, "name" text not null, "email" text not null unique, "emailVerified" integer not null, "image" text, "createdAt" date not null, "updatedAt" date not null);
--> statement-breakpoint
create table "hub_auth_session" ("id" text not null primary key, "expiresAt" date not null, "token" text not null unique, "createdAt" date not null, "updatedAt" date not null, "ipAddress" text, "userAgent" text, "userId" text not null references "hub_auth_user" ("id") on delete cascade);
--> statement-breakpoint
create table "hub_auth_account" ("id" text not null primary key, "accountId" text not null, "providerId" text not null, "userId" text not null references "hub_auth_user" ("id") on delete cascade, "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" date, "refreshTokenExpiresAt" date, "scope" text, "password" text, "createdAt" date not null, "updatedAt" date not null);
--> statement-breakpoint
create table "hub_auth_verification" ("id" text not null primary key, "identifier" text not null, "value" text not null, "expiresAt" date not null, "createdAt" date not null, "updatedAt" date not null);
--> statement-breakpoint
create table "hub_auth_rate_limit" ("id" text not null primary key, "key" text not null unique, "count" integer not null, "lastRequest" bigint not null);
--> statement-breakpoint
create index "hub_auth_session_userId_idx" on "hub_auth_session" ("userId");
--> statement-breakpoint
create index "hub_auth_account_userId_idx" on "hub_auth_account" ("userId");
--> statement-breakpoint
create index "hub_auth_verification_identifier_idx" on "hub_auth_verification" ("identifier");
--> statement-breakpoint
PRAGMA foreign_keys=ON;
--> statement-breakpoint
CREATE TABLE hub_live_admins(user_id TEXT PRIMARY KEY REFERENCES hub_auth_user(id));
--> statement-breakpoint
CREATE TABLE hub_live_shoots(id TEXT PRIMARY KEY,client_id TEXT NOT NULL REFERENCES hub_auth_user(id),draft_json TEXT NOT NULL CHECK(json_valid(draft_json)),published_json TEXT CHECK(published_json IS NULL OR json_valid(published_json)),revision INTEGER NOT NULL DEFAULT 0 CHECK(revision>=0));
--> statement-breakpoint
CREATE TABLE hub_live_answers(shoot_id TEXT NOT NULL REFERENCES hub_live_shoots(id),user_id TEXT NOT NULL REFERENCES hub_auth_user(id),question_id TEXT NOT NULL,body TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 1,PRIMARY KEY(shoot_id,user_id,question_id));
--> statement-breakpoint
CREATE TABLE hub_live_ideas(id TEXT PRIMARY KEY,shoot_id TEXT NOT NULL REFERENCES hub_live_shoots(id),board TEXT NOT NULL CHECK(board IN ('mood','outfits','light')),author_id TEXT NOT NULL REFERENCES hub_auth_user(id),body TEXT NOT NULL,url TEXT,created_at TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE hub_live_messages(id TEXT PRIMARY KEY,shoot_id TEXT NOT NULL REFERENCES hub_live_shoots(id),author_id TEXT NOT NULL REFERENCES hub_auth_user(id),body TEXT NOT NULL,created_at TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE hub_live_operations(user_id TEXT NOT NULL REFERENCES hub_auth_user(id),operation_id TEXT NOT NULL,kind TEXT NOT NULL,resource_id TEXT NOT NULL,PRIMARY KEY(user_id,operation_id));
--> statement-breakpoint
ALTER TABLE hub_live_ideas ADD COLUMN image_key TEXT;
--> statement-breakpoint
ALTER TABLE hub_live_ideas ADD COLUMN revision INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
CREATE TABLE hub_live_idea_reactions(idea_id TEXT NOT NULL REFERENCES hub_live_ideas(id),user_id TEXT NOT NULL REFERENCES hub_auth_user(id),kind TEXT NOT NULL CHECK(kind IN ('favorite','try')),PRIMARY KEY(idea_id,user_id,kind));
--> statement-breakpoint
CREATE TABLE hub_live_idea_comments(id TEXT PRIMARY KEY,idea_id TEXT NOT NULL REFERENCES hub_live_ideas(id),author_id TEXT NOT NULL REFERENCES hub_auth_user(id),body TEXT NOT NULL,created_at TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE hub_live_access(user_id TEXT PRIMARY KEY REFERENCES hub_auth_user(id),active INTEGER NOT NULL DEFAULT 1 CHECK(active IN(0,1)));
--> statement-breakpoint
CREATE TABLE hub_live_booking_links(inquiry_id TEXT PRIMARY KEY,shoot_id TEXT NOT NULL UNIQUE REFERENCES hub_live_shoots(id),status TEXT NOT NULL CHECK(status IN('confirmed','declined')));
