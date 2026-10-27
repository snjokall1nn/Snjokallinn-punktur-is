CREATE TABLE `client_sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`expires` integer NOT NULL,
	`version` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `client_state` (
	`role` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `client_uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`section` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`config` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`published` integer DEFAULT 0 NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `clients_slug_unique` ON `clients` (`slug`);