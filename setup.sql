CREATE TABLE IF NOT EXISTS boards (
    url varchar(15) PRIMARY KEY,
    title tinytext NOT NULL,
    about text,
    sfw boolean DEFAULT true,
    bumpLimit integer DEFAULT 0,
    maxThreads integer DEFAULT 2,
    createdAt datetime DEFAULT CURRENT_TIMESTAMP
)ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS posts (
    uid integer PRIMARY KEY AUTO_INCREMENT,
    boardUrl varchar(15) NOT NULL,
    boardId integer NOT NULL,
    parent integer NOT NULL DEFAULT 0,
    createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastBump datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    name text,
    subject text,
    content text,
    sticky boolean DEFAULT FALSE,
    UNIQUE KEY board_uid (boardUrl, boardId)
)ENGINE=Aria;

CREATE TABLE IF NOT EXISTS files (
    postUid integer NOT NULL,
    fileId varchar(36) PRIMARY KEY,
    extension tinytext NOT NULL,
    mimetype tinytext,
    thumbSuffix tinytext DEFAULT NULL,
    originalName text,
    hash text
)ENGINE=InnoDB;