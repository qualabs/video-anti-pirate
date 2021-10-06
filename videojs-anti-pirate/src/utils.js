export function makeId(length) {
  // Creates a random string
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function base64ToArrayBuffer(base64) {
  let binary_string = window.atob(base64);
  let len = binary_string.length;
  let bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

export const colors = [
  "#000",
  "#FFF",
  "#F00",
  "#0F0",
  "#00F",
  "#FF0",
  "#0FF",
  "#F0F",
  "linear-gradient(45deg, #000 49%, #F00 51%)",
  "linear-gradient(45deg, #F0F 49%, #000 51%)",
  "linear-gradient(45deg, #000 49%, #0F0 51%)",
  "linear-gradient(45deg, #0FF 49%, #000 51%)",
  "linear-gradient(45deg, #FFF 49%, #F00 51%)",
  "linear-gradient(45deg, #F0F 49%, #FFF 51%)",
  "linear-gradient(45deg, #FFF 49%, #0F0 51%)",
  "linear-gradient(45deg, #0FF 49%, #FFF 51%)",
];

export function to_bin(input) {
  var result = "";
  for (var i = 0; i < input.length; i++) {
    var bin = input[i].charCodeAt().toString(2);
    result += Array(8 - bin.length + 1).join("0") + bin;
  }
  return result;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function idWatermarking(player, markId, sessionId) {
  const videoEl = player.el();
  let idMarkId = markId;
  const idInterval = setInterval(() => {
    deleteMark(videoEl, idMarkId);

    idMarkId = makeId(5);
    const p = document.createElement("p");
    p.style.display = "inline-block";
    p.style.fontSize = "1rem";
    p.style.position = "relative";

    p.className = idMarkId;
    p.innerHTML = sessionId;
    videoEl.appendChild(p);

    player.on("hidewatermarking", () => {
      deleteMark(videoEl, idMarkId);
      clearInterval(idInterval);
    });

    const { height, width } = videoEl.getBoundingClientRect();
    const pDim = p.getBoundingClientRect();
    var top = Math.random() * (height - 2 * pDim.height);
    top = top < 0 ? 0 : top;
    var left = Math.random() * (width - pDim.width);
    left = left < 0 ? 0 : left;
    p.style.top = `${top}px`;
    p.style.left = `${left}px`;
  }, 5000);
  return idInterval;
}

function setStyle(elem, options) {
  elem.setAttribute(
    "style",
    `position:absolute; top:${options.x}%; left:${options.y}%; font-size:15px;`
  );

  elem.style.display = "flex";
  elem.style.justifyContent = "center";
  elem.style.alignItems = "center";
  elem.style.width = options.width + "px";
  elem.style.height = options.height + "px";
  elem.style.textShadow =
    "2px 0 0 #fff, -2px 0 0 #fff, 0 2px 0 #fff, 0 -2px 0 #fff, 1px 1px #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff";
  elem.style.color = "black";
}

function setColor(elem, bg) {
  elem.style.background = "";
  elem.style.background = bg;
}

export function colorWatermarking(player, markId, sessionId, options) {
  const videoEl = player.el();
  var last = "";
  var str = to_bin(sessionId);
  var i = 0;
  var rep = false;
  var first = true;
  let colorMarkId = markId;
  const colorInterval = setInterval(() => {
    deleteMark(videoEl, colorMarkId);
    colorMarkId = makeId(5);
    const div = document.createElement("div");
    setStyle(div, options);

    if (first) {
      setColor(div, "linear-gradient(45deg, #000 49%, #FFF 51%)");
      first = false;
    } else {
      var sim = str.slice(i, i + 4);
      var idx = parseInt(sim, 2);
      setColor(div, colors[idx]);
      if (last === idx) {
        rep = !rep;
        if (rep) div.innerHTML = "&#8226;";
      }

      if (i + 4 < str.length) i = i + 4;
      else {
        i = 0;
        first = true;
        rep = false;
      }
    }
    last = idx;
    div.className = colorMarkId;
    videoEl.appendChild(div);

    player.on("hidewatermarking", () => {
      deleteMark(videoEl, colorMarkId);
      clearInterval(colorInterval);
    });
  }, 1500);
  return colorInterval;
}

function deleteMark(videoEl, id) {
  if (videoEl.getElementsByClassName(id).length) {
    videoEl.removeChild(videoEl.getElementsByClassName(id)[0]);
  }
}
