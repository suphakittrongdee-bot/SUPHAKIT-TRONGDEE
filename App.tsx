import React, { useState, useCallback, useEffect } from 'react';
import { Section } from './components/Section';
import { LotterySet, GeneratorMode, PastDraw, GuruStat } from './types';
import { generateLuckyNumbersAI, getNextDrawDate, getLatestDrawResults, getGuruStats } from './services/geminiService';
import { SparklesIcon, ArrowPathIcon, CpuChipIcon, BoltIcon, ChartBarIcon, FireIcon, CalendarDaysIcon, TagIcon, CheckBadgeIcon, LinkIcon, TrophyIcon, StarIcon } from '@heroicons/react/24/solid';

const getRandomDigit = () => Math.floor(Math.random() * 10).toString();

const generateString = (length: number) => {
  return Array.from({ length }, getRandomDigit).join('');
};

const initialSet: LotterySet = {
  prize1: '------',
  front3: ['---', '---'],
  rear3: ['---', '---'],
  rear2: '--',
  source: 'RNG',
  drawDate: getNextDrawDate(),
  timestamp: Date.now()
};

const App: React.FC = () => {
  const [currentSet, setCurrentSet] = useState<LotterySet>(initialSet);
  const [isRolling, setIsRolling] = useState(false);
  const [mode, setMode] = useState<GeneratorMode>(GeneratorMode.RNG);
  const [error, setError] = useState<string | null>(null);
  
  // State for Past Results
  const [pastDraw, setPastDraw] = useState<PastDraw | null>(null);
  const [loadingPast, setLoadingPast] = useState<boolean>(true);

  // State for Guru Stats
  const [guruStats, setGuruStats] = useState<GuruStat[]>([]);
  const [loadingGuru, setLoadingGuru] = useState<boolean>(true);

  // Fetch past results and guru stats on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pastData, guruData] = await Promise.all([
            getLatestDrawResults(),
            getGuruStats()
        ]);
        setPastDraw(pastData);
        setGuruStats(guruData);
      } catch (e) {
        console.error("Error fetching data", e);
      } finally {
        setLoadingPast(false);
        setLoadingGuru(false);
      }
    };
    fetchData();
  }, []);

  const handleGenerate = useCallback(async () => {
    setIsRolling(true);
    setError(null);
    const nextDate = getNextDrawDate();
    
    // Artificial delay for RNG visualization
    if (mode === GeneratorMode.RNG) {
      setTimeout(() => {
        setCurrentSet({
          prize1: generateString(6),
          front3: [generateString(3), generateString(3)],
          rear3: [generateString(3), generateString(3)],
          rear2: generateString(2),
          source: 'RNG',
          drawDate: nextDate,
          timestamp: Date.now()
        });
        setIsRolling(false);
      }, 800);
    } else {
      // AI, History, or Guru Mode
      try {
        const aiSet = await generateLuckyNumbersAI(mode);
        setCurrentSet(aiSet);
      } catch (err) {
        setError("The service is currently unreachable. Please try again or switch to Standard Random.");
      } finally {
        setIsRolling(false);
      }
    }
  }, [mode]);

  return (
    <div className="min-h-screen bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black text-white p-4 md:p-8 flex flex-col items-center">
      
      {/* Header */}
      <header className="mb-6 text-center space-y-2">
        <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-thai-gold to-yellow-200 drop-shadow-lg">
          Thai Lotto AI
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-md mx-auto">
          ทำนายเลขเด็ดงวดถัดไป ด้วยระบบ AI และสถิติ
        </p>
        
        {/* Draw Date Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/80 rounded-full border border-slate-700 shadow-lg mt-2">
          <CalendarDaysIcon className="w-5 h-5 text-thai-gold" />
          <span className="text-white font-semibold tracking-wide">
            งวดวันที่: <span className="text-yellow-300">{currentSet.drawDate}</span>
          </span>
        </div>
      </header>

      {/* Main Content Layout: 1 Column Mobile, 2 Columns (Main + Sidebar) on LG */}
      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-8 items-start mb-16">
        
        {/* LEFT/CENTER: Generator Section */}
        <div className="flex-1 w-full flex flex-col items-center">
          
          {/* Control Panel */}
          <div className="w-full flex flex-col lg:flex-row justify-between items-center mb-8 gap-6 glass-panel p-4 rounded-xl">
            
            {/* Mode Switcher */}
            <div className="flex flex-wrap justify-center bg-slate-950 p-1.5 rounded-xl gap-1">
              <button
                onClick={() => setMode(GeneratorMode.RNG)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-xs md:text-sm font-medium ${
                  mode === GeneratorMode.RNG 
                    ? 'bg-slate-700 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <BoltIcon className="w-4 h-4" />
                <span>สุ่มทั่วไป</span>
              </button>
              
              <button
                onClick={() => setMode(GeneratorMode.AI)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-xs md:text-sm font-medium ${
                  mode === GeneratorMode.AI 
                    ? 'bg-purple-700 text-white shadow-md shadow-purple-900/50' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <SparklesIcon className="w-4 h-4 text-yellow-300" />
                <span>AI คำนวณ</span>
              </button>

              <button
                onClick={() => setMode(GeneratorMode.HISTORY)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-xs md:text-sm font-medium ${
                  mode === GeneratorMode.HISTORY 
                    ? 'bg-cyan-700 text-white shadow-md shadow-cyan-900/50' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <ChartBarIcon className="w-4 h-4 text-cyan-300" />
                <span>สถิติย้อนหลัง</span>
              </button>

              <button
                onClick={() => setMode(GeneratorMode.GURU)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-xs md:text-sm font-medium ${
                  mode === GeneratorMode.GURU 
                    ? 'bg-orange-700 text-white shadow-md shadow-orange-900/50' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <FireIcon className="w-4 h-4 text-orange-300" />
                <span>รวมเลขสำนักดัง</span>
              </button>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isRolling}
              className={`
                relative overflow-hidden group w-full lg:w-auto px-8 py-3 rounded-xl font-bold text-lg tracking-wide shadow-2xl transition-all transform active:scale-95
                ${mode === GeneratorMode.AI 
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white ring-2 ring-purple-400/50'
                  : mode === GeneratorMode.HISTORY
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white ring-2 ring-cyan-400/50'
                    : mode === GeneratorMode.GURU
                      ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white ring-2 ring-orange-400/50'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white ring-2 ring-emerald-400/50'}
                ${isRolling ? 'opacity-70 cursor-wait' : ''}
              `}
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 skew-x-12 -translate-x-full group-hover:animate-[shimmer_1s_infinite]"></div>
              <span className="flex items-center justify-center gap-2 whitespace-nowrap">
                {isRolling ? (
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                ) : mode === GeneratorMode.AI ? (
                  <CpuChipIcon className="w-5 h-5" />
                ) : mode === GeneratorMode.HISTORY ? (
                  <ChartBarIcon className="w-5 h-5" />
                ) : mode === GeneratorMode.GURU ? (
                  <FireIcon className="w-5 h-5" />
                ) : (
                  <BoltIcon className="w-5 h-5" />
                )}
                {isRolling ? 'กำลังคำนวณ...' : 
                 mode === GeneratorMode.AI ? 'ขอพร AI' : 
                 mode === GeneratorMode.HISTORY ? 'วิเคราะห์สถิติ' : 
                 mode === GeneratorMode.GURU ? 'รวมพลังเลขดัง' :
                 'สุ่มเลข'}
              </span>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-500/50 text-red-200 rounded-lg max-w-2xl w-full text-center">
              {error}
            </div>
          )}

          {/* AI Reasoning / Analysis */}
          {(mode !== GeneratorMode.RNG) && currentSet.reasoning && !isRolling && (
            <div className="mb-8 w-full animate-bounce-short">
              <div className={`glass-panel p-6 rounded-xl border-l-4 ${
                mode === GeneratorMode.HISTORY ? 'border-cyan-500' : 
                mode === GeneratorMode.GURU ? 'border-orange-500' :
                'border-purple-500'
              }`}>
                 <div className="flex flex-col md:flex-row justify-between items-start mb-2 gap-2">
                   <h4 className={`flex items-center gap-2 font-bold ${
                     mode === GeneratorMode.HISTORY ? 'text-cyan-300' : 
                     mode === GeneratorMode.GURU ? 'text-orange-300' :
                     'text-purple-300'
                   }`}>
                     {mode === GeneratorMode.HISTORY ? <ChartBarIcon className="w-5 h-5"/> : 
                      mode === GeneratorMode.GURU ? <FireIcon className="w-5 h-5"/> :
                      <SparklesIcon className="w-5 h-5" />} 
                     
                     {mode === GeneratorMode.HISTORY ? 'บทวิเคราะห์สถิติ' : 
                      mode === GeneratorMode.GURU ? 'สรุปจากสำนักดัง' :
                      "คำทำนายจาก AI"}
                   </h4>

                   {/* Confidence Badge */}
                   {currentSet.confidence !== undefined && (
                     <div className={`px-3 py-1 rounded-full text-sm font-bold border ${
                       currentSet.confidence > 75 ? 'bg-green-900/50 border-green-500 text-green-300' :
                       currentSet.confidence > 50 ? 'bg-yellow-900/50 border-yellow-500 text-yellow-300' :
                       'bg-red-900/50 border-red-500 text-red-300'
                     }`}>
                       ความมั่นใจ: {currentSet.confidence}%
                     </div>
                   )}
                 </div>
                 
                 <p className="text-gray-200 italic leading-relaxed mt-2 md:mt-0">"{currentSet.reasoning}"</p>

                 {/* Sources List */}
                 {currentSet.sources && currentSet.sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2 font-bold uppercase tracking-wider">
                      <TagIcon className="w-3 h-3" />
                      <span>อ้างอิงข้อมูล (Sources):</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentSet.sources.map((source, i) => (
                        <span 
                          key={i} 
                          className={`
                            text-xs px-2 py-1 rounded-md border
                            ${mode === GeneratorMode.GURU 
                              ? 'bg-orange-900/30 border-orange-500/30 text-orange-200' 
                              : mode === GeneratorMode.HISTORY
                                ? 'bg-cyan-900/30 border-cyan-500/30 text-cyan-200'
                                : 'bg-purple-900/30 border-purple-500/30 text-purple-200'
                            }
                          `}
                        >
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                 )}
              </div>
            </div>
          )}

          {/* Results Grid */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Prize 1: Spans full width */}
            <div className="md:col-span-2">
              <Section 
                title="รางวัลที่ 1" 
                subtitle="6 หลัก"
                numbers={[currentSet.prize1]}
                isRolling={isRolling}
              />
            </div>

            {/* 3 Digits Front */}
            <Section 
              title="เลขหน้า 3 ตัว" 
              subtitle="2 รางวัล"
              numbers={currentSet.front3}
              isRolling={isRolling}
              cols={2}
            />

            {/* 3 Digits Rear */}
            <Section 
              title="เลขท้าย 3 ตัว" 
              subtitle="2 รางวัล"
              numbers={currentSet.rear3}
              isRolling={isRolling}
              cols={2}
            />

            {/* 2 Digits - Center aligned in last row */}
            <div className="md:col-span-2 md:w-1/2 md:mx-auto">
              <Section 
                title="เลขท้าย 2 ตัว" 
                subtitle="1 รางวัล"
                numbers={[currentSet.rear2]}
                isRolling={isRolling}
              />
            </div>

          </div>
        </div>

        {/* RIGHT: Latest Results Sidebar */}
        <div className="w-full lg:w-96 flex-shrink-0 space-y-4">
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-1 shadow-xl border border-white/10">
            <div className="bg-slate-950/50 rounded-xl p-6 relative overflow-hidden">
               {/* Decorative Circles */}
               <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
               
               <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
                 <CheckBadgeIcon className="w-6 h-6 text-green-400" />
                 <h3 className="text-xl font-bold text-white">ผลรางวัลล่าสุด</h3>
               </div>

               {loadingPast ? (
                 <div className="flex flex-col items-center justify-center py-10 space-y-3">
                   <ArrowPathIcon className="w-8 h-8 text-slate-500 animate-spin" />
                   <p className="text-slate-500 text-sm">กำลังโหลดข้อมูล...</p>
                 </div>
               ) : pastDraw ? (
                 <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">งวดประจำวันที่</div>
                      <div className="text-lg font-bold text-thai-gold">{pastDraw.date}</div>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded-lg text-center border border-white/5">
                      <div className="text-slate-400 text-xs mb-1">รางวัลที่ 1</div>
                      <div className="text-3xl font-mono font-bold text-white tracking-widest">{pastDraw.prize1}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-800/30 p-3 rounded-lg text-center">
                         <div className="text-slate-500 text-[10px] mb-1">เลขหน้า 3 ตัว</div>
                         <div className="font-mono font-bold text-cyan-300">{pastDraw.front3.join('  ')}</div>
                      </div>
                      <div className="bg-slate-800/30 p-3 rounded-lg text-center">
                         <div className="text-slate-500 text-[10px] mb-1">เลขท้าย 3 ตัว</div>
                         <div className="font-mono font-bold text-pink-300">{pastDraw.rear3.join('  ')}</div>
                      </div>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded-lg text-center border border-white/5 relative overflow-hidden">
                      <div className="absolute inset-0 bg-yellow-500/5"></div>
                      <div className="text-slate-400 text-xs mb-1 relative">เลขท้าย 2 ตัว</div>
                      <div className="text-4xl font-mono font-bold text-yellow-400 relative">{pastDraw.rear2}</div>
                    </div>
                    
                    {pastDraw.sourceUrl && (
                       <a href={pastDraw.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-4 transition-colors">
                         <LinkIcon className="w-3 h-3" />
                         ตรวจสอบจากกองสลาก
                       </a>
                    )}
                 </div>
               ) : (
                 <div className="text-center text-red-400 py-4">ไม่สามารถโหลดข้อมูลได้</div>
               )}
            </div>
          </div>

          <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5 text-center">
            <p className="text-xs text-slate-500 leading-relaxed">
              ผลรางวัลถูกค้นหาโดย AI โปรดตรวจสอบกับสำนักงานสลากกินแบ่งรัฐบาลเพื่อความถูกต้อง
            </p>
          </div>
        </div>
      </div>

      {/* NEW SECTION: GURU PREDICTIONS & STATS */}
      <div className="w-full max-w-7xl mt-8">
        <div className="flex items-center gap-3 mb-6 px-2">
            <TrophyIcon className="w-8 h-8 text-yellow-400" />
            <div>
               <h2 className="text-2xl font-bold text-white">เลขเด็ดสำนักดัง & สถิติ</h2>
               <p className="text-slate-400 text-sm">แยกรายสำนัก: แนวทางเลขเด็ดงวดปัจจุบัน และประวัติความแม่นยำ</p>
            </div>
        </div>

        {loadingGuru ? (
           <div className="flex justify-center items-center h-48 glass-panel rounded-xl">
               <ArrowPathIcon className="w-8 h-8 animate-spin text-slate-500 mr-2"/>
               <span className="text-slate-400">กำลังรวบรวมข้อมูลสำนักดัง...</span>
           </div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {guruStats.map((guru) => (
                  <div key={guru.id} className="glass-panel p-5 rounded-xl border border-white/5 hover:border-white/20 transition-all flex flex-col h-full bg-slate-900/40 relative overflow-hidden group">
                      
                      {/* Highlight Background Effect */}
                      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                         <FireIcon className="w-20 h-20 text-white transform rotate-12"/>
                      </div>

                      {/* Header */}
                      <div className="flex justify-between items-start mb-4 relative z-10">
                         <div>
                            <h3 className="font-bold text-lg text-white">{guru.name}</h3>
                            <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">{guru.alias}</span>
                         </div>
                         <div className="flex flex-col items-end">
                            <div className="text-xl font-bold text-green-400">{guru.accuracy}%</div>
                            <div className="text-[10px] text-slate-500">ความแม่นยำ</div>
                         </div>
                      </div>

                      {/* CURRENT PREDICTION BIG DISPLAY */}
                      <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-4 rounded-lg border border-yellow-500/20 mb-4 text-center relative z-10 shadow-inner">
                         <div className="text-[10px] text-yellow-400 uppercase tracking-wider mb-2 font-bold">เลขเด็ดงวดนี้ ({currentSet.drawDate})</div>
                         
                         <div className="flex justify-center items-baseline gap-3">
                           {/* Top Pick */}
                           <div className="relative">
                             <div className="text-3xl font-bold text-white drop-shadow-md">{guru.nextDrawPrediction?.topPick || "?"}</div>
                             <div className="text-[8px] text-slate-500 absolute -bottom-3 w-full text-center">เด่นสุด</div>
                           </div>
                           
                           {/* Secondary Picks */}
                           {guru.nextDrawPrediction?.secondary?.slice(0, 2).map((num, i) => (
                              <div key={i} className="text-xl font-semibold text-slate-400">{num}</div>
                           ))}
                         </div>
                      </div>

                      <p className="text-xs text-slate-300 mb-4 flex-grow line-clamp-2 min-h-[2.5em]">{guru.description}</p>

                      {/* Recent Wins List */}
                      <div className="mt-auto relative z-10">
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 flex items-center gap-1">
                            <StarIcon className="w-3 h-3 text-yellow-500" />
                            ผลงานย้อนหลัง
                        </div>
                        <div className="space-y-2">
                           {guru.wins.length > 0 ? guru.wins.map((win, idx) => (
                               <div key={idx} className="flex justify-between items-center bg-slate-800/50 p-2 rounded text-xs border border-white/5">
                                   <div className="text-slate-400">{win.date}</div>
                                   <div className="flex items-center gap-2">
                                       <span className="text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">{win.number}</span>
                                       <span className="text-slate-500 text-[10px]">{win.prize}</span>
                                   </div>
                               </div>
                           )) : (
                               <div className="text-xs text-slate-600 text-center py-2">ไม่มีข้อมูลการถูกรางวัลเร็วๆ นี้</div>
                           )}
                        </div>
                      </div>
                  </div>
              ))}
           </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 text-slate-500 text-xs text-center pb-8">
        <p>© {new Date().getFullYear()} Thai Lotto AI. เพื่อความบันเทิงเท่านั้น โปรดใช้วิจารณญาณ</p>
        <p className="mt-1">
          การทำนายนี้สำหรับงวดวันที่: {currentSet.drawDate}
        </p>
      </footer>

    </div>
  );
};

export default App;