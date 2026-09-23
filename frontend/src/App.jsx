import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowDownUp, ArrowRight, ArrowUpRight, Bike, BusFront, Check, ChevronDown, Clock3, Compass, Footprints, MapPin, Menu, Navigation, Search, ShieldCheck, Sparkles, TrainFront, Users, X } from 'lucide-react';
import './routeCards.css';
import './plannerControls.css';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const sampleStops = ['Hubballi Railway Station', 'Dharwad Railway Station', 'CBT Hubballi', 'Dharwad New Bus Stand', 'KLE Technological University', 'BVB Campus', 'KIMS Hospital Vidyanagar', 'SDM Medical College Dharwad', 'Hubballi Airport', 'U Mall Hubli', 'Vidyanagar', 'Unkal', 'Unkal Lake', 'Gokul Road'];
const modes = { BRTS: 'Chigari BRTS', CITY_BUS: 'City bus', FEEDER_BUS: 'Feeder bus', TRAIN: 'Train', WALK: 'Walk', SHARED_AUTO: 'Shared auto', AUTO_RICKSHAW: 'Auto rickshaw', CAB: 'Cab' };
const preferences = [
  { value: 'balanced', label: 'Balanced trip', detail: 'A good mix of time and fare' },
  { value: 'fastest', label: 'Fastest route', detail: 'Prioritize getting there sooner' },
  { value: 'cheapest', label: 'Lowest fare', detail: 'Keep the cost down' },
  { value: 'comfortable', label: 'Comfortable ride', detail: 'Choose an easier journey' },
];

async function request(path, options) {
  let response;
  try {
    response = await fetch(`${API}${path}`, options);
  } catch {
    throw new Error(`The planner API at ${API} is unreachable. Start the backend from the backend folder, configure its .env file, and make sure MongoDB is running.`);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) throw new Error(body.message || 'Could not reach the planner. Check that the backend is running.');
  return body.data;
}

function App() {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [preference, setPreference] = useState('balanced');
  const [preferenceOpen, setPreferenceOpen] = useState(false);
  const [plan, setPlan] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [focused, setFocused] = useState('');
  const preferenceRef = useRef(null);

  useEffect(() => { request('/network/stats').then(setStats).catch(() => {}); }, []);

  useEffect(() => {
    if (!preferenceOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!preferenceRef.current?.contains(event.target)) setPreferenceOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setPreferenceOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [preferenceOpen]);

  const suggestions = useMemo(() => {
    const value = (focused === 'source' ? source : destination).trim().toLowerCase();
    return value ? sampleStops.filter((stop) => stop.toLowerCase().includes(value)).slice(0, 4) : [];
  }, [source, destination, focused]);

  async function findRoutes(event) {
    event.preventDefault();
    if (!source.trim() || !destination.trim()) { setError('Add both a starting point and destination to see your routes.'); return; }
    setLoading(true); setError(''); setPlan(null);
    try {
      const result = await request('/routes/plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source: source.trim(), destination: destination.trim(), preference }) });
      setPlan(result); setActiveTab('all');
      window.setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const options = plan?.options || [];
  const filteredOptions = activeTab === 'all' ? options : options.filter((option) => option.tag === activeTab);
  const recommended = options[plan?.recommended_index];

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#home" aria-label="Hop home"><span className="brand-mark"><Navigation size={18} fill="currentColor" /></span><span>hop<span className="brand-dot">.</span></span></a>
      <nav className={mobileMenu ? 'nav-links open' : 'nav-links'}>
        <a className="nav-active" href="#plan" onClick={() => setMobileMenu(false)}>Plan a trip</a><a href="#how" onClick={() => setMobileMenu(false)}>How it works</a><a href="#about" onClick={() => setMobileMenu(false)}>About</a>
      </nav>
      <div className="topbar-right"><span className="city-pill"><span className="live-dot" /> Hubballi–Dharwad</span><button className="menu-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle navigation">{mobileMenu ? <X size={20} /> : <Menu size={20} />}</button></div>
    </header>

    <main id="home">
      <section className="hero">
        <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line" /> YOUR CITY, CONNECTED</div><h1>Getting there<br />should feel <span>easy.</span></h1><p className="hero-subtitle">Find the right way across Hubballi and Dharwad.<br className="desktop-break" /> Compare buses, BRTS and more in one place.</p>
          <form id="plan" className="planner-card" onSubmit={findRoutes}>
            <div className="field-stack">
              <label className="location-field"><span className="field-icon origin"><span /></span><span className="field-content"><span className="field-label">FROM</span><input value={source} onChange={(e) => setSource(e.target.value)} onFocus={() => setFocused('source')} onBlur={() => window.setTimeout(() => setFocused(''), 140)} placeholder="Choose a starting point" autoComplete="off" /></span><MapPin className="field-trailing" size={18} /></label>
              {focused === 'source' && suggestions.length > 0 && <SuggestionList items={suggestions} onChoose={(value) => setSource(value)} />}
              <div className="connector"><span /><button type="button" className="swap-button" aria-label="Swap locations" onClick={() => { setSource(destination); setDestination(source); }}><ArrowDownUp size={15} /></button></div>
              <label className="location-field"><span className="field-icon dest"><MapPin size={17} /></span><span className="field-content"><span className="field-label">TO</span><input value={destination} onChange={(e) => setDestination(e.target.value)} onFocus={() => setFocused('destination')} onBlur={() => window.setTimeout(() => setFocused(''), 140)} placeholder="Where are you headed?" autoComplete="off" /></span><MapPin className="field-trailing" size={18} /></label>
              {focused === 'destination' && suggestions.length > 0 && <SuggestionList items={suggestions} onChoose={(value) => setDestination(value)} />}
            </div>
            <div className="planner-bottom"><div className="preference-label">I prefer <div className="preference-picker" ref={preferenceRef}><button id="preference" type="button" className={`preference-trigger${preferenceOpen ? ' open' : ''}`} aria-haspopup="listbox" aria-expanded={preferenceOpen} onClick={() => setPreferenceOpen(!preferenceOpen)}><span>{preferences.find((item) => item.value === preference)?.label}</span><ChevronDown size={15} /></button>{preferenceOpen && <div className="preference-menu" role="listbox" aria-label="Trip preference"><span className="preference-menu-heading">CHOOSE YOUR PRIORITY</span>{preferences.map((item) => <button key={item.value} type="button" role="option" aria-selected={preference === item.value} className={`preference-option${preference === item.value ? ' selected' : ''}`} onClick={() => { setPreference(item.value); setPreferenceOpen(false); }}><span className="preference-option-copy"><strong>{item.label}</strong><small>{item.detail}</small></span><span className="preference-check">{preference === item.value && <Check size={15} />}</span></button>)}</div>}</div></div><button className="search-button" type="submit" disabled={loading}>{loading ? <span className="spinner" /> : <><span>Find my route</span><ArrowRight size={17} /></>}</button></div>
            {error && <div className="form-error" role="alert">{error}</div>}
          </form>
          <div className="quick-note"><ShieldCheck size={15} /><span>Made for local journeys. Always free to use.</span></div>
        </div>
        <div className="hero-art" aria-label="Illustration of city transit"><div className="art-sun" /><div className="art-label"><span className="live-dot" /> OUT AND ABOUT</div><div className="map-path path-one" /><div className="map-path path-two" /><span className="map-node node-one"><MapPin size={15} fill="currentColor" /></span><span className="map-node node-two"><MapPin size={15} fill="currentColor" /></span><span className="map-node node-three"><MapPin size={15} fill="currentColor" /></span><div className="building building-one"><i /><i /><i /><i /></div><div className="building building-two"><i /><i /><i /><i /><i /><i /></div><div className="building building-three"><i /><i /><i /><i /></div><div className="building building-four"><i /><i /><i /><i /><i /><i /></div><div className="hill hill-back" /><div className="hill hill-front" /><div className="road"><div className="road-line" /></div><div className="bus-illustration"><div className="bus-sign"><span className="bus-route">BD</span><span className="bus-name">CHIGARI<br />CITY CONNECT</span></div><div className="bus-windows"><span /><span /><span /><span /></div><div className="bus-lower"><span>HOP ABOARD</span><span className="bus-door" /></div><div className="wheel wheel-left" /><div className="wheel wheel-right" /></div><div className="art-caption"><span className="caption-icon"><BusFront size={18} /></span><span><strong>One city, many ways.</strong><small>Find yours with Hop.</small></span><ArrowUpRight size={17} className="caption-arrow" /></div></div>
      </section>

      <section className="stats-strip" id="about"><div className="stats-intro"><Sparkles size={16} /><span>A little more connected every day</span></div><div className="stat-item"><strong>{stats?.total_stops ?? '—'}</strong><span>stops to explore</span></div><div className="stat-item"><strong>{stats?.total_routes ?? '—'}</strong><span>routes mapped</span></div><div className="stat-item"><strong>2</strong><span>cities, one journey</span></div></section>

      {plan && <section className="results-section" id="results"><div className="results-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> YOUR JOURNEY</div><h2>{plan.source_label || source} <ArrowRight size={21} /> {plan.destination_label || destination}</h2><p>Here are a few ways to make the trip.</p></div><div className="analysis-time"><Clock3 size={15} /> Planned in {plan.analysis_time_ms ?? 0} ms</div></div>
        {recommended && <div className="recommend-banner"><div className="recommend-icon"><Sparkles size={19} /></div><div><span>YOUR BEST MATCH</span><strong>{recommended.label}</strong><small>{recommended.recommended_for || 'A smart pick for this journey'}</small></div><div className="recommend-meta"><b>₹{recommended.fare_inr}</b><span><Clock3 size={14} /> {recommended.duration_min} min</span></div></div>}
        <div className="results-toolbar"><div><h3>Compare your options</h3><p>Choose what works for you today.</p></div><div className="filter-tabs">{[['all','All routes'],['fastest','Fastest'],['cheapest','Lowest fare'],['comfortable','Comfortable']].map(([id,label]) => <button key={id} className={activeTab === id ? 'filter-tab selected' : 'filter-tab'} onClick={() => setActiveTab(id)}>{label}</button>)}</div></div>
        <div className="route-grid">{filteredOptions.map((option) => <RouteCard key={option.id || option.tag} option={option} recommended={option === recommended} />)}{filteredOptions.length === 0 && <div className="empty-state">No route option in this category. Try another filter.</div>}</div>
        <p className="route-disclaimer">Fares and journey times are estimates and may vary with traffic and service conditions.</p>
      </section>}

      {!plan && <section className="how-section" id="how"><div className="how-heading"><div className="eyebrow"><span className="eyebrow-line" /> LESS GUESSING, MORE GOING</div><h2>Your next trip, in three easy steps.</h2></div><div className="steps"><div className="step-card"><span className="step-number">01</span><span className="step-icon"><Search size={19} /></span><h3>Pick your places</h3><p>Tell us where you are and where you need to be.</p></div><div className="step-connector"><ArrowRight size={17} /></div><div className="step-card"><span className="step-number">02</span><span className="step-icon"><Compass size={19} /></span><h3>See the possibilities</h3><p>Compare public transport and ride options side by side.</p></div><div className="step-connector"><ArrowRight size={17} /></div><div className="step-card"><span className="step-number">03</span><span className="step-icon"><Footprints size={19} /></span><h3>Go your own way</h3><p>Choose a trip that fits your time, budget and mood.</p></div></div></section>}
    </main>
    <footer className="footer"><a className="brand footer-brand" href="#home"><span className="brand-mark"><Navigation size={15} fill="currentColor" /></span><span>hop<span className="brand-dot">.</span></span></a><span>Thoughtfully finding your way around Hubballi–Dharwad.</span><span className="footer-right">Built for the everyday journey <span>✳</span></span></footer>
  </div>;
}

function SuggestionList({ items, onChoose }) {
  return <div className="suggestions">{items.map((item) => <button type="button" key={item} onMouseDown={() => onChoose(item)}><MapPin size={14} />{item}</button>)}</div>;
}

function RouteCard({ option, recommended }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = option.tag === 'comfortable' ? Bike : option.tag === 'cheapest' ? BusFront : TrainFront;
  return <article className={`route-card ${option.tag || ''}${recommended ? ' recommended' : ''}`}><div className="route-card-top"><span className={`route-icon ${option.tag || ''}`}><Icon size={19} /></span><span className="route-title"><span>{option.tag === 'fastest' ? 'QUICK CONNECTION' : option.tag === 'cheapest' ? 'SAVE AS YOU GO' : 'RIDE IN COMFORT'}</span><strong>{option.label}</strong></span>{recommended && <span className="recommended-chip"><Sparkles size={12} /> Best match</span>}</div><div className="route-metrics"><div><span>EST. FARE</span><strong>₹{option.fare_inr}</strong></div><div><span>TRAVEL TIME</span><strong>{option.duration_min}<small> min</small></strong></div><div><span>CHANGES</span><strong>{option.transfers ?? 0}<small> transfers</small></strong></div></div><div className="route-line">{(option.legs || []).slice(0, expanded ? undefined : 4).map((leg, index) => <div className="leg" key={`${leg.mode}-${index}`}><span className={`leg-icon ${leg.mode === 'WALK' ? 'walk' : ''}`}>{leg.mode === 'WALK' ? <Footprints size={14} /> : leg.mode === 'TRAIN' ? <TrainFront size={14} /> : leg.mode === 'CAB' || leg.mode.includes('AUTO') ? <Bike size={14} /> : <BusFront size={14} />}</span><span className="leg-copy"><strong>{leg.description || `${modes[leg.mode] || leg.mode} from ${leg.stop_from || 'Start'} to ${leg.stop_to || 'Next stop'}`}</strong><small>{leg.duration_min} min{leg.distance_meters ? ` · ${(leg.distance_meters / 1000).toFixed(1)} km` : ''}</small></span><span className="leg-mode">{modes[leg.mode] || leg.mode}</span></div>)}{(option.legs || []).length === 0 && <div className="leg"><span className="leg-icon"><MapPin size={14} /></span><span className="leg-copy"><strong>Direct trip</strong><small>{option.duration_min} min</small></span></div>}</div>{(option.legs || []).length > 4 && <button className="show-legs" onClick={() => setExpanded(!expanded)}>{expanded ? 'Show less' : `Show all ${option.legs.length} steps`} <ChevronDown size={14} /></button>}<div className="card-bottom"><span className="crowd"><Users size={14} /> {option.crowding || 'moderate'} crowding</span><span>{option.confidence ?? 90}% route confidence <Check size={13} /></span></div></article>;
}

export default App;
