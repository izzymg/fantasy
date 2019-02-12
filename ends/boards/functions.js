exports.getBoards = async () => {
    return { text: "All boards" };
};

exports.getBoard = async id => {
    return { text: `Board id ${id}` };
};

exports.getThread = async (board, id) => {
    return { text: `Thread on ${board}, ${id}`};
};

exports.getThreads = async board => {
    return { text: `Threads on ${board}` };
};

exports.getReplies = async (board, id) => {
    return { text: `Replies to ${id} on ${board}` };
};
