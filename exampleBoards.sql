INSERT INTO boards (
    url,
    title,
    about,
    sfw,
    bumpLimit,
    maxThreads,
    cooldown) 
    VALUES (
    "dev",
    "Generic dev testing",
    "",
    true,
    300,
    25,
    20
);

INSERT INTO boards (
    url,
    title,
    about,
    sfw,
    bumpLimit,
    maxThreads,
    cooldown) 
    VALUES (
    "bump",
    "Bump tests",
    "Testing bump limits and thread deletion",
    false,
    5,
    3,
    1
);