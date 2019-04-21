-- Some defaults for Fantasy

----------------------------------------------------------------------
----------------------------------------------------------------------

-- Adds an administrator with username and password "admin" (bcrypt generated)
DELETE FROM users WHERE username = "admin";
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