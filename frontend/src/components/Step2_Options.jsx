import { useStore } from '../store'

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
    <>
      <h1>Strategic options</h1>
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
              <button className="optdel" onClick={() => removeOption(i)}>x</button>
            </div>
          ))}
        </div>
        {options.length < 6 && (
          <button className="addopt" onClick={addOption}>+ Add option</button>
        )}
      </div>
      
      <div className="brow">
        <button className="btn btn-g" onClick={() => setStep(1)}>Back</button>
        <button className="btn btn-p" onClick={handleNext}>Evaluate options</button>
      </div>
    </>
  )
}
