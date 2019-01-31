CREATE TABLE IF NOT EXISTS `boards` (
    `id` varchar(10) NOT NULL UNIQUE,
    `title` TINYTEXT NOT NULL,
    `desc` TINYTEXT,
    `sfw` BOOLEAN
);