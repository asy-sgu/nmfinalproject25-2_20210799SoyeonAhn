document.addEventListener("DOMContentLoaded", () => {
  // ===== 화면 요소들 =====
  const doorScreen = document.getElementById("door-screen");
  const roomScreen = document.getElementById("room-screen");

  const doorHitbox = document.getElementById("door-hitbox");
  const doorImage  = document.getElementById("door-image");

  const DOOR_DEFAULT = "door01.svg";
  const DOOR_CLICKED = "door02.svg";

  // 방 안 히트박스
  const hitDesk     = document.getElementById("hit-desk");
  const hitBed      = document.getElementById("hit-bed");
  const hitWindow   = document.getElementById("hit-window");
  const hitMirror   = document.getElementById("hit-mirror");
  const hitBooks    = document.getElementById("hit-books");
  const hitRoomdoor = document.getElementById("hit-roomdoor");

  // 침대용 조명 레이어
  const roomDim = document.getElementById("room-dim-layer");
  let lightsOff = false;

  // 모달 관련
  const overlay    = document.getElementById("overlay");
  const modal      = document.querySelector(".modal");
  const modalBody  = document.getElementById("modal-body");
  const modalClose = document.getElementById("modal-close");

  // 페이드 레이어
  const fadeLayer = document.getElementById("fade-layer");
  const FADE_TIME = 500;

  // 가짜 커서
  const cursor         = document.getElementById("cursor");
  const CURSOR_DEFAULT = "cursor01.svg";
  const CURSOR_ACTIVE  = "cursor02.svg";

  // 카메라 스트림
  let currentStream = null;

  // Window 슬라이드용 이미지 목록
  const WINDOW_IMAGES = [
  "wd01.png",
  "wd02.png",
  "wd03.png",
  "wd04.png",
];

  // Keyboard 아카이브용 localStorage 키
  const KB_STORAGE_KEY = "room_project_keyboard_notes";

  // ===== 카메라 제어 =====
  function startCamera() {
    const videoEl = modalBody.querySelector("#mirror-video");
    const errorEl = modalBody.querySelector("#mirror-video-error");
    if (!videoEl) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (errorEl) {
        errorEl.textContent = "이 브라우저에서는 카메라를 사용할 수 없습니다.";
      }
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        currentStream = stream;
        videoEl.srcObject = stream;
        if (errorEl) errorEl.textContent = "";
      })
      .catch((err) => {
        console.error(err);
        if (errorEl) {
          errorEl.textContent = "카메라 접근이 거부되었거나 사용할 수 없습니다.";
        }
      });
  }

  function stopCamera() {
    if (currentStream) {
      currentStream.getTracks().forEach((t) => t.stop());
      currentStream = null;
    }
  }

  // ===== 화면 전환 =====
  function showScreen(name) {
    doorScreen.style.display = "none";
    roomScreen.style.display = "none";

    if (name === "door") {
      doorScreen.style.display = "flex";
    } else if (name === "room") {
      roomScreen.style.display = "block";
    }
  }

  function fadeToScreen(name) {
    fadeLayer.style.opacity = "1";
    fadeLayer.style.pointerEvents = "auto";

    setTimeout(() => {
      showScreen(name);

      fadeLayer.style.opacity = "0";
      setTimeout(() => {
        fadeLayer.style.pointerEvents = "none";
      }, FADE_TIME);
    }, FADE_TIME);
  }

  // 초기 상태
  showScreen("door");
  doorImage.src = DOOR_DEFAULT;
  fadeLayer.style.opacity = "0";
  fadeLayer.style.pointerEvents = "none";

  // 문 → 방
  doorHitbox.addEventListener("click", () => {
    doorImage.src = DOOR_CLICKED;

    setTimeout(() => {
      fadeToScreen("room");
      doorImage.src = DOOR_DEFAULT;
    }, 600);
  });

  // ===== 모달 열고 닫기 =====
  function openModal(templateId) {
    stopCamera();

    const tpl = document.getElementById(templateId);
    if (!tpl) return;

    // 모달 타입에 따른 클래스
    if (modal) {
      modal.classList.toggle("modal-desk", templateId === "tpl-desk");
    }

    modalBody.innerHTML = tpl.innerHTML;
    overlay.style.display = "flex";

    // Desk → 키보드
    if (templateId === "tpl-desk") {
      const kbHit = modalBody.querySelector(".desk-keyboard-hitbox");
      if (kbHit) {
        kbHit.addEventListener("click", () => {
          openModal("tpl-keyboard");
        });
      }
    }

    // Keyboard 화면 세팅
    if (templateId === "tpl-keyboard") {
      setupKeyboardScreen();
    }

    // Window 슬라이드 세팅
    if (templateId === "tpl-window") {
      setupWindowSlide();
    }

    // Mirror → 카메라 시작
    if (templateId === "tpl-mirror") {
      startCamera();
    }
  }

  function closeModal() {
    overlay.style.display = "none";
    modalBody.innerHTML = "";
    if (modal) modal.classList.remove("modal-desk");
    stopCamera();
  }

  modalClose.addEventListener("click", closeModal);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // ===== 방 내부 히트박스 동작 =====

  // 방 밖 문 → 처음 문 화면
  hitRoomdoor.addEventListener("click", () => {
    closeModal();
    fadeToScreen("door");
  });

  // desk0 → Desk 모달
  hitDesk.addEventListener("click", () => {
    openModal("tpl-desk");
  });

  // bed → 조명 토글
  hitBed.addEventListener("click", () => {
    lightsOff = !lightsOff;
    if (lightsOff) {
      roomDim.classList.add("on");
    } else {
      roomDim.classList.remove("on");
    }
  });

  // window → Window 슬라이드 모달
  hitWindow.addEventListener("click", () => {
    openModal("tpl-window");
  });

  // bookshelf / books → Bookshelf 모달
  hitBooks.addEventListener("click", () => {
    openModal("tpl-bookshelf");
  });

  // mirror → 카메라 모달
  hitMirror.addEventListener("click", () => {
    openModal("tpl-mirror");
  });

  // ===== Keyboard Screen : localStorage + 수정/삭제 =====
  function setupKeyboardScreen() {
    const form      = modalBody.querySelector(".kb-form");
    const textarea  = modalBody.querySelector(".kb-input");
    const list      = modalBody.querySelector(".kb-list");
    const btnClear  = modalBody.querySelector(".kb-clear");
    const btnDelete = modalBody.querySelector(".kb-delete-all");
    const btnSave   = modalBody.querySelector(".kb-save");

    if (!form || !textarea || !list) return;

    let editingIndex = null;

    function loadNotes() {
      try {
        const raw = localStorage.getItem(KB_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    function saveNotes(notes) {
      localStorage.setItem(KB_STORAGE_KEY, JSON.stringify(notes));
    }

    function renderNotes() {
      const notes = loadNotes();
      list.innerHTML = "";

      if (!notes.length) {
        const li = document.createElement("li");
        li.className = "kb-empty";
        li.textContent = "아직 저장된 글이 없습니다.";
        list.appendChild(li);
        return;
      }

      for (let i = notes.length - 1; i >= 0; i--) {
        const note = notes[i];

        const li = document.createElement("li");
        li.className = "kb-note";
        li.dataset.index = String(i);
        if (editingIndex === i) li.classList.add("kb-note-editing");

        const metaRow = document.createElement("div");
        metaRow.className = "kb-note-meta-row";

        const meta = document.createElement("span");
        meta.className = "kb-note-meta";
        meta.textContent = note.time || "";

        const actions = document.createElement("div");
        actions.className = "kb-note-actions";

        const btnEdit = document.createElement("button");
        btnEdit.type = "button";
        btnEdit.textContent = "수정";

        const btnDel = document.createElement("button");
        btnDel.type = "button";
        btnDel.textContent = "삭제";

        actions.appendChild(btnEdit);
        actions.appendChild(btnDel);

        metaRow.appendChild(meta);
        metaRow.appendChild(actions);

        const body = document.createElement("div");
        body.className = "kb-note-body";
        body.textContent = note.text || "";

        li.appendChild(metaRow);
        li.appendChild(body);
        list.appendChild(li);

        // 수정 버튼
        btnEdit.addEventListener("click", () => {
          editingIndex = i;
          textarea.value = note.text || "";
          textarea.focus();
          if (btnSave) btnSave.textContent = "수정 저장";
          renderNotes();
        });

        // 삭제 버튼
        btnDel.addEventListener("click", () => {
          const notesNow = loadNotes();
          if (i >= 0 && i < notesNow.length) {
            notesNow.splice(i, 1);
            saveNotes(notesNow);
          }

          if (editingIndex === i) {
            editingIndex = null;
            textarea.value = "";
            if (btnSave) btnSave.textContent = "저장";
          }
          renderNotes();
        });
      }
    }

    // 초기 렌더
    renderNotes();

    // 저장 / 수정 저장
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = textarea.value.trim();
      if (!text) return;

      const notes = loadNotes();
      const now   = new Date();
      const timeStr = now.toLocaleString("ko-KR");

      if (
        editingIndex !== null &&
        editingIndex >= 0 &&
        editingIndex < notes.length
      ) {
        // 수정 저장
        notes[editingIndex] = {
          ...notes[editingIndex],
          text,
          time: timeStr,
        };
      } else {
        // 새 글 추가
        notes.push({ text, time: timeStr });
      }

      saveNotes(notes);
      textarea.value = "";
      editingIndex = null;
      if (btnSave) btnSave.textContent = "저장";
      renderNotes();
    });

    // 입력창 지우기
    if (btnClear) {
      btnClear.addEventListener("click", () => {
        textarea.value = "";
        textarea.focus();
        editingIndex = null;
        if (btnSave) btnSave.textContent = "저장";
        renderNotes();
      });
    }

    // 전체 삭제
    if (btnDelete) {
      btnDelete.addEventListener("click", () => {
        if (!confirm("아카이브에 저장된 모든 글을 삭제할까요?")) return;
        saveNotes([]);
        textarea.value = "";
        editingIndex = null;
        if (btnSave) btnSave.textContent = "저장";
        renderNotes();
      });
    }
  }

  // ===== Window 슬라이드 : 고정 틀 + 4장 이미지 =====
  function setupWindowSlide() {
    const imgEl   = modalBody.querySelector("#win-photo");
    const btnPrev = modalBody.querySelector("#win-prev");
    const btnNext = modalBody.querySelector("#win-next");
    if (!imgEl || !btnPrev || !btnNext) return;

    let idx = 0;

    function updateImage() {
      imgEl.src = WINDOW_IMAGES[idx];
    }

    btnPrev.addEventListener("click", () => {
      idx = (idx - 1 + WINDOW_IMAGES.length) % WINDOW_IMAGES.length;
      updateImage();
    });

    btnNext.addEventListener("click", () => {
      idx = (idx + 1) % WINDOW_IMAGES.length;
      updateImage();
    });

    // 처음 열 때 1번 이미지로 초기화
    idx = 0;
    updateImage();
  }

  // ===== 커서 제어 =====
  document.addEventListener("mousemove", (e) => {
    cursor.style.left = `${e.clientX}px`;
    cursor.style.top  = `${e.clientY}px`;

    const target = e.target;
    const isActive = !!target.closest(".clickable");

    cursor.style.backgroundImage = isActive
      ? `url("${CURSOR_ACTIVE}")`
      : `url("${CURSOR_DEFAULT}")`;
  });
});
