class Statusbox {
  private ele: HTMLDivElement;
  private text: HTMLSpanElement;
  private close: HTMLSpanElement;
  private shown: boolean;
  constructor() {
    this.ele = document.querySelector(".statusbox");
    this.text = this.ele.querySelector(".text");
    this.close = this.ele.querySelector(".close");
    this.close.addEventListener("click", () => {
      this.ele.style.opacity = "0";
      setTimeout(() => {
        this.ele.style.height = "0";
        this.ele.style.visibility = "hidden";
    }, 150);
      this.shown = false;
    });
  }

  public update(text: string, error = false) {
    if(error) {
      this.text.classList.add("error");
    } else {
      this.text.classList.remove("error");
    }
    this.text.textContent = text;
    if(!this.shown) {
      this.ele.style.visibility = "visible";
      this.ele.style.height = "unset";
      this.ele.style.opacity = "1";
      this.shown = true;
    }
  }
}

export default Statusbox;