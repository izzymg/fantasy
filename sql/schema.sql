-- Fantasy SQL schema

----------------------------------------------------------------------
----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS boards (
    uid             varchar(20) PRIMARY KEY,
    title           tinytext NOT NULL,
    about           text,
    sfw             boolean DEFAULT true,
    bumpLimit       integer DEFAULT 200,
    maxThreads      integer DEFAULT 30,
    cooldown        smallint DEFAULT 60,
    createdAt       datetime DEFAULT now()
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

----------------------------------------------------------------------
----------------------------------------------------------------------

-- Post number count for boards

CREATE TABLE IF NOT EXISTS boardpostnumbers (
    boardUid        varchar(20) NOT NULL,
    number          integer NOT NULL,
    CONSTRAINT boardpostnumberboarduid
        FOREIGN KEY (boardUid) REFERENCES boards (uid)
        ON DELETE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add entry when a  board is inserted

CREATE TRIGGER IF NOT EXISTS insertboardpostnumber
    AFTER INSERT ON boards
    FOR EACH ROW
    INSERT INTO boardpostnumbers SET boardUid = new.uid, number = 1;

----------------------------------------------------------------------
----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS posts (
    uid             integer PRIMARY KEY AUTO_INCREMENT,
    number          integer NOT NULL,
    boardUid        varchar(20) NOT NULL,
    parent          integer NOT NULL DEFAULT 0,
    createdAt       datetime NOT NULL DEFAULT now(),
    lastBump        datetime,
    name            text,
    subject         text,
    content         text,
    sticky          boolean DEFAULT false,
    locked          boolean DEFAULT false,
    ip              varchar(39),
    CONSTRAINT postboard
        FOREIGN KEY (boardUid) REFERENCES boards (uid)
        ON DELETE CASCADE,
    UNIQUE KEY boardpost (boardUid, number)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX IF NOT EXISTS postNumber ON posts (number);
CREATE INDEX IF NOT EXISTS postBoardUid ON posts (boardUid);

-- Set post number on every insert
CREATE TRIGGER IF NOT EXISTS setpostnumber
    BEFORE INSERT ON posts
    FOR EACH ROW
    SET new.number =
        (SELECT number 
        FROM boardpostnumbers WHERE boardUid = new.boardUid);

-- Update board post number after every insert
CREATE TRIGGER IF NOT EXISTS updateboardpostnumber
    AFTER INSERT ON posts
    FOR EACH ROW
        UPDATE boardpostnumbers
        SET number = number + 1 WHERE boardUid = new.boardUid;
----------------------------------------------------------------------
----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS files (
    postUid         integer NOT NULL,
    filename        varchar(100) PRIMARY KEY,
    mimetype        tinytext,
    originalName    text,
    size            integer,
    hash            text,
    CONSTRAINT filepost
        FOREIGN KEY (postUid) REFERENCES posts (uid)
        ON DELETE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

----------------------------------------------------------------------
----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS bans (
    uid             integer PRIMARY KEY AUTO_INCREMENT,
    ip              varchar(39) NOT NULL,
    boardUid        varchar(20) NOT NULL,
    allBoards       boolean DEFAULT FALSE,
    expires         datetime,
    reason          text,
    constraint banboard
        FOREIGN KEY (boardUid) REFERENCES boards (uid)
        ON DELETE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX IF NOT EXISTS banIp ON bans (ip);

----------------------------------------------------------------------
----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
    username        varchar(100) PRIMARY KEY,
    password        text,
    createdAt       datetime DEFAULT now()
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

----------------------------------------------------------------------
----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS administrators (
    username        varchar(100) UNIQUE,
    createdAt       datetime NOT NULL DEFAULT now(),
    CONSTRAINT adminuser
        FOREIGN KEY (username) REFERENCES users (username)
        ON DELETE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

----------------------------------------------------------------------
----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS moderators (
    username        varchar(100) NOT NULL,
    boardUid        varchar(20) NOT NULL,
    createdAt       datetime NOT NULL DEFAULT now(),
    CONSTRAINT moduser
        FOREIGN KEY (username) REFERENCES users (username)
        ON DELETE CASCADE,
    CONSTRAINT modboard
        FOREIGN KEY (boardUid) REFERENCES boards (uid)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

----------------------------------------------------------------------
----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS reportlevels(
    level           integer PRIMARY KEY,
    description     text
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reports (
    postUid         integer NOT NULL,
    level           integer NOT NULL,
    ip              varchar(29) NOT NULL,
    createdAt       datetime DEFAULT now(),
    CONSTRAINT reportpost
        FOREIGN KEY (postUid) REFERENCES posts (uid)
        ON DELETE CASCADE,
    CONSTRAINT reportlevel
        FOREIGN KEY (level) REFERENCES reportlevels (level)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

----------------------------------------------------------------------
----------------------------------------------------------------------