import React, { useEffect, useState } from 'react';
import { invoke, view } from '@forge/bridge';
import * as bridge from '@forge/bridge';
import './App.css';

export default function App() {
  const [data, setData] = useState(null);
  const [usage, setUsage] = useState(null);
  const [rewardToasts, setRewardToasts] = useState([]);
  const [rewardBursts, setRewardBursts] = useState([]);
  const [currentProjectKey, setCurrentProjectKey] = useState(null);
  const [error, setError] = useState('');

  const showHostFlag = (toast) => {
    const showFlag = bridge?.showFlag;
    if (typeof showFlag !== 'function') {
      return false;
    }

    try {
      showFlag({
        id: toast.id,
        title: toast.title,
        description: toast.description,
        type: toast.appearance === 'error' ? 'error' : toast.appearance === 'warning' ? 'warning' : 'success',
        isAutoDismiss: true
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  const showRewardToast = (event) => {
    const id = event?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const nextToast = {
      id,
      title: 'Achievement Unlocked',
      description: event?.message || 'Congratulations! You earned points.',
      appearance: event?.appearance || 'success'
    };

    const shownInHost = showHostFlag(nextToast);
    if (shownInHost) {
      return;
    }

    setRewardToasts((prev) => [nextToast, ...prev].slice(0, 4));

    const burstId = `${id}-burst`;
    setRewardBursts((prev) => [
      ...prev,
      {
        id: burstId,
        toastId: id,
        pieces: Array.from({ length: 12 }, (_, i) => ({
          id: `${burstId}-${i}`,
          angle: Math.round((360 / 12) * i),
          distance: 44 + (i % 4) * 12,
          delay: (i % 3) * 0.03
        }))
      }
    ]);

    setTimeout(() => {
      setRewardBursts((prev) => prev.filter((b) => b.id !== burstId));
    }, 900);

    setTimeout(() => {
      setRewardToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5500);
  };

  const refreshGameReport = async () => {
    try {
      const ctx = await view.getContext();
      const projectKey = ctx?.extension?.project?.key || null;
      const projectId = ctx?.extension?.project?.id || null;

      if (!projectKey && !projectId) return;

      const report = await invoke('getMyGameReport', { projectKey, projectId });
      setData(report);
    } catch (err) {
      // silently fail if refresh fails
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const ctx = await view.getContext();

        const projectKey = ctx?.extension?.project?.key || null;
        const projectId = ctx?.extension?.project?.id || null;

        if (!projectKey && !projectId) {
          setError('Unable to identify project from page context.');
          return;
        }

        setCurrentProjectKey(projectKey || null);

        const report = await invoke('getMyGameReport', { projectKey, projectId });
        setData(report);

        await invoke('trackUiEvent', {
          action: 'ui-opened',
          source: 'custom-ui',
          projectKey
        });

        const usageSummary = await invoke('getUsageSummary', { days: 14 });
        setUsage(usageSummary);
      } catch (e) {
        setError(`Error loading QAQuest: ${e?.message || 'unknown'}`);
      }
    })();
  }, []);

  useEffect(() => {
    if (!currentProjectKey) return undefined;

    let mounted = true;

    const pollRewards = async () => {
      try {
        const events = await invoke('consumeRewardEvents', { projectKey: currentProjectKey });
        if (!mounted || !Array.isArray(events) || events.length === 0) return;
        
        events.forEach(showRewardToast);
        
        // Refresh game report after consuming rewards to update points display
        setTimeout(() => {
          if (mounted) refreshGameReport();
        }, 500);
      } catch (err) {
        // Nao bloqueia UI em caso de falha pontual no polling.
      }
    };

    pollRewards();
    const timer = setInterval(pollRewards, 1000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [currentProjectKey]);

  if (error) return <div className="box">⚠️ {error}</div>;
  if (!data) return <div className="box">⏳ Loading QAQuest...</div>;

  const sprintSeries = (data.sprintPerformance || []).slice(-8);

  // Build cumulative series: each bar shows running total of points so far
  const cumulativeSeries = sprintSeries.reduce((acc, s, i) => {
    const prev = i === 0 ? 0 : acc[i - 1].cumulative;
    acc.push({ ...s, cumulative: prev + (s.score || 0) });
    return acc;
  }, []);

  const maxCumulative = Math.max(1, ...cumulativeSeries.map((s) => s.cumulative));
  const chartHeight = 200;
  const chartBarWidth = 42;
  const chartGap = 20;
  const chartPaddingX = 16;
  const chartPaddingY = 24;
  const chartWidth = chartPaddingX * 2 + cumulativeSeries.length * chartBarWidth + Math.max(0, cumulativeSeries.length - 1) * chartGap;

  const compactSprintLabel = (name, index) => {
    const raw = (name || `Sprint ${index + 1}`).trim();
    const numericSuffix = raw.match(/(\d+)\s*$/);
    if (numericSuffix) return `S${numericSuffix[1]}`;
    return raw.length <= 6 ? raw : `${raw.slice(0, 5)}…`;
  };

  return (
    <div className="wrap">
      <div className="reward-toast-stack" aria-live="polite" aria-atomic="true">
        {rewardToasts.map((toast) => (
          <div key={toast.id} className={`reward-toast ${toast.appearance}`}>
            <div className="reward-burst-layer" aria-hidden="true">
              {rewardBursts.filter((burst) => burst.toastId === toast.id).map((burst) => (
                <div key={burst.id} className="reward-burst">
                  {burst.pieces.map((piece) => (
                    <span
                      key={piece.id}
                      className="reward-burst-piece"
                      style={{
                        '--burst-angle': `${piece.angle}deg`,
                        '--burst-distance': `${piece.distance}px`,
                        '--burst-delay': `${piece.delay}s`
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="reward-toast-title">{toast.title}</div>
            <div className="reward-toast-desc">{toast.description}</div>
          </div>
        ))}
      </div>

      <h2>🎮 QAQuest - Dashboard</h2>
      <p>Your Xray data for project <b>{data.projectKey}</b>.</p>

      <div className="grid">
        <div className="card">🧪 Tests Created: <b>{data.totals.testsCreatedByMe}</b></div>
        <div className="card">⚙️ Executions: <b>{data.totals.executionsByMe}</b></div>
        <div className="card">🐞 Defects Reported: <b>{data.totals.defectsReportedByMe}</b></div>
        <div className="card">🔁 Defects Retested: <b>{data.totals.defectsRetestedAfterResolved}</b></div>
        <div className="card">🗂️ Test Plans: <b>{data.totals.testPlansCreatedByMe}</b></div>
        <div className="card">✅ Plans with Tests: <b>{data.totals.testPlansWithAssociatedTests}</b></div>
        <div className="card">🧭 Story Coverage: <b>{data.totals.storyCoveragePct}%</b></div>
        <div className="card">🏃 Sprint Resolved: <b>{data.totals.sprintResolvedBeforeEndPct}%</b></div>
        <div className="card">⭐ QA Points: <b>{data.totals.points}</b></div>
        <div className="card">🏅 Level: <b>{data.totals.level}</b></div>
      </div>

      <h3>Quality Assurance</h3>
      <div className="grid">
        <div className="card">📝 Tests with Description: <b>{data.totals.descriptionCoveragePct}%</b></div>
        <div className="card">📜 Gherkin Steps: <b>{data.totals.gherkinCoveragePct}%</b></div>
        <div className="card">📎 Evidence Attached: <b>{data.totals.evidenceCoveragePct}%</b></div>
        <div className="card">🔗 Linked to Story/Task: <b>{data.totals.traceabilityCoveragePct}%</b></div>
      </div>

      <h3>Current Sprint</h3>
      <div className="grid">
        <div className="card">📅 Sprint: <b>{data.sprint?.name || 'Not found'}</b></div>
        <div className="card">⏱️ Duration: <b>{data.sprint?.durationDays ?? '-'} days</b></div>
        <div className="card">📌 Two-Week Window: <b>{data.sprint?.isTwoWeekSprint === null ? '-' : data.sprint?.isTwoWeekSprint ? 'Yes' : 'No'}</b></div>
        <div className="card">🛠️ Moved to In Progress: <b>{data.totals.sprintMovedToInProgress}</b></div>
        <div className="card">✅ Resolved Before End: <b>{data.totals.sprintResolvedBeforeEnd}</b></div>
        <div className="card">📦 Tracked Items: <b>{data.sprint?.trackedItems || 0}</b></div>
      </div>

      <h3>Sprint Performance</h3>
      {sprintSeries.length === 0 ? (
        <div className="box">No sprint data available yet.</div>
      ) : (
        <div className="chart-wrap">
          <svg
            width={chartWidth}
            height={chartHeight + 80}
            viewBox={`0 0 ${chartWidth} ${chartHeight + 80}`}
            preserveAspectRatio="xMinYMin meet"
            className="sprint-chart"
            role="img"
            aria-label="Cumulative QA points per sprint"
          >
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>

            {/* Bars */}
            {cumulativeSeries.map((s, i) => {
              const x = chartPaddingX + i * (chartBarWidth + chartGap);
              const h = Math.max(8, Math.round((s.cumulative / maxCumulative) * chartHeight));
              const y = chartPaddingY + (chartHeight - h);
              const shortName = compactSprintLabel(s.sprintName, i);
              const fullName = s.sprintName || `Sprint ${i + 1}`;

              return (
                <g key={s.sprintId || `${s.sprintName}-${i}`}>
                  <title>{`${fullName}: ${s.cumulative} pts acumulados (+${s.score} pts)`}</title>
                  <rect x={x} y={y} width={chartBarWidth} height={h} rx="8" className="bar-total" />
                  <text x={x + chartBarWidth / 2} y={y - 6} textAnchor="middle" className="bar-value">{s.cumulative}</text>
                  <text x={x + chartBarWidth / 2} y={chartHeight + chartPaddingY + 28} textAnchor="middle" className="bar-label">{shortName}</text>
                </g>
              );
            })}

            
          </svg>
        </div>
      )}

      <h3>Badges</h3>
      <div className="badges">
        {(data.badges || []).map((b) => (
          <div key={b.id} className={`badge ${b.unlocked ? 'unlocked' : 'locked'}`}>
            <span className="badge-emoji">{b.emoji}</span>
            <span className="badge-name">{b.name}</span>
            <span className="badge-level">{b.metricValue}{b.metricType === 'percent' ? '%' : ''} • Lv {b.level}/{b.maxLevel}</span>
          </div>
        ))}
      </div>

      <h3>Plugin Usage (Last 14 Days)</h3>
      {!usage ? (
        <div className="box">Loading usage metrics...</div>
      ) : (
        <div className="grid">
          <div className="card">📈 Total Events: <b>{usage.totalEvents}</b></div>
          <div className="card">👤 Active Users (Month): <b>{usage.monthlyActiveUsers}</b></div>
          <div className="card">🏢 Active Sites (Month): <b>{usage.monthlyActiveSites}</b></div>
        </div>
      )}
    </div>
  );
}