import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DEFAULT_GANTT_LABELS,
  GanttDayView,
  GanttDependencyView,
  GanttLabels,
  GanttRowView,
  GanttTask,
  GanttZoom,
} from './gantt.model';
import {
  GANTT_HEADER_HEIGHT,
  GANTT_LEFT_WIDTH,
  GANTT_ROW_HEIGHT,
  ZOOM_DAY_WIDTH,
  buildDays,
  buildDependencies,
  buildRows,
  dayOffset,
  startOfDay,
} from './gantt-layout';

interface TooltipState {
  lines: string[];
  x: number;
  y: number;
}

/**
 * Diagrama de Gantt para Medusa 7 (Bootstrap 5.2).
 * Sin dependencias externas: solo Angular y CommonModule.
 *
 * <medusa-gantt
 *   [tasks]="tasks" [start]="start" [end]="end" [today]="today"
 *   [(zoom)]="zoom" [showOperations]="true"
 *   (taskClick)="abrirTarea($event)">
 * </medusa-gantt>
 */
@Component({
  selector: 'medusa-gantt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './medusa-gantt.component.html',
  styleUrls: ['./medusa-gantt.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedusaGanttComponent implements OnChanges {
  /** Todas las tareas y operaciones, en el orden en que se muestran. */
  @Input() tasks: GanttTask[] = [];
  /** Primer día visible (se usa la medianoche local). */
  @Input() start!: Date;
  /** Último día visible, incluido. */
  @Input() end!: Date;
  /** Instante actual para la línea "Hoy". Por defecto, `new Date()`. */
  @Input() today: Date = new Date();
  /** Días de la semana no laborables (0 = domingo). */
  @Input() nonWorkingWeekdays: number[] = [0];
  @Input() zoom: GanttZoom = 'day';
  @Input() showOperations = true;
  @Input() locale = 'es-ES';
  @Input() labels: Partial<GanttLabels> = {};
  /** Alto máximo del área con scroll, en px. */
  @Input() maxHeight = 640;

  @Output() zoomChange = new EventEmitter<GanttZoom>();
  /** Clic, Enter o Espacio sobre la barra principal de una fila. */
  @Output() taskClick = new EventEmitter<GanttTask>();

  @ViewChild('scroller', { static: true }) scroller!: ElementRef<HTMLElement>;

  readonly headerHeight = GANTT_HEADER_HEIGHT;
  readonly leftWidth = GANTT_LEFT_WIDTH;

  days: GanttDayView[] = [];
  rows: GanttRowView[] = [];
  dependencies: GanttDependencyView[] = [];
  dayWidth = ZOOM_DAY_WIDTH.day;
  timelineWidth = 0;
  totalHeight = 0;
  todayLeft: number | null = null;
  todayLabel = '';
  l: GanttLabels = DEFAULT_GANTT_LABELS;
  tooltip: TooltipState | null = null;

  ngOnChanges(_: SimpleChanges): void {
    if (!this.start || !this.end) return;
    this.l = {
      ...DEFAULT_GANTT_LABELS,
      ...this.labels,
      status: { ...DEFAULT_GANTT_LABELS.status, ...this.labels.status },
      legend: { ...DEFAULT_GANTT_LABELS.legend, ...this.labels.legend },
    };
    const origin = startOfDay(this.start);
    this.dayWidth = ZOOM_DAY_WIDTH[this.zoom];
    this.days = buildDays(this.start, this.end, this.nonWorkingWeekdays, this.locale);
    this.timelineWidth = this.days.length * this.dayWidth;

    const visible = this.showOperations ? this.tasks : this.tasks.filter((t) => t.type === 'task');
    this.rows = buildRows(visible, origin, this.zoom, this.l, this.locale, this.nonWorkingWeekdays);
    this.dependencies = buildDependencies(this.rows);
    this.totalHeight = GANTT_HEADER_HEIGHT + this.rows.length * GANTT_ROW_HEIGHT;

    const offset = dayOffset(origin, this.today);
    const inRange = offset >= 0 && offset <= this.days.length;
    this.todayLeft = inRange ? offset * this.dayWidth : null;
    const hm = new Intl.DateTimeFormat(this.locale, { hour: '2-digit', minute: '2-digit' }).format(this.today);
    this.todayLabel = `${this.l.today} ${hm}`;
  }

  setZoom(z: GanttZoom): void {
    if (z === this.zoom) return;
    this.zoom = z;
    this.zoomChange.emit(z);
    this.ngOnChanges({});
  }

  /** Centra la línea "Hoy" en el área visible. */
  scrollToToday(): void {
    if (this.todayLeft == null) return;
    const el = this.scroller.nativeElement;
    el.scrollLeft = Math.max(0, GANTT_LEFT_WIDTH + this.todayLeft - (el.clientWidth + GANTT_LEFT_WIDTH) / 2);
  }

  showTooltip(row: GanttRowView, ev: MouseEvent | FocusEvent): void {
    const r = (ev.currentTarget as HTMLElement).getBoundingClientRect();
    this.tooltip = { lines: row.tooltip, x: r.left + r.width / 2, y: r.top };
  }

  hideTooltip(): void {
    this.tooltip = null;
  }

  onActivate(row: GanttRowView, ev: Event): void {
    ev.preventDefault();
    this.taskClick.emit(row.task);
  }

  trackRow(_: number, r: GanttRowView): string {
    return r.task.id;
  }
}
