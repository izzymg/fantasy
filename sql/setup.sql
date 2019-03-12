CREATE TABLE IF NOT EXISTS boards (
    url varchar(20) PRIMARY KEY,
    title tinytext NOT NULL,
    about text,
    sfw boolean DEFAULT true,
    bumpLimit integer DEFAULT 200,
    maxThreads integer DEFAULT 30,
    cooldown smallint DEFAULT 60,
    createdAt datetime DEFAULT now()
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS posts (
    uid integer PRIMARY KEY AUTO_INCREMENT,
    boardUrl varchar(20) NOT NULL,
    postId integer NOT NULL,
    parent integer NOT NULL DEFAULT 0,
    createdAt datetime NOT NULL DEFAULT now(),
    lastBump datetime,
    name text,
    subject text,
    content text,
    sticky boolean DEFAULT false,
    ip varchar(39),
    CONSTRAINT postboard
        FOREIGN KEY (boardUrl) REFERENCES boards (url)
        ON DELETE CASCADE,
    UNIQUE KEY boarduid (boardUrl, postId)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX IF NOT EXISTS postUid ON posts (uid);
CREATE INDEX IF NOT EXISTS postId ON posts (postId);

CREATE TABLE IF NOT EXISTS boardids (
    boardUrl varchar(20) NOT NULL,
    id integer NOT NULL,
    CONSTRAINT idboard
        FOREIGN KEY (boardUrl) REFERENCES boards (url)
        ON DELETE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TRIGGER IF NOT EXISTS updateboardids
    AFTER INSERT ON boards
    FOR EACH ROW
    INSERT INTO boardids SET boardUrl = new.url, id = 1;

CREATE TABLE IF NOT EXISTS files (
    postUid integer NOT NULL,
    filename varchar(100) PRIMARY KEY,
    thumbFilename varchar(100) DEFAULT NULL,
    mimetype tinytext,
    originalName text,
    size integer,
    hash text,
    CONSTRAINT filepost
        FOREIGN KEY (postUid) REFERENCES posts (uid)
        ON DELETE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
    username varchar(100) PRIMARY KEY,
    password text,
    createdAt datetime DEFAULT now()
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS administrators (
    username varchar(100) UNIQUE,
    createdAt datetime NOT NULL DEFAULT now(),
    CONSTRAINT adminuser
        FOREIGN KEY (username) REFERENCES users (username)
        ON DELETE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS moderators (
    username varchar(100) NOT NULL,
    boardUrl varchar(20) NOT NULL,
    createdAt datetime NOT NULL DEFAULT now(),
    CONSTRAINT moduser
        FOREIGN KEY (username) REFERENCES users (username)
        ON DELETE CASCADE,
    CONSTRAINT modboard
        FOREIGN KEY (boardUrl) REFERENCES boards (url)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS bans (
    uid integer PRIMARY KEY AUTO_INCREMENT,
    ip varchar(39) NOT NULL,
    boardUrl varchar(20) NOT NULL,
    allBoards boolean DEFAULT FALSE,
    expires datetime,
    reason text,
    constraint banboard
        FOREIGN KEY (boardUrl) REFERENCES boards (url)
        ON DELETE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reports (
    boardUrl varchar(20) NOT NULL,
    postUid integer NOT NULL,
    postId integer NOT NULL,
    ip varchar(29) NOT NULL,
    createdAt datetime DEFAULT now(),
    CONSTRAINT reportpost
        FOREIGN KEY (postUid) REFERENCES posts (uid)
        ON DELETE CASCADE,
    CONSTRAINT reportboard
        FOREIGN KEY (boardUrl) REFERENCES boards (url)
        ON DELETE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;