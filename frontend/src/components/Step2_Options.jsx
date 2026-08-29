import { useStore } from '../store'
import { List, Trash2, Plus, ArrowLeft, PlayCircle } from 'lucide-react'

export default function Step2_Options() {
  const store = useStore()
  const { options, setOptions, setStep, setError } = store

  const handleNext = () => {
    if (options.some(o => !o.trim())) return setError("All options must have text.")
    if (options.length < 2) return setError("Need at least 2 options.")
    setStep(3)
  }

  const updateOption = (index, value) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const removeOption = (index) => {
    if (options.length <= 2) return setError("Minimum 2 options.")
    const newOptions = options.filter((_, i) => i !== index)
    setOptions(newOptions)
  }

  const addOption = () => {
    if (options.length >= 6) return
    setOptions([...options, ""])
  }

  return (
    <div className="fade-in">
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <List size={24} style={{ color: 'var(--ac)' }} /> Strategic options
      </h1>
      <div className="hint">AI-generated options. Edit, remove, or add your own.</div>
      
      <div className="card">
        <div className="clabel">Options (min 2, max 6)</div>
        <div id="optlist">
          {options.map((opt, i) => (
            <div className="optitem" key={i}>
              <div className="optnum">{i + 1}</div>
              <textarea 
                className="optinp" 
                rows="2" 
                value={opt}
                onChange={(e) => {
                  updateOption(i, e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
              />
              <button className="optdel" onClick={() => removeOption(i)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        {options.length < 6 && (
          <button className="addopt" onClick={addOption} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Add option
          </button>
        )}
      </div>
      
      <div className="brow">
        <button className="btn btn-g" onClick={() => setStep(1)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <button className="btn btn-p" onClick={handleNext} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <PlayCircle size={16} /> Evaluate options
        </button>
      </div>
    </div>
  )
}
