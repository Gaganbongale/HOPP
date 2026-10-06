import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowDownUp, ArrowRight, ArrowUpRight, Bike, BusFront, CarFront, Check, ChevronDown, Clock3, Compass, Footprints, MapPin, Menu, Navigation, Search, ShieldCheck, Sparkles, TrainFront, Users, X, Ticket, CreditCard, ScanLine } from 'lucide-react';
import './routeCards.css';
import './plannerControls.css';
import QRCode from 'qrcode';
import brtsStationData from '../../seeds-cleaned/brtsStations.cleaned.json';

const API = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const brtsStations = brtsStationData.filter((station) => station.status === 'ACTIVE').map((station) => station.name);
const sampleStops = [...new Set([...brtsStations, 'Hubballi Railway Station', 'Dharwad Railway Station', 'Dharwad New Bus Stand', 'KLE Technological University', 'BVB Campus', 'KIMS Hospital Vidyanagar', 'SDM Medical College Dharwad', 'Hubballi Airport', 'U Mall Hubli', 'Gokul Road'])];
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

async function loadRazorpayCheckout() {
  if (window.Razorpay) return;
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Could not load Razorpay Checkout. Check your connection and try again.'));
    document.body.appendChild(script);
  });
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
  const [ticketFrom, setTicketFrom] = useState('CBT Hubballi');
  const [ticketTo, setTicketTo] = useState('Dharwad BRTS Terminal');
  const [ticketCount, setTicketCount] = useState(1);
  const [ticket, setTicket] = useState(null);
  const [ticketError, setTicketError] = useState('');
  const [ticketBusy, setTicketBusy] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [fareQuote, setFareQuote] = useState(null);
  const [fareError, setFareError] = useState('');
  const [brtsRoutes, setBrtsRoutes] = useState([]);
  const [openBrtsRoute, setOpenBrtsRoute] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authConfig, setAuthConfig] = useState(null);
  const [account, setAccount] = useState(() => { try { return JSON.parse(localStorage.getItem('hop-account') || 'null'); } catch { return null; } });
  const [paymentQr, setPaymentQr] = useState(null);
  const [qrPolling, setQrPolling] = useState(false);
  const preferenceRef = useRef(null);

  useEffect(() => { request('/network/stats').then(setStats).catch(() => {}); request('/tickets/config').then(setPaymentConfig).catch(() => setPaymentConfig({ keyId: null, baseFareRupees: null, farePerKmRupees: null })); request('/routes/brts').then(setBrtsRoutes).catch(() => {}); request('/auth/config').then(setAuthConfig).catch(() => setAuthConfig({ googleClientId: null })); }, []);

  useEffect(() => {
    if (!authOpen || !authConfig?.googleClientId) return;
    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !document.getElementById('google-signin-button')) return;
      window.google.accounts.id.initialize({ client_id: authConfig.googleClientId, callback: async ({ credential }) => {
        setAuthBusy(true); setAuthError('');
        try { const result = await request('/auth/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credential }) }); localStorage.setItem('hop-account', JSON.stringify(result)); setAccount(result); setAuthOpen(false); }
        catch (err) { setAuthError(err.message); } finally { setAuthBusy(false); }
      } });
      window.google.accounts.id.renderButton(document.getElementById('google-signin-button'), { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', width: 280 });
    };
    if (window.google?.accounts?.id) { renderGoogleButton(); return; }
    let script = document.querySelector('script[data-google-identity]');
    if (!script) { script = document.createElement('script'); script.src = 'https://accounts.google.com/gsi/client'; script.async = true; script.defer = true; script.dataset.googleIdentity = 'true'; document.head.appendChild(script); }
    script.addEventListener('load', renderGoogleButton);
    return () => script.removeEventListener('load', renderGoogleButton);
  }, [authOpen, authConfig]);

  useEffect(() => {
    let current = true;
    setFareQuote(null); setFareError('');
    request(`/tickets/fare?from=${encodeURIComponent(ticketFrom)}&to=${encodeURIComponent(ticketTo)}&passengers=${ticketCount}`)
      .then((quote) => { if (current) setFareQuote(quote); })
      .catch((err) => { if (current) setFareError(err.message); });
    return () => { current = false; };
  }, [ticketFrom, ticketTo, ticketCount]);

  async function buyTicket(event) {
    event.preventDefault();
    setTicketError(''); setTicket(null); setTicketBusy(true);
    try {
      if (!paymentConfig?.keyId) { setTicketBusy(false); return; }
      const order = await request('/tickets/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ from: ticketFrom, to: ticketTo, passengers: Number(ticketCount) }) });
      await loadRazorpayCheckout();
      const checkout = new window.Razorpay({ key: order.keyId, order_id: order.orderId, amount: order.amount, currency: order.currency, name: 'Hop · Chigari BRTS', description: `${order.passengers} BRTS ticket${order.passengers > 1 ? 's' : ''}`, prefill: {}, theme: { color: '#245c43' }, modal: { ondismiss: () => setTicketBusy(false) }, handler: async (payment) => {
        try {
          const issued = await request('/tickets/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payment, from: order.from, to: order.to, passengers: order.passengers }) });
          const qrDataUrl = await QRCode.toDataURL(`${API}/tickets/${issued.ticketId}`, { width: 220, margin: 2, color: { dark: '#1d2a26', light: '#ffffff' } });
          setTicket({ ...issued, qrDataUrl });
        } catch (err) { setTicketError(err.message); }
        finally { setTicketBusy(false); }
      } });
      checkout.on('payment.failed', (failure) => { setTicketError(failure.error?.description || 'Payment failed. You can try again.'); setTicketBusy(false); });
      checkout.open();
    } catch (err) { setTicketError(err.message); setTicketBusy(false); }
  }

  async function payByQr() {
    setTicketError(''); setTicket(null); setPaymentQr(null); setTicketBusy(true);
    try {
      const qr = await request('/tickets/qr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ from: ticketFrom, to: ticketTo, passengers: Number(ticketCount) }) });
      setPaymentQr(qr); setTicketBusy(false); setQrPolling(true);
      for (let attempt = 0; attempt < 180; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 3000));
        const result = await request(`/tickets/qr/${encodeURIComponent(qr.purchaseId)}/status`);
        if (result.status === 'PAID') {
          const qrDataUrl = await QRCode.toDataURL(`${API}/tickets/${result.ticket.ticketId}`, { width: 220, margin: 2, color: { dark: '#1d2a26', light: '#ffffff' } });
          setTicket({ ...result.ticket, qrDataUrl }); setPaymentQr(null); setQrPolling(false); return;
        }
        if (result.status === 'EXPIRED') { setTicketError('This payment QR expired. Create a new one to try again.'); setQrPolling(false); return; }
      }
      setTicketError('Payment was not detected before this QR timed out. Check your payment app before trying again.'); setQrPolling(false);
    } catch (err) { setTicketError(err.message); setQrPolling(false); }
    finally { setTicketBusy(false); }
  }

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
    return sampleStops.filter((stop) => !value || stop.toLowerCase().includes(value)).slice(0, value ? 6 : 4);
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

  async function submitAuth(event) {
    event.preventDefault(); setAuthBusy(true); setAuthError('');
    try {
      const result = await request(`/auth/${authMode === 'register' ? 'register' : 'login'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(authMode === 'register' ? authForm : { email: authForm.email, password: authForm.password }) });
      localStorage.setItem('hop-account', JSON.stringify(result)); setAccount(result); setAuthOpen(false); setAuthForm({ name: '', email: '', password: '' });
    } catch (err) { setAuthError(err.message); } finally { setAuthBusy(false); }
  }

  const options = plan?.options || [];
  const filteredOptions = activeTab === 'all' ? options : options.filter((option) => option.tag === activeTab);
  const recommended = options[plan?.recommended_index];

  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#home" aria-label="Hop home"><span className="brand-mark"><Navigation size={18} fill="currentColor" /></span><span>hop<span className="brand-dot">.</span></span></a>
      <nav className={mobileMenu ? 'nav-links open' : 'nav-links'}>
        <a className="nav-active" href="#plan" onClick={() => setMobileMenu(false)}>Plan a trip</a><a href="#tickets" onClick={() => setMobileMenu(false)}>Buy tickets</a><a href="#stations" onClick={() => setMobileMenu(false)}>BRTS stations</a><a href="#how" onClick={() => setMobileMenu(false)}>How it works</a>
      </nav>
      <div className="topbar-right"><span className="city-pill"><span className="live-dot" /> Hubballi–Dharwad</span>{account ? <button className="account-button" onClick={() => { localStorage.removeItem('hop-account'); setAccount(null); }}>{account.user?.name?.split(' ')[0] || 'Account'} · Sign out</button> : <button className="account-button" onClick={() => { setAuthError(''); setAuthOpen(true); }}>Sign in</button>}<button className="menu-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle navigation">{mobileMenu ? <X size={20} /> : <Menu size={20} />}</button></div>
    </header>

    <main id="home">
      <section className="hero">
        <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line" /> YOUR CITY, CONNECTED</div><h1>Getting there<br />should feel <span>easy.</span></h1><p className="hero-subtitle">Find the right way across Hubballi and Dharwad.<br className="desktop-break" /> Compare buses, BRTS and more in one place.</p>
          <form id="plan" className="planner-card" onSubmit={findRoutes}>
            <div className="field-stack">
              <div className="location-picker"><label className="location-field"><span className="field-icon origin"><span /></span><span className="field-content"><span className="field-label">FROM</span><input value={source} onChange={(e) => setSource(e.target.value)} onFocus={() => setFocused('source')} onBlur={() => window.setTimeout(() => setFocused(''), 140)} placeholder="Choose a starting point" autoComplete="off" /></span><MapPin className="field-trailing" size={18} /></label>
              {focused === 'source' && suggestions.length > 0 && <SuggestionList items={suggestions} onChoose={(value) => setSource(value)} />}</div>
              <div className="connector"><span /><button type="button" className="swap-button" aria-label="Swap locations" onClick={() => { setSource(destination); setDestination(source); }}><ArrowDownUp size={15} /></button></div>
              <div className="location-picker"><label className="location-field"><span className="field-icon dest"><MapPin size={17} /></span><span className="field-content"><span className="field-label">TO</span><input value={destination} onChange={(e) => setDestination(e.target.value)} onFocus={() => setFocused('destination')} onBlur={() => window.setTimeout(() => setFocused(''), 140)} placeholder="Where are you headed?" autoComplete="off" /></span><MapPin className="field-trailing" size={18} /></label>
              {focused === 'destination' && suggestions.length > 0 && <SuggestionList items={suggestions} onChoose={(value) => setDestination(value)} />}</div>
            </div>
            <div className="planner-bottom"><div className="preference-label">I prefer <div className="preference-picker" ref={preferenceRef}><button id="preference" type="button" className={`preference-trigger${preferenceOpen ? ' open' : ''}`} aria-haspopup="listbox" aria-expanded={preferenceOpen} onClick={() => setPreferenceOpen(!preferenceOpen)}><span>{preferences.find((item) => item.value === preference)?.label}</span><ChevronDown size={15} /></button>{preferenceOpen && <div className="preference-menu" role="listbox" aria-label="Trip preference"><span className="preference-menu-heading">CHOOSE YOUR PRIORITY</span>{preferences.map((item) => <button key={item.value} type="button" role="option" aria-selected={preference === item.value} className={`preference-option${preference === item.value ? ' selected' : ''}`} onClick={() => { setPreference(item.value); setPreferenceOpen(false); }}><span className="preference-option-copy"><strong>{item.label}</strong><small>{item.detail}</small></span><span className="preference-check">{preference === item.value && <Check size={15} />}</span></button>)}</div>}</div></div><button className="search-button" type="submit" disabled={loading}>{loading ? <span className="spinner" /> : <><span>Find my route</span><ArrowRight size={17} /></>}</button></div>
            {error && <div className="form-error" role="alert">{error}</div>}
          </form>
          <div className="quick-note"><ShieldCheck size={15} /><span>Made for local journeys. Always free to use.</span></div>
        </div>
        <div className="hero-art" aria-label="Illustration of city transit"><div className="art-sun" /><div className="art-label"><span className="live-dot" /> OUT AND ABOUT</div><div className="map-path path-one" /><div className="map-path path-two" /><span className="map-node node-one"><MapPin size={15} fill="currentColor" /></span><span className="map-node node-two"><MapPin size={15} fill="currentColor" /></span><span className="map-node node-three"><MapPin size={15} fill="currentColor" /></span><div className="building building-one"><i /><i /><i /><i /></div><div className="building building-two"><i /><i /><i /><i /><i /><i /></div><div className="building building-three"><i /><i /><i /><i /></div><div className="building building-four"><i /><i /><i /><i /><i /><i /></div><div className="hill hill-back" /><div className="hill hill-front" /><div className="road"><div className="road-line" /></div><div className="bus-illustration"><div className="bus-sign"><span className="bus-route">BD</span><span className="bus-name">CHIGARI<br />CITY CONNECT</span></div><div className="bus-windows"><span /><span /><span /><span /></div><div className="bus-lower"><span>HOP ABOARD</span><span className="bus-door" /></div><div className="wheel wheel-left" /><div className="wheel wheel-right" /></div><div className="art-caption"><span className="caption-icon"><BusFront size={18} /></span><span><strong>One city, many ways.</strong><small>Find yours with Hop.</small></span><ArrowUpRight size={17} className="caption-arrow" /></div></div>
      </section>

      <section className="stats-strip" id="about"><div className="stats-intro"><Sparkles size={16} /><span>A little more connected every day</span></div><div className="stat-item"><strong>{stats?.total_stops ?? '—'}</strong><span>stops to explore</span></div><div className="stat-item"><strong>{stats?.total_routes ?? '—'}</strong><span>routes mapped</span></div><div className="stat-item"><strong>2</strong><span>cities, one journey</span></div></section>

      <section className="ticket-section" id="tickets">
        <div className="ticket-copy"><div className="eyebrow"><span className="eyebrow-line" /> TRAVEL READY</div><h2>Get your Chigari ticket here.</h2><p>Fare follows the BRTS corridor distance. Pay in Razorpay Checkout or scan a one-time UPI payment QR; your separate ticket QR appears after payment.</p><div className="ticket-trust"><ShieldCheck size={15} /> {paymentConfig?.keyId ? `₹${paymentConfig.baseFareRupees} base + ₹${paymentConfig.farePerKmRupees}/km` : 'Checkout requires Razorpay test keys and distance fare rates.'}</div></div>
        <form className="ticket-card" onSubmit={buyTicket}>
          <div className="ticket-fields">
            <label>BOARDING STATION<select disabled={Boolean(paymentQr)} value={ticketFrom} onChange={(event) => { setTicketFrom(event.target.value); setTicket(null); }}>{brtsStations.map((station) => <option key={station}>{station}</option>)}</select></label>
            <label>DESTINATION<select disabled={Boolean(paymentQr)} value={ticketTo} onChange={(event) => { setTicketTo(event.target.value); setTicket(null); }}>{brtsStations.filter((station) => station !== ticketFrom).map((station) => <option key={station}>{station}</option>)}</select></label>
            <label>PASSENGERS<select disabled={Boolean(paymentQr)} value={ticketCount} onChange={(event) => { setTicketCount(event.target.value); setTicket(null); }}>{[1, 2, 3, 4, 5, 6].map((count) => <option key={count} value={count}>{count} {count === 1 ? 'passenger' : 'passengers'}</option>)}</select></label>
          </div>
          {fareQuote && <div className="fare-quote"><span>{fareQuote.distanceKm} km × ₹{fareQuote.farePerKmRupees}/km + ₹{fareQuote.baseFareRupees} base fare</span><strong>₹{fareQuote.totalRupees} total</strong></div>}
          {fareError && <div className="ticket-error" role="alert">{fareError}</div>}
          <div className="ticket-actions"><button className="ticket-button" type="submit" disabled={ticketBusy || Boolean(paymentQr) || !paymentConfig?.keyId || !fareQuote}><CreditCard size={16} /> Pay ₹{fareQuote?.totalRupees ?? '—'} with Razorpay</button><button className="ticket-button ticket-qr-button" type="button" onClick={payByQr} disabled={ticketBusy || Boolean(paymentQr) || !paymentConfig?.keyId || !fareQuote}><ScanLine size={16} /> Pay by UPI QR</button></div>
          {paymentConfig && !paymentConfig.keyId && <div className="ticket-setup-note">Add Razorpay test keys and distance fare rates to <code>backend/.env</code> to enable ticket payments.</div>}
          {paymentQr && <div className="razorpay-payment-qr" role="status"><div><strong>Scan to pay ₹{paymentQr.amountRupees}</strong><span>{paymentQr.from} → {paymentQr.to} · {paymentQr.distanceKm} km</span></div><img src={paymentQr.imageUrl} alt="Razorpay UPI payment QR code" referrerPolicy="no-referrer"/><a href={paymentQr.imageUrl} target="_blank" rel="noreferrer">Open payment QR</a><small>{qrPolling ? 'Waiting for payment confirmation…' : 'QR ready'}</small></div>}
          {ticketError && <div className="ticket-error" role="alert">{ticketError}</div>}
          {ticket && <div className="issued-ticket" role="status"><div><strong>Ticket confirmed</strong><span>{ticket.from} → {ticket.to}</span><small>{ticket.distanceKm} km · {ticket.passengers} passenger{ticket.passengers > 1 ? 's' : ''} · ₹{ticket.amountRupees} · {ticket.ticketId}</small><span className="ticket-valid"><Check size={13} /> {ticket.status}</span></div><img src={ticket.qrDataUrl} alt={`Unique QR ticket ${ticket.ticketId}`} /><a className="ticket-download" href={ticket.qrDataUrl} download={`hop-ticket-${ticket.ticketId}.png`}>Download ticket QR</a></div>}
        </form>
      </section>

      <section className="stations-section" id="stations"><div className="stations-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> CHIGARI BRTS</div><h2>BRTS stations, at a glance.</h2><p>Browse all active stops along the Hubballi–Dharwad corridor and explore every mapped service.</p></div><span className="station-count"><span className="live-dot" /> {brtsStations.length} active stations</span></div><div className="station-list">{brtsStations.map((station, index) => <div className="station-item" key={station}><span className="station-marker">{index + 1}</span><span>{station}</span></div>)}</div>
        <div className="brts-routes-heading"><div><h3>Explore BRTS routes</h3><p>Pick a service to see every stop on its route.</p></div><span>{brtsRoutes.length || 5} services</span></div><div className="brts-route-list">{brtsRoutes.map((route) => <article className="brts-route-card" key={route.id}><button className="brts-route-toggle" onClick={() => setOpenBrtsRoute(openBrtsRoute === route.id ? '' : route.id)} aria-expanded={openBrtsRoute === route.id}><span className="brts-route-number">{route.routeNumber}</span><span className="brts-route-copy"><strong>{route.source} → {route.destination}</strong><small>{route.stopCount} stops · Chigari BRTS</small></span><ChevronDown size={17} /></button>{openBrtsRoute === route.id && <div className="brts-route-stops">{route.stops.map((stop, index) => <button key={`${route.id}-${stop}`} onClick={() => { setSource(index === 0 ? stop : source); setDestination(stop); if (index === 0) setDestination(route.destination); else setSource(route.source); window.setTimeout(() => document.getElementById('plan')?.scrollIntoView({ behavior: 'smooth' }), 40); }}><span>{index + 1}</span>{stop}</button>)}</div>}</article>)}</div></section>

      {plan && <section className="results-section" id="results"><div className="results-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> YOUR JOURNEY</div><h2>{plan.source_label || source} <ArrowRight size={21} /> {plan.destination_label || destination}</h2><p>Here are a few ways to make the trip.</p></div><div className="analysis-time"><Clock3 size={15} /> Planned in {plan.analysis_time_ms ?? 0} ms</div></div>
        {recommended && <div className="recommend-banner"><div className="recommend-icon"><Sparkles size={19} /></div><div><span>YOUR BEST MATCH</span><strong>{recommended.label}</strong><small>{recommended.recommended_for || 'A smart pick for this journey'}</small></div><div className="recommend-meta"><b>₹{recommended.fare_inr}</b><span><Clock3 size={14} /> {recommended.duration_min} min</span></div></div>}
        <div className="results-toolbar"><div><h3>Compare your options</h3><p>Choose what works for you today.</p></div><div className="filter-tabs">{[['all','All routes'],['fastest','Fastest'],['cheapest','Lowest fare'],['comfortable','Comfortable']].map(([id,label]) => <button key={id} className={activeTab === id ? 'filter-tab selected' : 'filter-tab'} onClick={() => setActiveTab(id)}>{label}</button>)}</div></div>
        <div className="route-grid">{filteredOptions.map((option) => <RouteCard key={option.id || option.tag} option={option} recommended={option === recommended} />)}{filteredOptions.length === 0 && <div className="empty-state">No route option in this category. Try another filter.</div>}</div>
        <p className="route-disclaimer">Fares and journey times are estimates and may vary with traffic and service conditions.</p>
      </section>}

      {!plan && <section className="how-section" id="how"><div className="how-heading"><div className="eyebrow"><span className="eyebrow-line" /> LESS GUESSING, MORE GOING</div><h2>Your next trip, in three easy steps.</h2></div><div className="steps"><div className="step-card"><span className="step-number">01</span><span className="step-icon"><Search size={19} /></span><h3>Pick your places</h3><p>Tell us where you are and where you need to be.</p></div><div className="step-connector"><ArrowRight size={17} /></div><div className="step-card"><span className="step-number">02</span><span className="step-icon"><Compass size={19} /></span><h3>See the possibilities</h3><p>Compare public transport and ride options side by side.</p></div><div className="step-connector"><ArrowRight size={17} /></div><div className="step-card"><span className="step-number">03</span><span className="step-icon"><Footprints size={19} /></span><h3>Go your own way</h3><p>Choose a trip that fits your time, budget and mood.</p></div></div></section>}
    </main>
    <footer className="footer"><a className="brand footer-brand" href="#home"><span className="brand-mark"><Navigation size={15} fill="currentColor" /></span><span>hop<span className="brand-dot">.</span></span></a><span>Thoughtfully finding your way around Hubballi–Dharwad.</span><span className="footer-right">Built for the everyday journey <span>✳</span></span></footer>
    {authOpen && <div className="auth-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setAuthOpen(false); }}><section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button className="auth-close" onClick={() => setAuthOpen(false)} aria-label="Close"><X size={18} /></button><div className="eyebrow"><span className="eyebrow-line" /> YOUR HOP ACCOUNT</div><h2 id="auth-title">{authMode === 'register' ? 'Create your account.' : 'Welcome back.'}</h2><p>Save your details and make local trips easier.</p><form onSubmit={submitAuth}>{authMode === 'register' && <label>NAME<input required maxLength="50" value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} autoComplete="name" /></label>}<label>EMAIL<input required type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} autoComplete="email" /></label><label>PASSWORD<input required type="password" minLength="6" pattern={authMode === 'register' ? '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+' : undefined} title="Use uppercase and lowercase letters, a number, and a special character." value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} /></label>{authMode === 'register' && <small className="auth-password-hint">Use uppercase and lowercase letters, a number, and a special character.</small>}{authError && <div className="ticket-error" role="alert">{authError}</div>}<button className="ticket-button auth-submit" disabled={authBusy}>{authBusy ? 'Please wait…' : authMode === 'register' ? 'Create account' : 'Sign in'}</button></form><div className="auth-divider"><span />or continue with Google<span /></div>{authConfig?.googleClientId ? <div id="google-signin-button" /> : <div className="google-setup-note">Google sign-in needs a Google OAuth web client ID in <code>backend/.env</code>. Email and password sign-in is ready.</div>}<button className="auth-switch" onClick={() => { setAuthMode(authMode === 'register' ? 'login' : 'register'); setAuthError(''); }}>{authMode === 'register' ? 'Already have an account? Sign in' : 'New here? Create an account'}</button></section></div>}
  </div>;
}

function SuggestionList({ items, onChoose }) {
  return <div className="suggestions">{items.map((item) => <button type="button" key={item} onMouseDown={() => onChoose(item)}><MapPin size={14} />{item}</button>)}</div>;
}

function RouteCard({ option, recommended }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = option.tag === 'comfortable' ? Bike : option.tag === 'cheapest' || option.tag === 'fastest' ? BusFront : TrainFront;
  return <article className={`route-card ${option.tag || ''}${recommended ? ' recommended' : ''}`}>
    <div className="route-card-top"><span className={`route-icon ${option.tag || ''}`}><Icon size={19} /></span><span className="route-title"><span>{option.tag === 'fastest' ? 'QUICK CONNECTION' : option.tag === 'cheapest' ? 'SAVE AS YOU GO' : 'RIDE IN COMFORT'}</span><strong>{option.label}</strong></span>{recommended && <span className="recommended-chip"><Sparkles size={12} /> Best match</span>}</div>
    <div className="route-metrics"><div><span>EST. FARE</span><strong>₹{option.fare_inr}</strong></div><div><span>TRAVEL TIME</span><strong>{option.duration_min}<small> min</small></strong></div><div><span>CHANGES</span><strong>{option.transfers ?? 0}<small> transfers</small></strong></div></div>
    {option.provider_estimates?.length > 0 && <div className="provider-estimates"><div className="provider-estimate-heading">Indicative private ride estimates</div><div className="provider-estimate-list">{option.provider_estimates.map((estimate) => { const RideIcon = estimate.provider === 'Uber' ? CarFront : estimate.provider === 'Rapido' ? Bike : BusFront; return <div className="provider-estimate" key={estimate.provider}><RideIcon size={15} aria-hidden="true" /><span><strong>{estimate.provider}</strong><small>{estimate.ride_type} · about {estimate.duration_min} min</small></span><b>₹{estimate.fare_inr}</b></div>; })}</div><small className="provider-estimate-note">{option.fare_note}</small></div>}
    <div className="route-line">{(option.legs || []).slice(0, expanded ? undefined : 4).map((leg, index) => <div className="leg" key={`${leg.mode}-${index}`}><span className={`leg-icon ${leg.mode === 'WALK' ? 'walk' : ''}`}>{leg.mode === 'WALK' ? <Footprints size={14} /> : leg.mode === 'TRAIN' ? <TrainFront size={14} /> : leg.mode === 'CAB' || leg.mode.includes('AUTO') ? <Bike size={14} /> : <BusFront size={14} />}</span><span className="leg-copy"><strong>{leg.description || `${modes[leg.mode] || leg.mode} from ${leg.stop_from || 'Start'} to ${leg.stop_to || 'Next stop'}`}</strong><small>{leg.duration_min} min{leg.distance_meters ? ` · ${(leg.distance_meters / 1000).toFixed(1)} km` : ''}</small></span><span className="leg-mode">{modes[leg.mode] || leg.mode}</span></div>)}{(option.legs || []).length === 0 && <div className="leg"><span className="leg-icon"><MapPin size={14} /></span><span className="leg-copy"><strong>Direct trip</strong><small>{option.duration_min} min</small></span></div>}</div>
    {(option.legs || []).length > 4 && <button className="show-legs" onClick={() => setExpanded(!expanded)}>{expanded ? 'Show less' : `Show all ${option.legs.length} steps`} <ChevronDown size={14} /></button>}<div className="card-bottom"><span className="crowd"><Users size={14} /> {option.crowding || 'moderate'} crowding</span><span>{option.confidence ?? 90}% {option.tag === 'comfortable' ? 'estimate' : 'route'} confidence <Check size={13} /></span></div>
  </article>;
}

export default App;
