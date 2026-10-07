/** Estado de una tarea u operación. Determina el color de la barra y el texto de la columna Estado. */
export type GanttStatus = 'finished' | 'running' | 'notStarted';

/** Escala horizontal: `day` = 80 px por día, `compact` = 44 px por día. */
export type GanttZoom = 'day' | 'compact';

export interface GanttRange {
  start: Date;
  end: Date;
}

export interface GanttTask {
  id: string;
  /** Texto de la columna "Tarea / operación". */
  name: string;
  /** `task` = fila principal; `operation` = fila hija con sangría. */
  type: 'task' | 'operation';
  status: GanttStatus;
  /** Equipo responsable. Solo se muestra en las tareas. */
  team?: string;
  /** Línea base. Se dibuja como barra discontinua. */
  planned: GanttRange;
  /** Ejecución real (tareas finalizadas o en curso). */
  actual?: GanttRange;
  /** Previsión actual. Si termina después de `planned.end`, la fila se marca con retraso. */
  forecast?: GanttRange;
  /** Avance 0-100. Se pinta dentro de la barra principal de las tareas. */
  progress?: number;
  /** Muestra la etiqueta "Crítica". */
  critical?: boolean;
  /** Muestra el icono de aviso junto al código. */
  warning?: boolean;
  /** Texto adicional tras la desviación, p. ej. "sin capacidad hasta el 10/10". */
  note?: string;
  /** ids de las tareas de las que depende. Se dibuja una flecha desde cada una. */
  dependsOn?: string[];
}

export interface GanttLabels {
  task: string;
  teamStatus: string;
  today: string;
  critical: string;
  planned: string;
  forecast: string;
  actual: string;
  deviation: string;
  progress: string;
  status: Record<GanttStatus, string>;
  legend: {
    planned: string;
    finished: string;
    running: string;
    delayed: string;
    dependency: string;
  };
}

export const DEFAULT_GANTT_LABELS: GanttLabels = {
  task: 'Tarea / operación',
  teamStatus: 'Equipo / Estado',
  today: 'Hoy',
  critical: 'Crítica',
  planned: 'Planificado',
  forecast: 'Previsto',
  actual: 'Real',
  deviation: 'Desviación',
  progress: 'Avance',
  status: {
    finished: 'Finalizado',
    running: 'En curso',
    notStarted: 'Sin comenzar',
  },
  legend: {
    planned: 'Planificado',
    finished: 'Finalizado',
    running: 'En curso',
    delayed: 'Previsión con retraso',
    dependency: 'Dependencia',
  },
};

/** Datos de una barra ya posicionada (px relativos al inicio de la línea de tiempo). */
export interface GanttBarView {
  left: number;
  width: number;
}

export interface GanttDayView {
  date: Date;
  label: string;
  /** Solo el número de día, para la escala compacta. */
  shortLabel: string;
  nonWorking: boolean;
}

export interface GanttRowView {
  task: GanttTask;
  planned: GanttBarView;
  /** Barra principal (real, previsión o planificado según estado). */
  main: GanttBarView;
  /** Variante visual de la barra principal. */
  mainKind: 'finished' | 'running' | 'delayed' | 'idle';
  /** Relleno de avance sobre la previsión (solo `running`). */
  progress?: GanttBarView;
  progressLabel?: string;
  /** "+3 d" o "+0,5 d". Vacío si no hay retraso. */
  deviation: string;
  tooltip: string[];
}

export interface GanttDependencyView {
  from: string;
  to: string;
  path: string;
  arrow: string;
}
