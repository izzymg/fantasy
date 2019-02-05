const db = require("./database");

(async() => {
    await db.open();
    const queries = [
        {
            sql: "SELECT @boardId:=MAX(boardId) FROM posts WHERE boardUrl = ?",
            values: ["b"]
        },
        {
            sql: "SET @boardId = COALESCE(@boardId, 0)"
        },
        {
            sql: "SET @boardId = @boardId + 1"
        },
        {
            sql: "INSERT INTO posts SET ?",
            values: {
                boardUrl: "b",
                parent: 0,
                name: "Anonymous",
                subject: "A thread",
                content: "Using an SQL transaction"
            }
        }
    ];
    try {
        const res = await db.transaction(queries);
        console.log(res);
    } catch(e) {
        console.error(e);
    }
    await db.close();
})();