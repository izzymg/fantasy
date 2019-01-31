module.exports = async (db) => {
    try {
        console.log("Setting up boards");
        await db.query(`CREATE TABLE IF NOT EXISTS boards (
            url varchar(10) PRIMARY KEY NOT NULL,
            title tinytext NOT NULL,
            about text,
            sfw boolean DEFAULT true,
            createdAt datetime DEFAULT CURRENT_TIMESTAMP)`);
    } catch(error) {
        console.error("ZThree ERROR: Error setting up boards", error);
    }
};