import { useEffect, useMemo, useState } from "react";
import {
  Activity, BadgeCheck, Blocks, CheckCircle2, CircleAlert, ClipboardCheck,
  FileCheck2, FileKey2, FilePlus2, Fingerprint, RefreshCw, ShieldCheck,
  Upload, XCircle
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

function Stat({ icon: Icon, label, value, tone = "" }) {
  return <div className="stat"><div className={`stat-icon ${tone}`}><Icon size={19}/></div><div><p>{label}</p><strong>{value}</strong></div></div>;
}

function App() {
  const [page, setPage] = useState("overview");
  const [models, setModels] = useState([]);
  const [chain, setChain] = useState([]);
  const [health, setHealth] = useState("checking");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [registerFile, setRegisterFile] = useState(null);
  const [registerName, setRegisterName] = useState("");
  const [registerResult, setRegisterResult] = useState(null);
  const [verifyFile, setVerifyFile] = useState(null);
  const [verifyId, setVerifyId] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);
  const [validation, setValidation] = useState(null);

  const loadData = async () => {
    try {
      const [h, m, c] = await Promise.all([
        api("/api/health"), api("/api/models"), api("/api/chain")
      ]);
      setHealth(h.status === "ok" ? "online" : "offline");
      setModels(m.models || []);
      setChain(c.chain || []);
    } catch {
      setHealth("offline");
    }
  };

  useEffect(() => { loadData(); }, []);
  const totalModels = models.length;
  const verifiedBlocks = useMemo(() => chain.length, [chain]);

  const runRegister = async (event) => {
    event.preventDefault();
    if (!registerFile) return setNotice({ type: "error", text: "Choose a file first." });
    setLoading(true); setNotice(null); setRegisterResult(null);
    const form = new FormData();
    form.append("file", registerFile);
    form.append("model_name", registerName);
    try {
      const result = await api("/api/register", { method: "POST", body: form });
      setRegisterResult(result);
      setNotice({ type: "success", text: "Model registered and added to the ledger." });
      setRegisterFile(null); setRegisterName("");
      event.target.reset();
      await loadData();
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    } finally { setLoading(false); }
  };

  const runVerify = async (event) => {
    event.preventDefault();
    if (!verifyFile || !verifyId.trim()) return setNotice({ type: "error", text: "Enter a model ID and choose a file." });
    setLoading(true); setNotice(null); setVerifyResult(null);
    const form = new FormData();
    form.append("file", verifyFile);
    form.append("model_id", verifyId.trim());
    try {
      const result = await api("/api/verify", { method: "POST", body: form });
      setVerifyResult(result);
      setNotice({ type: result.verified ? "success" : "error", text: result.message });
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    } finally { setLoading(false); }
  };

  const runValidation = async () => {
    setLoading(true); setNotice(null);
    try {
      const result = await api("/api/chain/validate");
      setValidation(result);
      setNotice({ type: result.valid ? "success" : "error", text: result.valid ? "Ledger validation passed." : "Ledger validation found inconsistencies." });
      await loadData();
    } catch (error) {
      setNotice({ type: "error", text: error.message });
    } finally { setLoading(false); }
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "register", label: "Register model", icon: FilePlus2 },
    { id: "verify", label: "Verify integrity", icon: FileCheck2 },
    { id: "ledger", label: "Blockchain ledger", icon: Blocks }
  ];

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><ShieldCheck size={23}/></div><div><strong>ModelGuard</strong><span>INTEGRITY SYSTEM</span></div></div>
      <div className="side-label">WORKSPACE</div>
      <nav>{navItems.map(item => <button key={item.id} className={page === item.id ? "nav-item active" : "nav-item"} onClick={() => { setPage(item.id); setNotice(null); }}><item.icon size={18}/><span>{item.label}</span></button>)}</nav>
      <div className="sidebar-bottom">
        <div className="connection"><span className={health === "online" ? "dot online" : "dot"}></span><div><strong>Backend status</strong><small>{health === "online" ? "Connected" : health === "checking" ? "Checking..." : "Unavailable"}</small></div></div>
        <p className="prototype-note">Academic prototype · Local hash-linked ledger</p>
      </div>
    </aside>

    <main className="main">
      <header className="topbar">
        <div className="breadcrumbs">Workspace <span>/</span> <strong>{navItems.find(n => n.id === page)?.label}</strong></div>
        <button className="icon-button" title="Refresh data" onClick={loadData}><RefreshCw size={17}/></button>
      </header>
      <section className="content">
        {notice && <div className={`notice ${notice.type}`}>{notice.type === "success" ? <CheckCircle2 size={18}/> : <CircleAlert size={18}/>}<span>{notice.text}</span><button onClick={() => setNotice(null)} aria-label="Dismiss"><XCircle size={16}/></button></div>}

        {page === "overview" && <>
          <div className="page-heading"><div><p className="eyebrow">SECURE MODEL OPERATIONS</p><h1>Integrity dashboard</h1><p className="subheading">Register AI artifacts, verify file identity and inspect your hash-linked ledger.</p></div><button className="primary" onClick={() => { setPage("register"); setNotice(null); }}><FilePlus2 size={17}/> Register model</button></div>
          <div className="stats-grid">
            <Stat icon={FileKey2} label="Registered models" value={totalModels}/>
            <Stat icon={Blocks} label="Ledger blocks" value={verifiedBlocks}/>
            <Stat icon={Fingerprint} label="Hash algorithm" value="SHA-256" tone="purple"/>
            <Stat icon={ShieldCheck} label="Ledger status" value={health === "online" ? "Available" : "Offline"} tone="green"/>
          </div>
          <div className="panel"><div className="panel-heading"><div><h2>Recent registrations</h2><p>Model artifacts registered in the local ledger</p></div><button className="text-button" onClick={() => setPage("ledger")}>View ledger →</button></div>
            {models.length ? <div className="table-wrap"><table><thead><tr><th>Model</th><th>Model ID</th><th>SHA-256 fingerprint</th><th>Registered</th></tr></thead><tbody>{models.slice().reverse().slice(0,6).map(m => <tr key={m.model_id}><td className="model-cell"><span className="mini-icon"><FileKey2 size={16}/></span><strong>{m.model_name}</strong></td><td><code>{m.model_id}</code></td><td><code className="hash">{m.model_hash}</code></td><td>{new Date(m.registered_at).toLocaleString()}</td></tr>)}</tbody></table></div> : <div className="empty"><div className="empty-icon"><FileKey2 size={24}/></div><h3>No models registered yet</h3><p>Register a file to create its SHA-256 fingerprint and record it in the ledger.</p><button className="secondary" onClick={() => setPage("register")}>Register first model</button></div>}
          </div>
          <div className="info-banner"><div className="info-icon"><Fingerprint size={21}/></div><div><strong>What does verification prove?</strong><p>A matching SHA-256 hash indicates the file matches the registered artifact. It does not prove that the model is accurate, fair or safe.</p></div></div>
        </>}

        {page === "register" && <>
          <div className="page-heading"><div><p className="eyebrow">NEW ARTIFACT</p><h1>Register a model</h1><p className="subheading">Create a cryptographic fingerprint and store it in the hash-linked ledger.</p></div></div>
          <div className="form-panel"><div className="section-title"><div className="section-icon"><FilePlus2 size={19}/></div><div><h2>Model registration</h2><p>The file is hashed as bytes; its contents are not executed.</p></div></div>
            <form onSubmit={runRegister} className="stack-form">
              <label>Model name <span className="optional">Optional</span><input value={registerName} onChange={e => setRegisterName(e.target.value)} placeholder="e.g. StudentPerformancePredictor"/></label>
              <label>Model file <span className="required">*</span><input type="file" required onChange={e => setRegisterFile(e.target.files?.[0] || null)}/><small>Maximum upload size: 100 MB.</small></label>
              {registerFile && <div className="file-selected"><FileCheck2 size={18}/><div><strong>{registerFile.name}</strong><small>{(registerFile.size / 1024).toFixed(1)} KB</small></div></div>}
              <button className="primary submit" disabled={loading}>{loading ? "Registering..." : <><Upload size={17}/> Register file</>}</button>
            </form>
          </div>
          {registerResult && <div className="result-panel good"><BadgeCheck size={22}/><div><h2>Registration complete</h2><p>Model ID: <code>{registerResult.model_id}</code></p><p>SHA-256: <code className="break">{registerResult.model_hash}</code></p></div></div>}
        </>}

        {page === "verify" && <>
          <div className="page-heading"><div><p className="eyebrow">FILE INTEGRITY CHECK</p><h1>Verify model integrity</h1><p className="subheading">Compare a file's current fingerprint with the registered reference hash.</p></div></div>
          <div className="form-panel"><div className="section-title"><div className="section-icon purple"><Fingerprint size={19}/></div><div><h2>Verification request</h2><p>Use the model ID returned during the original registration.</p></div></div>
            <form onSubmit={runVerify} className="stack-form">
              <label>Registered model ID <span className="required">*</span><input required value={verifyId} onChange={e => setVerifyId(e.target.value)} placeholder="MODEL-XXXXXXXXXXXX"/></label>
              <label>File to verify <span className="required">*</span><input type="file" required onChange={e => setVerifyFile(e.target.files?.[0] || null)}/></label>
              <button className="primary submit" disabled={loading}>{loading ? "Verifying..." : <><ClipboardCheck size={17}/> Verify file</>}</button>
            </form>
          </div>
          {verifyResult && <div className={verifyResult.verified ? "result-panel good" : "result-panel bad"}>{verifyResult.verified ? <CheckCircle2 size={23}/> : <CircleAlert size={23}/>}<div><h2>{verifyResult.status}</h2><p>{verifyResult.message}</p><p>Registered: <code className="break">{verifyResult.registered_hash}</code></p><p>Submitted: <code className="break">{verifyResult.submitted_hash}</code></p></div></div>}
        </>}

        {page === "ledger" && <>
          <div className="page-heading"><div><p className="eyebrow">AUDIT TRAIL</p><h1>Blockchain-style ledger</h1><p className="subheading">Inspect model registrations and validate block hashes and previous-hash links.</p></div><button className="secondary" onClick={runValidation} disabled={loading}><ShieldCheck size={17}/> Validate chain</button></div>
          {validation && <div className={validation.valid ? "validation-card good" : "validation-card bad"}>{validation.valid ? <CheckCircle2 size={20}/> : <CircleAlert size={20}/>}<div><strong>{validation.valid ? "Ledger validation passed" : "Ledger inconsistencies found"}</strong><p>{validation.block_count} blocks checked · {validation.issues.length} issue(s)</p>{validation.issues.map((issue,i)=><p key={i}>Block {issue.index}: {issue.issue}</p>)}</div></div>}
          <div className="ledger-list">{chain.length ? chain.slice().reverse().map(block => <article className="block-card" key={block.block_hash}><div className="block-number"><Blocks size={18}/><span>Block {block.index}</span></div><div className="block-main"><div className="block-title"><h3>{block.model_name}</h3><span className="pill">Recorded</span></div><p className="muted">{block.timestamp ? new Date(block.timestamp).toLocaleString() : ""}</p><div className="block-fields"><div><small>MODEL ID</small><code>{block.model_id}</code></div><div><small>MODEL HASH (SHA-256)</small><code className="hash">{block.model_hash}</code></div><div><small>PREVIOUS HASH</small><code className="hash">{block.previous_hash}</code></div><div><small>BLOCK HASH</small><code className="hash">{block.block_hash}</code></div></div></div></article>) : <div className="empty"><div className="empty-icon"><Blocks size={24}/></div><h3>Your ledger is empty</h3><p>Registered models will appear here as linked blocks.</p></div>}</div>
        </>}

        <footer className="footer">Blockchain-Based Integrity Verification of AI Models <span>•</span> Educational prototype</footer>
      </section>
    </main>
  </div>;
}

export default App;
