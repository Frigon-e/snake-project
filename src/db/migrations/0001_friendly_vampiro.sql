ALTER TABLE `snakes` ADD `sex` text;--> statement-breakpoint
ALTER TABLE `snakes` ADD `hatch_date` text;--> statement-breakpoint
ALTER TABLE `snakes` ADD `personality` text;--> statement-breakpoint
ALTER TABLE `snakes` ADD `feeding_notes` text;--> statement-breakpoint
ALTER TABLE `snakes` ADD `diet` text;--> statement-breakpoint
ALTER TABLE `snakes` ADD `shed_frequency` text;--> statement-breakpoint
ALTER TABLE `snakes` ADD `temperature` text;--> statement-breakpoint
ALTER TABLE `snakes` ADD `humidity` text;--> statement-breakpoint
ALTER TABLE `snakes` ADD `weight_grams` integer;--> statement-breakpoint
ALTER TABLE `snakes` ADD `complementary_genetics` text;--> statement-breakpoint
ALTER TABLE `snakes` ADD `status` text;
UPDATE snakes SET status = CASE WHEN available = 1 THEN 'available' ELSE 'sold' END WHERE status IS NULL;