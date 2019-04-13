-- Some nice defaults for Fantasy

----------------------------------------------------------------------
----------------------------------------------------------------------

-- Adds an administrator with username and password "admin" (bcrypt generated)
INSERT INTO users(username, password) VALUES (
    "admin", 
    "$2b$15$Cd1aAqg9UEBj7u6Kzh8AIeadd9RNKZ2ilC6p9GTCEorSXtAO4qBZu"
);

INSERT INTO administrators(username) VALUES ("admin");

----------------------------------------------------------------------
----------------------------------------------------------------------

-- Some default report levels
INSERT INTO reportlevels SET level = 0, description = "Breaks the rules";
INSERT INTO reportlevels SET level = 1, description = "Spam/unintelligible";
INSERT INTO reportlevels SET level = 2, description = "Impersonation";
INSERT INTO reportlevels SET level = 3, description = "Illegal content";

----------------------------------------------------------------------
----------------------------------------------------------------------

-- Test board
DELETE FROM posts WHERE boardUid = "test";
DELETE FROM boards WHERE uid = "test";

INSERT INTO boards SET uid = "test", title = "Test board", about = "Test board",
    sfw = false, bumpLimit = 500, maxThreads = 30, cooldown = 30;

-- Some test posts with fake files
INSERT INTO posts SET
    name = "TestPost",
    content = "2 files",
    subject = "Test",
    parent = 0,
    boardUid = "test",
    lastBump = NOW();

INSERT INTO files SET
    postUid = (SELECT uid FROM posts WHERE name = "TestPost"),
    filename = "fakeFile.png",
    originalName = "fakeFile.png";
INSERT INTO files SET
    postUid = (SELECT uid FROM posts WHERE name = "TestPost"),
    filename = "fakeFile2.png",
    originalName = "fakeFile2.png";

INSERT INTO posts SET
    name = "TestPost2",
    content = "No files",
    subject = "Test",
    parent = 1,
    boardUid = "test";
    
----------------------------------------------------------------------
----------------------------------------------------------------------