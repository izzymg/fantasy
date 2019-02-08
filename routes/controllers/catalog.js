const db = require("../../database/database");
const postsConfig = require("../../config/posts");
const functions = require("./functions");
const { lengthCheck } = require("../../libs/textFunctions");

exports.post = async (ctx, next) => {
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
        lengthErr =
            lengthCheck(fields.content, postsConfig.maxContentLength, "Content") || lengthErr;
    }

    if (!fields.subject && postsConfig.threads.requireSubject) {
        return ctx.throw(400, "Post subject required");
    } else {
        lengthErr =
            lengthCheck(fields.subject, postsConfig.maxSubjectLength, "Subject") || lengthErr;
    }

    if (lengthErr) {
        return ctx.throw(400, lengthErr);
    }

    if (!files && files.length < 1 && postsConfig.threads.requireFiles) {
        return ctx.throw(400, "File required to post");
    }

    const { postId, processedFiles } = await functions.submitPost(
        {
            boardUrl: ctx.state.board.url,
            parent: 0,
            name: fields.name,
            subject: fields.subject,
            content: fields.content,
            lastBump: new Date(Date.now()),
        },
        files
    );
    await functions.deleteOldestThread(ctx.state.board.url, ctx.state.board.maxThreads);
    ctx.body = `Created thread ${postId}${
        processedFiles
            ? ` and uploaded ${processedFiles} ${processedFiles > 1 ? "files." : "file."}`
            : "."
    }`;
    return next();
};

exports.render = async ctx => {
    try {
        const threadsData = await db.fetchAll(
            `SELECT postId AS id, createdAt AS date, name, subject, content, sticky,
                fileId, extension, thumbSuffix
            FROM posts
            LEFT JOIN files ON posts.uid = files.postUid
            WHERE boardUrl = ? AND parent = 0
            ORDER BY lastBump DESC`,
            ctx.state.board.url,
            true
        );

        if (!threadsData) {
            return await ctx.render("catalog");
        }

        // Remove duplicate post data from join and process into ordered array
        const threads = [];
        threadsData.forEach(threadData => {
            let found = false;
            threads.forEach(thread => {
                if (thread.id === threadData.posts.id) {
                    thread.files.push(threadData.files);
                    found = true;
                }
            });
            if (!found) {
                threadData.posts.files = [];
                if (threadData.files.fileId) {
                    threadData.posts.files.push(threadData.files);
                }
                threads.push(threadData.posts);
            }
        });
        return await ctx.render("catalog", { threads });
    } catch (error) {
        return ctx.throw(500, error);
    }
};
