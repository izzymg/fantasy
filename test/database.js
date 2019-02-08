const assert = require("assert");
const secrets = require("../config/secrets");
const database = require("../database/database");

describe("Open database", () => {
    it("Should open a connection to the database and return the host and port", async () => {
        const { host, port } = await database.open();
        assert(host === secrets.host);
        assert(port === secrets.port);
        await database.close();
    });
});

describe("hooks", () => {
    before(async function openDb() {
        await database.open();
    });

    after(async function closeDb() {
        await database.close();
    });

    describe("Query: create table", () => {
        it("Should create a table named 'zthreetesting' with two columns", async () => {
            const res = await database.query(
                "CREATE TABLE IF NOT EXISTS zthreetesting (id int primary key auto_increment, value text)",
            );
            assert(res.affected === 0);
        });
    });

    describe("Query: insert into and fetch", () => {
        it("Should insert a row into zthreetesting, return the ID and fetch it", async () => {
            const res = await database.query(
                "INSERT INTO zthreetesting (value) values ('test value')",
            );
            assert(res.inserted === 1);
            const row = await database.fetch(
                "SELECT id, value FROM zthreetesting WHERE id = ?",
                res.inserted,
            );
            assert(row.id === res.inserted);
            assert(row.value === "test value");
        });
    });

    describe("Transactional query", () => {
        it("Should use transactions to insert a row with the value of the previous row's ID + 1", async () => {
            const queries = [
                {
                    sql: "SELECT @value:=id FROM zthreetesting WHERE id = 1",
                },
                {
                    sql: "SET @value = @value + 1",
                },
                {
                    sql: "INSERT INTO zthreetesting SET value = @value",
                },
            ];
            const [, , inserted] = await database.transaction(queries);
            assert(inserted.insertId === 2);
        });
    });

    describe("Fetch all", () => {
        it("Should fetch both rows in an array", async () => {
            const rows = await database.fetchAll("SELECT * FROM zthreetesting");
            assert(rows.length == 2);
            assert(rows[1].value == 2);
        });
    });

    describe("Drop table", () => {
        it("Should drop the testing table", async () => {
            await database.query("DROP TABLE zthreetesting");
        });
    });
});
