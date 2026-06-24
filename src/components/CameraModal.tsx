import React from 'react';
import { X, Camera, RefreshCw, AlertTriangle, Image } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  currentLang: 'kr' | 'en' | 'vn';
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  currentLang,
}) => {
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
  const [facingMode, setFacingMode] = React.useState<'environment' | 'user'>('environment');
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState<string>('');

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  // Translations
  const t = {
    title: {
      kr: '신분증 촬영',
      en: 'ID Photo Capture',
      vn: 'Chụp ảnh Thẻ ID',
    },
    guide: {
      kr: '여권이나 외국인등록증을 촬영하세요',
      en: 'Please take a photo of your Passport or ARC',
      vn: 'Vui lòng chụp ảnh Hộ chiếu hoặc Thẻ ARC',
    },
    guideSub: {
      kr: '가이드라인 사각형 박스에 신분증을 맞춰주세요.',
      en: 'Align your document inside the guideline box.',
      vn: 'Căn chỉnh tài liệu của bạn trong hộp hướng dẫn.',
    },
    capture: {
      kr: '촬영하기',
      en: 'Capture',
      vn: 'Chụp ảnh',
    },
    noPermission: {
      kr: '카메라 권한이 거부되었거나 사용 불가능합니다.',
      en: 'Camera permission denied or unavailable.',
      vn: 'Quyền truy cập camera bị từ chối hoặc không khả dụng.',
    },
    noPermissionDesc: {
      kr: '브라우저 주소창 좌측의 자물쇠 아이콘을 클릭하여 카메라 권한을 허용해 주시거나, 모바일 설정에서 브라우저의 카메라 접근 권한을 켜주세요. 아래 버튼을 눌러 사진첩이나 파일에서 신분증을 직접 첨부해도 정상 판독됩니다.',
      en: 'Please click the lock icon on the left side of the address bar to allow camera access, or enable camera permissions in your device settings. You can also select an existing ID image from your gallery or files below.',
      vn: 'Vui lòng nhấp vào biểu tượng ổ khóa ở phía bên trái của thanh địa chỉ để cho phép truy cập camera, hoặc bật quyền camera trong cài đặt thiết bị. Bạn cũng có thể chọn một ảnh ID hiện có từ thư viện hoặc tệp bên dưới.',
    },
    fallbackBtn: {
      kr: '갤러리/파일에서 선택하기',
      en: 'Select from Gallery/Files',
      vn: 'Chọn từ Thư viện/Tệp',
    },
    close: {
      kr: '닫기',
      en: 'Close',
      vn: 'Đóng',
    },
  }[currentLang as 'kr' | 'en' | 'vn'] || {
    title: '신분증 촬영',
    guide: '여권이나 외국인등록증을 촬영하세요',
    guideSub: '가이드라인 사각형 박스에 신분증을 맞춰주세요.',
    capture: '촬영하기',
    noPermission: '카메라 권한이 거부되었거나 사용 불가능합니다.',
    fallbackBtn: '갤러리/파일에서 선택하기',
    close: '닫기',
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    stopCamera();
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('이 브라우저/환경에서는 카메라 스트리밍이 지원되지 않습니다.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Make sure it starts playing
        await videoRef.current.play().catch((err) => {
          console.warn('Video playback was interrupted:', err);
        });
      }
      setHasPermission(true);
    } catch (err: any) {
      console.error('Camera startup error:', err);
      setHasPermission(false);
      setErrorMsg(err.message || '카메라를 시작할 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  if (!isOpen) return null;

  // Toggle camera
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture Image
  const handleCapture = () => {
    if (!videoRef.current || !streamRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to File/Blob
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `captured_id_${Date.now()}.jpg`, { type: 'image/jpeg' });
      onCapture(file);
      onClose();
    }, 'image/jpeg', 0.9);
  };

  // Handle fallback file upload
  const handleFallbackFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[160] flex items-center justify-center p-3 sm:p-4">
      <div className="glass-premium p-4 sm:p-6 rounded-3xl w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-emerald-500/20 flex flex-col items-center relative animate-[slideUpFade_0.3s_ease-out]">
        
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400 glow-text-emerald" />
            <span className="text-base font-display font-bold text-slate-200">{t.title}</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/5 active:bg-white/10 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions */}
        <div className="text-center mb-4">
          <h4 className="text-base sm:text-lg font-bold text-emerald-400 tracking-tight">
            {t.guide}
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            {t.guideSub}
          </p>
        </div>

        {/* Camera Stage */}
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#0A0A0C] border border-white/10 flex items-center justify-center">
          
          {hasPermission === false ? (
            // Fallback screen when no permission or not supported
            <div className="flex flex-col items-center justify-center p-4 sm:p-6 text-center h-full overflow-y-auto">
              <AlertTriangle className="w-10 h-10 text-rose-500 mb-2 shrink-0" />
              <p className="text-xs sm:text-sm font-extrabold text-rose-400 mb-1">{t.noPermission}</p>
              <p className="text-[10px] sm:text-xs text-slate-400 max-w-sm mb-4 leading-normal">
                {/* @ts-ignore */}
                {t.noPermissionDesc}
              </p>
              
              <label className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer transition shadow-lg shrink-0">
                <Image className="w-3.5 h-3.5" />
                <span>{t.fallbackBtn}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFallbackFile}
                  className="hidden" 
                />
              </label>
            </div>
          ) : (
            // Live Stream Screen
            <>
              {isLoading && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10">
                  <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin mb-2" />
                  <span className="text-xs text-slate-400">Camera loading...</span>
                </div>
              )}

              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-cover"
              />

              {/* Guideline cutout overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
                {/* 
                  Centered card cutout
                  w-[92%] h-[70%] represents the larger guide proportions
                  The shadow acts as the surrounding dark overlay and adds a beautiful glow
                */}
                <div className="w-[92%] h-[70%] border-2 border-emerald-400 border-dashed rounded-2xl shadow-[0_0_15px_rgba(16,185,129,0.45),0_0_0_9999px_rgba(10,10,12,0.68)] relative flex items-center justify-center">
                  {/* Subtle corners design */}
                  <div className="absolute -top-1.5 -left-1.5 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                  <div className="absolute -bottom-1.5 -left-1.5 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                  <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                  
                  {/* Faint hint text inside the box */}
                  <span className="text-[11px] text-emerald-300 font-extrabold tracking-widest uppercase bg-black/60 px-3 py-1.5 rounded-lg border border-emerald-500/20 shadow-md">
                    Passport / ARC / ID
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="w-full mt-5 flex items-center justify-between gap-4">
          {/* Fallback Selector for manual select even when streaming is active */}
          {hasPermission !== false && (
            <label className="p-3 bg-white/5 hover:bg-white/10 active:bg-white/15 rounded-xl border border-white/10 text-slate-400 hover:text-white transition cursor-pointer shrink-0" title={t.fallbackBtn}>
              <Image className="w-5 h-5" />
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFallbackFile}
                className="hidden" 
              />
            </label>
          )}

          {/* Trigger Button */}
          {hasPermission !== false ? (
            <button
              onClick={handleCapture}
              disabled={isLoading}
              className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 active:scale-98 text-white font-extrabold rounded-xl transition shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <Camera className="w-4 h-4" />
              <span>{t.capture}</span>
            </button>
          ) : (
            <div className="flex-1" />
          )}

          {/* Flip camera */}
          {hasPermission !== false && (
            <button
              onClick={toggleFacingMode}
              disabled={isLoading}
              className="p-3 bg-white/5 hover:bg-white/10 active:bg-white/15 rounded-xl border border-white/10 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
              title="Camera switch"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          )}

          {/* Close button on mobile/fallback */}
          {hasPermission === false && (
            <button
              onClick={onClose}
              className="flex-1 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-extrabold rounded-xl transition cursor-pointer text-sm"
            >
              {t.close}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
