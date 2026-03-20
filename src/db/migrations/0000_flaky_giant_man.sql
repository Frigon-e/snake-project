CREATE TABLE `inquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`snake_id` text,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`message` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`snake_id`) REFERENCES `snakes`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `snakes` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`species` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`price_in_cents` integer DEFAULT 0 NOT NULL,
	`available` integer DEFAULT false NOT NULL,
	`featured` integer DEFAULT false NOT NULL,
	`primary_image_key` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `snakes_slug_unique` ON `snakes` (`slug`);--> statement-breakpoint
CREATE TABLE `trait_chips` (
	`id` text PRIMARY KEY NOT NULL,
	`snake_id` text NOT NULL,
	`label` text NOT NULL,
	`type` text DEFAULT 'dominant' NOT NULL,
	FOREIGN KEY (`snake_id`) REFERENCES `snakes`(`id`) ON UPDATE no action ON DELETE cascade
);
