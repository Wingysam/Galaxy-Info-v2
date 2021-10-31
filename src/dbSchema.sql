CREATE TABLE Users (
	name TEXT PRIMARY KEY UNIQUE NOT NULL,
	id BIGINT NOT NULL
);

CREATE TABLE Kills (
	id BIGINT PRIMARY KEY UNIQUE NOT NULL,
	killer_id BIGINT NOT NULL,
	killer_name TEXT NOT NULL,
	killer_ship TEXT NOT NULL,
	killer_class TEXT NOT NULL,
	victim_id BIGINT NOT NULL,
	victim_name TEXT NOT NULL,
	victim_ship TEXT NOT NULL,
	victim_class TEXT NOT NULL,
	victim_cost INTEGER NOT NULL,
	victim_limited BOOLEAN NOT NULL,
	refunded BOOLEAN NOT NULL,
	nuke BOOLEAN NOT NULL,
	date DATETIME NOT NULL
);