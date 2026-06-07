import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const storageKey = "kawaii-life-planner-state";
const lifeStorageKey = "kawaii-life-planner-life-folders";
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

const weekdayFormatter = new Intl.DateTimeFormat("tr-TR", {
  weekday: "short",
});

const themes = {
  kawaii: {
    name: "Tatlı Mod",
    brand: "Kawaii Life",
    title: "Soft Planner",
    eyebrow: "Growing, glowing, and organizing",
    headline: "Planlarını tatlı ama düzenli tut.",
    characterTitle: "Karakter alanı",
    characterNote: "İleride eklenecek kız karakter versiyonu için boş bırakıldı.",
  },
  engineer: {
    name: "Engineer",
    brand: "Engineer Desk",
    title: "Build Planner",
    eyebrow: "Design, test, ship",
    headline: "Planlarını sistemli ve ölçülebilir tut.",
    characterTitle: "Çalışma istasyonu",
    characterNote: "Pati alanı bu modda sade bilgisayar ikonuna dönüşür.",
  },
  cyber: {
    name: "Cyber",
    brand: "Cyber Flow",
    title: "Secure Planner",
    eyebrow: "Monitor, harden, respond",
    headline: "Planlarını sakin, güvenli ve izlenebilir tut.",
    characterTitle: "Operasyon alanı",
    characterNote: "Siber güvenlik ikonları ileride verilecek assetlerle değiştirilebilir.",
  },
};

const toISODate = (date) => {
  const copy = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return copy.toISOString().slice(0, 10);
};

const addDays = (date, days) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

const addMonths = (date, months) => {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + months);
  return copy;
};

const getWeekStart = (date) => {
  const copy = new Date(date);
  const day = copy.getDay() || 7;
  copy.setDate(copy.getDate() - day + 1);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const addHoursToTime = (time, hoursToAdd) => {
  const [hour, minute] = time.split(":").map(Number);
  const nextHour = Math.min(hour + hoursToAdd, 23);
  return `${String(nextHour).padStart(2, "0")}:${String(minute || 0).padStart(2, "0")}`;
};

const timeToMinutes = (time) => {
  if (!time) return 0;
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + (minute || 0);
};

const getPlanDurationHours = (startTime, endTime) => {
  if (!startTime || !endTime) return 1;
  const duration = (timeToMinutes(endTime) - timeToMinutes(startTime)) / 60;
  return Math.max(1, Math.min(12, duration));
};

const getPlanGridSpan = (startTime, endTime) => Math.max(1, Math.ceil(getPlanDurationHours(startTime, endTime)));

const getMonthDays = (year, month) => {
  const count = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: count }, (_, index) => new Date(year, month, index + 1));
};

const bucketColumns = [
  { id: "now", title: "NOW", label: "Now" },
  { id: "next", title: "NEXT", label: "Next" },
  { id: "later", title: "LATER", label: "Later" },
];

const defaultState = {
  selectedDate: toISODate(today),
  folders: [
    {
      id: "daily-default",
      name: "Günlük yapılacaklar",
    },
    {
      id: "general-default",
      name: "Genel planlar",
    },
  ],
  tasks: [
    {
      id: crypto.randomUUID(),
      title: "Haftalık planı pembe ajandaya işle",
      folderId: "daily-default",
      scope: "daily",
      date: toISODate(today),
      time: "09:00",
      bucket: "now",
      done: false,
    },
    {
      id: crypto.randomUUID(),
      title: "Kısa mola ve su hatırlatması",
      folderId: "daily-default",
      scope: "daily",
      date: toISODate(today),
      time: "15:00",
      bucket: "now",
      done: false,
    },
  ],
  reminders: [
    {
      id: crypto.randomUUID(),
      title: "Günün kapanış notunu yaz",
      date: toISODate(today),
      time: "21:00",
    },
  ],
};

const defaultLifeFolders = [
  {
    id: "life-bucket",
    name: "Bucket List",
    accent: "life-pink",
    items: [
      { id: "life-bucket-1", text: "Küçük bir gezi fikri yaz", done: false },
      { id: "life-bucket-2", text: "Yeni bir deneyim seç", done: false },
      { id: "life-bucket-3", text: "Ay sonunda kontrol et", done: false },
    ],
  },
  {
    id: "life-journal",
    name: "Journal",
    accent: "life-line",
    items: [
      { id: "life-journal-1", text: "Bugünün enerjisi", done: false },
      { id: "life-journal-2", text: "Aklımda kalan cümle", done: false },
      { id: "life-journal-3", text: "Yarın için niyet", done: false },
    ],
  },
  {
    id: "life-budget",
    name: "Monthly Budget",
    accent: "life-room",
    items: [
      { id: "life-budget-1", text: "Sabit giderleri kontrol et", done: false },
      { id: "life-budget-2", text: "Küçük harcama notları", done: false },
      { id: "life-budget-3", text: "Bir sonraki ay hedefi", done: false },
    ],
  },
];

const loadState = () => {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return defaultState;

  try {
    const parsed = { ...defaultState, ...JSON.parse(saved) };
    const fallbackFolderId = parsed.folders?.[0]?.id || defaultState.folders[0].id;
    return {
      ...parsed,
      folders: parsed.folders?.length ? parsed.folders : defaultState.folders,
      tasks: parsed.tasks.map((task) => ({
        ...task,
        folderId: task.folderId || fallbackFolderId,
        scope: task.scope || (task.date ? "daily" : "general"),
        bucket: task.bucket || "now",
      })),
    };
  } catch {
    return defaultState;
  }
};

const loadLifeFolders = () => {
  const saved = localStorage.getItem(lifeStorageKey);
  if (!saved) return defaultLifeFolders;

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.length) return defaultLifeFolders;
    return parsed.map((folder) => ({
      ...folder,
      items: (folder.items || []).map((item) =>
        typeof item === "string" ? { id: crypto.randomUUID(), text: item, done: false } : item
      ),
    }));
  } catch {
    return defaultLifeFolders;
  }
};

function App() {
  const [state, setState] = useState(loadState);
  const [theme, setTheme] = useState("kawaii");
  const [activeSection, setActiveSection] = useState("home");
  const [calendarView, setCalendarView] = useState("week");
  const [clock, setClock] = useState(new Date());
  const [timerMode, setTimerMode] = useState("focus");
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [quickPlan, setQuickPlan] = useState("");
  const [quickBucket, setQuickBucket] = useState("now");
  const [slotDraft, setSlotDraft] = useState(null);
  const [slotTitle, setSlotTitle] = useState("");
  const [slotNote, setSlotNote] = useState("");
  const [slotShowNote, setSlotShowNote] = useState(false);
  const [slotEndTime, setSlotEndTime] = useState("11:00");
  const [detailTaskId, setDetailTaskId] = useState(null);
  const [detailEditing, setDetailEditing] = useState(false);
  const [detailTitle, setDetailTitle] = useState("");
  const [detailStartTime, setDetailStartTime] = useState("");
  const [detailEndTime, setDetailEndTime] = useState("");
  const [detailNote, setDetailNote] = useState("");
  const [lifeFolders, setLifeFolders] = useState(loadLifeFolders);
  const [lifeFolderName, setLifeFolderName] = useState("");
  const [lifeItemText, setLifeItemText] = useState("");
  const [activeLifeFolderId, setActiveLifeFolderId] = useState(null);
  const [draftSlot, setDraftSlot] = useState({
    date: state.selectedDate,
    time: "10:00",
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem(lifeStorageKey, JSON.stringify(lifeFolders));
  }, [lifeFolders]);

  useEffect(() => {
    const interval = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!timerRunning) return undefined;
    const interval = window.setInterval(() => {
      setTimerSeconds((current) => {
        if (current <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);

  const weekStart = useMemo(() => getWeekStart(new Date(`${state.selectedDate}T12:00:00`)), [state.selectedDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart]);
  const hours = useMemo(() => Array.from({ length: 15 }, (_, index) => `${String(index + 8).padStart(2, "0")}:00`), []);
  const selectedDateObject = useMemo(() => new Date(`${state.selectedDate}T12:00:00`), [state.selectedDate]);
  const selectedYear = selectedDateObject.getFullYear();
  const selectedMonthDays = useMemo(
    () => getMonthDays(selectedDateObject.getFullYear(), selectedDateObject.getMonth()),
    [selectedDateObject]
  );

  const selectedDayItems = useMemo(() => {
    const taskItems = state.tasks
      .filter((task) => task.date === state.selectedDate)
      .map((task) => ({ ...task, kind: "task" }));
    const reminderItems = state.reminders
      .filter((reminder) => reminder.date === state.selectedDate)
      .map((reminder) => ({ ...reminder, kind: "reminder" }));
    return [...taskItems, ...reminderItems].sort((first, second) =>
      (first.time || "99:99").localeCompare(second.time || "99:99")
    );
  }, [state]);

  const createCalendarItems = (days) => {
    const taskItems = state.tasks
      .filter((task) => task.date && task.time)
      .map((task) => ({ ...task, kind: "task" }));
    const reminderItems = state.reminders
      .filter((reminder) => reminder.date && reminder.time)
      .map((reminder) => ({ ...reminder, kind: "reminder" }));

    const positionedItems = [...taskItems, ...reminderItems]
      .map((item) => {
        const dayIndex = days.findIndex((day) => toISODate(day) === item.date);
        const hourIndex = hours.findIndex((hour) => hour.slice(0, 2) === item.time.slice(0, 2));
        if (dayIndex < 0 || hourIndex < 0) return null;

        const span = item.kind === "task" ? getPlanGridSpan(item.time, item.endTime) : 1;
        const startMinute = timeToMinutes(item.time);
        const endMinute = item.kind === "task" && item.endTime ? timeToMinutes(item.endTime) : startMinute + 60;
        return {
          ...item,
          dayIndex,
          hourIndex,
          span: Math.min(span, hours.length - hourIndex),
          startMinute,
          endMinute: Math.max(startMinute + 30, endMinute),
        };
      })
      .filter(Boolean);

    const laneItems = [];
    for (const day of days) {
      const date = toISODate(day);
      const dayItems = positionedItems
        .filter((item) => item.date === date)
        .sort((first, second) => first.startMinute - second.startMinute || first.endMinute - second.endMinute);
      let cluster = [];
      let clusterEnd = -1;

      const flushCluster = () => {
        if (cluster.length === 0) return;
        const laneEnds = [];
        const assigned = cluster.map((item) => {
          const laneIndex = laneEnds.findIndex((end) => end <= item.startMinute);
          const nextLaneIndex = laneIndex >= 0 ? laneIndex : laneEnds.length;
          laneEnds[nextLaneIndex] = item.endMinute;
          return { ...item, laneIndex: nextLaneIndex };
        });
        const laneCount = Math.max(1, ...assigned.map((item) => item.laneIndex + 1));
        laneItems.push(...assigned.map((item) => ({ ...item, laneCount })));
        cluster = [];
      };

      for (const item of dayItems) {
        if (cluster.length > 0 && item.startMinute >= clusterEnd) {
          flushCluster();
          clusterEnd = -1;
        }
        cluster.push(item);
        clusterEnd = Math.max(clusterEnd, item.endMinute);
      }
      flushCluster();
    }

    return laneItems;
  };

  const calendarItems = useMemo(() => createCalendarItems(weekDays), [hours, state.reminders, state.tasks, weekDays]);
  const monthCalendarItems = useMemo(
    () => createCalendarItems(selectedMonthDays),
    [hours, selectedMonthDays, state.reminders, state.tasks]
  );

  const completedCount = state.tasks.filter((task) => task.done).length;
  const activeCount = state.tasks.filter((task) => !task.done).length;
  const activeTheme = themes[theme];
  const detailTask = state.tasks.find((task) => task.id === detailTaskId);
  const detailDays = calendarView === "month" ? selectedMonthDays : weekDays;
  const detailPosition = detailTask
    ? {
        dayIndex: detailDays.findIndex((day) => toISODate(day) === detailTask.date),
        hourIndex: hours.findIndex((hour) => hour.slice(0, 2) === (detailTask.time || "").slice(0, 2)),
      }
    : null;
  const todayIso = toISODate(today);
  const dailyTodoTasks = state.tasks
    .filter((task) => task.scope === "daily" && task.date === todayIso && !task.done)
    .sort((first, second) => (first.time || "99:99").localeCompare(second.time || "99:99"));
  const todoBuckets = bucketColumns.map((bucket) => ({
    ...bucket,
    tasks: dailyTodoTasks.filter((task) => (task.bucket || "now") === bucket.id),
    tone: `todo-${bucket.id}`,
  }));
  const calendarDayMin = Math.min(
    280,
    Math.max(178, 178 + (Math.max(1, ...calendarItems.map((item) => item.laneCount || 1)) - 1) * 74)
  );
  const monthCalendarDayMin = Math.min(
    240,
    Math.max(150, 150 + (Math.max(1, ...monthCalendarItems.map((item) => item.laneCount || 1)) - 1) * 62)
  );
  const activeLifeFolder = lifeFolders.find((folder) => folder.id === activeLifeFolderId);

  const addQuickPlan = (event) => {
    event.preventDefault();
    const title = quickPlan.trim();
    if (!title) return;

    const dailyFolder = state.folders.find((folder) => folder.id === "daily-default") || state.folders[0];

    setState((current) => ({
      ...current,
      selectedDate: todayIso,
      tasks: [
        ...current.tasks,
        {
          id: crypto.randomUUID(),
          title,
          folderId: dailyFolder.id,
          scope: "daily",
          date: todayIso,
          time: "",
          bucket: quickBucket,
          done: false,
        },
      ],
    }));
    setQuickPlan("");
  };

  const openSlotPopup = (date, time) => {
    setDetailTaskId(null);
    selectSlot(date, time);
    setSlotDraft({ date, time });
    setSlotTitle("");
    setSlotNote("");
    setSlotShowNote(false);
    setSlotEndTime(addHoursToTime(time, 1));
  };

  const openCurrentSlotPopup = () => {
    const now = new Date();
    const roundedHour = Math.min(Math.max(now.getHours() + (now.getMinutes() > 0 ? 1 : 0), 8), 22);
    const time = `${String(roundedHour).padStart(2, "0")}:00`;
    openSlotPopup(toISODate(now), time);
  };

  const moveCalendarMonth = (months) => {
    const nextDate = addMonths(new Date(`${state.selectedDate}T12:00:00`), months);
    setState((current) => ({ ...current, selectedDate: toISODate(nextDate) }));
    setDetailTaskId(null);
    setSlotDraft(null);
  };

  const jumpCalendarToday = () => {
    setState((current) => ({ ...current, selectedDate: todayIso }));
    setDetailTaskId(null);
    setSlotDraft(null);
  };

  const addSlotPlan = (event) => {
    event.preventDefault();
    const title = slotTitle.trim();
    if (!title || !slotDraft) return;

    const dailyFolder = state.folders.find((folder) => folder.id === "daily-default") || state.folders[0];

    setState((current) => ({
      ...current,
      selectedDate: slotDraft.date,
      tasks: [
        ...current.tasks,
        {
          id: crypto.randomUUID(),
          title,
          folderId: dailyFolder.id,
          scope: "daily",
          date: slotDraft.date,
          time: slotDraft.time,
          endTime: slotEndTime,
          bucket: "now",
          note: slotNote.trim(),
          done: false,
        },
      ],
    }));
    setSlotDraft(null);
    setSlotTitle("");
  };

  const selectSlot = (date, time) => {
    setState((current) => ({ ...current, selectedDate: date }));
    setDraftSlot({ date, time });
  };

  const toggleTask = (id) => {
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    }));
  };

  const removeTask = (id) => {
    setState((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== id) }));
  };

  const openTaskDetail = (task) => {
    setDetailTaskId(task.id);
    setDetailEditing(false);
    setDetailTitle(task.title || "");
    setDetailStartTime(task.time || "");
    setDetailEndTime(task.endTime || "");
    setDetailNote(task.note || "");
  };

  const saveTaskDetail = () => {
    if (!detailTask) return;
    const title = detailTitle.trim();
    if (!title) return;

    setState((current) => ({
      ...current,
      selectedDate: detailTask.date || current.selectedDate,
      tasks: current.tasks.map((task) =>
        task.id === detailTask.id
          ? {
              ...task,
              title,
              time: detailStartTime,
              endTime: detailEndTime,
              note: detailNote.trim(),
            }
          : task
      ),
    }));
    setDetailEditing(false);
  };

  const removeReminder = (id) => {
    setState((current) => ({ ...current, reminders: current.reminders.filter((reminder) => reminder.id !== id) }));
  };

  const setTimerPreset = (mode, seconds) => {
    setTimerMode(mode);
    setTimerSeconds(seconds);
    setTimerRunning(false);
  };

  const addLifeFolder = (event) => {
    event.preventDefault();
    const name = lifeFolderName.trim();
    if (!name) return;

    const folder = {
      id: crypto.randomUUID(),
      name,
      accent: "life-pink",
      items: [],
    };

    setLifeFolders((current) => [...current, folder]);
    setActiveLifeFolderId(folder.id);
    setLifeFolderName("");
  };

  const addLifeItem = (event) => {
    event.preventDefault();
    const text = lifeItemText.trim();
    if (!text || !activeLifeFolderId) return;

    setLifeFolders((current) =>
      current.map((folder) =>
        folder.id === activeLifeFolderId
          ? { ...folder, items: [...folder.items, { id: crypto.randomUUID(), text, done: false }] }
          : folder
      )
    );
    setLifeItemText("");
  };

  const toggleLifeItem = (itemId) => {
    setLifeFolders((current) =>
      current.map((folder) =>
        folder.id === activeLifeFolderId
          ? {
              ...folder,
              items: folder.items.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item)),
            }
          : folder
      )
    );
  };

  return (
    <main className={`planner-page theme-${theme}`}>
      <header className="top-bar">
        <div className="brand">
          <span className={`brand-icon brand-icon-${theme}`} aria-hidden="true" />
          <div>
            <p>{activeTheme.brand}</p>
            <h1>{activeTheme.title}</h1>
          </div>
        </div>
        <nav className="top-actions" aria-label="Tema modları">
          {Object.entries(themes).map(([key, item]) => (
            <button className={theme === key ? "is-active" : ""} key={key} type="button" onClick={() => setTheme(key)}>
              {item.name}
            </button>
          ))}
        </nav>
      </header>

      <section className="cover-strip" aria-label="Tema konsept alanı">
        <div className="cover-text">
          <span>{activeTheme.eyebrow}</span>
          <strong>{activeTheme.headline}</strong>
        </div>
        <ThemeVisual theme={theme} />
      </section>

      <nav className="section-tabs" aria-label="Uygulama bölümleri">
        <button className={activeSection === "home" ? "is-active" : ""} type="button" onClick={() => setActiveSection("home")}>
          Ana Sayfa
        </button>
        <button className={activeSection === "plans" ? "is-active" : ""} type="button" onClick={() => setActiveSection("plans")}>
          Plan Merkezi
        </button>
        <button className={activeSection === "weekly" ? "is-active" : ""} type="button" onClick={() => setActiveSection("weekly")}>
          Haftalık Plan
        </button>
      </nav>

      {activeSection === "home" ? (
      <section className="planner-grid">
        <aside className="left-rail">
          <section className="character-slot" aria-label="Tema ikon alanı">
            <ThemeMark theme={theme} />
            <p>{activeTheme.characterTitle}</p>
            <small>{activeTheme.characterNote}</small>
          </section>

          <section className="todo-card">
            <div className="todo-heading">
              <span>TO-DOs</span>
              <strong>{dailyTodoTasks.length}</strong>
            </div>
            <form className="quick-plan-form" onSubmit={addQuickPlan}>
              <input
                value={quickPlan}
                onChange={(event) => setQuickPlan(event.target.value)}
                placeholder="Hızlı plan ekle"
              />
              <div className="quick-plan-actions">
                <button className={quickBucket === "now" ? "is-active" : ""} type="button" onClick={() => setQuickBucket("now")}>
                  Now
                </button>
                <button
                  className={quickBucket === "next" ? "is-active" : ""}
                  type="button"
                  onClick={() => setQuickBucket("next")}
                >
                  Next
                </button>
                <button type="submit">Ekle</button>
              </div>
            </form>
            <div className="todo-buckets">
              {todoBuckets.map((bucket) => (
                <article className={`todo-bucket ${bucket.tone}`} key={bucket.title}>
                  <div className="todo-bucket-art" aria-hidden="true" />
                  <h3>{bucket.title}</h3>
                  <div className="todo-bucket-list">
                    {bucket.tasks.length === 0 ? <p>Henüz görev yok</p> : null}
                    {bucket.tasks.map((task) => (
                      <button
                        className={`todo-mini-item ${task.done ? "is-done" : ""}`}
                        key={task.id}
                        type="button"
                        onClick={() => toggleTask(task.id)}
                      >
                        <span />
                        {task.title}
                      </button>
                    ))}
                  </div>
                  <button className="todo-add-button" type="button" onClick={() => setActiveSection("plans")}>
                    + ADD
                  </button>
                </article>
              ))}
            </div>
          </section>
        </aside>

        <section className="calendar-card">
          <div className="calendar-head">
            <div>
              <span>Calendar</span>
              <h2>{calendarView === "year" ? selectedYear : monthFormatter.format(selectedDateObject)}</h2>
            </div>
            <div className="calendar-head-actions">
              <div className="calendar-nav-actions" aria-label="Takvim gezinme">
                <button type="button" onClick={() => moveCalendarMonth(-1)}>
                  Önceki ay
                </button>
                <button type="button" onClick={jumpCalendarToday}>
                  Bugün
                </button>
                <button type="button" onClick={() => moveCalendarMonth(1)}>
                  Sonraki ay
                </button>
              </div>
              <div className="calendar-view-toggle" aria-label="Takvim görünümü">
                <button className={calendarView === "week" ? "is-active" : ""} type="button" onClick={() => setCalendarView("week")}>
                  Haftalık
                </button>
                <button className={calendarView === "month" ? "is-active" : ""} type="button" onClick={() => setCalendarView("month")}>
                  Aylık
                </button>
                <button className={calendarView === "year" ? "is-active" : ""} type="button" onClick={() => setCalendarView("year")}>
                  Yıllık
                </button>
              </div>
              <p>{dateFormatter.format(selectedDateObject)}</p>
              <button className="calendar-new-task" type="button" onClick={openCurrentSlotPopup}>
                Yeni görev ekle
              </button>
            </div>
          </div>

          {calendarView === "week" ? (
          <div
            className="week-calendar"
            role="grid"
            aria-label="Haftalık saatli takvim"
            style={{ "--day-min": `${calendarDayMin}px` }}
          >
            <div className="time-corner" style={{ gridColumn: 1, gridRow: 1 }}>
              Saat
            </div>
            {weekDays.map((day, dayIndex) => {
              const iso = toISODate(day);
              return (
                <button
                  className={`day-head ${iso === state.selectedDate ? "is-selected" : ""}`}
                  key={iso}
                  style={{ gridColumn: dayIndex + 2, gridRow: 1 }}
                  type="button"
                  onClick={() => selectSlot(iso, draftSlot.time)}
                >
                  <span>{weekdayFormatter.format(day)}</span>
                  <strong>{day.getDate()}</strong>
                </button>
              );
            })}

            {hours.map((hour, hourIndex) => (
              <React.Fragment key={hour}>
                <div className="time-label" style={{ gridColumn: 1, gridRow: hourIndex + 2 }}>
                  {hour}
                </div>
                {weekDays.map((day, dayIndex) => {
                  const iso = toISODate(day);

                  return (
                    <div
                      className={`time-cell ${iso === state.selectedDate ? "is-selected" : ""}`}
                      key={`${iso}-${hour}`}
                      style={{ gridColumn: dayIndex + 2, gridRow: hourIndex + 2 }}
                      onClick={() => openSlotPopup(iso, hour)}
                    />
                  );
                })}
              </React.Fragment>
            ))}

            {calendarItems.map((item) => (
              <article
                className={`event-pill calendar-event ${item.kind === "task" ? "" : "no-check"} ${item.done ? "is-done" : ""}`}
                key={`${item.kind}-${item.id}`}
                style={{
                  gridColumn: item.dayIndex + 2,
                  gridRow: `${item.hourIndex + 2} / span ${item.span}`,
                  "--lane-index": item.laneIndex,
                  "--lane-count": item.laneCount,
                  "--lane-width": `calc((100% - 10px - ${(item.laneCount - 1) * 5}px) / ${item.laneCount})`,
                  "--lane-left": `calc(${(item.laneIndex / item.laneCount) * 100}% + ${
                    5 + item.laneIndex * 5 - (item.laneIndex * (10 + (item.laneCount - 1) * 5)) / item.laneCount
                  }px)`,
                }}
              >
                {item.kind === "task" ? (
                  <button
                    className="event-check"
                    type="button"
                    aria-label="Görevi tamamla"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleTask(item.id);
                    }}
                  />
                ) : null}
                <button
                  className="event-title"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (item.kind === "task") openTaskDetail(item);
                  }}
                >
                  <span>{item.title}</span>
                  {item.kind === "task" && item.endTime ? <small>{item.time} - {item.endTime}</small> : null}
                </button>
              </article>
            ))}
            {detailTask && detailPosition && detailPosition.dayIndex >= 0 && detailPosition.hourIndex >= 0 ? (
              <section
                className={`task-detail-bubble ${detailPosition.dayIndex >= 4 ? "is-left" : ""}`}
                style={{
                  gridColumn:
                    detailPosition.dayIndex >= 4
                      ? `${Math.max(2, detailPosition.dayIndex)} / span 2`
                      : `${detailPosition.dayIndex + 3} / span 2`,
                  gridRow: detailPosition.hourIndex + 2,
                }}
                onClick={(event) => event.stopPropagation()}
              >
                <button className="popup-close" type="button" aria-label="Kapat" onClick={() => setDetailTaskId(null)}>
                  ×
                </button>
                <div className="detail-head">
                  <div>
                    <span>Plan detayı</span>
                    <strong>{detailTask.title}</strong>
                  </div>
                  <button type="button" onClick={() => setDetailEditing((current) => !current)}>
                    Düzenle
                  </button>
                </div>
                <p>
                  {[detailTask.date || "Tarih yok", detailTask.time || "Saat yok", detailTask.endTime ? `Bitiş ${detailTask.endTime}` : ""]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {detailEditing ? (
                  <>
                    <label>
                      Plan başlığı
                      <input
                        autoFocus
                        value={detailTitle}
                        onChange={(event) => setDetailTitle(event.target.value)}
                        placeholder="Plan başlığı"
                      />
                    </label>
                    <div className="slot-time-row">
                      <label>
                        Başlangıç
                        <input
                          value={detailStartTime}
                          onChange={(event) => setDetailStartTime(event.target.value)}
                          type="time"
                        />
                      </label>
                      <label>
                        Bitiş
                        <input value={detailEndTime} onChange={(event) => setDetailEndTime(event.target.value)} type="time" />
                      </label>
                    </div>
                    <label>
                      Detay notu
                      <textarea
                        value={detailNote}
                        onChange={(event) => setDetailNote(event.target.value)}
                        placeholder="Bu planla ilgili detayları düzenle..."
                      />
                    </label>
                    <div className="slot-popover-actions">
                      <button className="secondary-action" type="button" onClick={() => setDetailEditing(false)}>
                        Vazgeç
                      </button>
                      <button className="submit-button" type="button" onClick={saveTaskDetail}>
                        Kaydet
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="detail-note">
                    {detailTask.note || "Bu plan için detay notu yok."}
                  </div>
                )}
              </section>
            ) : null}
          </div>
          ) : calendarView === "month" ? (
            <div
              className="month-calendar"
              role="grid"
              aria-label="Aylık saatli takvim"
              style={{ "--month-day-min": `${monthCalendarDayMin}px`, "--month-days": selectedMonthDays.length }}
            >
              <div className="time-corner" style={{ gridColumn: 1, gridRow: 1 }}>
                Saat
              </div>
              {selectedMonthDays.map((day, dayIndex) => {
                const iso = toISODate(day);
                const dayTaskCount = state.tasks.filter((task) => task.date === iso && !task.done).length;
                return (
                  <button
                    className={`month-day-head ${iso === state.selectedDate ? "is-selected" : ""}`}
                    key={iso}
                    style={{ gridColumn: dayIndex + 2, gridRow: 1 }}
                    type="button"
                    onClick={() => selectSlot(iso, draftSlot.time)}
                  >
                    <span>{weekdayFormatter.format(day)}</span>
                    <strong>{day.getDate()}</strong>
                    {dayTaskCount ? <small>{dayTaskCount}</small> : null}
                  </button>
                );
              })}

              {hours.map((hour, hourIndex) => (
                <React.Fragment key={hour}>
                  <div className="time-label" style={{ gridColumn: 1, gridRow: hourIndex + 2 }}>
                    {hour}
                  </div>
                  {selectedMonthDays.map((day, dayIndex) => {
                    const iso = toISODate(day);

                    return (
                      <div
                        className={`time-cell ${iso === state.selectedDate ? "is-selected" : ""}`}
                        key={`${iso}-${hour}`}
                        style={{ gridColumn: dayIndex + 2, gridRow: hourIndex + 2 }}
                        onClick={() => openSlotPopup(iso, hour)}
                      />
                    );
                  })}
                </React.Fragment>
              ))}

              {monthCalendarItems.map((item) => (
                <article
                  className={`event-pill calendar-event ${item.kind === "task" ? "" : "no-check"} ${item.done ? "is-done" : ""}`}
                  key={`${item.kind}-${item.id}`}
                  style={{
                    gridColumn: item.dayIndex + 2,
                    gridRow: `${item.hourIndex + 2} / span ${item.span}`,
                    "--lane-index": item.laneIndex,
                    "--lane-count": item.laneCount,
                    "--lane-width": `calc((100% - 10px - ${(item.laneCount - 1) * 5}px) / ${item.laneCount})`,
                    "--lane-left": `calc(${(item.laneIndex / item.laneCount) * 100}% + ${
                      5 + item.laneIndex * 5 - (item.laneIndex * (10 + (item.laneCount - 1) * 5)) / item.laneCount
                    }px)`,
                  }}
                >
                  {item.kind === "task" ? (
                    <button
                      className="event-check"
                      type="button"
                      aria-label="Görevi tamamla"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleTask(item.id);
                      }}
                    />
                  ) : null}
                  <button
                    className="event-title"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (item.kind === "task") openTaskDetail(item);
                    }}
                  >
                    <span>{item.title}</span>
                    {item.kind === "task" && item.endTime ? <small>{item.time} - {item.endTime}</small> : null}
                  </button>
                </article>
              ))}
              {detailTask && detailPosition && detailPosition.dayIndex >= 0 && detailPosition.hourIndex >= 0 ? (
                <section
                  className={`task-detail-bubble ${detailPosition.dayIndex >= selectedMonthDays.length - 2 ? "is-left" : ""}`}
                  style={{
                    gridColumn:
                      detailPosition.dayIndex >= selectedMonthDays.length - 2
                        ? `${Math.max(2, detailPosition.dayIndex)} / span 2`
                        : `${detailPosition.dayIndex + 3} / span 2`,
                    gridRow: detailPosition.hourIndex + 2,
                  }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <button className="popup-close" type="button" aria-label="Kapat" onClick={() => setDetailTaskId(null)}>
                    ×
                  </button>
                  <div className="detail-head">
                    <div>
                      <span>Plan detayı</span>
                      <strong>{detailTask.title}</strong>
                    </div>
                    <button type="button" onClick={() => setDetailEditing((current) => !current)}>
                      Düzenle
                    </button>
                  </div>
                  <p>
                    {[detailTask.date || "Tarih yok", detailTask.time || "Saat yok", detailTask.endTime ? `Bitiş ${detailTask.endTime}` : ""]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {detailEditing ? (
                    <>
                      <label>
                        Plan başlığı
                        <input
                          autoFocus
                          value={detailTitle}
                          onChange={(event) => setDetailTitle(event.target.value)}
                          placeholder="Plan başlığı"
                        />
                      </label>
                      <div className="slot-time-row">
                        <label>
                          Başlangıç
                          <input
                            value={detailStartTime}
                            onChange={(event) => setDetailStartTime(event.target.value)}
                            type="time"
                          />
                        </label>
                        <label>
                          Bitiş
                          <input value={detailEndTime} onChange={(event) => setDetailEndTime(event.target.value)} type="time" />
                        </label>
                      </div>
                      <label>
                        Detay notu
                        <textarea
                          value={detailNote}
                          onChange={(event) => setDetailNote(event.target.value)}
                          placeholder="Bu planla ilgili detayları düzenle..."
                        />
                      </label>
                      <div className="slot-popover-actions">
                        <button className="secondary-action" type="button" onClick={() => setDetailEditing(false)}>
                          Vazgeç
                        </button>
                        <button className="submit-button" type="button" onClick={saveTaskDetail}>
                          Kaydet
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="detail-note">
                      {detailTask.note || "Bu plan için detay notu yok."}
                    </div>
                  )}
                </section>
              ) : null}
            </div>
          ) : (
            <div className="year-calendar" aria-label={`${selectedYear} yıllık görünüm`}>
              {Array.from({ length: 12 }, (_, monthIndex) => {
                const monthDays = getMonthDays(selectedYear, monthIndex);
                return (
                  <section className="year-month" key={monthIndex}>
                    <div className="year-month-head">
                      <button
                        type="button"
                        onClick={() => {
                          setState((current) => ({ ...current, selectedDate: toISODate(new Date(selectedYear, monthIndex, 1)) }));
                          setCalendarView("month");
                        }}
                      >
                        {monthFormatter.format(new Date(selectedYear, monthIndex, 1))}
                      </button>
                    </div>
                    <div className="year-weekdays" aria-hidden="true">
                      {["P", "S", "Ç", "P", "C", "C", "P"].map((dayLabel, index) => (
                        <span key={`${dayLabel}-${index}`}>{dayLabel}</span>
                      ))}
                    </div>
                    <div className="year-days">
                      {Array.from({ length: (monthDays[0].getDay() || 7) - 1 }, (_, index) => (
                        <span className="year-empty-day" key={`empty-${index}`} />
                      ))}
                      {monthDays.map((day) => {
                        const iso = toISODate(day);
                        const dayTaskCount = state.tasks.filter((task) => task.date === iso && !task.done).length;
                        return (
                          <button
                            className={`year-day ${iso === state.selectedDate ? "is-selected" : ""} ${dayTaskCount ? "has-task" : ""}`}
                            key={iso}
                            type="button"
                            onClick={() => {
                              setState((current) => ({ ...current, selectedDate: iso }));
                              setCalendarView("month");
                            }}
                          >
                            <span>{day.getDate()}</span>
                            {dayTaskCount ? <small>{dayTaskCount}</small> : null}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </section>

        <aside className="right-rail">
          <section className="clock-card">
            <span>{clock.getHours() >= 12 ? "PM" : "AM"}</span>
            <strong>{String(clock.getHours()).padStart(2, "0")}</strong>
            <strong>{String(clock.getMinutes()).padStart(2, "0")}</strong>
          </section>

          <section className="personal-life-card">
            <div className="section-title">
              <span>Personal Life</span>
              <strong>{lifeFolders.length}</strong>
            </div>
            <div className="life-folder-list">
              {lifeFolders.slice(0, 4).map((folder) => (
                <button className="life-folder-card" key={folder.id} type="button" onClick={() => setActiveLifeFolderId(folder.id)}>
                  <span className={`life-folder-art ${folder.accent}`} aria-hidden="true" />
                  <strong>{folder.name}</strong>
                </button>
              ))}
            </div>
            <form className="life-folder-form" onSubmit={addLifeFolder}>
              <input
                value={lifeFolderName}
                onChange={(event) => setLifeFolderName(event.target.value)}
                placeholder="Yeni klasör"
              />
              <button type="submit">Ekle</button>
            </form>
          </section>

          <section className="timer-card">
            <div className="section-title">
              <span>Sayaç</span>
              <strong>{timerMode === "focus" ? "Focus" : "Break"}</strong>
            </div>
            <div className="timer-face">
              {String(Math.floor(timerSeconds / 60)).padStart(2, "0")}:
              {String(timerSeconds % 60).padStart(2, "0")}
            </div>
            <div className="timer-presets">
              <button type="button" onClick={() => setTimerPreset("focus", 25 * 60)}>
                25
              </button>
              <button type="button" onClick={() => setTimerPreset("break", 5 * 60)}>
                5
              </button>
              <button type="button" onClick={() => setTimerPreset("break", 15 * 60)}>
                15
              </button>
            </div>
            <button className="timer-toggle" type="button" onClick={() => setTimerRunning((current) => !current)}>
              {timerRunning ? "Duraklat" : "Başlat"}
            </button>
          </section>

          <section className="day-list-card">
            <div className="section-title">
              <span>Seçili gün</span>
              <strong>{selectedDayItems.length}</strong>
            </div>
            <div className="day-list">
              {selectedDayItems.length === 0 ? (
                <p>Bu gün henüz sakin.</p>
              ) : (
                selectedDayItems.map((item) => (
                  <article className="day-item" key={`${item.kind}-${item.id}`}>
                    <div>
                      <span>{item.time || "Saat yok"}</span>
                      <strong>{item.title}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => (item.kind === "task" ? removeTask(item.id) : removeReminder(item.id))}
                    >
                      Sil
                    </button>
                  </article>
                ))
              )}
            </div>
          </section>
        </aside>
      </section>
      ) : activeSection === "plans" ? (
        <PlanWorkspace
          draftSlot={draftSlot}
          setActiveSection={setActiveSection}
          setState={setState}
          state={state}
          toggleTask={toggleTask}
          removeTask={removeTask}
        />
      ) : (
        <WeeklyPlanner
          setActiveSection={setActiveSection}
          setState={setState}
          state={state}
          toggleTask={toggleTask}
          removeTask={removeTask}
          weekDays={weekDays}
        />
      )}
      {slotDraft ? (
        <div className="slot-popover-backdrop" role="presentation" onClick={() => setSlotDraft(null)}>
          <form className="slot-popover" onClick={(event) => event.stopPropagation()} onSubmit={addSlotPlan}>
            <button className="popup-close" type="button" aria-label="Kapat" onClick={() => setSlotDraft(null)}>
              ×
            </button>
            <div className="section-title">
              <span>Takvime ekle</span>
              <strong>{slotDraft.time}</strong>
            </div>
            <p>{dateFormatter.format(new Date(`${slotDraft.date}T12:00:00`))}</p>
            <input
              autoFocus
              value={slotTitle}
              onChange={(event) => setSlotTitle(event.target.value)}
              placeholder="Bu saate ne ekleyelim?"
            />
            <div className="slot-time-row">
              <label>
                Tarih
                <input
                  value={slotDraft.date}
                  onChange={(event) => setSlotDraft((current) => ({ ...current, date: event.target.value }))}
                  type="date"
                />
              </label>
              <label>
                Başlangıç
                <input
                  value={slotDraft.time}
                  onChange={(event) => {
                    const time = event.target.value;
                    setSlotDraft((current) => ({ ...current, time }));
                    setSlotEndTime(addHoursToTime(time, 1));
                  }}
                  type="time"
                />
              </label>
              <label>
                Bitiş
                <input value={slotEndTime} onChange={(event) => setSlotEndTime(event.target.value)} type="time" />
              </label>
            </div>
            {!slotShowNote ? (
              <button className="detail-toggle" type="button" onClick={() => setSlotShowNote(true)}>
                Detay ekle
              </button>
            ) : (
              <label>
                Detay
                <textarea
                  value={slotNote}
                  onChange={(event) => setSlotNote(event.target.value)}
                  placeholder="Not, bağlantı, hazırlık, aklına gelen detay..."
                />
              </label>
            )}
            <div className="slot-popover-actions">
              <button className="secondary-action" type="button" onClick={() => setSlotDraft(null)}>
                Vazgeç
              </button>
              <button className="submit-button" type="submit">
                Ekle
              </button>
            </div>
          </form>
        </div>
      ) : null}
      {activeLifeFolder ? (
        <div className="life-popup-backdrop" role="presentation" onClick={() => setActiveLifeFolderId(null)}>
          <section className="life-popup" onClick={(event) => event.stopPropagation()}>
            <button className="popup-close" type="button" aria-label="Kapat" onClick={() => setActiveLifeFolderId(null)}>
              ×
            </button>
            <div className="section-title">
              <span>Personal Life</span>
              <strong>{activeLifeFolder.name}</strong>
            </div>
            <ul>
              {activeLifeFolder.items.map((item) => (
                <li className={item.done ? "is-done" : ""} key={item.id}>
                  <button type="button" aria-label="Maddeyi tamamla" onClick={() => toggleLifeItem(item.id)} />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
            <form className="life-item-form" onSubmit={addLifeItem}>
              <input
                value={lifeItemText}
                onChange={(event) => setLifeItemText(event.target.value)}
                placeholder="Yeni madde ekle"
              />
              <button type="submit">Ekle</button>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function ThemeMark({ theme }) {
  if (theme === "engineer") {
    return (
      <div className="computer-mark" aria-hidden="true">
        <span />
      </div>
    );
  }

  if (theme === "cyber") {
    return (
      <div className="terminal-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    );
  }

  return (
    <div className="paw-mark" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

function PlanWorkspace({ removeTask, setActiveSection, setState, state, toggleTask }) {
  const [folderName, setFolderName] = useState("");
  const [planQuickTitle, setPlanQuickTitle] = useState("");
  const [planQuickTarget, setPlanQuickTarget] = useState("now");
  const [planQuickDate, setPlanQuickDate] = useState(toISODate(today));

  const todayIso = toISODate(today);
  const dailyFolder = state.folders.find((folder) => folder.id === "daily-default") || state.folders[0];
  const sortPlans = (plans) =>
    [...plans].sort((first, second) => {
      const firstDate = first.date || "9999-12-31";
      const secondDate = second.date || "9999-12-31";
      if (firstDate !== secondDate) return firstDate.localeCompare(secondDate);
      return (first.time || "99:99").localeCompare(second.time || "99:99");
    });

  const boardLanes = [
    ...bucketColumns.map((bucket) => ({
      id: bucket.id,
      title: bucket.title,
      kicker: "TO-DO FLOW",
      kind: "bucket",
      tasks: sortPlans(state.tasks.filter((task) => task.date === todayIso && (task.bucket || "now") === bucket.id)),
    })),
    ...state.folders
      .filter((folder) => folder.id !== "daily-default")
      .map((folder) => ({
        id: `folder-${folder.id}`,
        folderId: folder.id,
        title: folder.name,
        kicker: "CUSTOM LIST",
        kind: "folder",
        tasks: sortPlans(state.tasks.filter((task) => task.folderId === folder.id)),
      })),
  ];

  const boardTaskCount = boardLanes.reduce((total, lane) => total + lane.tasks.filter((task) => !task.done).length, 0);

  const createFolder = (event) => {
    event.preventDefault();
    const name = folderName.trim();
    if (!name) return;

    const folder = {
      id: crypto.randomUUID(),
      name,
    };

    setState((current) => ({
      ...current,
      folders: [...current.folders, folder],
    }));
    setFolderName("");
  };

  const addQuickBoardPlan = (event) => {
    event.preventDefault();
    const title = planQuickTitle.trim();
    if (!title) return;
    const targetLane = boardLanes.find((lane) => lane.id === planQuickTarget) || boardLanes[0];
    const isBucket = targetLane.kind === "bucket";

    setState((current) => ({
      ...current,
      selectedDate: isBucket ? planQuickDate : current.selectedDate,
      tasks: [
        ...current.tasks,
        {
          id: crypto.randomUUID(),
          title,
          folderId: isBucket ? dailyFolder.id : targetLane.folderId,
          scope: isBucket ? "daily" : "general",
          date: isBucket ? planQuickDate : "",
          time: "",
          bucket: isBucket ? targetLane.id : "later",
          done: false,
        },
      ],
    }));
    setPlanQuickTitle("");
  };

  const deleteFolder = (folderId) => {
    if (state.folders.length <= 1) return;
    setState((current) => ({
      ...current,
      folders: current.folders.filter((folder) => folder.id !== folderId),
      tasks: current.tasks.filter((task) => task.folderId !== folderId),
    }));
  };

  return (
    <section className="plan-workspace board-workspace">
      <div className="board-top">
        <div>
          <span>Plan Merkezi</span>
          <h2>Akış Panosu</h2>
        </div>
        <strong>{boardTaskCount}</strong>
        <button className="secondary-action" type="button" onClick={() => setActiveSection("home")}>
          Takvime dön
        </button>
      </div>

      <form className="board-quick-panel" onSubmit={addQuickBoardPlan}>
        <div className="board-quick-copy">
          <span aria-hidden="true">+</span>
          <div>
            <strong>Hızlı plan ekle</strong>
            <small>Planını seçtiğin akışa ya da özel listeye tek satırda ekle.</small>
          </div>
        </div>
        <input
          autoFocus
          value={planQuickTitle}
          onChange={(event) => setPlanQuickTitle(event.target.value)}
          placeholder="Yeni plan başlığı"
        />
        <select value={planQuickTarget} onChange={(event) => setPlanQuickTarget(event.target.value)}>
          {boardLanes.map((lane) => (
            <option key={lane.id} value={lane.id}>
              {lane.title}
            </option>
          ))}
        </select>
        <input value={planQuickDate} onChange={(event) => setPlanQuickDate(event.target.value)} type="date" />
        <button type="submit">Ekle</button>
      </form>

      <div className="board-scroll" aria-label="Plan kolonları">
        {boardLanes.map((lane, laneIndex) => (
          <section className={`board-lane lane-${laneIndex % 4}`} key={lane.id}>
            <div className="board-lane-head">
              <span>{lane.kicker}</span>
              <strong>{lane.title}</strong>
              <small>{lane.tasks.filter((task) => !task.done).length}</small>
            </div>
            <div className="board-card-list">
              {lane.tasks.length === 0 ? <p className="board-empty">Henüz görev yok.</p> : null}
              {lane.tasks.map((task) => (
                <article className={`board-task-card ${task.done ? "is-done" : ""}`} key={task.id}>
                  <button className="board-check" type="button" aria-label="Görevi tamamla" onClick={() => toggleTask(task.id)} />
                  <button className="board-task-body" type="button" onClick={() => toggleTask(task.id)}>
                    <strong>{task.title}</strong>
                    <small>{[task.date || "", task.time || "", task.endTime ? `Bitiş ${task.endTime}` : ""].filter(Boolean).join(" · ")}</small>
                  </button>
                  <button className="board-delete" type="button" onClick={() => removeTask(task.id)}>
                    Sil
                  </button>
                </article>
              ))}
            </div>
            {lane.kind === "folder" && state.folders.length > 1 ? (
              <button className="board-remove-lane" type="button" onClick={() => deleteFolder(lane.folderId)}>
                Listeyi sil
              </button>
            ) : null}
          </section>
        ))}

        <section className="board-lane new-board-lane">
          <div className="board-lane-head">
            <span>NEW LIST</span>
            <strong>Yeni liste</strong>
            <small>+</small>
          </div>
          <form className="new-list-form" onSubmit={createFolder}>
            <input
              value={folderName}
              onChange={(event) => setFolderName(event.target.value)}
              placeholder="Yeni liste adı"
            />
            <button type="submit">Oluştur</button>
          </form>
        </section>
      </div>
    </section>
  );
}

function WeeklyPlanner({ removeTask, setActiveSection, setState, state, toggleTask, weekDays }) {
  const [dayInputs, setDayInputs] = useState({});
  const dailyFolder = state.folders.find((folder) => folder.id === "daily-default") || state.folders[0];
  const weekTaskCount = state.tasks.filter((task) =>
    weekDays.some((day) => toISODate(day) === task.date) && !task.done
  ).length;

  const addTaskToDay = (event, date) => {
    event.preventDefault();
    const title = (dayInputs[date] || "").trim();
    if (!title) return;

    setState((current) => ({
      ...current,
      selectedDate: date,
      tasks: [
        ...current.tasks,
        {
          id: crypto.randomUUID(),
          title,
          folderId: dailyFolder.id,
          scope: "daily",
          date,
          time: "",
          bucket: "now",
          done: false,
        },
      ],
    }));
    setDayInputs((current) => ({ ...current, [date]: "" }));
  };

  return (
    <section className="weekly-planner">
      <div className="weekly-top">
        <div>
          <span>Weekly Planner</span>
          <h2>{monthFormatter.format(weekDays[0])}</h2>
        </div>
        <strong>{weekTaskCount}</strong>
        <button className="secondary-action" type="button" onClick={() => setActiveSection("home")}>
          Ana sayfaya dön
        </button>
      </div>

      <div className="weekly-grid" aria-label="Haftanın 7 günü">
        {weekDays.map((day, index) => {
          const date = toISODate(day);
          const dayTasks = state.tasks
            .filter((task) => task.date === date)
            .sort((first, second) => (first.time || "99:99").localeCompare(second.time || "99:99"));

          return (
            <section className={`weekly-day weekly-day-${index % 4}`} key={date}>
              <div className="weekly-day-head">
                <span>{weekdayFormatter.format(day)}</span>
                <strong>{day.getDate()}</strong>
                <small>{dayTasks.filter((task) => !task.done).length}</small>
              </div>
              <div className="weekly-task-list">
                {dayTasks.length === 0 ? <p>Bu gün boş.</p> : null}
                {dayTasks.map((task) => (
                  <article className={`weekly-task ${task.done ? "is-done" : ""}`} key={task.id}>
                    <button className="weekly-check" type="button" aria-label="Görevi tamamla" onClick={() => toggleTask(task.id)} />
                    <button className="weekly-task-body" type="button" onClick={() => toggleTask(task.id)}>
                      <strong>{task.title}</strong>
                      <small>{[task.time || "", task.endTime ? `Bitiş ${task.endTime}` : ""].filter(Boolean).join(" · ")}</small>
                    </button>
                    <button className="weekly-delete" type="button" onClick={() => removeTask(task.id)}>
                      Sil
                    </button>
                  </article>
                ))}
              </div>
              <form className="weekly-add-form" onSubmit={(event) => addTaskToDay(event, date)}>
                <span aria-hidden="true">+</span>
                <input
                  value={dayInputs[date] || ""}
                  onChange={(event) => setDayInputs((current) => ({ ...current, [date]: event.target.value }))}
                  placeholder="Bu güne görev ekle"
                />
                <button type="submit">Ekle</button>
              </form>
            </section>
          );
        })}
      </div>
    </section>
  );
}

function ThemeVisual({ theme }) {
  if (theme === "engineer") {
    return (
      <div className="cover-visual engineer-visual" aria-hidden="true">
        <div className="monitor-frame">
          <span />
          <span />
          <span />
          <strong>build.log</strong>
        </div>
        <div className="blueprint-grid">
          <i />
          <i />
          <i />
        </div>
      </div>
    );
  }

  if (theme === "cyber") {
    return (
      <div className="cover-visual cyber-visual" aria-hidden="true">
        {Array.from({ length: 14 }, (_, index) => (
          <span key={index}>1010010110100101</span>
        ))}
      </div>
    );
  }

  return (
    <div className="cover-visual kawaii-visual" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
