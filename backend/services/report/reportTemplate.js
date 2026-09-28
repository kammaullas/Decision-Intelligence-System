function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function renderBarChart(scores, maxScore) {
    if (!scores || scores.length === 0) return '';
    let html = '<div class="chart-container">';
    scores.forEach(s => {
        const width = maxScore > 0 ? (s.weightedScore / maxScore) * 100 : 0;
        html += `
            <div class="chart-row">
                <div class="chart-label">${escapeHtml(s.option)}</div>
                <div class="chart-bar-wrapper">
                    <div class="chart-bar" style="width: ${width}%"></div>
                </div>
                <div class="chart-value">${parseFloat(s.weightedScore).toFixed(1)}</div>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

function renderReportTemplate(data) {
    const d = data.decision;
    const m = data.reportMeta;
    const e = data.evaluation;
    const o = data.outcome;
    const c = data.context;

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Decision Report</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
        <style>
            :root {
                --primary: #7F1D3A;
                --primary-light: #B4234D;
                --accent: #D94F70;
                --bg: #FAF7F3;
                --surface: #FFFFFF;
                --text: #171717;
                --muted: #6B6460;
                --border: #E5E0DA;
                --success: #2E7D5B;
                --warning: #C58A22;
                --info: #4267A8;
            }

            * { box-sizing: border-box; }
            
            body {
                margin: 0;
                padding: 0;
                font-family: 'Inter', sans-serif;
                background-color: var(--bg);
                color: var(--text);
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            @page {
                size: A4 portrait;
                margin: 20mm;
            }

            .page-break {
                page-break-before: always;
            }

            .avoid-break {
                page-break-inside: avoid;
            }

            /* Cover Page */
            .cover-page {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: flex-start;
                min-height: 80vh;
            }
            .cover-title {
                font-family: 'Playfair Display', serif;
                font-size: 3.5rem;
                color: var(--primary);
                line-height: 1.1;
                margin-bottom: 2rem;
            }
            .cover-subtitle {
                font-size: 1.5rem;
                font-weight: 500;
                color: var(--muted);
                text-transform: uppercase;
                letter-spacing: 2px;
                margin-bottom: 4rem;
            }
            .cover-meta {
                margin-top: auto;
                font-size: 1rem;
                color: var(--text);
                border-left: 4px solid var(--primary);
                padding-left: 1rem;
            }

            /* Typography */
            h1 { font-family: 'Playfair Display', serif; font-size: 2.2rem; color: var(--primary); margin-top: 0; margin-bottom: 1.5rem; }
            h2 { font-size: 1.2rem; text-transform: uppercase; letter-spacing: 1.5px; color: var(--primary-light); margin-top: 2rem; margin-bottom: 1rem; }
            h3 { font-size: 1rem; color: var(--text); margin-bottom: 0.5rem; }
            p { line-height: 1.6; margin-bottom: 1rem; color: var(--text); font-size: 0.95rem; }

            /* Cards */
            .card {
                background: var(--surface);
                border: 1px solid var(--border);
                border-radius: 12px;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
            }

            .grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1.5rem;
            }
            .mb-2 { margin-bottom: 2rem; }
            .mt-2 { margin-top: 2rem; }

            /* Stats */
            .stat-label {
                font-size: 0.85rem;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: var(--muted);
                margin-bottom: 0.5rem;
            }
            .stat-value {
                font-size: 2rem;
                font-weight: 700;
                color: var(--primary);
            }

            /* Lists */
            .list-item {
                position: relative;
                padding-left: 1.5rem;
                margin-bottom: 0.8rem;
                line-height: 1.5;
                font-size: 0.95rem;
            }
            .list-item::before {
                content: "•";
                color: var(--accent);
                position: absolute;
                left: 0;
                font-size: 1.2rem;
                line-height: 1;
            }

            /* Chart */
            .chart-container {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }
            .chart-row {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            .chart-label {
                flex: 0 0 40%;
                font-size: 0.9rem;
                line-height: 1.3;
            }
            .chart-bar-wrapper {
                flex: 1;
                background: var(--bg);
                height: 12px;
                border-radius: 6px;
                overflow: hidden;
            }
            .chart-bar {
                height: 100%;
                background: var(--primary);
                border-radius: 6px;
            }
            .chart-value {
                flex: 0 0 30px;
                text-align: right;
                font-weight: 600;
                color: var(--primary);
            }

        </style>
    </head>
    <body>

        <!-- COVER PAGE -->
        <div class="cover-page">
            <div class="cover-title">Executive<br>Decision Report</div>
            <div class="cover-subtitle">${escapeHtml(m.title)}</div>
            
            <div class="cover-meta">
                <p style="margin:0; font-weight: 600;">Prepared for: ${escapeHtml(m.userName)}</p>
                <p style="margin:5px 0 0 0;">Date: ${escapeHtml(m.generatedAt)}</p>
                <p style="margin:5px 0 0 0;">Report ID: ${escapeHtml(m.reportId)}</p>
            </div>
        </div>

        <div class="page-break"></div>

        <!-- DECISION OVERVIEW -->
        <h1>Decision Overview</h1>
        <p class="mb-2">${escapeHtml(d.description)}</p>

        <div class="grid mb-2">
            <div class="card avoid-break">
                <div class="stat-label">Selected Option</div>
                <div class="stat-value" style="font-size: 1.2rem;">${escapeHtml(d.selectedOption)}</div>
            </div>
            <div class="card avoid-break">
                <div class="stat-label">Decision Status</div>
                <div class="stat-value" style="font-size: 1.2rem; color: var(--info);">${escapeHtml(d.status)}</div>
            </div>
            <div class="card avoid-break">
                <div class="stat-label">Readiness Score</div>
                <div class="stat-value">${escapeHtml(String(d.readinessScore))} / 100</div>
            </div>
            <div class="card avoid-break">
                <div class="stat-label">Decision Date</div>
                <div class="stat-value" style="font-size: 1.2rem;">${escapeHtml(d.date)}</div>
            </div>
        </div>

        <h2 style="margin-top:0;">Key Factors & Rankings</h2>
        <div class="card avoid-break mb-2">
            ${renderBarChart(e.scores, e.maxScore)}
        </div>

        ${d.executiveJudgment && d.executiveJudgment.disagrees ? `
        <div class="card avoid-break mb-2" style="border-left: 4px solid var(--warning);">
            <h2 style="margin-top:0;">Executive Judgment Override</h2>
            <p><strong>Reason:</strong> ${escapeHtml(d.executiveJudgment.reason)}</p>
            <p><em>"${escapeHtml(d.executiveJudgment.explanation)}"</em></p>
        </div>
        ` : ''}

        <div class="page-break"></div>

        <!-- STRATEGIC ANALYSIS -->
        <h1>Strategic Analysis</h1>
        
        ${e.whyWon.length > 0 ? `
        <div class="card avoid-break">
            <h2 style="margin-top:0;">Why This Recommendation Won</h2>
            ${e.whyWon.map(w => `<div class="list-item">${escapeHtml(w)}</div>`).join('')}
        </div>
        ` : ''}

        <div class="grid">
            <div class="card avoid-break">
                <h2 style="margin-top:0;">Critical Assumptions</h2>
                ${c.assumptions.length > 0 ? c.assumptions.map(a => `<div class="list-item">${escapeHtml(a)}</div>`).join('') : '<p class="muted">No critical assumptions identified.</p>'}
            </div>
            <div class="card avoid-break">
                <h2 style="margin-top:0;">Known Constraints</h2>
                ${c.constraints.length > 0 ? c.constraints.map(con => `<div class="list-item">${escapeHtml(con)}</div>`).join('') : '<p class="muted">No known constraints identified.</p>'}
            </div>
        </div>

        ${e.missingInfo && e.missingInfo.length > 0 ? `
        <div class="card avoid-break" style="background-color: #FFF8E1; border-color: #FFC107;">
            <h2 style="margin-top:0; color: #B08D00;">Missing Information</h2>
            <p style="margin-top:-10px; font-size:0.9rem; color:#856404;">Information you might want to gather before executing this decision.</p>
            ${e.missingInfo.map(m => `<div class="list-item" style="color: #665000;">${escapeHtml(m)}</div>`).join('')}
        </div>
        ` : ''}

        ${e.biases && e.biases.length > 0 ? `
        <div class="card avoid-break" style="background-color: #F8D7DA; border-color: #F5C6CB;">
            <h2 style="margin-top:0; color: #721C24;">Bias Alerts</h2>
            <p style="margin-top:-10px; font-size:0.9rem; color:#721C24;">Potential cognitive biases detected in your framing.</p>
            ${e.biases.map(b => `<div class="list-item" style="color: #721C24;">${escapeHtml(b)}</div>`).join('')}
        </div>
        ` : ''}

        ${e.risks.length > 0 ? `
        <h2>Top Risks</h2>
        ${e.risks.slice(0, 3).map(r => `
        <div class="card avoid-break">
            <h3 style="margin-top:0;">${escapeHtml(r.option)}</h3>
            <p><strong>Risk:</strong> ${escapeHtml(r.topRisk?.description || r.risks?.[0] || 'Unknown')}</p>
            <p><strong>Mitigation:</strong> ${escapeHtml(r.mitigation || 'None provided')}</p>
        </div>
        `).join('')}
        ` : ''}

        <div class="page-break"></div>

        <!-- RECOMMENDATIONS & NEXT STEPS -->
        <h1>Recommendations</h1>

        ${e.nextSteps && e.nextSteps.length > 0 ? `
        <div class="card avoid-break">
            <h2 style="margin-top:0;">Implementation Priorities (Next Steps)</h2>
            ${e.nextSteps.map(n => `<div class="list-item">${escapeHtml(n)}</div>`).join('')}
        </div>
        ` : '<p>No specific next steps provided.</p>'}

        ${e.coaching && e.coaching.length > 0 ? `
        <div class="card avoid-break" style="background: #FCE8ED; border-color: var(--primary-light);">
            <h2 style="margin-top:0; color: var(--primary);">Personalized Executive Coaching</h2>
            ${e.coaching.map(co => `<div class="list-item">${escapeHtml(co)}</div>`).join('')}
        </div>
        ` : ''}

        <!-- OUTCOMES (IF ANY) -->
        ${o ? `
        <div class="page-break"></div>
        <h1>Outcomes & Personal Insights</h1>
        
        <div class="grid mb-2">
            <div class="card avoid-break" style="background: #E6F4EA;">
                <div class="stat-label">Decision Quality Score</div>
                <div class="stat-value" style="color: var(--success);">${o.decisionQualityScore} / 100</div>
            </div>
            <div class="card avoid-break">
                <div class="stat-label">Assumption Accuracy</div>
                <div class="stat-value">${o.assumptionAccuracy} / 100</div>
            </div>
            <div class="card avoid-break">
                <div class="stat-label">Execution Effectiveness</div>
                <div class="stat-value">${o.executionEffectiveness} / 100</div>
            </div>
            <div class="card avoid-break">
                <div class="stat-label">Evidence Quality</div>
                <div class="stat-value">${o.evidenceQuality} / 100</div>
            </div>
        </div>

        <div class="card avoid-break">
            <h2 style="margin-top:0;">Observed Results</h2>
            <p><strong>Observations:</strong> ${escapeHtml(o.observations)}</p>
            <p><strong>Metrics:</strong> ${escapeHtml(o.metrics)}</p>
        </div>

        ${o.lessonsLearned && o.lessonsLearned.length > 0 ? `
        <div class="card avoid-break">
            <h2 style="margin-top:0;">Lessons Learned</h2>
            ${o.lessonsLearned.map(l => `<div class="list-item">${escapeHtml(l)}</div>`).join('')}
        </div>
        ` : ''}
        ` : ''}

    </body>
    </html>
    `;
}

module.exports = { renderReportTemplate };
