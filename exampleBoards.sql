INSERT INTO boards (
    url,
    title,
    about,
    sfw,
    bumpLimit,
    maxThreads) 
    VALUES (
    "dev",
    "Generic dev testing",
    "",
    true,
    300,
    25
);

INSERT INTO boards (
    url,
    title,
    about,
    sfw,
    bumpLimit,
    maxThreads) 
    VALUES (
    "bump",
    "Bump tests",
    "Testing bump limits and thread deletion",
    false,
    5,
    3
);