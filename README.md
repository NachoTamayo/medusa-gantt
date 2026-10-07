# medusa-gantt

Diagrama de Gantt para la pantalla **Órdenes de Trabajo · Tareas y operaciones** (SLANG-ITP), con estilo Medusa 7 sobre Bootstrap 5.2.
Inspirado en la anatomía de [angular-gantt](https://github.com/angular-gantt/angular-gantt) (tabla, línea de tiempo, barras, tooltips, dependencias, línea "Hoy"), pero **sin usar esa librería**: angular-gantt está hecho para AngularJS 1.x y no funciona en Angular moderno.

- Componente `standalone`, `OnPush`, sin dependencias externas (solo `@angular/core` y `CommonModule`).
- Verificado: compila con Angular 22 en modo estricto de plantillas y los tests de `gantt-layout.spec.ts` pasan (6/6). No se ha probado con versiones anteriores a Angular 15; usa `standalone` y `*ngIf/*ngFor`, así que debería funcionar desde la 15.
- Bootstrap 5.2 debe estar cargado en la aplicación (el componente solo usa `btn`, `btn-group`, `btn-outline-secondary`, `btn-sm`).
- Los iconos (`today`, `warning_amber`) usan la fuente **Material Symbols** (clase `material-symbols-outlined`), la misma familia de iconos de Google que usan las pantallas. Debe estar cargada en la aplicación.

## Uso

```ts
import { MedusaGanttComponent, GanttTask, GanttZoom } from './medusa-gantt';

@Component({
  standalone: true,
  imports: [MedusaGanttComponent],
  template: `
    <medusa-gantt
      [tasks]="tasks"
      [start]="start" [end]="end" [today]="today"
      [(zoom)]="zoom"
      [showOperations]="verOperaciones"
      (taskClick)="abrirDetalle($event)" />`,
})
export class TareasPage {
  tasks: GanttTask[] = [];            // viene del backend
  start = new Date(2026, 9, 5);
  end = new Date(2026, 9, 16);
  today = new Date();
  zoom: GanttZoom = 'day';
  verOperaciones = true;
  abrirDetalle(t: GanttTask) { /* navegar a la tarea */ }
}
```

`gantt.demo-data.ts` contiene los datos de OT-2026-0147 tal como están en Figma. Es solo para demos y tests; no lo incluyas en el bundle de producción.

## API

### Inputs

| Input | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `tasks` | `GanttTask[]` | `[]` | Tareas y operaciones en el orden en que se muestran. Las operaciones van justo después de su tarea. |
| `start` / `end` | `Date` | obligatorios | Primer y último día visibles (ambos incluidos). |
| `today` | `Date` | `new Date()` | Instante de la línea roja "Hoy HH:mm". Si cae fuera del rango no se dibuja. |
| `nonWorkingWeekdays` | `number[]` | `[0]` | Días no laborables (0 = domingo). Se sombrean y no cuentan en la desviación. |
| `zoom` | `'day' \| 'compact'` | `'day'` | 80 px o 44 px por día. Soporta `[(zoom)]`. |
| `showOperations` | `boolean` | `true` | Oculta las filas de tipo `operation`. |
| `locale` | `string` | `'es-ES'` | Nombres de día y formato de números (`0,5`). |
| `labels` | `Partial<GanttLabels>` | español | Textos de cabeceras, estados, leyenda y tooltip. |
| `maxHeight` | `number` | `640` | Alto máximo en px del área con scroll. |

### Outputs

| Output | Valor | Cuándo |
|---|---|---|
| `taskClick` | `GanttTask` | Clic, Enter o Espacio sobre la barra principal de una fila. |
| `zoomChange` | `GanttZoom` | El usuario cambia Día / Compacto. |

### Método público

`scrollToToday()` centra la línea "Hoy". Está enlazado al botón "Ir a hoy"; úsalo vía `@ViewChild(MedusaGanttComponent)` si quieres llamarlo al cargar.

### Contenido proyectado

`<ng-content select="[mgToolbar]">` añade controles a la barra superior (por ejemplo, el interruptor "Mostrar operaciones").

## Modelo (`GanttTask`)

| Campo | Obligatorio | Notas |
|---|---|---|
| `id`, `name`, `type` | sí | `type`: `task` (fila principal) o `operation` (fila hija con sangría). |
| `status` | sí | `finished`, `running`, `notStarted`. |
| `planned` | sí | Línea base: barra discontinua pequeña sobre la barra principal. |
| `actual` | no | Ejecución real. Barra principal de `finished`; relleno de avance en `running`. |
| `forecast` | no | Previsión. Si termina después de `planned.end`, la barra pasa a ámbar y se muestra la desviación. |
| `progress` | no | 0-100. Etiqueta dentro de la barra de las tareas. |
| `team` | no | Columna Equipo (solo tareas). |
| `critical`, `warning` | no | Etiqueta "Crítica" / icono de aviso. |
| `note` | no | Texto tras la desviación, p. ej. `sin capacidad hasta el 10/10`. |
| `dependsOn` | no | ids de las tareas predecesoras. Dibuja una flecha fin → inicio. Los ids que no existen (o están ocultos) se ignoran. |

**Qué barra se pinta según el estado**

| Estado | Barra principal |
|---|---|
| `finished` | `actual` (o `planned` si no hay) en verde |
| `running` | `forecast` (o `actual`/`planned`) en azul claro, con el tramo `actual` en azul sólido |
| `notStarted` con `forecast` que retrasa | `forecast` en ámbar discontinuo |
| `notStarted` sin retraso | `planned` en gris |

**Desviación**: diferencia entre `forecast.end` y `planned.end` en **días laborables**, redondeada a medios días (`+3 d`, `+0,5 d`). Es lo que muestra el diseño, que no cuenta el domingo.

## Estilo y tema

Todos los colores y medidas salen de variables `--mg-*` definidas en `:host`. Cada una apunta a su equivalente de Bootstrap 5.2 con un valor por defecto, por ejemplo `--mg-finished: var(--bs-success, #2a7a4b)`.

Para ajustarlo a los tokens de Medusa 7, redefine las variables en un ancestro (no hace falta tocar el SCSS del componente):

```scss
medusa-gantt {
  --mg-finished: var(--medusa-success);
  --mg-running: var(--medusa-primary);
  --mg-line: var(--medusa-border);
}
```

Hay valores por defecto en hexadecimal que **no tienen equivalente directo en Bootstrap** (`--mg-nonwork`, `--mg-running-soft`, `--mg-delay-*`, `--mg-crit-*`, `--mg-dep`, `--mg-idle`). Hay que sustituirlos por los tokens equivalentes de Medusa 7. Los valores actuales son los colores de la captura de Figma; los tokens reales de Medusa 7 no se han podido consultar.

El tema oscuro no está definido: si la aplicación lo tiene, basta con redefinir las mismas variables bajo su selector de tema.

## Cómo funciona el layout

- `gantt-layout.ts` contiene funciones puras (fechas → píxeles, desviación, flechas). No toca el DOM y es lo que cubre `gantt-layout.spec.ts`.
- Las filas miden **48 px** y la cabecera **52 px**; las columnas fijas, **276 + 150 px**. Los valores están en `gantt-layout.ts` (`GANTT_*`) y en el SCSS. Si se cambian, hay que cambiarlos en los dos sitios porque las flechas SVG y la línea "Hoy" se posicionan con ellos.
- Las columnas Tarea y Equipo/Estado son `position: sticky`, y la cabecera también, dentro de un único contenedor con scroll.
- El tooltip es propio (`position: fixed`, sin Bootstrap JS ni `ng-bootstrap`). Aparece con hover y con foco de teclado.

## Accesibilidad

- Las barras principales son `role="button"` con `tabindex="0"` y `aria-label` con el mismo texto del tooltip. Enter y Espacio emiten `taskClick`.
- El área con scroll es focusable y tiene `role="region"`.
- Las flechas de dependencia son decorativas (`aria-hidden`); la relación no se anuncia a lectores de pantalla.

## Limitaciones conocidas

- Sin arrastrar ni redimensionar barras: es una vista de solo lectura.
- No hay escala semanal ni mensual; solo `day` y `compact`.
- Las flechas se recalculan al cambiar `tasks`, `zoom` o `showOperations`, pero no si el contenedor cambia de tamaño (el ancho del timeline es fijo según el zoom).
- Si una tarea no tiene `forecast` ni `actual` se dibuja en `planned`, sin avisar.
- Sin virtualización: pensado para decenas de filas, no miles.
