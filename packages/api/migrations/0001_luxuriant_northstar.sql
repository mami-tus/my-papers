CREATE TABLE `papers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`field` text NOT NULL,
	`doi` text NOT NULL,
	`title` text NOT NULL,
	`year` integer NOT NULL,
	`authors` blob,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_user_field_doi` ON `papers` (`user_id`,`field`,`doi`);--> statement-breakpoint
ALTER TABLE `users` ADD `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL;