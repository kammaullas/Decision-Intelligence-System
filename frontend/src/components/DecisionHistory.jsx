import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'

export default function DecisionHistory() {
  const { decisionHistory, fetchHistory, loading, globalError } = useStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  return (
    <>
      <h1>Decision History</h1>
      <div className="hint">Review past decisions and their evaluated outcomes.</div>

      {loading && decisionHistory.length === 0 ? (
        <p>Loading history...</p>
      ) : decisionHistory.length === 0 ? (
        <div className="card">
          <p>No decisions found. Start by defining a new decision.</p>
          <button className="btn btn-p" onClick={() => navigate('/')}>Create Decision</button>
        </div>
      ) : (
        <div className="card" style={{ padding: '0' }}>
          <table className="stbl">
            <thead>
              <tr>
                <th>Decision Title</th>
                <th>Industry</th>
                <th>Date</th>
                <th>Readiness</th>
                <th>Recommendation</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {decisionHistory.map(d => (
                <tr key={d._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/history/${d._id}`)}>
                  <td style={{ fontWeight: '500' }}>{d.title}</td>
                  <td>{d.industry || '-'}</td>
                  <td>{new Date(d.createdAt).toLocaleDateString()}</td>
                  <td>
                    {d.decisionReadinessScore ? (
                      <span className={`badge ${d.decisionReadinessScore >= 80 ? 'bhi' : (d.decisionReadinessScore >= 60 ? 'bmi' : 'blo')}`}>
                        {d.decisionReadinessScore}
                      </span>
                    ) : '-'}
                  </td>
                  <td style={{ color: 'var(--ac)' }}>{d.recommendedOption || '-'}</td>
                  <td>
                    <span className="badge" style={{ background: d.status === 'Evaluated' ? 'var(--bg-card-hover)' : 'var(--bg-p)' }}>
                      {d.status}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
