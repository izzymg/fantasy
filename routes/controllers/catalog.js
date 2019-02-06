const db = require("../../database/database");
const postsConfig = require("../../config/posts");
const functions = require("./functions");
const { lengthCheck } = require("../../libs/textFunctions");

exports.post = async ctx => {

    let formData;

    try {
        formData = await functions.getMultipart(ctx);
    } catch (error) {
        if (error.status && error.text && error.status === 400) {
            return ctx.throw(400, error.text);
        } else {
            return ctx.throw(500, error);
        }
    }

    const fields = formData.fields;
    const files = formData.files;

    let lengthErr;
    if (!fields.name) {
        fields.name = postsConfig.defaultName;
    } else {
        lengthErr = lengthCheck(fields.name, postsConfig.maxNameLength, "Name") || lengthErr;
    }

    if (!fields.content && postsConfig.threads.requireContent) {
        return ctx.throw(400, "Post content required");
    } else {
        lengthErr = lengthCheck(fields.content, postsConfig.maxContentLength, "Content") || lengthErr;
    }

    if (!fields.subject && postsConfig.threads.requireSubject) {
        return ctx.throw(400, "Post subject required");
    } else {
        lengthErr = lengthCheck(fields.subject, postsConfig.maxSubjectLength, "Subject") || lengthErr;
    }

    if (lengthErr) {
        return ctx.throw(400, lengthErr);
    }

    if ((!files && files.length < 1) && postsConfig.threads.requireFiles) {
        return ctx.throw(400, "File required to post");
    }

    const { postId, processedFiles } = await functions.submitPost(
        {
            boardUrl: ctx.state.board.url,
            parent: 0,
            name: fields.name,
            subject: fields.subject,
            content: fields.content,
            lastBump: new Date(Date.now())
        }, files
    );
    await functions.deleteOldestThread(ctx.state.board.url, ctx.state.board.maxThreads);
    return ctx.body = `Created thread ${postId}${processedFiles ? ` and uploaded ${processedFiles} ${processedFiles > 1 ? "files." : "file."}` : "."}`;
};

exports.render = async ctx => {
    try {
        const threadsData = await db.fetchAll(
            `SELECT boardId AS id, createdAt AS date, name, subject, content, sticky,
                fileId, extension, thumbSuffix
            FROM posts
            LEFT JOIN files ON posts.uid = files.postUid
            WHERE boardUrl = ? AND parent = 0
            ORDER BY lastBump ASC`,
            ctx.state.board.url, true);
        const threads = {};
        // Remove duplicates from query and join files to posts
        if (threadsData) {
            for (const thread of threadsData) {
                if (threads[thread.posts.id] && thread.files.fileId) {
                    threads[thread.posts.id].files.push(thread.files);
                } else {
                    // Copy thread posts table into new key/val pair
                    threads[thread.posts.id] = thread.posts;
                    // Add thread files array
                    if (thread.files.fileId) {
                        threads[thread.posts.id].files = [thread.files];
                    }
                }
            }
        }
        return await ctx.render("catalog", { threads });
    } catch (error) {
        return ctx.throw(500, error);
    }
};