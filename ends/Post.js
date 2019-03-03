const persistence = require("./persistence");

const Post = function({ postId, boardUrl, uid, parent = 0, createdAt = new Date(Date.now()),
  lastBump, name = "Anonymous", subject, content, sticky = false, ip}, { safe } = { safe: true }) {
  const post = {
    id: postId,
    boardUrl,
    parent,
    createdAt,
    lastBump,
    name,
    subject,
    content,
    sticky,
  };
  if(!safe) {
    post.uid = uid;
    post.ip = ip;
  }
  return post;
};

const File = function(postUid, filename, thumbFilename,
  mimetype, originalName, size, hash) {
  return {
    postUid,
    filename,
    thumbFilename,
    mimetype,
    originalName: originalName || "image.png",
    size,
    hash
  };
};

exports.getFilePost = async function(board, id) {
  const sql = `SELECT createdAt, name, subject, content, sticky, parent,
                      lastBump, filename, thumbFilename, originalName, mimetype, size
              FROM posts LEFT JOIN files on files.postUid = posts.uid
              WHERE boardUrl = ? AND postId = ?`;
  const rows = await persistence.getAll({ sql, values: [board, id], nestTables: true });
  if(!rows || rows.length < 1) return null;

  // Map file data onto post to discard duplicate 'posts' data
  const post = Post({...rows[0].posts, boardUrl: board, postId: id});
  if(rows[0].files) post.files = rows.map((row) => File(row.files));
  return post;
};