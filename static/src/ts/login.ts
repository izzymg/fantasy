import Statusbox from "./statusbox";

function initaliseLoginForm(onSuccess: Function, onError: Function) {
  const form = document.querySelector("form") as HTMLFormElement;
  const username = form.querySelector(".username") as HTMLInputElement;  
  const password = form.querySelector(".password") as HTMLInputElement;

  async function login(username: string, password: string) {

    const res = await fetch(form.action, {
      method: form.method,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });
    return res;
  }

  form.addEventListener("submit", async (event) => {
    // Stop actual form submission
    event.preventDefault();
    event.stopPropagation();
    try {
      if(!username.value || !password.value) {
        return onError("Enter username and password");
      }
      const res = await login(username.value, password.value);
        const text = await res.text();
      if (!res.ok) {
        return onError(text || `Sorry - unknown error, status ${res.status}`);
      }
      onSuccess(text);
      setTimeout(() => window.location.href = "../", 800);
    } catch(error) {
      return onError("Network error - server may be down");
    }
  });
}

function init() {
  try {
    fetch("");
  } catch (error) {
    return;
  }

  const sb = new Statusbox();
  initaliseLoginForm(
    (text: string) => {
      sb.update(text, false);
    },
    (text: string) => {
      sb.update(text, true);
  });
}

if (document.readyState !== "loading") {
  init();
} else {
  document.addEventListener("DOMContentLoaded", init);
}

export default init;