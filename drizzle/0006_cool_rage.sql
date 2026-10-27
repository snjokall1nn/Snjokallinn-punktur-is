CREATE TABLE `photo_applications` (
	`id` text PRIMARY KEY NOT NULL,
	`competition` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`contact` text NOT NULL,
	`ideas` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_photo_applications_competition` ON `photo_applications` (`competition`);--> statement-breakpoint
CREATE TABLE `photo_competitions` (
	`slug` text PRIMARY KEY NOT NULL,
	`config` text NOT NULL,
	`published` integer DEFAULT 0 NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`selected` text,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
