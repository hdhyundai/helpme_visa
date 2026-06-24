import React from 'react';
import { X, Search, Trash2, ShieldAlert, FolderOpen, Cloud, Database } from 'lucide-react';
import { EmployeeDBItem } from '../types';
import { fetchEmployees, deleteEmployee } from '../firebase';

interface DBModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadItem: (item: EmployeeDBItem) => void;
  onDeleteItem: (arc: string) => void;
}

export const DBModal: React.FC<DBModalProps> = ({
  isOpen,
  onClose,
  onLoadItem,
  onDeleteItem,
}) => {
  const [search, setSearch] = React.useState('');
  const [items, setItems] = React.useState<EmployeeDBItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [dbSource, setDbSource] = React.useState<'cloud' | 'local'>('local');

  React.useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchEmployees()
        .then(({ source, items: loadedItems }) => {
          setItems(loadedItems);
          setDbSource(source);
        })
        .catch((err) => {
          console.error('Failed to load employee DB:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredItems = items.filter(emp => {
    const fullSearch = `${emp.i_surname} ${emp.i_givenname} ${emp.i_arc}`.toLowerCase();
    return fullSearch.includes(search.toLowerCase());
  });

  const handleDelete = async (arc: string) => {
    onDeleteItem(arc); // local state sync in parent App
    await deleteEmployee(arc); // delete from firebase & local
    setItems(prev => prev.filter(item => item.i_arc !== arc));
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[160] flex items-center justify-center p-4">
      <div className="glass-premium p-6 rounded-3xl w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-blue-500/20 flex flex-col max-h-[80vh] step-container-transition relative cyber-bracket animate-[slideUpFade_0.4s_ease-out]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400 glow-text-cyan" />
              <span className="tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">동기화 직원 데이터베이스</span>
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              {dbSource === 'cloud' ? (
                <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  <Cloud className="w-3 h-3 animate-pulse" />
                  Firebase Cloud Synced (실시간 클라우드 연동 완료)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  <Database className="w-3 h-3" />
                  Local Cache Mode (로컬 캐시 보관 모드)
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-sm bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 text-white placeholder-slate-500 transition-all font-semibold"
            placeholder="이름(Surname/Given name) 또는 등록번호 검색..."
          />
        </div>

        {/* Database List */}
        <div className="flex-1 overflow-y-auto mb-4 border border-white/10 bg-black/20 rounded-2xl min-h-[200px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-slate-400">
              <span className="text-sm font-semibold animate-pulse text-blue-400">명부 불러오는 중...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-slate-400">
              <ShieldAlert className="w-10 h-10 mb-2 opacity-50 text-slate-400" />
              <p className="text-sm font-semibold">검색 결과가 없거나 명부가 비어 있습니다.</p>
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {filteredItems.map((emp) => {
                const fullName = `${emp.i_surname} ${emp.i_givenname}`.toUpperCase();
                return (
                  <li
                    key={emp.i_arc || Math.random().toString()}
                    className="p-4 flex justify-between items-center hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <div onClick={() => onLoadItem(emp)} className="flex-1">
                      <div className="font-extrabold text-white text-sm tracking-wide">
                        {fullName}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                        <span className="bg-white/5 border border-white/10 text-slate-300 px-2 py-0.5 rounded-md font-mono text-[10px]">
                          {emp.i_arc || '등록번호 없음'}
                        </span>
                        <span className="text-[10px] text-slate-505 text-slate-500">
                          수정일: {emp.lastUpdated}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(emp.i_arc);
                      }}
                      className="p-2 text-slate-500 hover:text-rose-455 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 rounded-xl font-bold transition cursor-pointer"
        >
          닫기 (Close)
        </button>
      </div>
    </div>
  );
};
