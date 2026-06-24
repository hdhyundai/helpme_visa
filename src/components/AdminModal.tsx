import React from 'react';
import { X, Settings2, CheckCircle2, AlertCircle } from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadTemplate: (docType: string, base64: string) => void;
  onClearTemplate: (docType: string) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  onUploadTemplate,
  onClearTemplate,
}) => {
  const [templateStatus, setTemplateStatus] = React.useState<Record<string, boolean>>({
    main: false,
    residence: false,
    guarantee: false,
  });

  const checkStatus = () => {
    try {
      setTemplateStatus({
        main: !!localStorage.getItem('visaPdfTemplate_main'),
        residence: !!localStorage.getItem('visaPdfTemplate_residence'),
        guarantee: !!localStorage.getItem('visaPdfTemplate_guarantee'),
      });
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const base64 = dataUrl.split(',')[1];
      onUploadTemplate(docType, base64);
      checkStatus();
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset
  };

  const docTypes = [
    { id: 'main', name: '통합신청서 (별지 제34호)', color: 'text-blue-400', border: 'border-blue-500/10 bg-blue-500/5' },
    { id: 'residence', name: '거주/숙소제공 확인서', color: 'text-emerald-400', border: 'border-emerald-500/10 bg-emerald-500/5' },
    { id: 'guarantee', name: '신원보증서 (별지 제129호)', color: 'text-indigo-400', border: 'border-indigo-500/10 bg-indigo-500/5' },
  ];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[150] flex items-center justify-center p-4">
      <div className="glass-premium p-6 rounded-3xl w-full max-w-sm shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-blue-500/20 step-container-transition relative cyber-bracket animate-[slideUpFade_0.4s_ease-out]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-cyan-400 glow-text-cyan animate-[spin_8s_linear_infinite]" />
            <span className="tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">시스템 코어 템플릿 환경 설정</span>
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>
        <p className="text-[11px] font-medium text-slate-400 mb-5 pb-3 border-b border-white/10 leading-relaxed">
          각 서류의 정부 원본 빈 PDF 양식을 로컬에 등록합니다. 미등록 시 영문과 한글 조합으로 직접 양식을 자동 빌드하여 예쁘게 인쇄합니다.
        </p>

        <div className="space-y-3.5 mb-6">
          {docTypes.map((t) => {
            const isRegistered = templateStatus[t.id];
            return (
              <div
                key={t.id}
                className={`flex justify-between items-center p-4 rounded-2xl border border-white/10 bg-white/5`}
              >
                <div>
                  <div className="font-extrabold text-sm text-white">{t.name}</div>
                  <div className="mt-1">
                    {isRegistered ? (
                      <span className="text-[10px] inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> 등록 완료
                      </span>
                    ) : (
                      <span className="text-[10px] inline-flex items-center gap-1 font-bold text-rose-455 text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                        <AlertCircle className="w-3 h-3" /> 원본 미등록 (fallback 가능)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="file"
                    id={`file-upload-${t.id}`}
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => handleFileChange(t.id, e)}
                  />
                  <label
                    htmlFor={`file-upload-${t.id}`}
                    className="bg-white/10 border border-white/10 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer hover:bg-white/20 transition shadow-sm"
                  >
                    등록
                  </label>
                  {isRegistered && (
                    <button
                      onClick={() => {
                        onClearTemplate(t.id);
                        checkStatus();
                      }}
                      className="text-xs font-bold text-rose-400 hover:text-rose-300 px-2 py-1.5 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                    >
                      제거
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition cursor-pointer shadow-[0_0_15px_rgba(37,99,235,0.3)]"
        >
          설정 완료 (Save Settings)
        </button>
      </div>
    </div>
  );
};
