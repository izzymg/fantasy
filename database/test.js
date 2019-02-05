const db = require("./database");

(async() => {
    await db.open();
    const queries = [
        {
            sql: "SELECT @boardId:=MAX(boardId) FROM posts WHERE boardUrl = ?",
            values: ["g"]
        },
        {
            sql: "SET @boardId = COALESCE(@boardId, 0)"
        },
        {
            sql: "SET @boardId = @boardId + 1"
        },
        {
            sql: "INSERT INTO posts SET boardId = @boardId, ?",
            values: [
                {
                    boardUrl: "g",
                    parent: 0,
                    name: "Anonymous",
                    subject: "A thread",
                    content: "Test"
                }
            ]
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