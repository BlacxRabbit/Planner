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

const defaultState = {
  selectedDate: toISODate(today),
  tasks: [
    {
      id: crypto.randomUUID(),
      title: "Haftalık planı pembe ajandaya işle",
      date: toISODate(today),
      time: "09:00",
      done: false,
    },
    {
      id: crypto.randomUUID(),
      title: "Kısa mola ve su hatırlatması",
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
    return { ...defaultState, ...JSON.parse(saved) };
  } catch {
    return defaultState;
  }
};

function App() {
  const [state, setState] = useState(loadState);
  const [theme, setTheme] = useState("kawaii");
  const [clock, setClock] = useState(new Date());
  const [timerMode, setTimerMode] = useState("focus");
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [form, setForm] = useState({
    title: "",
    date: state.selectedDate,
    time: "10:00",
    type: "task",
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
    return [...taskItems, ...reminderItems].sort((first, second) => first.time.localeCompare(second.time));
  }, [state]);

  const completedCount = state.tasks.filter((task) => task.done).length;
  const activeCount = state.tasks.filter((task) => !task.done).length;
  const activeTheme = themes[theme];

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const addItem = (event) => {
    event.preventDefault();
    const nextItem = {
      id: crypto.randomUUID(),
      title: form.title.trim(),
      date: form.date,
      time: form.time || "09:00",
    };

    if (!nextItem.title) return;

    setState((current) => {
      if (form.type === "reminder") {
        return { ...current, reminders: [...current.reminders, nextItem] };
      }

      return {
        ...current,
        tasks: [...current.tasks, { ...nextItem, done: false }],
      };
    });

    setForm((current) => ({ ...current, title: "" }));
  };

  const selectSlot = (date, time) => {
    setState((current) => ({ ...current, selectedDate: date }));
    setForm((current) => ({ ...current, date, time }));
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

      <section className="planner-grid">
        <aside className="left-rail">
          <section className="character-slot" aria-label="Tema ikon alanı">
            <ThemeMark theme={theme} />
            <p>{activeTheme.characterTitle}</p>
            <small>{activeTheme.characterNote}</small>
          </section>

          <section className="todo-card">
            <div className="section-title">
              <span>To-dos</span>
              <strong>{activeCount}</strong>
            </div>
            <div className="todo-list">
              {state.tasks.slice(0, 5).map((task) => (
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
                  onClick={() => selectSlot(iso, form.time)}
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
                    (task) => task.date === iso && task.time.slice(0, 2) === hour.slice(0, 2)
                  );
                  const cellReminders = state.reminders.filter(
                    (reminder) => reminder.date === iso && reminder.time.slice(0, 2) === hour.slice(0, 2)
                  );

                  return (
                    <button
                      className={`time-cell ${iso === state.selectedDate ? "is-selected" : ""}`}
                      key={`${iso}-${hour}`}
                      type="button"
                      onClick={() => selectSlot(iso, hour)}
                    >
                      {[...cellTasks, ...cellReminders].map((item) => (
                        <span className={`event-pill ${item.done ? "is-done" : ""}`} key={item.id}>
                          {item.title}
                        </span>
                      ))}
                    </button>
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

          <section className="add-card">
            <div className="section-title">
              <span>Plan ekle</span>
              <strong>{completedCount} bitti</strong>
            </div>
            <form onSubmit={addItem}>
              <label>
                Başlık
                <input
                  value={form.title}
                  onChange={(event) => updateForm("title", event.target.value)}
                  placeholder="Örn. Notları düzenle"
                />
              </label>
              <div className="form-row">
                <label>
                  Tarih
                  <input value={form.date} onChange={(event) => updateForm("date", event.target.value)} type="date" />
                </label>
                <label>
                  Saat
                  <input value={form.time} onChange={(event) => updateForm("time", event.target.value)} type="time" />
                </label>
              </div>
              <div className="type-toggle" role="radiogroup" aria-label="Plan tipi">
                <button
                  className={form.type === "task" ? "is-active" : ""}
                  type="button"
                  onClick={() => updateForm("type", "task")}
                >
                  Görev
                </button>
                <button
                  className={form.type === "reminder" ? "is-active" : ""}
                  type="button"
                  onClick={() => updateForm("type", "reminder")}
                >
                  Anımsatıcı
                </button>
              </div>
              <button className="submit-button" type="submit">
                Ekle
              </button>
            </form>
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
                      <span>{item.time}</span>
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
