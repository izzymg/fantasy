const postsConfig = require("./config/posts");
const db = require("./database/database");
(async () => {
    db.open();
    try {
        console.log("Db Setup: Setting up boards table");
        await db.query(`CREATE TABLE IF NOT EXISTS boards (
            url varchar(10) PRIMARY KEY NOT NULL,
            title tinytext NOT NULL,
            about text,
            sfw boolean DEFAULT true,
            createdAt datetime DEFAULT CURRENT_TIMESTAMP)`);
    } catch (error) {
        return console.error("Db Setup: Error setting up boards", error);
    }

    try {
        const boards = await db.fetchAll("select url from boards");
        if (!boards) return;
        // Create a posts table for each board, suffixed with the board url (e.g. posts_g)
        // Done in parallel by mapping each board to an array of promises
        await Promise.all(boards.map(async board => {
            console.log(`Db Setup: Found /${board.url}/ - initializing tables`);
            await db.query(`CREATE TABLE IF NOT EXISTS posts_${board.url} (
                fileId int PRIMARY KEY AUTO_INCREMENT,
                name varchar(${postsConfig.maxNameLength}),
                subject varchar(${postsConfig.maxSubjectLength}),
                content varchar(${postsConfig.maxContentLength}),
                date datetime DEFAULT CURRENT_TIMESTAMP,
                parent int NOT NULL DEFAULT 0,
                lastBump datetime DEFAULT CURRENT_TIMESTAMP)`);
            await db.query(`CREATE TABLE IF NOT EXISTS files_${board.url} (
                id varchar(36) PRIMARY KEY,
                thumbSuffix tinytext,
                originalName text,
                extension varchar(12),
                mimetype tinytext,
                hash text,
                postId int
            )`);
        }));
    } catch (error) {
        return console.error("Db Setup: Error setting up boards", error);
    }

    try {
        await db.close();
        return console.log("Done, exiting.");
    } catch (error) {
        return console.error("Error exiting", error);
    }
})();