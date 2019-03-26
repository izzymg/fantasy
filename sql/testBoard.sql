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
    name = "TestPost", content = "2 files", subject = "Test", parent = 0, boardUid = "test";
INSERT INTO files SET postUid = (SELECT uid FROM posts WHERE name = "TestPost"),
    filename = "fakeFile.png", originalName = "fakeFile.png", thumbFilename = "fake_thumb.jpg";
INSERT INTO files SET postUid = (SELECT uid FROM posts WHERE name = "TestPost"),
    filename = "fakeFile2.png", originalName = "fakeFile2.png", thumbFilename = "fake_thumb2.jpg";
UPDATE boardids SET id = id + 1 WHERE boardUid = "test";
INSERT INTO posts SET id = (SELECT id FROM boardids WHERE boardUid = "test" FOR UPDATE),
    name = "TestPost2", content = "No files", subject = "Test", parent = 0, boardUid = "test";
UPDATE boardids SET id = id + 1 WHERE boardUid = "test";