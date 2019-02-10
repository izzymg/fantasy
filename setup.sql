CREATE TABLE IF NOT EXISTS boards (
    url varchar(15) PRIMARY KEY,
    title tinytext NOT NULL,
    about text,
    sfw boolean DEFAULT true,
    bumpLimit integer DEFAULT 200,
    maxThreads integer DEFAULT 30,
    cooldown smallint DEFAULT 60,
    createdAt datetime DEFAULT CURRENT_TIMESTAMP
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS posts (
    uid integer PRIMARY KEY AUTO_INCREMENT,
    boardUrl varchar(15) NOT NULL,
    postId integer NOT NULL,
    parent integer NOT NULL DEFAULT 0,
    createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    lastBump datetime,
    name text,
    subject text,
    content text,
    sticky boolean DEFAULT FALSE,
    UNIQUE KEY board_uid (boardUrl, postId)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS files (
    postUid integer NOT NULL,
    fileId varchar(36) PRIMARY KEY,
    extension tinytext NOT NULL,
    mimetype tinytext,
    thumbSuffix tinytext DEFAULT NULL,
    originalName text,
    size integer,
    hash text
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
    username varchar(100) PRIMARY KEY,
    password text NOT NULL,
    createdAt datetime DEFAULT CURRENT_TIMESTAMP
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS administrators (
    username varchar(100) NOT NULL PRIMARY KEY,
    CONSTRAINT admin_username
        FOREIGN KEY (username) REFERENCES users (username)
        ON DELETE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS boardmods (
    username varchar(100) NOT NULL,
    boardUrl varchar(15) NOT NULL,
    UNIQUE KEY mod_uid (username, boardUrl),
    CONSTRAINT mod_username
        FOREIGN KEY (username) REFERENCES users (username)
        ON DELETE CASCADE,
    CONSTRAINT mod_board
        FOREIGN KEY (boardUrl) REFERENCES boards (url)
        ON DELETE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;