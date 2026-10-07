import {
  GanttDayView,
  GanttDependencyView,
  GanttLabels,
  GanttRange,
  GanttRowView,
  GanttTask,
  GanttZoom,
} from './gantt.model';

/** Altura de la cabecera y de cada fila, en px. Deben coincidir con el SCSS. */
export const GANTT_HEADER_HEIGHT = 52;
export const GANTT_ROW_HEIGHT = 48;
/** Ancho de las columnas fijas (Tarea + Equipo/Estado), en px. */
export const GANTT_LEFT_WIDTH = 426;

export const ZOOM_DAY_WIDTH: Record<GanttZoom, number> = { day: 80, compact: 44 };

const MS_DAY = 86_400_000;

const pad = (n: number) => String(n).padStart(2, '0');
/** dd/MM fijo: Intl con es-ES omite el cero inicial ("5/10"). */
const ddmm = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;

/** Medianoche local de una fecha. */
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Días (con fracción) entre `origin` y `d`, usando componentes locales
 * para que un cambio de hora no desplace las barras.
 */
export function dayOffset(origin: Date, d: Date): number {
  const o = Date.UTC(origin.getFullYear(), origin.getMonth(), origin.getDate());
  const t =
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) +
    ((d.getHours() * 60 + d.getMinutes()) * 60 + d.getSeconds()) * 1000;
  return (t - o) / MS_DAY;
}

export function buildDays(start: Date, end: Date, nonWorkingWeekdays: number[], locale: string): GanttDayView[] {
  const days: GanttDayView[] = [];
  const first = startOfDay(start);
  const last = startOfDay(end);
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  for (let d = new Date(first); d <= last; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    const w = weekday.format(d).replace('.', '');
    days.push({
      date: d,
      label: `${w.charAt(0).toUpperCase()}${w.slice(1)} ${ddmm(d)}`,
      shortLabel: pad(d.getDate()),
      nonWorking: nonWorkingWeekdays.includes(d.getDay()),
    });
  }
  return days;
}

function bar(origin: Date, r: GanttRange, dw: number) {
  const left = dayOffset(origin, r.start) * dw;
  const width = Math.max((dayOffset(origin, r.end) - dayOffset(origin, r.start)) * dw, 6);
  return { left: left + 2, width: width - 2 };
}

/** Días laborables (con fracción) entre dos instantes: no cuenta los días de `nonWorking` (0 = domingo). */
export function workingDaysBetween(a: Date, b: Date, nonWorking: number[]): number {
  const origin = startOfDay(a);
  const from = dayOffset(origin, a);
  const to = dayOffset(origin, b);
  if (to <= from) return 0;
  let total = 0;
  for (let i = Math.floor(from); i < to; i++) {
    const day = new Date(origin.getFullYear(), origin.getMonth(), origin.getDate() + i);
    if (nonWorking.includes(day.getDay())) continue;
    total += Math.min(to, i + 1) - Math.max(from, i);
  }
  return total;
}

/** Retraso del fin previsto sobre el planificado, en días laborables y a medios días: "+3 d" / "+0,5 d". '' si no hay retraso. */
export function formatDeviation(
  planned: GanttRange,
  forecast: GanttRange | undefined,
  locale: string,
  nonWorking: number[],
): string {
  if (!forecast) return '';
  const delta = Math.round(workingDaysBetween(planned.end, forecast.end, nonWorking) * 2) / 2;
  if (delta <= 0) return '';
  return `+${new Intl.NumberFormat(locale).format(delta)} d`;
}

function fmt(d: Date, _locale: string): string {
  return `${ddmm(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function buildRows(
  tasks: GanttTask[],
  origin: Date,
  zoom: GanttZoom,
  labels: GanttLabels,
  locale: string,
  nonWorking: number[],
): GanttRowView[] {
  const dw = ZOOM_DAY_WIDTH[zoom];
  return tasks.map((task) => {
    const planned = bar(origin, task.planned, dw);
    const deviation = formatDeviation(task.planned, task.forecast, locale, nonWorking);
    let main = planned;
    let mainKind: GanttRowView['mainKind'] = 'idle';
    let progress: GanttRowView['progress'];
    let progressLabel: string | undefined;

    if (task.status === 'finished') {
      main = bar(origin, task.actual ?? task.planned, dw);
      mainKind = 'finished';
    } else if (task.status === 'running') {
      main = bar(origin, task.forecast ?? task.actual ?? task.planned, dw);
      mainKind = 'running';
      if (task.actual) progress = bar(origin, task.actual, dw);
    } else if (task.forecast) {
      main = bar(origin, task.forecast, dw);
      mainKind = deviation ? 'delayed' : 'idle';
    }
    if (task.type === 'task' && task.progress != null) {
      progressLabel = `${task.progress} %`;
    }

    const tooltip = [
      `${task.id} · ${task.name}`,
      `${labels.status[task.status]}${task.progress != null ? ` · ${task.progress} %` : ''}`,
      `${labels.planned}: ${fmt(task.planned.start, locale)} → ${fmt(task.planned.end, locale)}`,
    ];
    if (task.forecast) tooltip.push(`${labels.forecast}: ${fmt(task.forecast.start, locale)} → ${fmt(task.forecast.end, locale)}`);
    else if (task.actual) tooltip.push(`${labels.actual}: ${fmt(task.actual.start, locale)} → ${fmt(task.actual.end, locale)}`);
    if (deviation) tooltip.push(`${labels.deviation}: ${deviation}${task.note ? ' · ' + task.note : ''}`);

    return { task, planned, main, mainKind, progress, progressLabel, deviation, tooltip };
  });
}

/** Flechas fin→inicio con codo. Las coordenadas son relativas al contenedor completo (incluye columnas fijas). */
export function buildDependencies(rows: GanttRowView[]): GanttDependencyView[] {
  const index = new Map(rows.map((r, i) => [r.task.id, i]));
  const out: GanttDependencyView[] = [];
  for (const row of rows) {
    for (const dep of row.task.dependsOn ?? []) {
      const i = index.get(dep);
      const j = index.get(row.task.id);
      if (i == null || j == null) continue;
      const a = rows[i].main;
      const xa = GANTT_LEFT_WIDTH + a.left + a.width;
      const xb = GANTT_LEFT_WIDTH + row.main.left;
      const ya = GANTT_HEADER_HEIGHT + i * GANTT_ROW_HEIGHT + 29;
      const yb = GANTT_HEADER_HEIGHT + j * GANTT_ROW_HEIGHT + 29;
      const mid = Math.max(xb - 10, xa + 6);
      out.push({
        from: dep,
        to: row.task.id,
        path: `M${xa} ${ya} H${mid} V${yb} H${xb - 1}`,
        arrow: `${xb},${yb} ${xb - 6},${yb - 3.5} ${xb - 6},${yb + 3.5}`,
      });
    }
  }
  return out;
}
