CREATE TABLE `erna_attempts` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`until` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `erna_sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`expires` integer NOT NULL,
	`version` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `erna_state` (
	`role` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `erna_uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`section` text NOT NULL,
	`created` text NOT NULL
);
