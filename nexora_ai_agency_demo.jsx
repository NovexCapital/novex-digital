import React, { useEffect, useRef, useState } from "react";

const PHONE_NUMBER = "27688215876";
const GOOGLE_SHEETS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxW-cDYysfS7eiLTqZxjX6AJGKbwVvWTD-_eoifG4vSB6VIccpmQJv_ozova3HrZbU9ng/exec";
const META_PIXEL_ID = "PASTE_YOUR_META_PIXEL_ID_HERE";
const GOOGLE_MEASUREMENT_ID = "PASTE_YOUR_GA4_MEASUREMENT_ID_HERE";
const WHATSAPP_MESSAGE = "Hi Novex Digital, I saw your website and I am interested in your AI website, WhatsApp chatbot, or automation services.";
const WA_LINK = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
const INSTAGRAM_LINK = "https://instagram.com/novexdigitalai";
const LEAD_API_URL = "/api/leads";

const packages = [
  {
    name: "Starter Website",
    price: "R1,499 setup + R299/mo",
    description: "A clean business website with WhatsApp lead capture and hosting support.",
    features: ["1-page conversion website", "WhatsApp click-to-chat", "Lead capture form", "Basic SEO setup", "Hosting guidance", "Monthly edits"],
    cta: "Get this installed",
    popular: false,
  },
  {
    name: "AI Growth System",
    price: "R3,999 setup + R999/mo",
    description: "Website + AI WhatsApp assistant that answers questions and captures leads 24/7.",
    features: ["Everything in Starter", "WhatsApp AI assistant", "FAQ automation", "Lead qualification", "Booking request flow", "Monthly optimisation"],
    cta: "Get AI Growth",
    popular: true,
  },
  {
    name: "Business Automation",
    price: "From R8,999 setup + R2,499/mo",
    description: "Full automation system for sales, follow-ups, CRM, dashboards, and admin tasks.",
    features: ["Everything in Growth", "CRM or Google Sheets pipeline", "Auto follow-ups", "Quote/invoice workflows", "Dashboard reporting", "Priority support"],
    cta: "Automate my business",
    popular: false,
  },
];

const industries = ["Car dealerships", "Real estate agents", "Salons", "Clinics", "Plumbers", "Electricians", "Gyms", "Local retailers"];

const automationSteps = [
  "Customer messages your business on WhatsApp",
  "Your system responds quickly and asks the right questions",
  "Lead details are captured in a simple lead pipeline",
  "You receive a qualified enquiry with the important details",
  "Follow-ups and reminders can be automated as the business grows",
];

const botFlows = {
  services: [
    { from: "bot", text: "Novex Digital builds AI websites, WhatsApp chatbots, and automation systems for growing businesses." },
    { from: "bot", text: "Our most popular system combines a conversion website, WhatsApp entry points, lead capture, and automated follow-up support." },
    { from: "bot", text: "What type of business do you run? Example: salon, plumbing, car sales, real estate, clinic, or local service business." },
  ],
  pricing: [
    { from: "bot", text: "Our packages start from R1,499 setup + R299/month." },
    { from: "bot", text: "For most businesses, I recommend the AI Growth System at R3,999 setup + R999/month because it includes the website and WhatsApp AI flow." },
    { from: "bot", text: "Would you like the Starter, Growth, or Automation package?" },
  ],
  booking: [
    { from: "bot", text: "Great. I can help you request a free AI audit." },
    { from: "bot", text: "Please send your name, business type, and what you want automated. Then tap the WhatsApp button to send it directly to Novex Digital." },
  ],
  website: [
    { from: "bot", text: "Yes, we build websites that are designed to convert visitors into WhatsApp leads." },
    { from: "bot", text: "Your site can include services, pricing, enquiry forms, a chatbot demo, and strong WhatsApp call-to-action buttons." },
  ],
  salon: [
    { from: "bot", text: "For salons and barbers, we can help automate bookings, service questions, pricing, location, operating hours, and reminders." },
    { from: "bot", text: "Typical lead details include the service needed, preferred date, preferred time, name, and WhatsApp number." },
  ],
  plumbing: [
    { from: "bot", text: "For plumbers and electricians, the system can capture the customer area, issue, urgency, photos, and contact number." },
    { from: "bot", text: "This helps you respond faster and prioritise emergency jobs." },
  ],
  cars: [
    { from: "bot", text: "For car dealerships, the system can qualify buyers by vehicle interest, budget, finance status, trade-in, and appointment request." },
    { from: "bot", text: "This gives your sales team cleaner leads to follow up with." },
  ],
  default: [
    { from: "bot", text: "I can help with services, pricing, websites, or booking a free AI audit. You can also try: salon demo, plumbing demo, or car sales demo." },
  ],
};

function getBotFlowKey(text) {
  const t = String(text || "").toLowerCase();

  if (t.includes("price") || t.includes("cost") || t.includes("package") || t.includes("how much")) return "pricing";
  if (t.includes("book") || t.includes("audit") || t.includes("demo") || t.includes("call")) return "booking";
  if (t.includes("salon") || t.includes("barber") || t.includes("hair")) return "salon";
  if (t.includes("plumb") || t.includes("electric") || t.includes("geyser") || t.includes("leak")) return "plumbing";
  if (t.includes("car") || t.includes("dealership") || t.includes("vehicle") || t.includes("finance")) return "cars";
  if (t.includes("website") || t.includes("landing page") || t.includes("site")) return "website";
  if (t.includes("service") || t.includes("bot") || t.includes("automation") || t.includes("whatsapp") || t.includes("ai")) return "services";

  return "default";
}

function runTests() {
  const tests = [
    { input: "How much does it cost?", expected: "pricing" },
    { input: "Show me the packages", expected: "pricing" },
    { input: "Can I book a demo?", expected: "booking" },
    { input: "I need a website", expected: "website" },
    { input: "Do you build WhatsApp bots?", expected: "services" },
    { input: "Salon booking system", expected: "booking" },
    { input: "Plumbing emergency", expected: "plumbing" },
    { input: "Car dealership finance", expected: "cars" },
    { input: "Hello", expected: "default" },
  ];

  tests.forEach((test) => {
    const actual = getBotFlowKey(test.input);
    if (actual !== test.expected) {
      throw new Error(`Test failed for ${test.input}. Expected ${test.expected}, got ${actual}.`);
    }
  });
}

function isConfigured(value) {
  return Boolean(value) && !String(value).startsWith("PASTE_YOUR_");
}

runTests();

function LogoMark({ className = "h-10 w-10" }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="novexBlue" x1="16" y1="16" x2="106" y2="104" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22d3ee" />
          <stop offset="0.5" stopColor="#0284c7" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="novexSilver" x1="80" y1="16" x2="112" y2="96" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f8fafc" />
          <stop offset="1" stopColor="#64748b" />
        </linearGradient>
        <filter id="novexGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width="120" height="120" rx="28" fill="#020617" />
      <path d="M28 30v58l17 12V54l45 46h19L45 30H28z" fill="url(#novexBlue)" filter="url(#novexGlow)" />
      <path d="M35 23l59 62V61L35 0v23z" transform="translate(0 18)" fill="url(#novexBlue)" opacity="0.95" />
      <path d="M88 29l19-13v72l-19 12V29z" fill="url(#novexSilver)" opacity="0.92" />
      <path d="M22 48h-9" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" />
      <path d="M22 61H8" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" />
      <path d="M22 74h-8" stroke="#22d3ee" strokeWidth="4" strokeLinecap="round" />
      <circle cx="10" cy="48" r="4" fill="#020617" stroke="#22d3ee" strokeWidth="3" />
      <circle cx="5" cy="61" r="4" fill="#020617" stroke="#22d3ee" strokeWidth="3" />
      <circle cx="11" cy="74" r="4" fill="#020617" stroke="#22d3ee" strokeWidth="3" />
    </svg>
  );
}

function Icon({ name, className = "h-5 w-5" }) {
  const commonProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    "aria-hidden": "true",
  };

  const icons = {
    menu: <svg {...commonProps}><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></svg>,
    x: <svg {...commonProps}><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>,
    check: <svg {...commonProps}><circle cx="12" cy="12" r="10" /><path d="M8 12l3 3 5-6" /></svg>,
    message: <svg {...commonProps}><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" /></svg>,
    send: <svg {...commonProps}><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>,
    phone: <svg {...commonProps}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6.4 6.4l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z" /></svg>,
    robot: <svg {...commonProps}><rect x="5" y="8" width="14" height="10" rx="3" /><path d="M12 8V4" /><path d="M8 12h.01" /><path d="M16 12h.01" /><path d="M9 16h6" /></svg>,
    bolt: <svg {...commonProps}><path d="M13 2L3 14h8l-1 8 11-14h-8l1-6z" /></svg>,
    globe: <svg {...commonProps}><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15 15 0 0 1 0 20" /><path d="M12 2a15 15 0 0 0 0 20" /></svg>,
    chevron: <svg {...commonProps}><path d="M9 18l6-6-6-6" /></svg>,
    shield: <svg {...commonProps}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-5" /></svg>,
  };

  return icons[name] || icons.check;
}

function Header() {
  const [open, setOpen] = useState(false);
  const nav = ["Services", "System", "Packages", "Contact"];

  return (
    <header className="sticky top-0 z-40 border-b border-cyan-300/10 bg-slate-950/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-5">
        <a href="#home" className="flex items-center gap-3" aria-label="Novex Digital home">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-400/10 shadow-lg shadow-cyan-500/20">
            <LogoMark className="h-11 w-11" />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-white">Novex Digital</p>
            <p className="text-xs text-cyan-200/70">Connect • Automate • Grow</p>
          </div>
        </a>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
          {nav.map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="text-sm text-slate-300 transition hover:text-cyan-200">
              {item}
            </a>
          ))}
          <a href={WA_LINK} target="_blank" rel="noreferrer" className="rounded-full bg-cyan-300 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-white">
            WhatsApp Us
          </a>
        </nav>

        <button type="button" onClick={() => setOpen(!open)} className="rounded-xl border border-white/10 p-2 text-white md:hidden" aria-label="Toggle mobile menu" aria-expanded={open}>
          <Icon name={open ? "x" : "menu"} />
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/10 bg-slate-950 px-5 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {nav.map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setOpen(false)} className="text-slate-200">
                {item}
              </a>
            ))}
            <a href={WA_LINK} target="_blank" rel="noreferrer" className="rounded-xl bg-cyan-300 px-4 py-3 text-center font-bold text-slate-950">WhatsApp Us</a>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function Stat({ value, label }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{label}</p>
    </div>
  );
}

function ChatDemo() {
  const leadQuestions = [
    { key: "name", question: "Great — what is your name?" },
    { key: "business", question: "What is your business name or business type?" },
    { key: "whatsapp", question: "What WhatsApp number should we contact you on?" },
    { key: "automation", question: "What would you like to improve or automate? Example: website, WhatsApp replies, bookings, lead capture, follow-ups." },
  ];

  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi 👋 I’m the Novex Digital assistant. I can help you request a free AI audit and capture your details for the team." },
    { from: "bot", text: "Tap Start AI Audit below, or ask about services and pricing." },
  ]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [captureMode, setCaptureMode] = useState(false);
  const [leadStep, setLeadStep] = useState(0);
  const [leadData, setLeadData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const endRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, submitting]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const addBotMessages = (botMessages, delay = 500) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setTyping(true);
    timeoutRef.current = setTimeout(() => {
      setMessages((current) => [...current, ...botMessages]);
      setTyping(false);
      timeoutRef.current = null;
    }, delay);
  };

  const submitLead = async (data) => {
    setSubmitting(true);
    const payload = {
      name: data.name || "",
      business: data.business || "",
      whatsapp: data.whatsapp || "",
      service: "Website + WhatsApp AI",
      automation: data.automation || "",
      source: "Novex Digital Website Chatbot",
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await fetch(LEAD_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Lead endpoint failed");

      if (window.fbq) window.fbq("track", "Lead");
      if (window.gtag) window.gtag("event", "generate_lead", { event_category: "Lead", event_label: "Chatbot Lead" });

      const directText = `Hi Novex Digital, I completed the AI audit form.\n\nName: ${payload.name}\nBusiness: ${payload.business}\nWhatsApp: ${payload.whatsapp}\nNeed: ${payload.automation}`;
      const directLink = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(directText)}`;

      setMessages((current) => [
        ...current,
        { from: "bot", text: "Perfect — your details have been captured. The next step is to message us directly on WhatsApp so we can continue the conversation." },
        { from: "bot", text: "Tap the WhatsApp button below to send your request instantly." },
        { from: "action", text: "Continue on WhatsApp", link: directLink },
      ]);
      setCaptureMode(false);
      setLeadStep(0);
      setLeadData({});
    } catch (error) {
      setMessages((current) => [...current, { from: "bot", text: "Something went wrong while saving your details. Please tap WhatsApp Us and message Novex Digital directly." }]);
    } finally {
      setSubmitting(false);
    }
  };

  const startCapture = () => {
    setCaptureMode(true);
    setLeadStep(0);
    setLeadData({});
    setMessages((current) => [...current, { from: "user", text: "Start AI Audit" }]);
    addBotMessages([{ from: "bot", text: leadQuestions[0].question }]);
  };

  const sendFlow = (key, customText) => {
    const text = customText || (key === "pricing" ? "How much does it cost?" : key === "booking" ? "Start AI Audit" : "What services do you offer?");

    if (key === "booking") {
      setMessages((current) => [...current, { from: "user", text }]);
      setCaptureMode(true);
      setLeadStep(0);
      setLeadData({});
      addBotMessages([{ from: "bot", text: leadQuestions[0].question }]);
      return;
    }

    if (!customText) {
      setMessages((current) => [...current, { from: "user", text }]);
    }

    addBotMessages(botFlows[key] || botFlows.default);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || submitting) return;
    setInput("");
    setMessages((current) => [...current, { from: "user", text }]);

    if (captureMode) {
      const currentQuestion = leadQuestions[leadStep];
      const updatedLeadData = { ...leadData, [currentQuestion.key]: text };
      setLeadData(updatedLeadData);

      const nextStep = leadStep + 1;
      if (nextStep < leadQuestions.length) {
        setLeadStep(nextStep);
        addBotMessages([{ from: "bot", text: leadQuestions[nextStep].question }]);
      } else {
        addBotMessages([{ from: "bot", text: "Thanks. I’m saving your request now..." }], 300);
        setTimeout(() => submitLead(updatedLeadData), 700);
      }
      return;
    }

    addBotMessages(botFlows[getBotFlowKey(text)] || botFlows.default);
  };

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-cyan-300/20 bg-slate-950 shadow-2xl shadow-cyan-950/40 sm:rounded-[2rem]">
      <div className="flex items-center justify-between bg-gradient-to-r from-cyan-400/20 to-blue-500/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-cyan-400/10">
            <LogoMark className="h-10 w-10" />
          </div>
          <div>
            <p className="font-bold text-white">Novex Lead Assistant</p>
            <p className="flex items-center gap-1 text-xs text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-300" /> Online now</p>
          </div>
        </div>
        <Icon name="message" className="h-5 w-5 text-cyan-200" />
      </div>

      <div className="h-[390px] overflow-y-auto bg-slate-900 p-4 sm:h-[420px] sm:p-5">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={`${message.from}-${index}-${message.text}`} className={`flex ${message.from === "user" || message.from === "action" ? "justify-end" : "justify-start"}`}>
              {message.from === "action" ? (
                <a href={message.link} target="_blank" rel="noreferrer" className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-slate-950 hover:bg-white">
                  {message.text}
                </a>
              ) : (
                <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.from === "user" ? "bg-cyan-300 text-slate-950" : "border border-white/10 bg-white/[0.06] text-slate-100"}`}>
                  {message.text}
                </div>
              )}
            </div>
          ))}
          {typing ? <div className="w-fit rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-slate-300">Assistant is typing...</div> : null}
          {submitting ? <div className="w-fit rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-200">Saving your request...</div> : null}
          <div ref={endRef} />
        </div>
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          <button type="button" onClick={startCapture} className="rounded-full bg-cyan-300 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-white">Start AI Audit</button>
          {[["services", "Services"], ["pricing", "Pricing"], ["salon", "Salon"], ["plumbing", "Plumbing"], ["cars", "Car Sales"]].map(([key, label]) => (
            <button key={key} type="button" onClick={() => sendFlow(key)} className="rounded-full border border-cyan-300/20 px-3 py-2 text-xs text-cyan-100 hover:bg-cyan-300/10">
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") handleSend(); }} placeholder={captureMode ? "Type your answer..." : "Ask a question or start an audit..."} className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50" />
          <button type="button" onClick={handleSend} disabled={submitting} className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300 text-slate-950 hover:bg-white disabled:opacity-50" aria-label="Send message">
            <Icon name="send" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PackageCard({ pkg }) {
  return (
    <div className={`rounded-[2rem] border p-6 ${pkg.popular ? "border-cyan-300/60 bg-cyan-300/[0.08] shadow-2xl shadow-cyan-950/50" : "border-white/10 bg-white/[0.04]"}`}>
      {pkg.popular ? <div className="mb-4 w-fit rounded-full bg-cyan-300 px-3 py-1 text-xs font-bold text-slate-950">Best seller</div> : null}
      <h3 className="text-xl font-black text-white">{pkg.name}</h3>
      <p className="mt-4 text-2xl font-black text-cyan-200">{pkg.price}</p>
      <p className="mt-3 text-sm leading-6 text-slate-400">{pkg.description}</p>
      <div className="mt-6 space-y-3">
        {pkg.features.map((feature) => (
          <div key={feature} className="flex items-start gap-3 text-sm text-slate-300">
            <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /> {feature}
          </div>
        ))}
      </div>
      <a href={WA_LINK} target="_blank" rel="noreferrer" className={`mt-7 flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition ${pkg.popular ? "bg-cyan-300 text-slate-950 hover:bg-white" : "border border-white/10 text-white hover:bg-white/10"}`}>
        {pkg.cta}<Icon name="chevron" className="h-4 w-4" />
      </a>
    </div>
  );
}

function FloatingWhatsApp() {
  return (
    <a href={WA_LINK} target="_blank" rel="noreferrer" className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-3 text-xs font-black text-slate-950 shadow-2xl shadow-emerald-900/40 transition hover:bg-white sm:bottom-5 sm:right-5 sm:px-5 sm:text-sm">
      <Icon name="message" /> <span className="hidden sm:inline">WhatsApp Us</span><span className="sm:hidden">Chat</span>
    </a>
  );
}

export default function App() {
  const [formSent, setFormSent] = useState(false);
  const [formError, setFormError] = useState("");
  const year = new Date().getFullYear();

  useEffect(() => {
    if (isConfigured(META_PIXEL_ID) && !window.fbq) {
      window.fbq = function () {
        window.fbq.callMethod ? window.fbq.callMethod.apply(window.fbq, arguments) : window.fbq.queue.push(arguments);
      };
      window.fbq.queue = [];
      window.fbq.loaded = true;
      window.fbq.version = "2.0";
      window.fbq("init", META_PIXEL_ID);
      window.fbq("track", "PageView");
    }

    if (isConfigured(GOOGLE_MEASUREMENT_ID) && !window.gtag) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
      window.gtag("js", new Date());
      window.gtag("config", GOOGLE_MEASUREMENT_ID);
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: formData.get("name"),
      business: formData.get("business"),
      whatsapp: formData.get("whatsapp"),
      service: formData.get("service"),
      automation: formData.get("automation"),
      source: "Novex Digital Website",
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await fetch(LEAD_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Lead endpoint failed");

      if (window.fbq) window.fbq("track", "Lead");
      if (window.gtag) window.gtag("event", "generate_lead", { event_category: "Lead", event_label: payload.service });

      setFormSent(true);
      form.reset();
    } catch (error) {
      setFormError("Something went wrong. Please message us directly on WhatsApp.");
    }
  };

  return (
    <main id="home" className="min-h-screen bg-slate-950 text-white">
      <FloatingWhatsApp />
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[460px] w-[460px] rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <Header />

      <section className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-5 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div>
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
            <LogoMark className="h-7 w-7" /> AI systems for South African businesses
          </div>
          <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl md:text-6xl">
            Get More Customers Automatically with AI-Powered Websites & WhatsApp Automation
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            We build systems that reply instantly, capture leads, and turn visitors into paying customers — 24/7.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href={WA_LINK} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-6 py-4 font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-white">
              <Icon name="message" /> Chat on WhatsApp
            </a>
            <a href="#system" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-6 py-4 font-bold text-white transition hover:bg-white/10">
              <Icon name="robot" /> See the system
            </a>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <Stat value="24/7" label="Customer replies" />
            <Stat value="3-in-1" label="Website + bot + automation" />
            <Stat value="+27 68 821 5876" label="Direct WhatsApp contact" />
          </div>
        </div>
        <ChatDemo />
      </section>

      <section className="relative mx-auto max-w-7xl px-5 py-12">
        <div className="grid gap-6 rounded-[2rem] border border-cyan-300/20 bg-gradient-to-br from-cyan-300/10 via-white/[0.04] to-blue-600/10 p-8 lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-cyan-300">Limited Setup Offer</p>
            <h2 className="mt-3 text-3xl font-black md:text-5xl">Website + WhatsApp AI system set up in 3 days.</h2>
            <p className="mt-5 leading-8 text-slate-300">We build the system for you so your business can reply faster, capture leads automatically, and stop losing customers to slow responses.</p>
            <a href={WA_LINK} target="_blank" rel="noreferrer" className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-6 py-4 font-black text-slate-950 hover:bg-white">
              <Icon name="message" /> Get started today
            </a>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {["Instant replies to customers", "Automated lead capture", "WhatsApp-first system", "No technical work needed"].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-slate-200">
                <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" /> {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-5 py-12">
        <div className="rounded-[2rem] border border-rose-300/20 bg-rose-300/[0.06] p-8 lg:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-rose-200">The Problem</p>
          <h2 className="mt-3 text-3xl font-black md:text-5xl">Without automation, you are losing customers.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {["Slow replies = lost sales", "Missed messages = missed income", "Competitors reply faster", "Customers choose someone else"].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/50 p-5 text-sm font-bold text-slate-200">{item}</div>
            ))}
          </div>
          <a href={WA_LINK} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-6 py-4 font-black text-slate-950 hover:bg-white">
            <Icon name="bolt" /> Fix this with automation
          </a>
        </div>
      </section>

      <section id="services" className="relative mx-auto max-w-7xl px-5 py-16">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-cyan-300">What Novex Builds</p>
          <h2 className="mt-3 text-3xl font-black md:text-5xl">Your business should never miss another lead.</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6"><Icon name="globe" className="mb-5 h-9 w-9 text-cyan-300" /><h3 className="text-xl font-bold">AI Websites</h3><p className="mt-3 text-sm leading-7 text-slate-400">Conversion-focused websites built to drive WhatsApp enquiries and bookings.</p></div>
          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6"><Icon name="robot" className="mb-5 h-9 w-9 text-cyan-300" /><h3 className="text-xl font-bold">WhatsApp AI Bots</h3><p className="mt-3 text-sm leading-7 text-slate-400">AI assistants that reply instantly, answer FAQs, qualify leads, and collect details.</p></div>
          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6"><Icon name="bolt" className="mb-5 h-9 w-9 text-cyan-300" /><h3 className="text-xl font-bold">Automation Systems</h3><p className="mt-3 text-sm leading-7 text-slate-400">Automated follow-ups, CRM updates, quote flows, dashboards, and admin workflows.</p></div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-12 sm:px-5 sm:py-16">
        <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-cyan-300">Why Businesses Trust Novex</p>
              <h2 className="mt-3 text-3xl font-black md:text-5xl">Professional systems, clear support, and practical automation.</h2>
              <p className="mt-5 leading-8 text-slate-300">We focus on simple, useful AI systems that help businesses respond faster, capture better leads, and look more professional online.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {["Secure lead capture setup", "Google Sheets / CRM ready", "WhatsApp-first customer journeys", "Mobile-friendly websites", "Clear monthly support", "Built with scalable tools"].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-200">
                  <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" /> {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="system" className="relative mx-auto max-w-7xl px-5 py-16">
        <div className="grid gap-8 rounded-[2rem] border border-cyan-300/20 bg-gradient-to-br from-cyan-300/10 via-white/[0.04] to-blue-600/10 p-8 lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-cyan-300">How It Works</p>
            <h2 className="mt-3 text-3xl font-black md:text-5xl">A smarter way to handle customers on WhatsApp.</h2>
            <p className="mt-5 leading-8 text-slate-300">When customers contact your business, Novex Digital helps you respond faster, collect the right details, and turn more enquiries into real opportunities.</p>
            <a href={WA_LINK} target="_blank" rel="noreferrer" className="mt-7 inline-flex rounded-2xl bg-cyan-300 px-6 py-4 font-black text-slate-950 hover:bg-white">Start with Novex Digital</a>
          </div>
          <div className="space-y-4">
            {automationSteps.map((step, index) => (
              <div key={step} className="flex gap-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cyan-300 text-sm font-black text-slate-950">{index + 1}</div>
                <p className="text-slate-200">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-5 py-16">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-cyan-300">Who We Help</p>
          <h2 className="mt-3 text-3xl font-black md:text-5xl">Built for businesses that depend on enquiries.</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {industries.map((industry) => (
            <span key={industry} className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-slate-200">{industry}</span>
          ))}
        </div>
      </section>

      <section id="packages" className="relative mx-auto max-w-7xl px-4 py-14 sm:px-5 sm:py-16">
        <div className="mb-8 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">Limited Availability</p>
          <p className="mt-1 text-sm text-slate-200">We only onboard a small number of businesses each month to ensure proper setup and support.</p>
        </div>
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-cyan-300">Packages</p>
          <h2 className="mt-3 text-3xl font-black md:text-5xl">Choose the system that helps your business reply faster, capture more leads, and grow monthly.</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => <PackageCard key={pkg.name} pkg={pkg} />)}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-12 sm:px-5 sm:py-16">
        <div className="rounded-[2rem] border border-cyan-300/20 bg-gradient-to-br from-cyan-300/10 via-slate-900/90 to-blue-600/10 p-8 text-center lg:p-12">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-cyan-300">Follow Novex Digital</p>
          <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-black md:text-5xl">See AI systems, automation ideas, and business growth tips.</h2>
          <p className="mx-auto mt-5 max-w-2xl leading-8 text-slate-300">Follow us on Instagram for demos, examples, and practical ideas for using AI in your business.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a href={INSTAGRAM_LINK} target="_blank" rel="noreferrer" className="rounded-2xl border border-white/10 px-6 py-4 font-black text-white hover:bg-white/10">Open Instagram</a>
            <a href={WA_LINK} target="_blank" rel="noreferrer" className="rounded-2xl bg-cyan-300 px-6 py-4 font-black text-slate-950 hover:bg-white">Chat on WhatsApp</a>
          </div>
        </div>
      </section>

      <section id="contact" className="relative mx-auto max-w-7xl px-5 py-20">
        <div className="grid overflow-hidden rounded-[2.5rem] border border-cyan-300/20 bg-slate-900/70 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="p-8 md:p-12">
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-cyan-300">Start Here</p>
            <h2 className="mt-3 text-3xl font-black md:text-5xl">Request your free AI audit.</h2>
            <p className="mt-5 leading-8 text-slate-300">Tell us what your business does and we will recommend the best website, WhatsApp bot, or automation system for you.</p>
            <div className="mt-8 space-y-4 text-slate-200">
              <div className="flex items-center gap-3"><Icon name="phone" className="h-5 w-5 text-cyan-300" /> WhatsApp: +27 68 821 5876</div>
              <div className="flex items-center gap-3"><Icon name="shield" className="h-5 w-5 text-cyan-300" /> Built by Novex Digital</div>
            </div>
          </div>
          <form className="bg-white/[0.04] p-8 pb-24 md:p-12 md:pb-12" onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <label className="text-sm text-slate-300" htmlFor="name">Your name</label>
              <input id="name" required name="name" placeholder="Your name" className="rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-300/50" />
              <label className="text-sm text-slate-300" htmlFor="business">Business name</label>
              <input id="business" required name="business" placeholder="Business name" className="rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-300/50" />
              <label className="text-sm text-slate-300" htmlFor="whatsapp">WhatsApp number</label>
              <input id="whatsapp" required name="whatsapp" placeholder="WhatsApp number" className="rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-300/50" />
              <label className="text-sm text-slate-300" htmlFor="service">Service needed</label>
              <select id="service" name="service" defaultValue="Website + WhatsApp AI" className="rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-4 text-slate-300 outline-none focus:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-300/50">
                <option>Website + WhatsApp AI</option>
                <option>WhatsApp AI only</option>
                <option>Business automation</option>
                <option>Not sure yet</option>
              </select>
              <label className="text-sm text-slate-300" htmlFor="automation">What do you want to improve or automate?</label>
              <textarea id="automation" name="automation" placeholder="What do you want to improve or automate?" rows={4} className="rounded-2xl border border-white/10 bg-slate-950/70 px-5 py-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/60 focus-visible:ring-2 focus-visible:ring-cyan-300/50" />
              <p className="text-xs leading-6 text-slate-400">By submitting, you agree that Novex Digital can contact you on WhatsApp about your request.</p>
              {formSent ? <p className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-5 py-3 text-sm text-emerald-200">Request captured. Your lead has been sent to Novex Digital.</p> : null}
              {formError ? <p className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-5 py-3 text-sm text-rose-200">{formError}</p> : null}
              <button type="submit" className="rounded-2xl bg-cyan-300 px-6 py-4 font-black text-slate-950 transition hover:bg-white">Submit request</button>
              <a href={WA_LINK} target="_blank" rel="noreferrer" className="rounded-2xl border border-emerald-300/30 bg-emerald-300/10 px-6 py-4 text-center font-black text-emerald-200 transition hover:bg-emerald-300 hover:text-slate-950">Message directly on WhatsApp</a>
            </div>
          </form>
        </div>
      </section>

    <footer className="relative border-t border-white/10 px-5 py-8 text-center text-sm text-slate-500">
        © {year} Novex Digital. Connect. Automate. Grow.
      </footer>
    </main>
  );
}
