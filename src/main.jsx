import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const storageKey = "kawaii-life-planner-state";
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
      done: false,
    },
    {
      id: crypto.randomUUID(),
      title: "Kısa mola ve su hatırlatması",
      folderId: "daily-default",
      scope: "daily",
      date: toISODate(today),
      time: "15:00",
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
      })),
    };
  } catch {
    return defaultState;
  }
};

function App() {
  const [state, setState] = useState(loadState);
  const [theme, setTheme] = useState("kawaii");
  const [activeSection, setActiveSection] = useState("home");
  const [clock, setClock] = useState(new Date());
  const [timerMode, setTimerMode] = useState("focus");
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [quickPlan, setQuickPlan] = useState("");
  const [quickDay, setQuickDay] = useState("today");
  const [slotDraft, setSlotDraft] = useState(null);
  const [slotTitle, setSlotTitle] = useState("");
  const [slotNote, setSlotNote] = useState("");
  const [slotShowNote, setSlotShowNote] = useState(false);
  const [slotEndTime, setSlotEndTime] = useState("11:00");
  const [detailTaskId, setDetailTaskId] = useState(null);
  const [detailEditing, setDetailEditing] = useState(false);
  const [detailNote, setDetailNote] = useState("");
  const [draftSlot, setDraftSlot] = useState({
    date: state.selectedDate,
    time: "10:00",
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

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

  const completedCount = state.tasks.filter((task) => task.done).length;
  const activeCount = state.tasks.filter((task) => !task.done).length;
  const activeTheme = themes[theme];
  const detailTask = state.tasks.find((task) => task.id === detailTaskId);
  const todayIso = toISODate(today);
  const tomorrowIso = toISODate(addDays(today, 1));
  const dailyTodoTasks = state.tasks
    .filter((task) => task.scope === "daily" && task.date === todayIso && !task.done)
    .sort((first, second) => (first.time || "99:99").localeCompare(second.time || "99:99"));

  const addQuickPlan = (event) => {
    event.preventDefault();
    const title = quickPlan.trim();
    if (!title) return;

    const targetDate = quickDay === "tomorrow" ? tomorrowIso : todayIso;
    const dailyFolder = state.folders.find((folder) => folder.id === "daily-default") || state.folders[0];

    setState((current) => ({
      ...current,
      selectedDate: targetDate,
      tasks: [
        ...current.tasks,
        {
          id: crypto.randomUUID(),
          title,
          folderId: dailyFolder.id,
          scope: "daily",
          date: targetDate,
          time: "",
          done: false,
        },
      ],
    }));
    setQuickPlan("");
  };

  const openSlotPopup = (date, time) => {
    selectSlot(date, time);
    setSlotDraft({ date, time });
    setSlotTitle("");
    setSlotNote("");
    setSlotShowNote(false);
    setSlotEndTime(addHoursToTime(time, 1));
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
    setDetailNote(task.note || "");
  };

  const saveTaskNote = () => {
    if (!detailTask) return;
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === detailTask.id ? { ...task, note: detailNote.trim() } : task)),
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
            <div className="section-title">
              <span>Bugünkü To-dos</span>
              <strong>{dailyTodoTasks.length}</strong>
            </div>
            <form className="quick-plan-form" onSubmit={addQuickPlan}>
              <input
                value={quickPlan}
                onChange={(event) => setQuickPlan(event.target.value)}
                placeholder="Hızlı plan ekle"
              />
              <div className="quick-plan-actions">
                <button className={quickDay === "today" ? "is-active" : ""} type="button" onClick={() => setQuickDay("today")}>
                  Bugün
                </button>
                <button
                  className={quickDay === "tomorrow" ? "is-active" : ""}
                  type="button"
                  onClick={() => setQuickDay("tomorrow")}
                >
                  Yarın
                </button>
                <button type="submit">Ekle</button>
              </div>
            </form>
            <div className="todo-list">
              {dailyTodoTasks.length === 0 ? (
                <p className="empty-note">Bugün için günlük plan yok.</p>
              ) : null}
              {dailyTodoTasks.slice(0, 6).map((task) => (
                <button
                  className={`todo-item ${task.done ? "is-done" : ""}`}
                  key={task.id}
                  type="button"
                  onClick={() => toggleTask(task.id)}
                >
                  <span />
                  {task.title}
                </button>
              ))}
            </div>
          </section>
        </aside>

        <section className="calendar-card">
          <div className="calendar-head">
            <div>
              <span>Calendar</span>
              <h2>{monthFormatter.format(new Date(`${state.selectedDate}T12:00:00`))}</h2>
            </div>
            <p>{dateFormatter.format(new Date(`${state.selectedDate}T12:00:00`))}</p>
          </div>

          <div className="week-calendar" role="grid" aria-label="Haftalık saatli takvim">
            <div className="time-corner">Saat</div>
            {weekDays.map((day) => {
              const iso = toISODate(day);
              return (
                <button
                  className={`day-head ${iso === state.selectedDate ? "is-selected" : ""}`}
                  key={iso}
                  type="button"
                  onClick={() => selectSlot(iso, draftSlot.time)}
                >
                  <span>{weekdayFormatter.format(day)}</span>
                  <strong>{day.getDate()}</strong>
                </button>
              );
            })}

            {hours.map((hour) => (
              <React.Fragment key={hour}>
                <div className="time-label">{hour}</div>
                {weekDays.map((day) => {
                  const iso = toISODate(day);
                  const cellTasks = state.tasks.filter(
                    (task) => task.date === iso && (task.time || "").slice(0, 2) === hour.slice(0, 2)
                  );
                  const cellReminders = state.reminders.filter(
                    (reminder) => reminder.date === iso && (reminder.time || "").slice(0, 2) === hour.slice(0, 2)
                  );

                  return (
                    <div
                      className={`time-cell ${iso === state.selectedDate ? "is-selected" : ""}`}
                      key={`${iso}-${hour}`}
                      onClick={() => openSlotPopup(iso, hour)}
                    >
                      {[...cellTasks, ...cellReminders].map((item) => (
                        <article
                          className={`event-pill ${"folderId" in item ? "" : "no-check"} ${item.done ? "is-done" : ""}`}
                          key={item.id}
                        >
                          {"folderId" in item ? (
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
                              if ("folderId" in item) openTaskDetail(item);
                            }}
                          >
                            <span>{item.title}</span>
                            {"endTime" in item && item.endTime ? <small>{item.time} - {item.endTime}</small> : null}
                          </button>
                        </article>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </section>

        <aside className="right-rail">
          <section className="clock-card">
            <span>{clock.getHours() >= 12 ? "PM" : "AM"}</span>
            <strong>{String(clock.getHours()).padStart(2, "0")}</strong>
            <strong>{String(clock.getMinutes()).padStart(2, "0")}</strong>
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
      ) : (
        <PlanWorkspace
          draftSlot={draftSlot}
          setActiveSection={setActiveSection}
          setState={setState}
          state={state}
          toggleTask={toggleTask}
          removeTask={removeTask}
        />
      )}
      {slotDraft ? (
        <div className="slot-popover-backdrop" role="presentation" onClick={() => setSlotDraft(null)}>
          <form className="slot-popover" onClick={(event) => event.stopPropagation()} onSubmit={addSlotPlan}>
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
                Başlangıç
                <input value={slotDraft.time} readOnly type="time" />
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
      {detailTask ? (
        <div className="slot-popover-backdrop" role="presentation" onClick={() => setDetailTaskId(null)}>
          <section className="slot-popover task-detail-popover" onClick={(event) => event.stopPropagation()}>
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
                  Detay notu
                  <textarea
                    autoFocus
                    value={detailNote}
                    onChange={(event) => setDetailNote(event.target.value)}
                    placeholder="Bu planla ilgili detayları düzenle..."
                  />
                </label>
                <div className="slot-popover-actions">
                  <button className="secondary-action" type="button" onClick={() => setDetailEditing(false)}>
                    Vazgeç
                  </button>
                  <button className="submit-button" type="button" onClick={saveTaskNote}>
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

function PlanWorkspace({ draftSlot, removeTask, setActiveSection, setState, state, toggleTask }) {
  const [selectedFolderId, setSelectedFolderId] = useState(state.folders[0]?.id || "");
  const [folderName, setFolderName] = useState("");
  const [planForm, setPlanForm] = useState({
    title: "",
    scope: "daily",
    useDate: true,
    date: draftSlot.date,
    useTime: true,
    time: draftSlot.time,
    routine: false,
  });

  useEffect(() => {
    setPlanForm((current) => ({
      ...current,
      date: draftSlot.date,
      time: draftSlot.time,
    }));
  }, [draftSlot]);

  useEffect(() => {
    if (!state.folders.some((folder) => folder.id === selectedFolderId)) {
      setSelectedFolderId(state.folders[0]?.id || "");
    }
  }, [selectedFolderId, state.folders]);

  const selectedFolder = state.folders.find((folder) => folder.id === selectedFolderId);
  const folderPlans = state.tasks
    .filter((task) => task.folderId === selectedFolderId)
    .sort((first, second) => {
      const firstDate = first.date || "9999-12-31";
      const secondDate = second.date || "9999-12-31";
      if (firstDate !== secondDate) return firstDate.localeCompare(secondDate);
      return (first.time || "99:99").localeCompare(second.time || "99:99");
    });

  const updatePlanForm = (key, value) => {
    setPlanForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "scope" && value === "general") {
        next.useDate = false;
        next.routine = false;
      }
      return next;
    });
  };

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
    setSelectedFolderId(folder.id);
    setFolderName("");
  };

  const addPlan = (event) => {
    event.preventDefault();
    const title = planForm.title.trim();
    if (!title || !selectedFolderId) return;

    const baseDate = planForm.useDate ? planForm.date : "";
    const baseTime = planForm.useTime ? planForm.time : "";
    const shouldRepeat = planForm.routine && planForm.scope === "daily";
    const repeatStart = baseDate || toISODate(today);
    const repeatCount = shouldRepeat ? 30 : 1;

    const plans = Array.from({ length: repeatCount }, (_, index) => {
      const date = shouldRepeat ? toISODate(addDays(new Date(`${repeatStart}T12:00:00`), index)) : baseDate;
      return {
        id: crypto.randomUUID(),
        title,
        folderId: selectedFolderId,
        scope: planForm.scope,
        date,
        time: baseTime,
        done: false,
        routine: shouldRepeat,
      };
    });

    setState((current) => ({
      ...current,
      selectedDate: plans[0].date || current.selectedDate,
      tasks: [...current.tasks, ...plans],
    }));

    setPlanForm((current) => ({
      ...current,
      title: "",
    }));
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
    <section className="plan-workspace">
      <aside className="folder-panel">
        <div className="section-title">
          <span>Klasörler</span>
          <strong>{state.folders.length}</strong>
        </div>
        <form className="folder-form" onSubmit={createFolder}>
          <label>
            Yeni klasör
            <input
              value={folderName}
              onChange={(event) => setFolderName(event.target.value)}
              placeholder="Örn. Günlük yapılacaklar"
            />
          </label>
          <button className="submit-button" type="submit">
            Klasör aç
          </button>
        </form>
        <div className="folder-list">
          {state.folders.map((folder) => (
            <article className={`folder-item ${folder.id === selectedFolderId ? "is-active" : ""}`} key={folder.id}>
              <button type="button" onClick={() => setSelectedFolderId(folder.id)}>
                <span>{folder.name}</span>
                <small>{state.tasks.filter((task) => task.folderId === folder.id).length} plan</small>
              </button>
              {state.folders.length > 1 ? (
                <button className="folder-delete" type="button" onClick={() => deleteFolder(folder.id)}>
                  Sil
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </aside>

      <section className="plan-editor">
        <div className="section-title">
          <span>Plan oluştur</span>
          <strong>{selectedFolder?.name || "Klasör seç"}</strong>
        </div>
        <form className="plan-builder-form" onSubmit={addPlan}>
          <label className="wide-field">
            Plan başlığı
            <input
              value={planForm.title}
              onChange={(event) => updatePlanForm("title", event.target.value)}
              placeholder="Örn. Sabah notlarını yaz"
            />
          </label>

          <div className="type-toggle" role="radiogroup" aria-label="Plan kapsamı">
            <button
              className={planForm.scope === "daily" ? "is-active" : ""}
              type="button"
              onClick={() => updatePlanForm("scope", "daily")}
            >
              Günlük plan
            </button>
            <button
              className={planForm.scope === "general" ? "is-active" : ""}
              type="button"
              onClick={() => updatePlanForm("scope", "general")}
            >
              Genel plan
            </button>
          </div>

          <div className="option-grid">
            <label className="check-option">
              <input
                checked={planForm.useDate}
                disabled={planForm.scope === "general"}
                onChange={(event) => updatePlanForm("useDate", event.target.checked)}
                type="checkbox"
              />
              Tarih seç
            </label>
            {planForm.useDate ? (
              <label>
                Tarih
                <input value={planForm.date} onChange={(event) => updatePlanForm("date", event.target.value)} type="date" />
              </label>
            ) : null}

            <label className="check-option">
              <input
                checked={planForm.useTime}
                onChange={(event) => updatePlanForm("useTime", event.target.checked)}
                type="checkbox"
              />
              Saat seç
            </label>
            {planForm.useTime ? (
              <label>
                Saat
                <input value={planForm.time} onChange={(event) => updatePlanForm("time", event.target.value)} type="time" />
              </label>
            ) : null}
          </div>

          <label className="check-option routine-option">
            <input
              checked={planForm.routine}
              disabled={planForm.scope === "general"}
              onChange={(event) => updatePlanForm("routine", event.target.checked)}
              type="checkbox"
            />
            Rutin olarak 1 ay boyunca her güne ekle
          </label>

          <div className="plan-actions">
            <button className="secondary-action" type="button" onClick={() => setActiveSection("home")}>
              Takvime dön
            </button>
            <button className="submit-button" type="submit">
              Planı ekle
            </button>
          </div>
        </form>
      </section>

      <aside className="folder-preview">
        <div className="section-title">
          <span>Klasör içeriği</span>
          <strong>{folderPlans.length}</strong>
        </div>
        <div className="folder-plan-list">
          {folderPlans.length === 0 ? (
            <p>Bu klasör henüz boş.</p>
          ) : (
            folderPlans.map((plan) => (
              <article className={`folder-plan ${plan.done ? "is-done" : ""}`} key={plan.id}>
                <button type="button" onClick={() => toggleTask(plan.id)}>
                  <span>{plan.scope === "daily" ? "Günlük" : "Genel"}</span>
                  <strong>{plan.title}</strong>
                  <small>
                    {[plan.date || "Tarih yok", plan.time || "Saat yok", plan.routine ? "Rutin" : ""]
                      .filter(Boolean)
                      .join(" · ")}
                  </small>
                </button>
                <button className="folder-delete" type="button" onClick={() => removeTask(plan.id)}>
                  Sil
                </button>
              </article>
            ))
          )}
        </div>
      </aside>
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
