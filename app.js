const storageKey = "momentum-planner-state";
const today = new Date();
const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
const monthFormatter = new Intl.DateTimeFormat("tr-TR", {
  month: "long",
  year: "numeric",
});

const toISODate = (date) => {
  const copy = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return copy.toISOString().slice(0, 10);
};

const addDays = (date, days) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

const defaultState = {
  view: "daily",
  calendarMonth: new Date(today.getFullYear(), today.getMonth(), 1).toISOString(),
  tasks: [
    {
      id: crypto.randomUUID(),
      title: "Haftanın üç ana hedefini yaz",
      priority: "high",
      date: toISODate(today),
      time: "09:00",
      done: false,
    },
    {
      id: crypto.randomUUID(),
      title: "30 dakikalık odak bloğu ayır",
      priority: "medium",
      date: toISODate(today),
      time: "14:00",
      done: false,
    },
    {
      id: crypto.randomUUID(),
      title: "Ay sonu için kişisel kontrol listesi hazırla",
      priority: "low",
      date: toISODate(addDays(today, 8)),
      time: "",
      done: false,
    },
  ],
  reminders: [
    {
      id: crypto.randomUUID(),
      title: "Kısa yürüyüş molası",
      date: toISODate(today),
      time: "16:30",
    },
  ],
};

const loadState = () => {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return defaultState;

  try {
    return { ...defaultState, ...JSON.parse(saved) };
  } catch {
    return defaultState;
  }
};

let state = loadState();

const elements = {
  todayLabel: document.querySelector("#todayLabel"),
  sidebarFocus: document.querySelector("#sidebarFocus"),
  doneCount: document.querySelector("#doneCount"),
  activeCount: document.querySelector("#activeCount"),
  reminderCount: document.querySelector("#reminderCount"),
  viewTitle: document.querySelector("#viewTitle"),
  taskBoard: document.querySelector("#taskBoard"),
  taskForm: document.querySelector("#taskForm"),
  taskTitle: document.querySelector("#taskTitle"),
  taskPriority: document.querySelector("#taskPriority"),
  taskDate: document.querySelector("#taskDate"),
  taskTime: document.querySelector("#taskTime"),
  monthLabel: document.querySelector("#monthLabel"),
  calendarGrid: document.querySelector("#calendarGrid"),
  schedulePanel: document.querySelector("#schedulePanel"),
  scheduleGrid: document.querySelector("#scheduleGrid"),
  scheduleRange: document.querySelector("#scheduleRange"),
  prevMonth: document.querySelector("#prevMonth"),
  nextMonth: document.querySelector("#nextMonth"),
  reminderForm: document.querySelector("#reminderForm"),
  reminderTitle: document.querySelector("#reminderTitle"),
  reminderDate: document.querySelector("#reminderDate"),
  reminderTime: document.querySelector("#reminderTime"),
  reminderList: document.querySelector("#reminderList"),
};

const saveState = () => {
  localStorage.setItem(storageKey, JSON.stringify(state));
};

const viewConfig = {
  daily: {
    title: "Günlük plan",
    empty: "Bugün için görev yok. Küçük bir başlangıç ekleyelim.",
  },
  weekly: {
    title: "Haftalık plan",
    empty: "Bu hafta için henüz görev yok.",
  },
  monthly: {
    title: "Aylık plan",
    empty: "Bu ay için henüz görev yok.",
  },
  schedule: {
    title: "Zaman planı",
    empty: "Bu hafta için saatli görev veya anımsatıcı yok.",
  },
};

const priorityLabels = {
  high: "Yüksek öncelik",
  medium: "Orta öncelik",
  low: "Düşük öncelik",
};

const getWeekStart = (date) => {
  const copy = new Date(date);
  const day = copy.getDay() || 7;
  copy.setDate(copy.getDate() - day + 1);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const isTaskInView = (task) => {
  const taskDate = new Date(`${task.date}T12:00:00`);
  if (state.view === "daily") return task.date === toISODate(today);

  if (state.view === "weekly") {
    const weekStart = getWeekStart(today);
    const weekEnd = addDays(weekStart, 6);
    return taskDate >= weekStart && taskDate <= weekEnd;
  }

  if (state.view === "schedule") {
    const weekStart = getWeekStart(today);
    const weekEnd = addDays(weekStart, 6);
    return taskDate >= weekStart && taskDate <= weekEnd;
  }

  return taskDate.getMonth() === today.getMonth() && taskDate.getFullYear() === today.getFullYear();
};

const renderNavigation = () => {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === state.view);
  });
  elements.viewTitle.textContent = viewConfig[state.view].title;
  elements.taskBoard.hidden = state.view === "schedule";
  elements.schedulePanel.hidden = state.view !== "schedule";
};

const renderMetrics = () => {
  elements.doneCount.textContent = state.tasks.filter((task) => task.done).length;
  elements.activeCount.textContent = state.tasks.filter((task) => !task.done).length;
  elements.reminderCount.textContent = state.reminders.length;
  elements.todayLabel.textContent = dateFormatter.format(today);
  elements.sidebarFocus.textContent =
    state.tasks.find((task) => task.date === toISODate(today) && !task.done)?.title ||
    "Bugüne nazik bir başlangıç seç";
};

const renderTasks = () => {
  const tasks = state.tasks.filter(isTaskInView).sort((first, second) => {
    if (first.done !== second.done) return first.done ? 1 : -1;
    return first.date.localeCompare(second.date);
  });

  if (!tasks.length) {
    elements.taskBoard.innerHTML = `<div class="empty-state">${viewConfig[state.view].empty}</div>`;
    return;
  }

  elements.taskBoard.innerHTML = tasks
    .map(
      (task) => `
        <article class="task-card ${task.done ? "done" : ""}" data-priority="${task.priority}">
          <button class="check-button" data-action="toggle-task" data-id="${task.id}" type="button" aria-label="Görevi tamamla">
            ${task.done ? "✓" : ""}
          </button>
          <div>
            <span class="task-title">${escapeHtml(task.title)}</span>
            <span class="task-meta">
              <span>${priorityLabels[task.priority]}</span>
              <span>${dateFormatter.format(new Date(`${task.date}T12:00:00`))}</span>
              <span>${task.time || "Saat yok"}</span>
            </span>
          </div>
          <button class="delete-button" data-action="delete-task" data-id="${task.id}" type="button">Sil</button>
        </article>
      `
    )
    .join("");
};

const renderSchedule = () => {
  const weekStart = getWeekStart(today);
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const hours = Array.from({ length: 16 }, (_, index) => `${String(index + 7).padStart(2, "0")}:00`);
  const weekdayFormatter = new Intl.DateTimeFormat("tr-TR", { weekday: "short" });

  elements.scheduleRange.textContent = `${dateFormatter.format(weekStart)} - ${dateFormatter.format(addDays(weekStart, 6))}`;

  const header = [
    `<div class="schedule-corner">Saat</div>`,
    ...days.map(
      (day) => `
        <div class="schedule-day-heading">
          <strong>${weekdayFormatter.format(day)}</strong>
          <span>${day.getDate()}</span>
        </div>
      `
    ),
  ].join("");

  const rows = hours
    .map((hour) => {
      const cells = days
        .map((day) => {
          const iso = toISODate(day);
          const taskItems = state.tasks
            .filter((task) => task.date === iso && (task.time || "").slice(0, 2) === hour.slice(0, 2))
            .map(
              (task) => `
                <button class="schedule-item task ${task.done ? "done" : ""}" data-action="toggle-task" data-id="${task.id}" type="button">
                  <span>${escapeHtml(task.title)}</span>
                  <small>${task.time || hour}</small>
                </button>
              `
            );
          const reminderItems = state.reminders
            .filter((reminder) => reminder.date === iso && (reminder.time || "").slice(0, 2) === hour.slice(0, 2))
            .map(
              (reminder) => `
                <div class="schedule-item reminder">
                  <span>${escapeHtml(reminder.title)}</span>
                  <small>${reminder.time}</small>
                </div>
              `
            );
          const isToday = iso === toISODate(today);
          return `
            <div class="schedule-cell ${isToday ? "is-today" : ""}" data-date="${iso}" data-hour="${hour}">
              ${[...taskItems, ...reminderItems].join("")}
            </div>
          `;
        })
        .join("");

      return `<div class="schedule-hour">${hour}</div>${cells}`;
    })
    .join("");

  elements.scheduleGrid.innerHTML = header + rows;
};

const renderCalendar = () => {
  const monthDate = new Date(state.calendarMonth);
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() || 7) - 1;
  const gridStart = addDays(firstDay, -startOffset);
  const itemDates = new Set([...state.tasks, ...state.reminders].map((item) => item.date));

  elements.monthLabel.textContent = monthFormatter.format(monthDate);
  elements.calendarGrid.innerHTML = Array.from({ length: 42 }, (_, index) => {
    const day = addDays(gridStart, index);
    const iso = toISODate(day);
    const classes = [
      "calendar-day",
      day.getMonth() !== month ? "is-muted" : "",
      iso === toISODate(today) ? "is-today" : "",
      itemDates.has(iso) ? "has-items" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return `<button class="${classes}" data-date="${iso}" type="button">${day.getDate()}</button>`;
  }).join("");
};

const renderReminders = () => {
  const reminders = [...state.reminders].sort((first, second) => {
    const left = `${first.date}${first.time || ""}`;
    const right = `${second.date}${second.time || ""}`;
    return left.localeCompare(right);
  });

  if (!reminders.length) {
    elements.reminderList.innerHTML = `<div class="empty-state">Henüz anımsatıcı yok.</div>`;
    return;
  }

  elements.reminderList.innerHTML = reminders
    .map(
      (reminder) => `
        <article class="reminder-item">
          <div>
            <strong>${escapeHtml(reminder.title)}</strong>
            <span class="reminder-meta">
              <span>${dateFormatter.format(new Date(`${reminder.date}T12:00:00`))}</span>
              <span>${reminder.time || "Saat yok"}</span>
            </span>
          </div>
          <button class="delete-button" data-action="delete-reminder" data-id="${reminder.id}" type="button">Sil</button>
        </article>
      `
    )
    .join("");
};

const escapeHtml = (value) =>
  value.replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[char];
  });

const render = () => {
  renderNavigation();
  renderMetrics();
  renderTasks();
  renderSchedule();
  renderCalendar();
  renderReminders();
};

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => {
    state.view = button.dataset.view;
    saveState();
    render();
  });
});

elements.taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.tasks.unshift({
    id: crypto.randomUUID(),
    title: elements.taskTitle.value.trim(),
    priority: elements.taskPriority.value,
    date: elements.taskDate.value,
    time: elements.taskTime.value,
    done: false,
  });
  elements.taskForm.reset();
  elements.taskDate.value = toISODate(today);
  saveState();
  render();
});

elements.taskBoard.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  if (button.dataset.action === "toggle-task") {
    state.tasks = state.tasks.map((task) =>
      task.id === button.dataset.id ? { ...task, done: !task.done } : task
    );
  }

  if (button.dataset.action === "delete-task") {
    state.tasks = state.tasks.filter((task) => task.id !== button.dataset.id);
  }

  saveState();
  render();
});

elements.scheduleGrid.addEventListener("click", (event) => {
  const itemButton = event.target.closest("button[data-action='toggle-task']");
  if (itemButton) {
    state.tasks = state.tasks.map((task) =>
      task.id === itemButton.dataset.id ? { ...task, done: !task.done } : task
    );
    saveState();
    render();
    return;
  }

  const cell = event.target.closest(".schedule-cell");
  if (!cell) return;
  elements.taskDate.value = cell.dataset.date;
  elements.taskTime.value = cell.dataset.hour;
  elements.reminderDate.value = cell.dataset.date;
  elements.reminderTime.value = cell.dataset.hour;
});

elements.prevMonth.addEventListener("click", () => {
  const date = new Date(state.calendarMonth);
  state.calendarMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1).toISOString();
  saveState();
  renderCalendar();
});

elements.nextMonth.addEventListener("click", () => {
  const date = new Date(state.calendarMonth);
  state.calendarMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1).toISOString();
  saveState();
  renderCalendar();
});

elements.calendarGrid.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-date]");
  if (!button) return;
  elements.taskDate.value = button.dataset.date;
  elements.reminderDate.value = button.dataset.date;
});

elements.reminderForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.reminders.push({
    id: crypto.randomUUID(),
    title: elements.reminderTitle.value.trim(),
    date: elements.reminderDate.value,
    time: elements.reminderTime.value,
  });
  elements.reminderForm.reset();
  elements.reminderDate.value = toISODate(today);
  saveState();
  render();
});

elements.reminderList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action='delete-reminder']");
  if (!button) return;
  state.reminders = state.reminders.filter((reminder) => reminder.id !== button.dataset.id);
  saveState();
  render();
});

elements.taskDate.value = toISODate(today);
elements.taskTime.value = "";
elements.reminderDate.value = toISODate(today);
render();
