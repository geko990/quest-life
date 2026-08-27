import React, { useState, useEffect, useRef } from 'react';
import { getGameDate, getGameDateObj, formatISO, getWeekIdentifier, getMonthIdentifier, getYearIdentifier } from '../utils/helpers';
import SwipeableCard from '../components/SwipeableCard';
import { useTouchReorder } from '../utils/useTouchReorder';

export default function HabitsTab({
  habits = [],
  setHabits,
  completionLog,
  setCompletionLog,
  onToggleHabit,
  onOpenModal,
  onDeleteHabit,
  onEditHabit,
  stats,
  settings
}) {
  const { getDragProps } = useTouchReorder(habits, setHabits);
  const todayStr = getGameDate(settings.dayStartTime);
  const [viewedDate, setViewedDate] = useState(todayStr);
  const calendarScrollRef = useRef(null);

  // Scroll calendar to end on mount
  useEffect(() => {
    if (calendarScrollRef.current) {
      calendarScrollRef.current.scrollLeft = calendarScrollRef.current.scrollWidth;
    }
  }, []);

  // Count completions in period
  const countCompletionsInPeriod = (habitId, frequency, periodId) => {
    let count = 0;
    Object.keys(completionLog).forEach(dateStr => {
      const log = completionLog[dateStr];
      if (log?.habits?.includes(habitId)) {
        const isWeekly = frequency === 'weekly' || frequency === 'times_week';
        const isMonthly = frequency === 'monthly' || frequency === 'times_month';
        const logPeriodId = isWeekly ? getWeekIdentifier(dateStr, settings.weekStart) :
                            isMonthly ? getMonthIdentifier(dateStr) :
                            getYearIdentifier(dateStr);
        if (logPeriodId === periodId) {
          count++;
        }
      }
    });
    return count;
  };

  // Helper: get visible habits for date
  const getHabitsForDate = (dateStr) => {
    return habits.filter(h => {
      if (h.locked) return false;

      if (h.createdAt) {
        const createdDate = h.createdAt.split('T')[0];
        if (createdDate > dateStr) return false;
      }

      return true;
    });
  };

  const isHabitCompletedOnDate = (habitId, dateStr) => {
    return completionLog[dateStr]?.habits?.includes(habitId) || false;
  };

  const getCompletionPercentageForDate = (dateStr) => {
    const visibleHabits = getHabitsForDate(dateStr);
    if (visibleHabits.length === 0) return 0;
    let completed = 0;
    visibleHabits.forEach(h => {
      if (isHabitCompletedOnDate(h.id, dateStr)) completed++;
    });
    return Math.floor((completed / visibleHabits.length) * 100);
  };

  // Generate calendar days
  const calendarDays = [];
  const startDay = getGameDateObj(settings.dayStartTime);
  for (let i = 21; i >= 0; i--) {
    const dateObj = new Date(startDay);
    dateObj.setDate(dateObj.getDate() - i);
    calendarDays.push(dateObj);
  }

  const visibleHabits = getHabitsForDate(viewedDate);
  const habitsToShow = visibleHabits
    .map(h => ({
      ...h,
      completed: isHabitCompletedOnDate(h.id, viewedDate)
    }))
    .sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return 0;
    });

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // XP calculation from stars/difficulty
  const calculateXp = (stars = 1) => (stars || 1) * 10;

  return (
    <section id="section-habits" className="section active">
      {/* Calendar Header (v3.3.0) */}
      <div className="calendar-container" id="calendarContainer">
        <div className="calendar-scroll" id="calendarScroll" ref={calendarScrollRef}>
          {calendarDays.map((day, idx) => {
            const dateStr = formatISO(day);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === viewedDate;
            const completionPct = getCompletionPercentageForDate(dateStr);
            const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

            return (
              <div
                key={idx}
                onClick={() => setViewedDate(dateStr)}
                className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'active' : ''}`}
              >
                <div className="calendar-day-name">{dayNames[day.getDay()]}</div>
                <div className="calendar-day-number" style={{ position: 'relative' }}>
                  {/* SVG Circular Completion Ring */}
                  <svg
                    viewBox="0 0 44 44"
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      left: '-4px',
                      width: '44px',
                      height: '44px',
                      transform: 'rotate(-90deg)',
                      pointerEvents: 'none'
                    }}
                  >
                    <circle
                      cx="22"
                      cy="22"
                      r="19"
                      fill="none"
                      stroke="var(--glass-border)"
                      strokeWidth="2.5"
                      opacity="0.3"
                    />
                    {completionPct > 0 && (
                      <circle
                        cx="22"
                        cy="22"
                        r="19"
                        fill="none"
                        stroke={completionPct === 100 ? '#10b981' : 'var(--accent-primary)'}
                        strokeWidth="2.5"
                        strokeDasharray={2 * Math.PI * 19}
                        strokeDashoffset={2 * Math.PI * 19 * (1 - completionPct / 100)}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.3s ease' }}
                      />
                    )}
                  </svg>
                  <span style={{ position: 'relative', zIndex: 2 }}>{day.getDate()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Habits Wrapper (v3.3.0) */}
      <div className="habits-wrapper">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', gap: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            📜 Abitudini <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-secondary)' }}>({viewedDate === todayStr ? 'Oggi' : viewedDate})</span>
          </h2>
          <div className="header-actions" style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              className="add-btn-circle"
              onClick={() => onOpenModal('habit')}
            >
              +
            </button>
          </div>
        </div>

        {/* Habits List (v3.3.0 original card structure) */}
        <div className="habits-list" id="habitsList">
          {habitsToShow.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📜</div>
              <div className="empty-state-text">Nessuna abitudine</div>
              <div className="empty-state-hint">Clicca "+" per iniziare</div>
            </div>
          ) : (
            habitsToShow.map((h, idx) => {
              const isCompleted = h.completed;
              const primaryStat = stats.find(s => s.id === (h.primaryStatId || h.primaryTarget));
              const secondaryStat = stats.find(s => s.id === (h.secondaryStatId || h.secondaryTarget));
              const starsCount = h.difficulty !== undefined ? h.difficulty : (h.stars || 1);
              const dragProps = getDragProps(h, idx);

              return (
                <div
                  key={h.id}
                  className={`task-card ${h.locked ? 'locked' : ''} ${isCompleted ? 'completed' : ''}`}
                  data-type="habit"
                  data-id={h.id}
                  {...dragProps}
                >
                  <div className="swipe-content" onClick={() => onOpenModal('habit_detail', h)}>
                    {/* Checkbox (v3.3.0 card-checkbox) */}
                    <div
                      className={`card-checkbox ${isCompleted ? 'checked' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleHabit(h.id, viewedDate);
                      }}
                    ></div>

                    {/* Content (v3.3.0 card-content & card-meta) */}
                    <div className="card-content">
                      <div className={`card-title ${isCompleted ? 'line-through opacity-60' : ''}`}>
                        {h.emoji ? `${h.emoji} ` : ''}{h.name}
                      </div>
                      <div className="card-meta">
                        <span className="card-stars">{'⭐'.repeat(starsCount)}</span>
                        {primaryStat && <span className="card-stat" title={primaryStat.name}>{primaryStat.icon}</span>}
                        {secondaryStat && <span className="card-stat" style={{ opacity: 0.6 }} title={secondaryStat.name}>{secondaryStat.icon}</span>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '32px', flexShrink: 0 }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ef4444', background: 'rgba(239, 68, 68, 0.12)', padding: '2px 7px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                        🔥 {h.streak || 0}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
