export default function F4Preview() {
  const [selectedLanguage, setSelectedLanguage] = React.useState('thai');
  const [selectedSection, setSelectedSection] = React.useState('contraindications');
  const [showValidation, setShowValidation] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('translation');

  const translationData = {
    thai: {
      pilId: 1247,
      productName: 'Amoxicillin 500mg',
      market: 'FDA Thailand',
      overallConfidence: 92.5,
      encodingValid: true,
      terminologyValid: true,
      processingTimeMs: 78500,
      sections: [
        {
          id: 'contraindications',
          name: 'ข้อห้ามใช้',
          englishName: 'CONTRAINDICATIONS',
          translatedText: 'ข้อห้ามใช้: ห้ามใช้ในผู้ป่วยที่มีประวัติแพ้ยาในกลุ่มเพนิซิลลิน หรือแพ้ส่วนประกอบใดๆ ของยานี้ ห้ามใช้ในผู้ป่วยที่มีประวัติแพ้รุนแรงต่อยาในกลุ่มเบตาแลคแทม',
          confidenceScore: 94.2,
          encodingValid: true,
          terminologyValid: true,
          warnings: []
        },
        {
          id: 'dosage',
          name: 'ขนาดยาและวิธีใช้',
          englishName: 'DOSAGE AND ADMINISTRATION',
          translatedText: 'ขนาดยา: ผู้ใหญ่และเด็กที่มีน้ำหนักตัวมากกว่า 40 กิโลกรัม ใช้ขนาด 500 มิลลิกรัม รับประทานวันละ 3 ครั้ง ทุก 8 ชั่วโมง วิธีใช้: รับประทานพร้อมอาหารหรือหลังอาหาร',
          confidenceScore: 96.8,
          encodingValid: true,
          terminologyValid: true,
          warnings: []
        },
        {
          id: 'adverse',
          name: 'ผลข้างเคียง',
          englishName: 'ADVERSE REACTIONS',
          translatedText: 'ผลข้างเคียงที่พบบ่อย: คลื่นไส้ อาเจียน ท้องเสีย ผื่นแพ้ เหตุการณ์ไม่พึงประสงค์ที่ร้ายแรง: ปฏิกิริยาแพ้รุนแรง ตับอักเสบ โรคลำไส้อักเสบจากเชื้อ Clostridium difficile',
          confidenceScore: 91.3,
          encodingValid: true,
          terminologyValid: true,
          warnings: []
        },
        {
          id: 'warnings',
          name: 'คำเตือนและข้อควรระวัง',
          englishName: 'WARNINGS AND PRECAUTIONS',
          translatedText: 'คำเตือน: ใช้ด้วยความระมัดระวังในผู้ป่วยโรคไต ข้อควรระวัง: อาจเกิดการติดเชื้อซ้ำจากเชื้อดื้อยา ควรตรวจสอบการทำงานของไตและตับเป็นระยะ',
          confidenceScore: 88.7,
          encodingValid: true,
          terminologyValid: true,
          warnings: []
        }
      ]
    },
    vietnamese: {
      pilId: 1248,
      productName: 'Amoxicillin 500mg',
      market: 'DAV Vietnam',
      overallConfidence: 89.3,
      encodingValid: true,
      diacriticsValid: true,
      terminologyValid: true,
      processingTimeMs: 82300,
      sections: [
        {
          id: 'contraindications',
          name: 'Chống chỉ định',
          englishName: 'CONTRAINDICATIONS',
          translatedText: 'Chống chỉ định: Không sử dụng cho bệnh nhân có tiền sử dị ứng với penicillin hoặc bất kỳ thành phần nào của thuốc này. Không sử dụng cho bệnh nhân có tiền sử phản ứng dị ứng nghiêm trọng với các thuốc nhóm beta-lactam.',
          confidenceScore: 92.1,
          encodingValid: true,
          diacriticsValid: true,
          terminologyValid: true,
          warnings: []
        },
        {
          id: 'dosage',
          name: 'Liều lượng và Cách dùng',
          englishName: 'DOSAGE AND ADMINISTRATION',
          translatedText: 'Liều lượng: Người lớn và trẻ em trên 40kg sử dụng liều 500mg, uống 3 lần mỗi ngày, cách nhau 8 giờ. Cách dùng: Uống cùng bữa ăn hoặc sau bữa ăn để giảm kích ứng dạ dày.',
          confidenceScore: 94.5,
          encodingValid: true,
          diacriticsValid: true,
          terminologyValid: true,
          warnings: []
        },
        {
          id: 'adverse',
          name: 'Phản ứng có hại',
          englishName: 'ADVERSE REACTIONS',
          translatedText: 'Phản ứng có hại thường gặp: Buồn nôn, nôn, tiêu chảy, phát ban. Tác dụng không mong muốn nghiêm trọng: Phản ứng dị ứng nghiêm trọng, viêm gan, viêm đại tràng do Clostridium difficile.',
          confidenceScore: 87.8,
          encodingValid: true,
          diacriticsValid: true,
          terminologyValid: true,
          warnings: ['Phát hiện thuật ngữ "Tác dụng không mong muốn" - đã xác minh phù hợp với DAV']
        },
        {
          id: 'warnings',
          name: 'Cảnh báo và Thận trọng',
          englishName: 'WARNINGS AND PRECAUTIONS',
          translatedText: 'Cảnh báo: Sử dụng thận trọng ở bệnh nhân suy thận. Thận trọng: Có thể xảy ra nhiễm trùng tái phát do vi khuẩn kháng thuốc. Nên theo dõi chức năng thận và gan định kỳ.',
          confidenceScore: 85.2,
          encodingValid: true,
          diacriticsValid: false,
          terminologyValid: true,
          warnings: ['Phát hiện "Thận trọng" thiếu dấu thanh ở một số vị trí - đã tự động sửa']
        }
      ]
    }
  };

  const currentData = translationData[selectedLanguage];
  const currentSection = currentData.sections.find(s => s.id === selectedSection);

  const getConfidenceColor = (score) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 85) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getConfidenceBg = (score) => {
    if (score >= 90) return 'bg-emerald-500/20 border-emerald-500/30';
    if (score >= 85) return 'bg-amber-500/20 border-amber-500/30';
    return 'bg-rose-500/20 border-rose-500/30';
  };

  const getProgressColor = (score) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 85) return 'bg-amber-400';
    return 'bg-rose-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 text-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Multi-Language PIL Translation</h1>
              <p className="text-sm text-slate-400 mt-1">FDA Thailand & DAV Vietnam Regulatory Compliance</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-slate-500">PIL ID</div>
                <div className="text-sm font-semibold text-violet-400">#{currentData.pilId}</div>
              </div>
              <div className="h-10 w-px bg-white/10"></div>
              <div className="text-right">
                <div className="text-xs text-slate-500">Processing Time</div>
                <div className="text-sm font-semibold text-cyan-400">{(currentData.processingTimeMs / 1000).toFixed(1)}s</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Language Selector */}
        <div className="mb-6">
          <div className="inline-flex rounded-2xl bg-slate-800/50 p-1.5 border border-white/5">
            <button
              onClick={() => setSelectedLanguage('thai')}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                selectedLanguage === 'thai'
                  ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🇹🇭 Thai (FDA Thailand)
            </button>
            <button
              onClick={() => setSelectedLanguage('vietnamese')}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                selectedLanguage === 'vietnamese'
                  ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🇻🇳 Vietnamese (DAV)
            </button>
          </div>
        </div>

        {/* Overall Status Card */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5 mb-6 shadow-xl shadow-black/20">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">{currentData.productName}</h2>
              <p className="text-sm text-slate-400">Market: {currentData.market}</p>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${getConfidenceBg(currentData.overallConfidence)}`}>
              <div className={`w-2 h-2 rounded-full ${getProgressColor(currentData.overallConfidence)}`}></div>
              {currentData.overallConfidence >= 85 ? '✅ Ready for Review' : '⚠️ Needs Review'}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <div className="text-xs text-slate-500 mb-1">Overall Confidence</div>
              <div className={`text-2xl font-bold ${getConfidenceColor(currentData.overallConfidence)}`}>
                {currentData.overallConfidence}%
              </div>
              <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getProgressColor(currentData.overallConfidence)} transition-all`}
                  style={{ width: `${currentData.overallConfidence}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <div className="text-xs text-slate-500 mb-1">Encoding</div>
              <div className="flex items-center gap-2">
                {currentData.encodingValid ? (
                  <>
                    <span className="text-2xl">✅</span>
                    <span className="text-sm font-semibold text-emerald-400">Valid UTF-8</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">❌</span>
                    <span className="text-sm font-semibold text-rose-400">Invalid</span>
                  </>
                )}
              </div>
            </div>

            {selectedLanguage === 'vietnamese' && (
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="text-xs text-slate-500 mb-1">Diacritics</div>
                <div className="flex items-center gap-2">
                  {currentData.diacriticsValid ? (
                    <>
                      <span className="text-2xl">✅</span>
                      <span className="text-sm font-semibold text-emerald-400">Correct</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">⚠️</span>
                      <span className="text-sm font-semibold text-amber-400">Warnings</span>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <div className="text-xs text-slate-500 mb-1">Terminology</div>
              <div className="flex items-center gap-2">
                {currentData.terminologyValid ? (
                  <>
                    <span className="text-2xl">✅</span>
                    <span className="text-sm font-semibold text-emerald-400">Approved</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">❌</span>
                    <span className="text-sm font-semibold text-rose-400">Issues</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('translation')}
            className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'translation'
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                : 'bg-slate-800/50 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            📄 Translation Review
          </button>
          <button
            onClick={() => setActiveTab('validation')}
            className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'validation'
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                : 'bg-slate-800/50 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            ✓ Validation Details
          </button>
        </div>

        {activeTab === 'translation' && (
          <div className="grid grid-cols-12 gap-6">
            {/* Section List */}
            <div className="col-span-4 space-y-3">
              {currentData.sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setSelectedSection(section.id)}
                  className={`w-full text-left p-4 rounded-xl transition-all ${
                    selectedSection === section.id
                      ? 'bg-violet-500/20 border-2 border-violet-500/50 shadow-lg shadow-violet-500/20'
                      : 'bg-slate-800/50 border border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-sm font-semibold text-white">{section.name}</div>
                    <div className={`text-xs font-bold ${getConfidenceColor(section.confidenceScore)}`}>
                      {section.confidenceScore}%
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 mb-2">{section.englishName}</div>
                  <div className="flex items-center gap-2">
                    {section.encodingValid && <span className="text-xs">✅ Encoding</span>}
                    {selectedLanguage === 'vietnamese' && section.diacriticsValid && (
                      <span className="text-xs">✅ Diacritics</span>
                    )}
                    {section.terminologyValid && <span className="text-xs">✅ Terms</span>}
                  </div>
                  {section.warnings.length > 0 && (
                    <div className="mt-2 text-xs text-amber-400">⚠️ {section.warnings.length} warning(s)</div>
                  )}
                </button>
              ))}
            </div>

            {/* Translation Content */}
            <div className="col-span-8">
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5 shadow-xl shadow-black/20">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{currentSection.name}</h3>
                    <p className="text-sm text-slate-400">{currentSection.englishName}</p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${getConfidenceBg(currentSection.confidenceScore)}`}>
                    Confidence: {currentSection.confidenceScore}%
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-xl p-5 border border-white/5 mb-4">
                  <div className="text-sm leading-relaxed text-slate-200" style={{ lineHeight: '1.8' }}>
                    {currentSection.translatedText}
                  </div>
                </div>

                {/* Validation Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                    currentSection.encodingValid 
                      ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/20 border border-rose-500/30 text-rose-400'
                  }`}>
                    {currentSection.encodingValid ? '✅' : '❌'} UTF-8 Encoding
                  </div>

                  {selectedLanguage === 'vietnamese' && (
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                      currentSection.diacriticsValid 
                        ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                        : 'bg-amber-500/20 border border-amber-500/30 text-amber-400'
                    }`}>
                      {currentSection.diacriticsValid ? '✅' : '⚠️'} Diacritics
                    </div>
                  )}

                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                    currentSection.terminologyValid 
                      ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/20 border border-rose-500/30 text-rose-400'
                  }`}>
                    {currentSection.terminologyValid ? '✅' : '❌'} {currentData.market} Terminology
                  </div>
                </div>

                {/* Warnings */}
                {currentSection.warnings.length > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-amber-400 mb-2">Validation Warnings</div>
                        <div className="space-y-1">
                          {currentSection.warnings.map((warning, idx) => (
                            <div key={idx} className="text-xs text-amber-300">{warning}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'validation' && (
          <div className="grid grid-cols-2 gap-6">
            {/* Encoding Validation */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5 shadow-xl shadow-black/20">
              <h3 className="text-lg font-bold text-white mb-4">
                {selectedLanguage === 'thai' ? '🇹🇭 Thai Script Validation' : '🇻🇳 Vietnamese Encoding Validation'}
              </h3>
              
              <div className="space-y-4">
                <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">UTF-8 Encoding</span>
                    <span className="text-emerald-400 font-semibold">✅ Valid</span>
                  </div>
                  <div className="text-xs text-slate-500">All characters properly encoded in UTF-8 format</div>
                </div>

                {selectedLanguage === 'thai' && (
                  <>
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">Thai Character Range</span>
                        <span className="text-emerald-400 font-semibold">✅ Valid</span>
                      </div>
                      <div className="text-xs text-slate-500">Characters in U+0E00 to U+0E7F range</div>
                    </div>

                    <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">Tone Mark Placement</span>
                        <span className="text-emerald-400 font-semibold">✅ Correct</span>
                      </div>
                      <div className="text-xs text-slate-500">All tone marks follow valid base characters</div>
                    </div>

                    <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">Thai Character Percentage</span>
                        <span className="text-cyan-400 font-semibold">67.3%</span>
                      </div>
                      <div className="text-xs text-slate-500">Sufficient for pharmaceutical text (≥10% required)</div>
                    </div>
                  </>
                )}

                {selectedLanguage === 'vietnamese' && (
                  <>
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">Diacritic Marks</span>
                        <span className="text-amber-400 font-semibold">⚠️ 2 Warnings</span>
                      </div>
                      <div className="text-xs text-slate-500">Some critical terms missing proper diacritics</div>
                    </div>

                    <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">NFC Normalization</span>
                        <span className="text-emerald-400 font-semibold">✅ Correct</span>
                      </div>
                      <div className="text-xs text-slate-500">Text in precomposed (NFC) form</div>
                    </div>

                    <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">Combining Marks</span>
                        <span className="text-emerald-400 font-semibold">✅ Valid</span>
                      </div>
                      <div className="text-xs text-slate-500">All combining marks follow valid base characters</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Terminology Validation */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5 shadow-xl shadow-black/20">
              <h3 className="text-lg font-bold text-white mb-4">
                {selectedLanguage === 'thai' ? '📋 FDA Thailand Terminology' : '📋 DAV Terminology'}
              </h3>
              
              <div className="space-y-4">
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">✅</span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-emerald-400 mb-2">Approved Terms Used</div>
                      <div className="space-y-1 text-xs text-emerald-300">
                        {selectedLanguage === 'thai' ? (
                          <>
                            <div>• ข้อห้ามใช้ (contraindications)</div>
                            <div>• ผลข้างเคียง (adverse reactions)</div>
                            <div>• ขนาดยา (dosage)</div>
                            <div>• วิธีใช้ (administration)</div>
                            <div>• คำเตือน (warnings)</div>
                          </>
                        ) : (
                          <>
                            <div>• Chống chỉ định (contraindications)</div>
                            <div>• Phản ứng có hại (adverse reactions)</div>
                            <div>• Liều lượng (dosage)</div>
                            <div>• Cách dùng (administration)</div>
                            <div>• Cảnh báo (warnings)</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Terminology Consistency</span>
                    <span className="text-emerald-400 font-semibold">100%</span>
                  </div>
                  <div className="text-xs text-slate-500">All pharmaceutical terms match approved glossary</div>
                </div>

                <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">Translation Memory Hits</span>
                    <span className="text-cyan-400 font-semibold">47/52</span>
                  </div>
                  <div className="text-xs text-slate-500">90.4% of terms found in translation memory</div>
                </div>

                {selectedLanguage === 'vietnamese' && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">⚠️</span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-amber-400 mb-2">Diacritic Warnings</div>
                        <div className="space-y-1 text-xs text-amber-300">
                          <div>• "Thận trọng" found without proper tone marks in 1 location</div>
                          <div>• Auto-corrected to DAV-approved form</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex items-center justify-between">
          <button className="px-6 py-3 rounded-xl bg-slate-800/50 border border-white/5 text-slate-400 hover:text-white hover:border-white/10 font-semibold transition-all">
            ← Back to PIL List
          </button>
          <div className="flex gap-3">
            <button className="px-6 py-3 rounded-xl bg-slate-800/50 border border-white/5 text-white hover:border-white/10 font-semibold transition-all">
              📥 Export Translation
            </button>
            <button className="px-6 py-3 rounded-xl bg-violet-500 text-white font-semibold shadow-lg shadow-violet-500/30 hover:bg-violet-600 transition-all">
              ✓ Submit for Approval
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}