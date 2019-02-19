class PostForm {

}

function init() {
  console.log("Post form");
}

if(document.readyState !== "loading") {
  init();
} else {
  document.addEventListener("DOMContentLoaded", init);
}

export default PostForm;