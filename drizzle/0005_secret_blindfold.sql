CREATE TABLE `sjut_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`club` text NOT NULL,
	`member` text NOT NULL,
	`mission` text NOT NULL,
	`mime` text NOT NULL,
	`approved` integer DEFAULT 0 NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_sjut_entries_club` ON `sjut_entries` (`club`);--> statement-breakpoint
CREATE INDEX `idx_sjut_entries_member` ON `sjut_entries` (`member`);--> statement-breakpoint
CREATE TABLE `sjut_members` (
	`id` text PRIMARY KEY NOT NULL,
	`club` text NOT NULL,
	`name` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sjut_members_token_unique` ON `sjut_members` (`token`);--> statement-breakpoint
CREATE INDEX `idx_sjut_members_club` ON `sjut_members` (`club`);--> statement-breakpoint
CREATE TABLE `sjut_missions` (
	`id` text PRIMARY KEY NOT NULL,
	`club` text NOT NULL,
	`title` text NOT NULL,
	`instructions` text NOT NULL,
	`points` integer DEFAULT 1 NOT NULL,
	`published` integer DEFAULT 1 NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_sjut_missions_club` ON `sjut_missions` (`club`);