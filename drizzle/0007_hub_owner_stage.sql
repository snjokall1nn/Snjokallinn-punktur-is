CREATE TABLE hub_stage_users(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE);
--> statement-breakpoint
PRAGMA foreign_keys=ON;
--> statement-breakpoint
CREATE TABLE hub_stage_admins(user_id TEXT PRIMARY KEY REFERENCES hub_stage_users(id));
--> statement-breakpoint
CREATE TABLE hub_stage_shoots(id TEXT PRIMARY KEY,client_id TEXT NOT NULL REFERENCES hub_stage_users(id),draft_json TEXT NOT NULL CHECK(json_valid(draft_json)),published_json TEXT CHECK(published_json IS NULL OR json_valid(published_json)),revision INTEGER NOT NULL DEFAULT 0 CHECK(revision>=0));
--> statement-breakpoint
CREATE TABLE hub_stage_answers(shoot_id TEXT NOT NULL REFERENCES hub_stage_shoots(id),user_id TEXT NOT NULL REFERENCES hub_stage_users(id),question_id TEXT NOT NULL,body TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 1,PRIMARY KEY(shoot_id,user_id,question_id));
--> statement-breakpoint
CREATE TABLE hub_stage_ideas(id TEXT PRIMARY KEY,shoot_id TEXT NOT NULL REFERENCES hub_stage_shoots(id),board TEXT NOT NULL CHECK(board IN ('mood','outfits','light')),author_id TEXT NOT NULL REFERENCES hub_stage_users(id),body TEXT NOT NULL,url TEXT,created_at TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE hub_stage_messages(id TEXT PRIMARY KEY,shoot_id TEXT NOT NULL REFERENCES hub_stage_shoots(id),author_id TEXT NOT NULL REFERENCES hub_stage_users(id),body TEXT NOT NULL,created_at TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE hub_stage_operations(user_id TEXT NOT NULL REFERENCES hub_stage_users(id),operation_id TEXT NOT NULL,kind TEXT NOT NULL,resource_id TEXT NOT NULL,PRIMARY KEY(user_id,operation_id));
--> statement-breakpoint
ALTER TABLE hub_stage_ideas ADD COLUMN image_key TEXT;
--> statement-breakpoint
ALTER TABLE hub_stage_ideas ADD COLUMN revision INTEGER NOT NULL DEFAULT 0;
--> statement-breakpoint
CREATE TABLE hub_stage_idea_reactions(idea_id TEXT NOT NULL REFERENCES hub_stage_ideas(id),user_id TEXT NOT NULL REFERENCES hub_stage_users(id),kind TEXT NOT NULL CHECK(kind IN ('favorite','try')),PRIMARY KEY(idea_id,user_id,kind));
--> statement-breakpoint
CREATE TABLE hub_stage_idea_comments(id TEXT PRIMARY KEY,idea_id TEXT NOT NULL REFERENCES hub_stage_ideas(id),author_id TEXT NOT NULL REFERENCES hub_stage_users(id),body TEXT NOT NULL,created_at TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE hub_stage_access(user_id TEXT PRIMARY KEY REFERENCES hub_stage_users(id),active INTEGER NOT NULL DEFAULT 1 CHECK(active IN(0,1)));
