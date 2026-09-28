import { useState } from 'react'
import { ShieldCheck, AlertTriangle, Info, ChevronDown, ChevronUp, Target, Award, Compass } from 'lucide-react'

/**
 * BenchmarkMetric Component
 * 
 * Provides an institutional point-range benchmark metric for strategic decisions.
 * Compares executive readiness & confidence scores against a calibrated 70-point minimum threshold.
 * 
 * @param {number} score - Current score (0 - 100)
 * @param {string} metricName - Name of metric (e.g. "Decision Readiness" or "Executive Confidence")
 * @param {number} benchmark - Minimum institutional threshold (default 70)
 * @param {string} subtitle - Optional contextual subtitle
 */
export default function BenchmarkMetric({ 
  score = 0, 
  metricName = "Strategic Readiness", 
  benchmark = 70,
  subtitle
}) {
  const [showGuide, setShowGuide] = useState(false);
  const clampedScore = Math.max(0, Math.min(100, Math.round(score || 0)));
  const diff = clampedScore - benchmark;
  const isAboveBenchmark = diff >= 0;

  // Determine current tier
  let tier = {
    name: "Critical Ambiguity",
    range: "0 – 39",
    color: "var(--badge-red-text, #ef4444)",
    bg: "var(--badge-red-bg, rgba(239, 68, 68, 0.12))",
    border: "rgba(239, 68, 68, 0.3)",
    status: "Below Minimum Threshold",
    analysis: "Strategic framing has critical blindspots or insufficient evidence. Human analysis advises against irreversible capital allocation until key assumptions are validated.",
    action: "Re-examine problem framing, stress-test underlying hypotheses, and solicit contradictory data."
  };

  if (clampedScore >= 85) {
    tier = {
      name: "Exemplary Precision",
      range: "85 – 100",
      color: "var(--badge-blue-text, #38bdf8)",
      bg: "var(--badge-blue-bg, rgba(56, 189, 248, 0.12))",
      border: "rgba(56, 189, 248, 0.3)",
      status: "High Conviction · Optimal Rigor",
      analysis: "High evidentiary depth, balanced multi-criteria alignment, and clear option separation. Resilient against market volatility with robust risk awareness.",
      action: "Greenlight for rapid commitment with designated milestone governance and KPIs."
    };
  } else if (clampedScore >= 70) {
    tier = {
      name: "Executive Benchmark",
      range: "70 – 84",
      color: "var(--badge-green-text, #22c55e)",
      bg: "var(--badge-green-bg, rgba(34, 197, 94, 0.12))",
      border: "rgba(34, 197, 94, 0.3)",
      status: "Decision-Ready · Benchmark Met",
      analysis: "Meets or exceeds the institutional benchmark for board-level execution. Sound trade-off analysis conducted with manageable residual uncertainty.",
      action: "Proceed to stakeholder sign-off and phased execution roadmap."
    };
  } else if (clampedScore >= 40) {
    tier = {
      name: "Conditional Viability",
      range: "40 – 69",
      color: "var(--badge-amber-text, #f59e0b)",
      bg: "var(--badge-amber-bg, rgba(245, 158, 11, 0.12))",
      border: "rgba(245, 158, 11, 0.3)",
      status: "Caution · Refinement Recommended",
      analysis: "Core options and initial criteria are framed, but residual ambiguity or close option scores pose execution friction. Approaching the benchmark threshold.",
      action: "Conduct targeted sensitivity analysis on top risk factors before final commitment."
    };
  }

  const tiers = [
    {
      range: "0 – 39",
      title: "Critical Ambiguity",
      color: "var(--badge-red-text, #ef4444)",
      desc: "Incomplete evidence or excessive bias risk. Do not commit.",
      tag: "Unsafe"
    },
    {
      range: "40 – 69",
      title: "Conditional Viability",
      color: "var(--badge-amber-text, #f59e0b)",
      desc: "Baseline viable, but sensitive to assumptions. Refine before signing off.",
      tag: "Caution"
    },
    {
      range: "70 – 84",
      title: "Executive Benchmark",
      color: "var(--badge-green-text, #22c55e)",
      desc: "Standard institutional threshold. Fully cleared for strategic commitment.",
      tag: "★ Min Benchmark (70)"
    },
    {
      range: "85 – 100",
      title: "Exemplary Precision",
      color: "var(--badge-blue-text, #38bdf8)",
      desc: "Antifragile, high conviction, thorough stress-testing. World-class rigor.",
      tag: "Exemplary"
    }
  ];

  return (
    <div style={{
      background: 'var(--s2)',
      border: '1px solid var(--b1)',
      borderRadius: '12px',
      padding: '20px 22px',
      marginTop: '20px',
      marginBottom: '20px',
      boxSizing: 'border-box'
    }}>
      {/* Top Row: Metric Title & Current Benchmark Comparison */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={18} style={{ color: 'var(--ac)' }} />
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--t1)' }}>{metricName} Benchmark Meter</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--t3)', marginTop: '3px' }}>
            {subtitle || `Institutional Decision Threshold: Minimum ${benchmark} / 100 pts`}
          </div>
        </div>

        {/* Delta Tag */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: '20px',
          fontSize: '0.82rem',
          fontWeight: 700,
          background: tier.bg,
          color: tier.color,
          border: `1px solid ${tier.border}`
        }}>
          {isAboveBenchmark ? <ShieldCheck size={15} /> : <AlertTriangle size={15} />}
          <span>
            {clampedScore} / 100 · {tier.name}
          </span>
          <span style={{ opacity: 0.8, fontSize: '0.76rem', borderLeft: `1px solid ${tier.color}40`, paddingLeft: '6px', marginLeft: '2px' }}>
            {isAboveBenchmark ? `+${diff} above benchmark` : `${Math.abs(diff)} below benchmark`}
          </span>
        </div>
      </div>

      {/* Visual Benchmark Range Track */}
      <div style={{ position: 'relative', marginTop: '22px', marginBottom: '28px', padding: '0 4px' }}>
        {/* Multi-tier gradient bar */}
        <div style={{
          height: '10px',
          width: '100%',
          borderRadius: '5px',
          background: 'linear-gradient(to right, #ef4444 0%, #ef4444 39%, #f59e0b 40%, #f59e0b 69%, #10b981 70%, #10b981 84%, #38bdf8 85%, #38bdf8 100%)',
          position: 'relative',
          opacity: 0.95
        }} />

        {/* Minimum Benchmark Pin at 70% */}
        <div style={{
          position: 'absolute',
          left: `${benchmark}%`,
          top: '-6px',
          bottom: '-6px',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{ width: '2px', height: '22px', background: '#ffffff', boxShadow: '0 0 8px rgba(255,255,255,0.8)' }} />
          <div style={{
            marginTop: '4px',
            fontSize: '0.68rem',
            fontWeight: 800,
            letterSpacing: '0.5px',
            color: '#ffffff',
            background: 'rgba(16, 185, 129, 0.9)',
            padding: '2px 6px',
            borderRadius: '4px',
            whiteSpace: 'nowrap'
          }}>
            ★ MIN BENCHMARK ({benchmark})
          </div>
        </div>

        {/* Current Score Marker Pin */}
        <div style={{
          position: 'absolute',
          left: `${clampedScore}%`,
          top: '-10px',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 10,
          transition: 'left 0.4s ease'
        }}>
          <div style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: tier.color,
            border: '3px solid var(--s1)',
            boxShadow: `0 0 12px ${tier.color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }} />
          <div style={{
            marginTop: '3px',
            fontSize: '0.76rem',
            fontWeight: 800,
            color: 'var(--t1)',
            background: 'var(--s1)',
            border: `1px solid ${tier.border}`,
            padding: '2px 8px',
            borderRadius: '10px',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}>
            Score: {clampedScore}
          </div>
        </div>
      </div>

      {/* Human Strategic Analysis Callout */}
      <div style={{
        background: 'var(--s1)',
        border: `1px solid ${tier.border}`,
        borderRadius: '8px',
        padding: '14px 16px',
        marginTop: '32px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        <div style={{ color: tier.color, marginTop: '2px', flexShrink: 0 }}>
          {isAboveBenchmark ? <Award size={20} /> : <Target size={20} />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--t1)' }}>
              Human Strategic Analysis
            </span>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: tier.color,
              background: tier.bg,
              padding: '2px 8px',
              borderRadius: '4px'
            }}>
              {tier.status}
            </span>
          </div>
          <div style={{ fontSize: '0.86rem', lineHeight: 1.5, color: 'var(--t2)', marginBottom: '6px' }}>
            {tier.analysis}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--t1)', fontWeight: 600 }}>
            <span style={{ color: 'var(--ac)' }}>Recommended Action: </span> {tier.action}
          </div>
        </div>
      </div>

      {/* Toggle Benchmark Reference Guide */}
      <div style={{ marginTop: '12px', textAlign: 'right' }}>
        <button
          onClick={() => setShowGuide(!showGuide)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--t3)',
            cursor: 'pointer',
            fontSize: '0.78rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: '4px',
            transition: 'color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.color = 'var(--t1)'}
          onMouseOut={(e) => e.currentTarget.style.color = 'var(--t3)'}
        >
          <Info size={13} />
          {showGuide ? 'Hide Benchmark Point Range Reference' : 'View Benchmark Point Range Reference'}
          {showGuide ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {/* Expandable Benchmark Point Range Table */}
      {showGuide && (
        <div style={{
          marginTop: '10px',
          background: 'var(--s1)',
          border: '1px solid var(--b1)',
          borderRadius: '8px',
          padding: '12px 14px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '10px'
        }}>
          {tiers.map((t, idx) => (
            <div 
              key={idx} 
              style={{
                padding: '10px',
                borderRadius: '6px',
                background: 'var(--s2)',
                borderLeft: `3px solid ${t.color}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: t.color }}>{t.title}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--t3)', fontFamily: 'monospace' }}>{t.range}</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--t2)', lineHeight: 1.35 }}>
                {t.desc}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
