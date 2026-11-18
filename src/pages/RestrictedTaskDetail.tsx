import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectService } from '../services/api';
import type { SDLCStatus, Task } from '../types';

const idOf = (value: Task['assignedTo']) => typeof value === 'string' ? value : value?._id;

export default function RestrictedTaskDetail() {
  const { taskId } = useParams();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    if (!taskId) { setLoading(false); return; }
    projectService.getTask(taskId).then(value => { if (active) setTask(value); })
      .catch(() => { if (active) setError('Task ကို ဖွင့်မရပါ။'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [taskId]);
  const nextStatuses: SDLCStatus[] = [];
  if (task && user?.roles.some(role => ['developer', 'uiux', 'dqa'].includes(role)) && idOf(task.assignedTo) === user._id) {
    if (task.status === 'todo') nextStatuses.push('in-progress');
    if (task.status === 'in-progress') nextStatuses.push('code-review');
  }
  if (task && user?.roles.some(role => ['dqa', 'dqa_head'].includes(role)) && idOf(task.qaAssignedTo) === user._id && task.status === 'qa-testing') {
    nextStatuses.push('done', 'in-progress');
  }
  const changeStatus = async (status: SDLCStatus) => {
    if (!task) return;
    setError('');
    try { setTask(await projectService.updateTaskStatus(task._id, status)); }
    catch { setError('Status ကို ပြောင်းမရပါ။'); }
  };
  if (loading) return <p>ဖွင့်နေပါသည်…</p>;
  if (!task) return <p role="alert">{error || 'Task မတွေ့ပါ။'}</p>;
  return <section className="mx-auto max-w-3xl space-y-4 p-4">
    <h1 className="text-2xl font-bold">Task</h1>
    <p className="text-sm text-slate-600">စာသားအဟောင်းများကို လုံခြုံရေးအတွက် ယာယီ ဖျောက်ထားပါသည်။</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <label className="block space-y-2"><span className="font-medium">Status</span>
      <select className="block rounded border p-2" value={task.status || 'todo'} disabled={nextStatuses.length === 0}
        onChange={event => void changeStatus(event.target.value as SDLCStatus)}>
        {[task.status || 'todo', ...nextStatuses].map(status => <option key={status} value={status}>{status}</option>)}
      </select>
    </label>
    {nextStatuses.length === 0 && <p className="text-sm text-slate-600">ဤအဆင့်တွင် status ပြောင်းခွင့် မရှိပါ။</p>}
  </section>;
}
