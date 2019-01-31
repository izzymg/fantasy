const db = require("../database/database");
const Sequelize = require("sequelize");
const Board = db.define("board",
    {
        url: {
            primaryKey: true,
            type: Sequelize.STRING({length: 10})
        },
        title: Sequelize.TEXT("tiny"),
        desc: Sequelize.TEXT("tiny"),
        sfw: Sequelize.BOOLEAN
    }, 
    {
        updatedAt: false
    }
);

Board.sync().then(() => {
    console.log("Setup boards");
}).catch(e => {
    console.error("ZThree: Error setting up boards", e);
});

module.exports = Board;