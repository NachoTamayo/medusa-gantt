import { buildDays, buildDependencies, buildRows, dayOffset, formatDeviation, workingDaysBetween } from './gantt-layout';
import { DEFAULT_GANTT_LABELS } from './gantt.model';
import { DEMO_END, DEMO_START, DEMO_TASKS } from './gantt.demo-data';

describe('gantt-layout', () => {
  const origin = new Date(2026, 9, 5);

  it('dayOffset devuelve días con fracción', () => {
    expect(dayOffset(origin, new Date(2026, 9, 7, 12))).toBe(2.5);
  });

  it('buildDays marca el domingo como no laborable', () => {
    const days = buildDays(DEMO_START, DEMO_END, [0], 'es-ES');
    expect(days.length).toBe(12);
    expect(days[0].label).toBe('Lun 05/10');
    expect(days.filter((d) => d.nonWorking).map((d) => d.label)).toEqual(['Dom 11/10']);
  });

  it('workingDaysBetween salta los domingos', () => {
    // Jue 08/10 → Lun 12/10 = 4 días naturales, 3 laborables
    expect(workingDaysBetween(new Date(2026, 9, 8), new Date(2026, 9, 12), [0])).toBe(3);
  });

  it('formatDeviation coincide con el diseño (+3 d, +0,5 d) y vacío sin retraso', () => {
    const t = (id: string) => DEMO_TASKS.find((x) => x.id === id)!;
    expect(formatDeviation(t('T-04').planned, t('T-04').forecast, 'es-ES', [0])).toBe('+3 d');
    expect(formatDeviation(t('T-03').planned, t('T-03').forecast, 'es-ES', [0])).toBe('+0,5 d');
    expect(formatDeviation(t('T-01').planned, t('T-01').forecast, 'es-ES', [0])).toBe('');
  });

  it('buildRows usa la previsión de las tareas con retraso y el real de las finalizadas', () => {
    const rows = buildRows(DEMO_TASKS, origin, 'day', DEFAULT_GANTT_LABELS, 'es-ES', [0]);
    const t01 = rows.find((r) => r.task.id === 'T-01')!;
    const t04 = rows.find((r) => r.task.id === 'T-04')!;
    expect(t01.mainKind).toBe('finished');
    expect(t04.mainKind).toBe('delayed');
    expect(t04.main.left).toBeGreaterThan(t04.planned.left);
  });

  it('buildDependencies ignora ids inexistentes', () => {
    const rows = buildRows(
      DEMO_TASKS.filter((t) => t.type === 'task'), origin, 'day', DEFAULT_GANTT_LABELS, 'es-ES', [0]);
    rows[0].task = { ...rows[0].task, dependsOn: ['X-99'] };
    const deps = buildDependencies(rows);
    expect(deps.some((d) => d.from === 'X-99')).toBe(false);
    expect(deps.length).toBe(7);
  });
});
