import { GanttTask } from './gantt.model';

/** Datos de ejemplo de OT-2026-0147 (los mismos que el diseño de Figma). Solo para demos y tests. */
const d = (day: number, hours = 0, minutes = 0) => new Date(2026, 9, day, hours, minutes);
/** Fracción de día → Date dentro de octubre de 2026 (5 = 05/10 00:00). */
const f = (days: number) => new Date(2026, 9, 5, Math.round(days * 24), 0);

export const DEMO_START = d(5);
export const DEMO_END = d(16);
export const DEMO_TODAY = d(7, 10, 0);

export const DEMO_TASKS: GanttTask[] = [
  { id: 'T-01', name: 'Despresurización y acceso', type: 'task', status: 'finished', team: 'Hidráulica',
    planned: { start: f(0), end: f(1) }, actual: { start: f(0), end: f(1.05) }, progress: 100 },
  { id: 'T-02', name: 'Desmontaje de bomba hidráulica', type: 'task', status: 'finished', team: 'Desmontaje y montaje',
    planned: { start: f(1), end: f(2) }, actual: { start: f(1.1), end: f(2.1) }, progress: 100, dependsOn: ['T-01'] },
  { id: 'O-02.1', name: 'Desconexión de líneas y conector', type: 'operation', status: 'finished',
    planned: { start: f(1), end: f(1.45) }, actual: { start: f(1.1), end: f(1.55) } },
  { id: 'O-02.2', name: 'Desmontaje · P/N 123-456-789', type: 'operation', status: 'finished',
    planned: { start: f(1.5), end: f(1.95) }, actual: { start: f(1.6), end: f(2.1) } },
  { id: 'T-03', name: 'Drenaje y cambio de aceite hidráulico', type: 'task', status: 'running', team: 'Lubricación',
    planned: { start: f(1), end: f(2) }, actual: { start: f(1), end: f(2.35) }, forecast: { start: f(1), end: f(2.55) },
    progress: 80, dependsOn: ['T-01'] },
  { id: 'T-04', name: 'Anticorrosión y pintura', type: 'task', status: 'notStarted', team: 'Pintura y protección',
    warning: true, planned: { start: f(2), end: f(3.95) }, forecast: { start: f(5), end: f(7.95) }, progress: 0,
    note: 'sin capacidad hasta el 10/10', dependsOn: ['T-02'] },
  { id: 'O-04.1', name: 'Limpieza y decapado', type: 'operation', status: 'notStarted',
    planned: { start: f(2), end: f(2.45) }, forecast: { start: f(5), end: f(5.45) } },
  { id: 'O-04.2', name: 'Imprimación anticorrosiva', type: 'operation', status: 'notStarted',
    planned: { start: f(2.5), end: f(2.95) }, forecast: { start: f(5.5), end: f(5.95) } },
  { id: 'O-04.3', name: 'Pintura de acabado y curado 24 h', type: 'operation', status: 'notStarted',
    planned: { start: f(3), end: f(3.95) }, forecast: { start: f(7), end: f(7.95) } },
  { id: 'T-05', name: 'Instalación de la bomba', type: 'task', status: 'notStarted', team: 'Desmontaje y montaje',
    critical: true, planned: { start: f(4), end: f(4.95) }, forecast: { start: f(8), end: f(8.95) }, progress: 0,
    dependsOn: ['T-04'] },
  { id: 'O-05.1', name: 'Montaje · S/N PB-20944', type: 'operation', status: 'notStarted',
    planned: { start: f(4), end: f(4.55) }, forecast: { start: f(8), end: f(8.55) } },
  { id: 'O-05.2', name: 'Par de apriete y frenado', type: 'operation', status: 'notStarted',
    planned: { start: f(4.6), end: f(4.95) }, forecast: { start: f(8.6), end: f(8.95) } },
  { id: 'T-06', name: 'Llenado y purga del sistema', type: 'task', status: 'notStarted', team: 'Lubricación',
    planned: { start: f(5), end: f(5.45) }, forecast: { start: f(9), end: f(9.45) }, progress: 0, dependsOn: ['T-05'] },
  { id: 'T-07', name: 'Prueba funcional hidráulica', type: 'task', status: 'notStarted', team: 'Pruebas funcionales',
    planned: { start: f(7), end: f(7.95) }, forecast: { start: f(9.5), end: f(9.95) }, progress: 0, dependsOn: ['T-06'] },
  { id: 'O-07.1', name: 'Medida de presión con EIME', type: 'operation', status: 'notStarted',
    planned: { start: f(7), end: f(7.45) }, forecast: { start: f(9.5), end: f(9.7) } },
  { id: 'O-07.2', name: 'Registro de prueba funcional', type: 'operation', status: 'notStarted',
    planned: { start: f(7.5), end: f(7.95) }, forecast: { start: f(9.75), end: f(9.95) } },
  { id: 'T-08', name: 'Cierre de paneles e inspección final', type: 'task', status: 'notStarted', team: 'Desmontaje y montaje',
    planned: { start: f(8), end: f(8.95) }, forecast: { start: f(10), end: f(10.95) }, progress: 0, dependsOn: ['T-07'] },
];
