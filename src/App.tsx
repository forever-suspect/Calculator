import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  History,
  Users,
  Info,
  Calculator as CalcIcon,
  Save,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  HandMetal,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {
  calculateLifePath,
  PATH_DESCRIPTIONS,
  reduceNumber,
  calculateNameNumber,
  NumerologySystem
} from './lib/numerology';
import { getDailyHoroscope, getCompatibilityReport } from './lib/gemini';
import { auth, signIn, db, handleFirestoreError, OperationType } from './lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { Card, Button, Input, cn } from './components/UI';

type View = 'calc' | 'systems' | 'saved' | 'compatibility' | 'horoscope';

export default function App() {
  const [user, setUser] = useState(auth.currentUser);
  const [view, setView] = useState<View>('calc');
  const [birthdate, setBirthdate] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedSystem, setSelectedSystem] = useState<NumerologySystem>('Pythagorean');
  const [result, setResult] = useState<any>(null);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedResults, setSavedResults] = useState<any[]>([]);
  const [horoscope, setHoroscope] = useState('');
  const [loadingHoroscope, setLoadingHoroscope] = useState(false);
  const [compReport, setCompReport] = useState('');
  const [loadingComp, setLoadingComp] = useState(false);
  const [p1Path, setP1Path] = useState('');
  const [p2Path, setP2Path] = useState('');

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      if (u) fetchSaved(u.uid);
    });
    return unsub;
  }, []);

  const fetchSaved = async (uid: string) => {
    try {
      const q = query(collection(db, 'saved_results'), where('userId', '==', uid));
      const snap = await getDocs(q);
      setSavedResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCalc = () => {
    if (!birthdate) return;
    const lifePathResult = calculateLifePath(birthdate);
    const nameResult = fullName ? calculateNameNumber(fullName, selectedSystem) : null;
    
    setResult({
      ...lifePathResult,
      nameNumber: nameResult,
      system: selectedSystem,
      fullName
    });
  };

  const handleSave = async () => {
    if (!user || !result) return;
    setIsSaving(true);
    try {
      const type = result.fullName ? 'Full Profile' : 'Life Path';
      const name = result.fullName ? `${result.fullName} (${result.total}/${result.nameNumber})` : `Life Path ${result.total}`;
      
      await addDoc(collection(db, 'saved_results'), {
        userId: user.uid,
        name,
        type,
        number: result.total,
        note,
        createdAt: serverTimestamp(),
        resultData: result
      });
      setNote('');
      fetchSaved(user.uid);
      alert('Result saved successfully!');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'saved_results');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSaved = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'saved_results', id));
      fetchSaved(user!.uid);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHoroscope = async (num: number) => {
    setLoadingHoroscope(true);
    const h = await getDailyHoroscope(num);
    setHoroscope(h || '');
    setLoadingHoroscope(false);
  };

  const handleCompatibility = async () => {
    if (!p1Path || !p2Path) return;
    setLoadingComp(true);
    const r = await getCompatibilityReport(parseInt(p1Path), parseInt(p2Path));
    setCompReport(r || '');
    setLoadingComp(false);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A] font-serif flex flex-col selection:bg-[#E5E1D8]">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FAF9F6]/80 backdrop-blur-md border-b border-[#E5E1D8] h-32 px-8 md:px-12 flex justify-between items-end pb-8">
        <div className="flex flex-col">
          <span className="text-[10px] tracking-[0.2em] font-sans uppercase opacity-60 mb-1">Cosmic Order & Numerical Harmony</span>
          <h1 className="text-4xl italic lowercase font-light tracking-tight">Aether <span className="font-bold not-italic">Numerology</span></h1>
        </div>

        <div className="hidden md:flex items-center gap-12 font-sans text-[11px] uppercase tracking-widest pb-1">
          <button onClick={() => setView('calc')} className={cn("hover:opacity-100 transition-opacity", view === 'calc' ? "border-b border-[#1A1A1A] pb-1" : "opacity-40")}>Calculator</button>
          <button onClick={() => setView('compatibility')} className={cn("hover:opacity-100 transition-opacity", view === 'compatibility' ? "border-b border-[#1A1A1A] pb-1" : "opacity-40")}>Compatibility</button>
          <button onClick={() => setView('horoscope')} className={cn("hover:opacity-100 transition-opacity", view === 'horoscope' ? "border-b border-[#1A1A1A] pb-1" : "opacity-40")}>Daily</button>
          <button onClick={() => setView('systems')} className={cn("hover:opacity-100 transition-opacity", view === 'systems' ? "border-b border-[#1A1A1A] pb-1" : "opacity-40")}>Systems</button>
          {user && (
            <button onClick={() => setView('saved')} className={cn("hover:opacity-100 transition-opacity", view === 'saved' ? "border-b border-[#1A1A1A] pb-1" : "opacity-40")}>Archives</button>
          )}
        </div>

        <div className="flex items-center gap-4 pb-1">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase font-sans tracking-wider opacity-40 hidden sm:inline">{user.email}</span>
              <button onClick={() => auth.signOut()} className="text-[10px] uppercase font-sans tracking-widest underline decoration-[#E5E1D8] hover:text-black">
                Sign Out
              </button>
            </div>
          ) : (
            <button onClick={signIn} className="text-[10px] uppercase font-sans tracking-widest underline decoration-[#E5E1D8] hover:text-black">Sign In</button>
          )}
        </div>
      </nav>

      <main className="pt-48 pb-20 px-8 max-w-[1400px] w-full mx-auto flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {view === 'calc' && (
            <motion.div
              key="calc"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col md:flex-row gap-12"
            >
              {/* Left Sidebar: Form */}
              <aside className="w-full md:w-1/3 flex flex-col gap-12">
                <section>
                  <h3 className="text-[11px] font-sans uppercase tracking-[0.15em] mb-8 opacity-60 italic">Personal Data</h3>
                  <div className="space-y-10">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase font-sans opacity-40">Your Full Name</label>
                      <Input
                        placeholder="Julianna Sterling"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="text-xl border-[#E5E1D8]"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] uppercase font-sans opacity-40">Reveal Your Entrance Date</label>
                      <Input
                        type="date"
                        value={birthdate}
                        onChange={(e) => setBirthdate(e.target.value)}
                        className="text-2xl border-[#E5E1D8]"
                      />
                    </div>
                    <div className="flex flex-col gap-4">
                      <label className="text-[10px] uppercase font-sans opacity-40">Numerological System</label>
                      <div className="flex gap-2">
                        {(['Pythagorean', 'Chaldean'] as NumerologySystem[]).map((sys) => (
                          <button
                            key={sys}
                            onClick={() => setSelectedSystem(sys)}
                            className={cn(
                              "flex-1 py-3 text-[10px] uppercase tracking-widest border transition-all",
                              selectedSystem === sys 
                                ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" 
                                : "bg-transparent text-[#1A1A1A] border-[#E5E1D8] hover:border-[#1A1A1A]"
                            )}
                          >
                            {sys}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Button onClick={handleCalc} className="w-full py-5 text-sm uppercase">Calculate Destiny</Button>
                  </div>
                </section>

                <section className="mt-auto opacity-50">
                  <p className="text-[12px] leading-relaxed text-[#555] font-sans text-justify">
                    <strong className="text-[#1A1A1A] font-bold">Provenance:</strong> Your Life Path Number represents the core of who you are, the challenges you will face, and the opportunities you will encounter throughout your Earthly journey.
                  </p>
                </section>
              </aside>

              {/* Central Result Area */}
              <section className="flex-1 border-l border-[#E5E1D8] md:pl-12 flex flex-col items-center">
                <AnimatePresence mode="wait">
                  {result ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full text-center py-12"
                    >
                      <h2 className="text-[11px] font-sans uppercase tracking-[0.3em] mb-12 opacity-60">
                        {result.fullName ? `Analysis for ${result.fullName}` : 'The Life Path Result'}
                      </h2>

                      <div className="flex flex-col md:flex-row justify-center items-center gap-12 md:gap-24 mb-12">
                        {/* Life Path */}
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] uppercase tracking-[0.5em] opacity-40 mb-2">Life Path</span>
                          <div className="relative inline-block mb-4">
                            <span className="text-[120px] leading-none font-bold tracking-tighter text-[#1A1A1A]">
                              {result.total}
                            </span>
                            <span className="absolute -top-2 -right-8 text-[8px] font-sans tracking-[0.5em] uppercase opacity-40 rotate-90">Root</span>
                          </div>
                          <p className="text-xl italic text-[#1A1A1A] font-light">
                            {result.master ? `Master ${result.total}` : `Vibration ${result.total}`}
                          </p>
                        </div>

                        {/* Name Number (Expression) */}
                        {result.nameNumber !== null && (
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] uppercase tracking-[0.5em] opacity-40 mb-2">Expression ({result.system})</span>
                            <div className="relative inline-block mb-4">
                              <span className="text-[120px] leading-none font-bold tracking-tighter text-[#1A1A1A]">
                                {result.nameNumber}
                              </span>
                              <span className="absolute -top-2 -right-8 text-[8px] font-sans tracking-[0.5em] uppercase opacity-40 rotate-90">Name</span>
                            </div>
                            <p className="text-xl italic text-[#1A1A1A] font-light">
                              Vibration {result.nameNumber}
                            </p>
                          </div>
                        )}
                      </div>

                      <p className="max-w-2xl mx-auto text-2xl italic text-[#1A1A1A] mb-12 font-light px-8">
                        {result.master ? `Master ${result.total}: The Illuminated` : PATH_DESCRIPTIONS[result.total] || "A unique and powerful path awaits."}
                      </p>

                      <div className="max-w-md mx-auto text-[13px] leading-relaxed text-[#444] font-sans text-justify bg-white/40 p-8 border border-[#E5E1D8] mb-12">
                        <strong className="block text-[10px] uppercase tracking-widest mb-4 opacity-40 italic">Mathematical Reduction</strong>
                        <div className="flex flex-wrap justify-center gap-2 mb-4">
                          {result.steps.map((step: number, i: number) => (
                            <span key={i} className="flex items-center gap-2">
                              <span className={cn(i === result.steps.length - 1 ? "font-bold text-[#1A1A1A]" : "opacity-40")}>{step}</span>
                              {i < result.steps.length - 1 && <span className="opacity-20">+</span>}
                            </span>
                          ))}
                        </div>
                        <p className="border-t border-[#E5E1D8] pt-4 mt-4 text-center">
                          The vibration of these numbers harmonizes to form your primary frequency.
                        </p>
                      </div>

                      {user ? (
                        <div className="max-w-md mx-auto flex flex-col gap-6">
                          <textarea
                            placeholder="Record your reflections on this path..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full bg-[#F4F2EE] p-6 text-xs font-sans border-none focus:ring-0 resize-none h-32 italic"
                          />
                          <div className="flex gap-4">
                            <Button onClick={handleSave} className="flex-1" disabled={isSaving}>
                              {isSaving ? 'Recording...' : 'Save to Journal'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={signIn} className="text-xs uppercase font-sans tracking-widest underline decoration-[#E5E1D8] opacity-60">Sign in to record your discovery</button>
                      )}
                    </motion.div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-[#E5E1D8] select-none p-12">
                      <CalcIcon size={120} strokeWidth={0.5} className="mb-8 opacity-20" />
                      <p className="text-sm font-sans uppercase tracking-[0.4em] opacity-40">Ready for Alignment</p>
                    </div>
                  )}
                </AnimatePresence>
              </section>
            </motion.div>
          )}

          {view === 'horoscope' && (
            <motion.div
              key="horoscope"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              <div className="flex flex-col items-center mb-24">
                <h1 className="text-6xl font-light italic lowercase mb-4 tracking-tight">Daily <span className="font-bold not-italic">Forecast</span></h1>
                <p className="text-[11px] font-sans uppercase tracking-[0.3em] opacity-40">Celestial Guidance by Number</p>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-0 border border-[#E5E1D8] bg-[#E5E1D8] w-full mb-24 shadow-sm">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33].map(n => (
                  <button
                    key={n}
                    onClick={() => fetchHoroscope(n)}
                    className="aspect-square bg-white hover:bg-[#FAF9F6] transition-all flex flex-col items-center justify-center group active:bg-[#E5E1D8] border-[#E5E1D8]"
                  >
                    <span className="text-[10px] font-sans uppercase tracking-tighter opacity-30 group-hover:opacity-100 mb-1">{n === 11 || n === 22 || n === 33 ? 'Master' : 'Path'}</span>
                    <span className="text-2xl font-bold">{n}</span>
                  </button>
                ))}
              </div>

              {loadingHoroscope && (
                <div className="flex flex-col items-center gap-4 py-20 text-[#E5E1D8]">
                  <div className="w-12 h-12 border border-[#E5E1D8] border-t-[#1A1A1A] animate-spin" />
                  <span className="text-[11px] font-sans uppercase tracking-widest">Decoding Vibrations</span>
                </div>
              )}

              {horoscope && !loadingHoroscope && (
                <div className="max-w-2xl mx-auto w-full">
                  <Card className="p-12 md:p-20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8">
                      <span className="text-[10px] font-sans uppercase tracking-[0.2em] opacity-20">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="markdown-prose border-l-4 border-[#1A1A1A] pl-8">
                      <ReactMarkdown>{horoscope}</ReactMarkdown>
                    </div>
                  </Card>
                </div>
              )}
            </motion.div>
          )}

          {view === 'compatibility' && (
            <motion.div
              key="compatibility"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              <div className="flex flex-col items-center mb-24">
                <h1 className="text-6xl font-light italic lowercase mb-4 tracking-tight">Soul <span className="font-bold not-italic">Connection</span></h1>
                <p className="text-[11px] font-sans uppercase tracking-[0.3em] opacity-40">Energetic Resonance Analysis</p>
              </div>

              <div className="flex flex-col lg:flex-row gap-12 max-w-5xl mx-auto w-full">
                <aside className="w-full lg:w-1/3">
                  <Card className="p-10 flex flex-col gap-10">
                    <div className="flex flex-col gap-10">
                      <div className="flex flex-col gap-4">
                        <label className="text-[10px] uppercase font-sans tracking-widest opacity-60 italic">Vibration Alpha</label>
                        <select
                          value={p1Path}
                          onChange={(e) => setP1Path(e.target.value)}
                          className="bg-transparent text-xl font-serif py-3 border-b border-[#1A1A1A] outline-none"
                        >
                          <option value="">Select Path</option>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-4">
                        <label className="text-[10px] uppercase font-sans tracking-widest opacity-60 italic">Vibration Beta</label>
                        <select
                          value={p2Path}
                          onChange={(e) => setP2Path(e.target.value)}
                          className="bg-transparent text-xl font-serif py-3 border-b border-[#1A1A1A] outline-none"
                        >
                          <option value="">Select Path</option>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                    </div>
                    <Button onClick={handleCompatibility} className="w-full py-5 mt-4" disabled={loadingComp || !p1Path || !p2Path}>
                      {loadingComp ? 'Analyzing Resonance...' : 'Generate Report'}
                    </Button>
                  </Card>
                </aside>

                <section className="flex-1">
                  {loadingComp && (
                    <div className="h-full flex flex-col items-center justify-center gap-4 text-[#A39E93]">
                      <div className="w-10 h-10 border border-[#E5E1D8] border-t-[#1A1A1A] animate-spin" />
                      <span className="text-[10px] uppercase tracking-widest">Synthesizing Data</span>
                    </div>
                  )}
                  {compReport && !loadingComp && (
                    <Card className="p-12 md:p-16">
                      <div className="markdown-prose text-justify">
                        <ReactMarkdown>{compReport}</ReactMarkdown>
                      </div>
                    </Card>
                  )}
                  {!compReport && !loadingComp && (
                    <div className="h-full flex flex-col items-center justify-center p-20 border border-dashed border-[#E5E1D8] rounded-sm text-[#E5E1D8]">
                      <Users size={64} strokeWidth={0.5} className="mb-4 opacity-40" />
                      <p className="text-[10px] uppercase tracking-widest opacity-60">Report Awaiting Parameters</p>
                    </div>
                  )}
                </section>
              </div>
            </motion.div>
          )}

          {view === 'systems' && (
            <motion.div
              key="systems"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              <div className="mb-24 flex flex-col items-center">
                <h1 className="text-[11px] font-sans uppercase tracking-[0.5em] opacity-40 mb-4">Methodologies</h1>
                <h2 className="text-7xl font-light italic tracking-tighter">Canonical <span className="font-bold not-italic">Systems</span></h2>
              </div>

              <div className="grid md:grid-cols-2 gap-1 px-8 md:px-0 bg-[#E5E1D8] border border-[#E5E1D8]">
                <div className="bg-white p-12 md:p-16 flex flex-col group">
                  <span className="text-[9px] font-sans uppercase tracking-[0.2em] opacity-30 mb-8 block group-hover:opacity-100 transition-opacity">Module A-01</span>
                  <h3 className="text-4xl italic font-light mb-8">The <span className="font-bold not-italic">Pythagorean</span> Scroll</h3>
                  <p className="text-sm leading-relaxed text-[#555] font-sans text-justify mb-12">
                    Originating from the teachings of Pythagoras in ancient Greece, this system emphasizes a linear, sequential relationship between the alphabet and the first nine digits. It is the bedrock of modern Western numerological practice, focusing on the psychological structure and character evolution of the individual.
                  </p>
                  <div className="mt-auto pt-8 border-t border-[#FAF9F6] grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase opacity-40">Frequency</span>
                      <span className="text-xs font-bold">1.0 - 9.0Hz</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase opacity-40">Focus</span>
                      <span className="text-xs font-bold">Psychology</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase opacity-40">Era</span>
                      <span className="text-xs font-bold">500 BCE</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1A1A1A] p-12 md:p-16 flex flex-col text-white group">
                  <span className="text-[9px] font-sans uppercase tracking-[0.2em] opacity-30 mb-8 block group-hover:opacity-100 transition-opacity">Module B-01</span>
                  <h3 className="text-4xl italic font-light mb-8 text-white">The <span className="font-bold not-italic">Chaldean</span> Vibration</h3>
                  <p className="text-sm leading-relaxed text-neutral-400 font-sans text-justify mb-12">
                    Considered more mystical and ancient, the Chaldean system was born in Babylonia. It discards the sequential map in favor of sound-vibration resonance. The number 9 was historically held sacred and omitted from name calculations, representing a higher celestial plane.
                  </p>
                  <div className="mt-auto pt-8 border-t border-white/5 grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase opacity-40">Frequency</span>
                      <span className="text-xs font-bold">Variable</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase opacity-40">Focus</span>
                      <span className="text-xs font-bold">Mystical Resonance</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase opacity-40">Era</span>
                      <span className="text-xs font-bold">Ancient Mesopotamia</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-24 max-w-4xl mx-auto w-full">
                <h3 className="text-center text-[10px] font-sans uppercase tracking-[0.3em] opacity-40 mb-12">System Comparator</h3>
                <div className="bg-white border border-[#E5E1D8] p-12 flex flex-col md:flex-row gap-12 items-center">
                  <div className="flex-1 w-full">
                    <label className="text-[10px] uppercase font-sans tracking-widest opacity-40 mb-4 block">Input Subject Name</label>
                    <Input
                      placeholder="Julianna V. Sterling"
                      className="w-full italic font-light text-3xl"
                      value={result?.name || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          setResult(null);
                          return;
                        }
                        const resP = calculateNameNumber(val, 'Pythagorean');
                        const resC = calculateNameNumber(val, 'Chaldean');
                        setResult({ pyth: resP, chal: resC, name: val });
                      }}
                    />
                  </div>
                  {result && result.name && (
                    <div className="flex gap-12 border-l border-[#E5E1D8] pl-12">
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase opacity-40 mb-2">Pythagorean</span>
                        <span className="text-6xl font-bold tracking-tighter">{result.pyth}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase opacity-40 mb-2">Chaldean</span>
                        <span className="text-6xl font-bold tracking-tighter opacity-40">{result.chal}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'saved' && (
            <motion.div
              key="saved"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              <div className="flex flex-col items-center mb-20">
                <h1 className="text-7xl font-light italic lowercase mb-4 tracking-tighter">The <span className="font-bold not-italic">Archives</span></h1>
                <p className="text-[11px] font-sans uppercase tracking-[0.3em] opacity-40">Personal Numerical History</p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {savedResults.length === 0 ? (
                  <div className="col-span-2 py-32 border border-dashed border-[#E5E1D8] flex flex-col items-center justify-center text-[#E5E1D8]">
                    <History size={48} strokeWidth={0.5} className="mb-4 opacity-40" />
                    <p className="text-[10px] uppercase tracking-widest italic opacity-60">History currently unpopulated</p>
                  </div>
                ) : (
                  savedResults.map((res) => (
                    <Card key={res.id} className="p-10 group relative border-[#E5E1D8] hover:border-[#1A1A1A] transition-colors">
                      <button
                        onClick={() => deleteSaved(res.id)}
                        className="absolute top-6 right-6 text-[9px] uppercase font-sans tracking-[0.2em] opacity-0 group-hover:opacity-40 hover:opacity-100 transition-opacity"
                      >
                        Expunge record
                      </button>
                      <div className="flex items-end gap-6 mb-8 pb-8 border-b border-[#FAF9F6]">
                        <span className="text-7xl font-bold tracking-tighter leading-none">{res.number}</span>
                        <div className="flex flex-col pb-1">
                          <h3 className="text-[11px] font-sans uppercase font-bold tracking-widest">{res.name}</h3>
                          <span className="text-[10px] font-sans uppercase tracking-tighter opacity-40">{new Date(res.createdAt?.toDate()).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                      {res.note && (
                        <p className="text-sm italic font-serif leading-relaxed text-[#555] bg-[#F4F2EE] p-6 rounded-sm">
                          "{res.note}"
                        </p>
                      )}
                      <div className="mt-8 flex gap-8">
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] uppercase opacity-30">Classification</span>
                          <span className="text-[10px] font-sans font-bold uppercase">{res.type}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] uppercase opacity-30">System</span>
                          <span className="text-[10px] font-sans font-bold uppercase">Standard-V3</span>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="h-16 border-t border-[#E5E1D8] px-12 flex items-center justify-between text-[10px] font-sans uppercase tracking-[0.2em] opacity-40">
        <div>System Model: Aether v2.4.0</div>
        <div>© 2026 Aether Numerological Society</div>
        <div className="hidden sm:flex gap-8">
          <span>Privacy Ethics</span>
          <span>Consultations</span>
        </div>
      </footer>
    </div>
  );
}
