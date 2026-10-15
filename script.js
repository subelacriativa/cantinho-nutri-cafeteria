(() => {
  "use strict";

  const state = { stream: null, photo: null, frame: "classic", startingCamera: false };
  const $ = (selector) => document.querySelector(selector);
  const screens = ["welcome", "capture", "frames", "result", "thanks"];
  const caption = "Eu fui ao Cantinho da Nutri! ❤️ @cantinhodanutricafeteria #VocêNoCantinho";  

  const frames = [
    { id: "classic", name: "Eu fui ao Cantinho", accent: "#5b321f", line: "Eu fui ao Cantinho!" },
    { id: "botanical", name: "Nova história", accent: "#697047", line: "Faço parte dessa nova história." },
    { id: "minimal", name: "Reinauguração 2026", accent: "#8b5d3f", line: "Reinauguração 2026" },
    { id: "coffee", name: "Café + carinho", accent: "#7b4b30", line: "Um momento para guardar ❤️" }
  ];

  function show(id) {
    screens.forEach((screen) => $("#" + screen).classList.toggle("active", screen === id));
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (id !== "capture") stopCamera();
    if (id === "capture" && !state.photo && !state.stream) {
      // Não solicita câmera sem uma ação explícita: isso evita falhas silenciosas
      // e permite que o usuário escolha a galeria se negar a permissão.
      $("#cameraPlaceholder").style.display = "flex";
      $("#video").style.display = "none";
    }
  }

  let toastTimer;
  function toast(message) {
    const node = $("#toast");
    node.textContent = message;
    node.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove("show"), 3200);
  }

  function stopCamera() {
    if (state.stream) {
      state.stream.getTracks().forEach((track) => track.stop());
      state.stream = null;
    }
    const video = $("#video");
    if (video) {
      video.pause();
      video.srcObject = null;
      video.style.display = "none";
    }
    const placeholder = $("#cameraPlaceholder");
    if (placeholder && !state.photo) placeholder.style.display = "flex";
    state.startingCamera = false;
  }

  async function startCamera() {
    if (state.startingCamera) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast("Este navegador não permite abrir a câmera aqui. Escolha uma foto da galeria ou acesse o site por HTTPS.");
      $("#fileInput").click();
      return;
    }
    stopCamera();
    state.startingCamera = true;
    $("#cameraBtn").disabled = true;
    $("#cameraBtn").textContent = "Abrindo câmera…";
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
  facingMode: { ideal: "user" }
}
      });
      state.stream = stream;
      const video = $("#video");
      video.srcObject = stream;
      video.style.display = "block";
      $("#cameraPlaceholder").style.display = "none";
      await video.play();
      $("#cameraBtn").textContent = "Tirar foto";
      $("#cameraBtn").onclick = captureFromVideo;
    } catch (error) {
      stopCamera();
      let message = "Não foi possível abrir a câmera. Verifique a permissão ou escolha uma foto da galeria.";
      if (error && (error.name === "NotAllowedError" || error.name === "PermissionDeniedError")) {
        message = "A permissão da câmera foi negada. Autorize o acesso nas configurações do navegador ou escolha uma foto da galeria.";
      } else if (error && error.name === "NotFoundError") {
        message = "Nenhuma câmera foi encontrada. Escolha uma foto da galeria.";
      } else if (error && error.name === "NotReadableError") {
        message = "A câmera pode estar sendo usada por outro aplicativo. Feche-o e tente novamente.";
      }
      toast(message);
      $("#cameraBtn").textContent = "Tentar abrir câmera novamente";
      $("#cameraBtn").onclick = startCamera;
    } finally {
      state.startingCamera = false;
      $("#cameraBtn").disabled = false;
    }
  }

  function captureFromVideo() {
    const video = $("#video");
    if (!state.stream || !video.videoWidth || !video.videoHeight) {
      toast("A câmera ainda está carregando. Tente novamente em alguns segundos.");
      return;
    }
    const canvas = $("#captureCanvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    // Espelha a foto para corresponder à prévia de selfie.
    context.save();
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    context.restore();
    state.photo = canvas.toDataURL("image/jpeg", 0.94);
    stopCamera();
    prepareFrames();
    show("frames");
  }

  function loadFile(file) {
    if (!file) return;
    if (!file.type || !file.type.startsWith("image/")) {
      toast("Escolha um arquivo de imagem, como JPG, PNG ou WebP.");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => toast("Não foi possível ler esta imagem. Tente selecionar outra.");
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        state.photo = reader.result;
        stopCamera();
        prepareFrames();
        show("frames");
      };
      image.onerror = () => toast("Esta imagem não pôde ser aberta. Tente outra foto.");
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
    $("#fileInput").value = "";
  }

  function drawFrame(canvas, image, frameId) {
    const W = 1200;
    const H = 1440;
    const footerH = 270;
    const margin = 28;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d", { alpha: false });
    const selected = frames.find((frame) => frame.id === frameId) || frames[0];

    ctx.fillStyle = "#f6eddc";
    ctx.fillRect(0, 0, W, H);

    // Foto em formato de capa, sem deformar a imagem original.
    const photoH = H - footerH - margin * 2;
    const scale = Math.max((W - margin * 2) / image.width, photoH / image.height);
    const drawW = image.width * scale;
    const drawH = image.height * scale;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(margin, margin, W - margin * 2, photoH, 30);
    ctx.clip();
    ctx.drawImage(image, margin + ((W - margin * 2) - drawW) / 2, margin + (photoH - drawH) / 2, drawW, drawH);
    ctx.restore();

    ctx.fillStyle = selected.accent;
    ctx.fillRect(0, H - footerH, W, footerH);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fffaf0";
    ctx.font = "700 55px 'Playfair Display', Georgia, serif";
    const title = frameId === "coffee" ? "CAFÉ + CARINHO" : "CANTINHO DA NUTRI";
    ctx.fillText(title, W / 2, H - 204, W - 70);

    ctx.font = "600 43px Caveat, cursive";
    ctx.fillText(selected.line, W / 2, H - 143, W - 70);

    // Hashtag e @ em tamanho maior, com ajuste automático para telas estreitas.
    const socialText = "@cantinhodanutricafeteria  •  #VocêNoCantinho";
    let socialSize = 40;
    do {
      ctx.font = `700 ${socialSize}px 'DM Sans', Arial, sans-serif`;
      if (ctx.measureText(socialText).width <= W - 70) break;
      socialSize -= 1;
    } while (socialSize > 20);
    ctx.fillStyle = "#f4dfbf";
    ctx.fillText(socialText, W / 2, H - 65, W - 60);

    ctx.strokeStyle = "#d7b889";
    ctx.lineWidth = 7;
    ctx.strokeRect(14, 14, W - 28, H - 28);
  }

  function prepareFrames() {
    if (!state.photo) {
      toast("Tire uma foto ou escolha uma imagem primeiro.");
      show("capture");
      return;
    }
    const grid = $("#frameGrid");
    grid.replaceChildren();
    const image = new Image();
    image.onload = () => {
      frames.forEach((frame, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "frame-option" + (frame.id === state.frame ? " selected" : "");
        button.dataset.frame = frame.id;
        button.setAttribute("aria-pressed", String(frame.id === state.frame));
        const canvas = document.createElement("canvas");
        canvas.setAttribute("aria-hidden", "true");
        drawFrame(canvas, image, frame.id);
        button.appendChild(canvas);
        const label = document.createElement("span");
        label.className = "frame-label";
        label.textContent = frame.name;
        button.appendChild(label);
        button.addEventListener("click", () => {
          state.frame = frame.id;
          grid.querySelectorAll(".frame-option").forEach((option) => {
            const selected = option.dataset.frame === frame.id;
            option.classList.toggle("selected", selected);
            option.setAttribute("aria-pressed", String(selected));
          });
        });
        grid.appendChild(button);
      });
    };
    image.onerror = () => toast("Não foi possível preparar a foto. Tente selecionar outra imagem.");
    image.src = state.photo;
  }

  function makeResult() {
    if (!state.photo) {
      toast("Primeiro tire uma foto ou escolha uma imagem.");
      show("capture");
      return;
    }
    const image = new Image();
    image.onload = () => {
      drawFrame($("#resultCanvas"), image, state.frame);
      show("result");
    };
    image.onerror = () => toast("Não foi possível criar a lembrança. Tente outra foto.");
    image.src = state.photo;
  }

  function downloadImage() {
    const canvas = $("#resultCanvas");
    try {
      canvas.toBlob((blob) => {
        if (!blob) {
          toast("Não foi possível exportar a imagem. Tente novamente.");
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = "cantinho-da-nutri-reinauguracao.png";
        link.href = url;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        toast("Imagem pronta! Confira a pasta de downloads ou a galeria. ❤️");
      }, "image/png");
    } catch (error) {
      toast("Seu navegador não conseguiu salvar a imagem. Use a opção Compartilhar imagem.");
    }
  }

  async function shareImage() {
    const canvas = $("#resultCanvas");
    try {
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Falha ao gerar imagem")), "image/png");
      });
      const file = new File([blob], "cantinho-da-nutri-reinauguracao.png", { type: "image/png" });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Cantinho da Nutri e Cafeteria", text: caption });
        return;
      }
      // Desktop/navegadores sem compartilhamento de arquivos: baixar a imagem e abrir o Instagram.
      downloadImage();
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
      toast("A imagem foi preparada para baixar. Depois, anexe-a à publicação no Instagram.");
    } catch (error) {
      if (error && error.name === "AbortError") return;
      toast("Não foi possível compartilhar diretamente. Baixe a imagem e publique pelo Instagram.");
    }
  }

  async function copyCaption() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(caption);
        toast("Legenda copiada! ❤️");
      } else {
        const area = document.createElement("textarea");
        area.value = caption;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        const copied = document.execCommand("copy");
        area.remove();
        toast(copied ? "Legenda copiada! ❤️" : caption);
      }
    } catch (error) {
      toast("Copie esta legenda: " + caption);
    }
  }

  $("#startBtn").addEventListener("click", () => show("capture"));
  $("#cameraBtn").addEventListener("click", () => {
  const video = $("#video");

  if (
    state.stream &&
    video.srcObject &&
    video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
  ) {
    captureFromVideo();
  } else {
    startCamera();
  }
});
  $("#galleryBtn").addEventListener("click", () => $("#fileInput").click());
  $("#fileInput").addEventListener("change", (event) => loadFile(event.target.files[0]));
  $("#applyFrameBtn").addEventListener("click", makeResult);
  $("#downloadBtn").addEventListener("click", downloadImage);
  $("#shareBtn").addEventListener("click", shareImage);
  $("#copyCaptionBtn").addEventListener("click", copyCaption);
  $("#newPhotoBtn").addEventListener("click", () => {
    state.photo = null;
    state.frame = "classic";
    $("#cameraBtn").textContent = "Ativar câmera";
    $("#cameraBtn").onclick = null;
    show("capture");
  });
  $("#restartBtn").addEventListener("click", () => {
    state.photo = null;
    state.frame = "classic";
    show("welcome");
  });
  document.querySelectorAll("[data-back]").forEach((button) => {
    button.addEventListener("click", () => show(button.dataset.back));
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopCamera();
  });
  window.addEventListener("pagehide", stopCamera);
})();
