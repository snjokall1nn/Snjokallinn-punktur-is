CREATE TABLE `ball_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`person` text NOT NULL,
	`mission` integer NOT NULL,
	`mime` text NOT NULL,
	`approved` integer DEFAULT 0 NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ball_people` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`token` text NOT NULL,
	`slot` integer,
	`missions` text NOT NULL,
	`handed` integer DEFAULT 0 NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ball_people_token_unique` ON `ball_people` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `ball_people_slot_unique` ON `ball_people` (`slot`);