import Statusbox from "./statusbox";

function initialisePostForm(onSuccess: Function, onError: Function) {
  const wrapper = document.querySelector(".postFormBox") as HTMLDivElement;
  const form = wrapper.querySelector("form") as HTMLFormElement;

  async function submitPost() {
    const data = new FormData(form);
    const res = await fetch(form.action, {
      method: form.method,
      body: data
    });
    return res;
  }

  form.addEventListener("submit", async (event) => {
    // Stop actual form submission
    event.preventDefault();
    event.stopPropagation();
    const res = await submitPost();
    const text = await res.text();
    if (!res.ok) {
      return onError(text || `Sorry - unknown error, status ${res.status}`);
    }
    return onSuccess(text);
  });
}

function init() {
  try {
    fetch("");
  } catch (error) {
    return;
  }
  const sb = new Statusbox();
  initialisePostForm(
    (text: string) => {
      sb.update(text, false);
    },
    (text: string) => {
      sb.update(text, true);
    }
  );
}

if (document.readyState !== "loading") {
  init();
} else {
  document.addEventListener("DOMContentLoaded", init);
}

export default initialisePostForm;