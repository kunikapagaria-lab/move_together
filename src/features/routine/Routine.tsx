import { useState } from 'react';
import { Plus, Trash2, Calendar, GripVertical } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store';
import { setCell, moveCell, addTimeRow, removeTimeRow, type TimetableCell } from '../../store/routineSlice';
import { BackButton } from '../../components/ui/BackButton';
import { useToast } from '../../components/ui/Toast';

const DAYS: TimetableCell['day'][] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export const Routine = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { showSuccess } = useToast();
  const { cells, timeRows } = useSelector((state: RootState) => state.routine);

  // Active editing state: { day, timeRow } or null
  const [editingCellKey, setEditingCellKey] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');

  // Side Time Row Add State
  const [newRowTime, setNewRowTime] = useState('');
  const [isAddingRow, setIsAddingRow] = useState(false);

  // Drag and Drop State
  const [draggedCellId, setDraggedCellId] = useState<string | null>(null);

  const getCellKey = (day: string, timeRow: string) => `${day}__${timeRow}`;

  const getCellData = (day: TimetableCell['day'], timeRow: string) => {
    return cells.find(c => c.day === day && c.timeRow === timeRow);
  };

  const handleStartEdit = (day: TimetableCell['day'], timeRow: string) => {
    const existing = getCellData(day, timeRow);
    setEditTitle(existing ? existing.title : '');
    setEditSubtitle(existing ? existing.subtitle || '' : '');
    setEditingCellKey(getCellKey(day, timeRow));
  };

  const handleSaveCell = (day: TimetableCell['day'], timeRow: string) => {
    dispatch(setCell({
      day,
      timeRow,
      title: editTitle,
      subtitle: editSubtitle
    }));
    setEditingCellKey(null);
    if (editTitle.trim()) {
      showSuccess('Saved slot!');
    }
  };

  const handleAddRow = () => {
    if (!newRowTime.trim()) return;
    dispatch(addTimeRow(newRowTime.trim()));
    showSuccess(`Added ${newRowTime} time row!`);
    setNewRowTime('');
    setIsAddingRow(false);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, cellId: string) => {
    setDraggedCellId(cellId);
    e.dataTransfer.setData('text/plain', cellId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetDay: TimetableCell['day'], targetTimeRow: string) => {
    e.preventDefault();
    const cellId = e.dataTransfer.getData('text/plain') || draggedCellId;
    if (cellId) {
      dispatch(moveCell({ cellId, targetDay, targetTimeRow }));
      showSuccess(`Moved task to ${targetDay} ${targetTimeRow}!`);
      setDraggedCellId(null);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto w-full px-2 sm:px-6 py-6 text-center">
      <BackButton />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 text-left">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/20 border border-white/20 px-3.5 py-1 rounded-full text-xs font-bold text-white mb-2">
            <Calendar className="w-3.5 h-3.5 text-white" /> Weekly Grid Routine
          </div>
          <h1 
            style={{ fontFamily: "'Oswald', sans-serif" }}
            className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight"
          >
            Weekly Routine Timetable
          </h1>
          <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-xl">
            Click directly inside any cell to type your task. Drag and drop task blocks between days and times to re-arrange your schedule.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAddingRow ? (
            <div className="flex items-center gap-2 bg-black/80 border border-white/30 rounded-2xl p-2">
              <input 
                type="text" 
                value={newRowTime}
                onChange={e => setNewRowTime(e.target.value)}
                placeholder="e.g. 23:00 PM"
                className="bg-white/10 text-white border border-white/20 rounded-xl px-3 py-1 text-xs outline-none w-28 font-mono"
              />
              <button 
                onClick={handleAddRow}
                className="bg-white text-black font-bold text-xs px-3 py-1 rounded-xl"
              >
                Add
              </button>
              <button 
                onClick={() => setIsAddingRow(false)}
                className="text-white/50 hover:text-white px-2 text-xs"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingRow(true)}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Side Time Row
            </button>
          )}
        </div>
      </div>

      {/* TIMETABLE GRID BOARD */}
      <div className="w-full overflow-x-auto custom-scrollbar border-2 border-white/20 bg-black/90 shadow-2xl rounded-2xl p-1 sm:p-2">
        <div className="min-w-[900px] grid grid-cols-[100px_repeat(7,1fr)] sm:grid-cols-[130px_repeat(7,1fr)] gap-[2px] bg-neutral-900 border border-white/10">
          
          {/* TOP LEFT CORNER CELL */}
          <div className="bg-[#e0531c] border border-white/20 flex items-center justify-center p-3 text-white font-black text-xs uppercase tracking-widest">
            TIME / DAY
          </div>

          {/* 7 DAY HEADER COLUMNS (Top Axis across screen) */}
          {DAYS.map(day => (
            <div 
              key={day}
              className="bg-[#e0531c] border border-white/20 flex items-center justify-center p-3 text-white font-black text-sm uppercase tracking-wider shadow-sm"
            >
              {day}
            </div>
          ))}

          {/* GRID ROWS (Time Column on the SIDE + 7 Day Cells) */}
          {timeRows.map(timeRow => (
            <div key={timeRow} className="contents">
              
              {/* SIDE TIME COLUMN CELL (Left Axis down screen) */}
              <div className="bg-[#121212] border border-white/10 flex items-center justify-between px-3 py-4 text-white font-bold text-xs sm:text-sm font-mono tracking-wider text-left group">
                <span>{timeRow}</span>
                <button
                  onClick={() => dispatch(removeTimeRow(timeRow))}
                  className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-rose-400 transition-opacity"
                  title="Remove row"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 7 INTERACTIVE DAY CELLS FOR THIS TIME ROW */}
              {DAYS.map(day => {
                const cellKey = getCellKey(day, timeRow);
                const cellData = getCellData(day, timeRow);
                const isEditing = editingCellKey === cellKey;

                return (
                  <div
                    key={cellKey}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, day, timeRow)}
                    className="relative min-h-[90px] border border-white/10 transition-colors bg-[#080808] hover:bg-neutral-900/80 flex items-center justify-center p-1.5"
                  >
                    {isEditing ? (
                      /* DIRECT INLINE CELL INPUT FORM (No dropdowns / modals) */
                      <div className="w-full h-full bg-black border-2 border-amber-400 rounded-lg p-2 flex flex-col justify-center gap-1.5 z-20 shadow-xl">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          placeholder="TASK (e.g. YOGA)"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveCell(day, timeRow);
                            if (e.key === 'Escape') setEditingCellKey(null);
                          }}
                          className="w-full bg-white/10 text-white text-xs font-bold px-2 py-1 rounded border border-white/20 outline-none uppercase placeholder-white/40"
                        />
                        <input
                          type="text"
                          value={editSubtitle}
                          onChange={e => setEditSubtitle(e.target.value)}
                          placeholder="Time Range (e.g. 5:00am-7:00am)"
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveCell(day, timeRow);
                            if (e.key === 'Escape') setEditingCellKey(null);
                          }}
                          className="w-full bg-white/10 text-white text-[10px] px-2 py-1 rounded border border-white/20 outline-none placeholder-white/40"
                        />
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <button
                            onClick={() => setEditingCellKey(null)}
                            className="text-[10px] bg-white/10 hover:bg-white/20 text-white px-2 py-0.5 rounded"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveCell(day, timeRow)}
                            className="text-[10px] bg-white text-black font-bold px-2.5 py-0.5 rounded"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : cellData ? (
                      /* FILLED WHITE TASK CARD (Matching reference image) */
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, cellData.id)}
                        onClick={() => handleStartEdit(day, timeRow)}
                        className="w-full h-full bg-white border border-slate-300 rounded-none p-2 sm:p-3 flex flex-col items-center justify-center text-center cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-all shadow-md group relative"
                      >
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <h4 className="font-extrabold text-[#e0531c] text-xs sm:text-sm uppercase tracking-wide leading-tight">
                          {cellData.title}
                        </h4>
                        {cellData.subtitle && (
                          <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-1">
                            {cellData.subtitle}
                          </p>
                        )}
                      </div>
                    ) : (
                      /* EMPTY CELL (+ Add directly on click) */
                      <button
                        onClick={() => handleStartEdit(day, timeRow)}
                        className="w-full h-full flex flex-col items-center justify-center gap-1 text-white/20 hover:text-white/80 hover:bg-white/5 transition-all text-xs font-bold group"
                      >
                        <Plus className="w-4 h-4 text-white/30 group-hover:text-white group-hover:scale-125 transition-all" />
                        <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity uppercase font-mono">Click to Add</span>
                      </button>
                    )}
                  </div>
                );
              })}

            </div>
          ))}

        </div>
      </div>
    </div>
  );
};
