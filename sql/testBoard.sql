INSERT INTO boards (
    uid,
    title,
    about,
    sfw,
    bumpLimit,
    maxThreads,
    cooldown) 
    VALUES (
    "test",
    "Dev testing",
    "Dev tests",
    false,
    5,
    1,
    0
);

INSERT INTO posts SET id = (SELECT id FROM boardids WHERE boardUid = "test" FOR UPDATE),
    name = "Test Post", content = "Test", subject = "Test", parent = 0, boardUid = "test";