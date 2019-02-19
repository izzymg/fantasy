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

INSERT INTO boards (
    url, title, about,
    sfw, bumpLimit, maxThreads, cooldown
    ) VALUES (
    "new", "Setup board", "Welcome",
    true, 300, 25, 30
);

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
    CONSTRAINT postboard
        FOREIGN KEY (boardUrl) REFERENCES boards (url)
        ON DELETE CASCADE,
    UNIQUE KEY boarduid (boardUrl, postId)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX postUid ON posts (uid);
CREATE INDEX postId ON posts (postId);

CREATE TABLE IF NOT EXISTS boardids (
    boardUrl varchar(15) NOT NULL,
    id integer NOT NULL,
    CONSTRAINT idboard
        FOREIGN KEY (boardUrl) REFERENCES boards (url)
        ON DELETE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TRIGGER updateboardids
    AFTER INSERT ON boards
    FOR EACH ROW
    INSERT INTO boardids SET boardUrl = new.url, id = 0;

CREATE TABLE IF NOT EXISTS files (
    postUid integer NOT NULL,
    fileId varchar(36) PRIMARY KEY,
    extension tinytext NOT NULL,
    mimetype tinytext,
    thumbSuffix tinytext DEFAULT NULL,
    originalName text,
    size integer,
    hash text,
    CONSTRAINT filepost
        FOREIGN KEY (postUid) REFERENCES posts (uid)
        ON DELETE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
    username varchar(100) PRIMARY KEY,
    password text NOT NULL,
    createdAt datetime DEFAULT CURRENT_TIMESTAMP
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS administrators (
    username varchar(100) NOT NULL PRIMARY KEY,
    CONSTRAINT adminusername
        FOREIGN KEY (username) REFERENCES users (username)
        ON DELETE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS boardmods (
    username varchar(100) NOT NULL,
    boardUrl varchar(15) NOT NULL,
    UNIQUE KEY mod_uid (username, boardUrl),
    CONSTRAINT modusername
        FOREIGN KEY (username) REFERENCES users (username)
        ON DELETE CASCADE,
    CONSTRAINT modboard
        FOREIGN KEY (boardUrl) REFERENCES boards (url)
        ON DELETE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;