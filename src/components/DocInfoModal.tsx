import React from 'react';
import { X, HelpCircle } from 'lucide-react';
import { LangCode, docMatrix, reqNames } from '../i18n';

interface DocInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  visaType: string;
  reqType: string;
  currentLang: LangCode;
}

export const DocInfoModal: React.FC<DocInfoModalProps> = ({
  isOpen,
  onClose,
  visaType,
  reqType,
  currentLang,
}) => {
  const [translatedField, setTranslatedField] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const docList = docMatrix[visaType]?.[reqType] || docMatrix[visaType]?.['default'] || [];

  const handleToggleTranslate = (krName: string) => {
    if (currentLang === 'kr') return;
    setTranslatedField(translatedField === krName ? null : krName);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[170] flex items-center justify-center p-4">
      <div className="glass-premium p-6 rounded-3xl w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-blue-500/25 flex flex-col max-h-[80vh] step-container-transition relative cyber-bracket animate-[slideUpFade_0.4s_ease-out]">
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
          <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400 glow-text-cyan animate-pulse" />
            <span className="tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              {currentLang === 'kr' ? '민원별 필요 서류 안내' : currentLang === 'en' ? 'Required Documents Guide' : 'Hướng dẫn tài liệu cần thiết'}
            </span>
          </h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-4 text-xs font-mono font-bold text-slate-300 bg-blue-950/20 p-3 rounded-xl border border-blue-500/15 flex justify-between items-center">
          <div>
            <span className="text-cyan-400 mr-1 font-mono">[{visaType}]</span>{' '}
            <span className="text-white">{reqNames[reqType] || reqType}</span>
          </div>
          {currentLang !== 'kr' && (
            <div className="text-[9px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 animate-pulse font-mono tracking-wider">
              TAP TO TRANSLATE
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {docList.map((doc, idx) => {
            let badgeStyle = '';
            let borderStyle = '';
            let labelTypeStr = '';

            if (doc.type === 'auto') {
              badgeStyle = 'bg-blue-500/20 text-blue-300 border border-blue-500/20';
              borderStyle = 'border-blue-500/10 bg-blue-500/5';
              labelTypeStr = currentLang === 'kr' ? '시스템 자동 발급' : currentLang === 'en' ? 'System Compiled' : 'Tạo tự động';
            } else if (doc.type === 'company') {
              badgeStyle = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20';
              borderStyle = 'border-emerald-500/10 bg-emerald-500/5';
              labelTypeStr = currentLang === 'kr' ? '회사 측 준비' : currentLang === 'en' ? 'Company Provided' : 'Công ty cấp';
            } else {
              badgeStyle = 'bg-amber-500/20 text-amber-300 border border-amber-500/20';
              borderStyle = 'border-amber-500/10 bg-amber-500/5';
              labelTypeStr = currentLang === 'kr' ? '개인 직접 준비' : currentLang === 'en' ? 'Foreigner Preps' : 'Cá nhân chuẩn bị';
            }

            const isTranslated = translatedField === doc.name.kr;
            const displayedText = isTranslated ? doc.name[currentLang] : doc.name.kr;

            return (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 ${borderStyle}`}
              >
                <span
                  onClick={() => handleToggleTranslate(doc.name.kr)}
                  className={`text-sm font-semibold text-slate-350 hover:text-white pr-3 leading-snug cursor-pointer select-none flex-1 transition-all duration-200 ${
                    isTranslated ? 'text-blue-400 scale-[0.99] font-extrabold' : ''
                  }`}
                >
                  {displayedText}
                </span>
                <span className={`text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-lg font-bold shrink-0 ${badgeStyle}`}>
                  {labelTypeStr}
                </span>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-3 bg-white/5 border border-white/10 text-slate-200 hover:text-white rounded-xl font-bold hover:bg-white/10 transition text-sm cursor-pointer"
        >
          {currentLang === 'kr' ? '확인했습니다' : currentLang === 'en' ? 'Got it' : 'Đã hiểu'}
        </button>
      </div>
    </div>
  );
};
