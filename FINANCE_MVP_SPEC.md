# Especificación funcional — MVP de finanzas personales

> Documento para implementar con Codex. Estado: propuesta de MVP; las decisiones indicadas como **pendientes** no deben tratarse como requisitos confirmados.

## 1. Objetivo del producto

Construir una aplicación móvil para visualizar **la liquidez futura por día**, a partir de los **saldos actuales**, movimientos programados y obligaciones conocidas de tarjetas configuradas. La pregunta principal que debe responder es: **«¿Cuánto dinero tendré disponible en una fecha específica?»**.

La app no busca predecir hábitos ni estimar consumos futuros. Es una proyección determinista de los movimientos conocidos.

### Reglas innegociables

- **No** agregar un gasto diario estimado.
- **No** inventar ingresos, gastos ni movimientos futuros no programados.
- La proyección solo cambia cuando existen movimientos efectivos o programados para esas fechas.
- Diferenciar **compra a crédito**, **deuda**, **pago programado** y **pago efectivamente realizado** para no duplicar descuentos.
- El registro de movimientos debe ser rápido y simple.

## 2. Alcance del MVP

### Funcionalidades principales

1. **Cuentas y saldos actuales**: efectivo, cuentas bancarias/débito y tarjetas de crédito.
2. **Registro rápido de ingresos y gastos**: monto, fecha, cuenta/medio de pago y concepto opcional.
3. **Movimientos programados**: únicos o recurrentes (por ejemplo, nómina, suscripciones, servicios).
4. **Tarjetas de crédito**: corte, fecha límite, saldo facturado/deuda actual, compras y pagos.
5. **Gráfica interactiva de liquidez**: navegar por días y consultar el saldo proyectado de cada fecha; horizontes de 30, 60, 90 y 180 días.
6. **Historial de movimientos** con capacidad de editar o corregir registros.
7. **Simulación de compra hipotética**: comparar la liquidez base con un escenario temporal sin guardar la compra como movimiento real.
8. **Compras a meses sin intereses (MSI)**: distribuir una compra de crédito entre ciclos confirmados sin duplicar la deuda ni los pagos.
9. **Estadísticas sencillas**: ingresos, gastos y diferencia neta de movimientos realizados, por mes y con totales claros.

Las cuentas se crean en dos pasos: nombre y saldo, seguido de un carrusel con diseños de débito BBVA, Nu y Plata, además de «Otro banco» y «Efectivo». La selección determina si la cuenta es bancaria o efectivo y, cuando hay imagen, aparece en la cartera de Inicio.

Permitir eliminar cuentas y tarjetas con confirmación. Una cuenta con movimientos realizados o programados, o usada por pagos de tarjeta, debe desvincularse antes; una tarjeta con compras o pagos registrados debe vaciar su actividad antes. Al eliminar una tarjeta sin actividad, se eliminan también sus ciclos. No se dejan referencias huérfanas en el historial.

### Posibles funciones posteriores, no bloqueantes para el MVP

- Presupuestos, metas de ahorro, préstamos y estadísticas avanzadas por categorías.
- Backend, sincronización bancaria, OCR y autenticación.

**Fuera de alcance:** pronósticos de hábitos y cualquier análisis con IA.

## 3. Pantalla principal

La gráfica de liquidez es el componente central:

- Mostrar saldo disponible de hoy.
- Curva de saldo proyectado por día.
- En la proyección, tres trazos desde el saldo de hoy: saldo total en negro, saldo más ingresos acumulados en gris claro y saldo menos gastos acumulados en gris más oscuro. Los gastos incluyen pagos de tarjeta previstos por el calendario o programados manualmente. Un badge compacto muestra solo los ingresos y gastos no nulos del día elegido.
- Permitir tocar/arrastrar sobre la curva para consultar **fecha + saldo**. Un arrastre iniciado en el área de la gráfica selecciona fechas sin mover el carrusel; fuera de la gráfica se puede deslizar entre sus páginas, y el desplazamiento vertical de la pantalla sigue disponible.
- Mostrar cambios únicamente en días con movimientos previstos; una línea horizontal en periodos sin eventos.
- Distinguir tramo histórico/actual y tramo proyectado. El ancho del tramo histórico crece con los días disponibles hasta un límite; con poco historial, la gráfica comienza cerca del borde izquierdo.
- Mostrar los próximos ingresos, gastos y pagos de tarjeta previstos en tarjetas compactas dentro de un carrusel horizontal, ordenadas por fecha. Los filtros permiten combinar ingresos o gastos con las frecuencias «Único», «Semanal», «Quincenal» y «Mensual»; «Todos» deselecciona los demás y queda como único filtro activo. Cada tarjeta separa el signo del importe, muestra la frecuencia y permite eliminar con una X. En recurrencias, elegir entre omitir solo esa ocurrencia, sin afectar el saldo, o eliminar toda la programación; la proyección y la lista respetan la decisión. La tarjeta final «Ver todos» abre una pantalla propia con la lista cronológica vertical, los mismos filtros y acciones para editar, marcar o eliminar movimientos.
- Acceso inmediato a **Añadir movimiento**.
- Debajo de la fecha y el saldo principal, mostrar un carrusel horizontal de altura compartida que se ajusta al ancho de la cartera: primera página con la gráfica, leyenda y selector de periodos; segunda página con la cartera y los accesos. La fecha y el saldo principal permanecen fuera del carrusel, y la lista inferior no cambia de posición al deslizar. Al mostrar la cartera, la fecha seleccionada vuelve a hoy.
- En la segunda página, la cartera negra ocupa todo el ancho disponible y mantiene un perfil bajo, con la liquidez total y una lengüeta sobre hasta tres tarjetas reales. Una tarjeta queda arriba; dos conservan la separación actual; tres usan una separación menor para caber detrás de la lengüeta. Debajo hay cinco accesos circulares pequeños sin texto visible, alineados a la izquierda en una fila: simular compra, estadísticas, historial, cuentas y tarjetas, y registrar movimiento. Los accesos tienen etiquetas de accesibilidad.
- Al tocar la cartera o su lengüeta, mantenerla fija y elevar las tarjetas visibles por detrás de la lengüeta, sin sacarlas por completo ni desplazar el contenido inferior. La lengüeta forma parte de la cartera y nunca abre una cuenta. Cada tarjeta disponible abre su pantalla de detalle enfocada; las tarjetas de crédito muestran su deuda por separado y no se suman a la liquidez. El botón «+» aparece con la animación y abre la pantalla «Agregar» para elegir entre cuenta o tarjeta de crédito. El penúltimo acceso de la fila abre el listado único «Cuentas y tarjetas».
- Debajo del importe de la cartera, mostrar la cantidad real de cuentas y tarjetas en lugar de repetir «Saldo disponible»; si no hay cuentas, mostrar «Añadir primera cuenta».

**Definición de liquidez para esta pantalla:** dinero disponible en efectivo y cuentas bancarias; una deuda con tarjeta **no** disminuye automáticamente esa liquidez hasta el día de su pago proyectado o efectivo.

Es posible agregar más adelante una segunda curva de «saldo neto» (liquidez menos obligaciones), pero **no es necesaria para la primera versión**.

## 4. Motor de proyección determinista

Para cada día `d`:

```text
saldo_proyectado(d) = saldo_disponible_hoy
                    + suma(ingresos futuros hasta d)
                    - suma(gastos pagados desde efectivo/débito hasta d)
                    - suma(pagos de tarjetas programados hasta d)
                    +/- transferencias netas según cuentas incluidas
```

### Comportamiento requerido

- Comenzar desde los **saldos actuales**, no volver a sumar/restar movimientos ya reflejados en ellos.
- Generar ocurrencias futuras a partir de recurrencias explícitamente configuradas.
- No incluir ninguna estimación de consumo diario ni ingresos hipotéticos.
- Un gasto nuevo en efectivo/débito **realizado hoy** actualiza el saldo actual y, por tanto, la proyección futura; no debe descontarse dos veces.
- Un gasto **programado para el futuro** no modifica el saldo actual: se aplica en su fecha.
- Una transferencia entre dos cuentas propias incluidas en la liquidez no altera el total agregado; sí ajusta cada cuenta individual.
- Una compra con tarjeta aumenta la deuda, pero no reduce la liquidez hasta que se pague.
- Los pagos realizados reemplazan o reducen sus obligaciones programadas relacionadas, **sin duplicación**.

### Ejemplo simple

| Fecha | Evento | Liquidez proyectada |
|---|---|---:|
| 11 nov | Saldo disponible actual | $5,000 |
| 12 nov | Pago programado de tarjeta -$2,000 | $3,000 |
| 15 nov | Ingreso programado +$6,000 | $9,000 |
| 20 nov | Suscripción programada -$200 | $8,800 |

> Ejemplos ilustrativos en MXN; no constituyen estimaciones automáticas.

## 5. Tarjetas de crédito

### 5.1 Configuración de una tarjeta

La creación usa dos pasos en el mismo bottom sheet: primero nombre, día de corte en un campo numérico compacto, próxima fecha límite exacta, «Deuda actual», «Deuda del corte anterior» (opcional) y cuenta de pago, organizados en pocas filas; después se elige el banco en un carrusel de diseños locales. «Deuda actual» incluye el saldo pendiente del corte anterior. No se pide la fecha del último corte: se calcula con el día habitual y la próxima fecha límite. El diseño elegido se guarda con la tarjeta y se muestra en la cartera de Inicio. BBVA, Nu y Plata usan imágenes incluidas en la app; «Otro banco» y las tarjetas creadas antes de esta selección conservan el diseño genérico.

Campos sugeridos:

- Nombre identificador.
- Institución/emisor (opcional).
- Límite de crédito (opcional para calcular liquidez).
- Día habitual de corte.
- Próxima fecha límite exacta, usada como ancla para estimar vencimientos mensuales posteriores; cada ciclo permite **corrección manual**.
- Cuenta bancaria desde la que se prevé pagar.
- Saldo total de deuda actual.
- **Saldo facturado pendiente** del último estado de cuenta y su fecha límite.
- Compras posteriores al último corte aún no facturadas, cuando proceda.

**Importante:** no asumir que «deuda actual», «saldo al corte», «pago mínimo» y «pago para no generar intereses» son equivalentes.

El día de corte conserva su valor habitual (1–31). Cuando un mes no tenga ese día, usar su último día disponible solo para ese mes; el siguiente vuelve al día habitual. Se crean 48 ciclos mensuales móviles. Las tarjetas antiguas conservan sus ciclos y pagos; pueden activar el calendario en «Editar» al confirmar la próxima fecha límite. No se convierten automáticamente.

En la pantalla de cada tarjeta se muestra solo una tarjeta resumida del próximo ciclo relevante: el siguiente pago pendiente o, si no lo hay, el siguiente corte. La proyección automática se aplica sin pedir confirmación. Tocar el resumen abre la edición de fecha o importe; desde ahí se puede elegir otro ciclo. No mostrar una lista permanente de los 48 ciclos ni una acción «Confirmar corte».

### 5.2 Registro de compras

Cuando se registra una compra de crédito:

1. Guardar la transacción con tarjeta, importe y fecha.
2. Identificar el ciclo de facturación correspondiente.
3. Aumentar la deuda pendiente (o reducir el crédito disponible si se lleva ese dato).
4. **No** restar la compra de la liquidez bancaria de inmediato.
5. Incorporar el importe al saldo facturado del ciclo cuando corresponda.
6. Actualizar la obligación de pago vinculada al ciclo y la proyección resultante.

Para compras exactamente en la fecha de corte, **no asumir** que su inclusión en ese estado de cuenta es universal: dependerá del registro/posteo bancario. Permitir reasignar el ciclo manualmente.

### 5.3 Ejemplo de fechas de corte y pago

Tarjeta hipotética que corta el **12 de cada mes** y cuyo ciclo de noviembre vence el **2 de diciembre**:

| Compra | Ciclo ilustrativo | Fecha de pago proyectada |
|---|---|---|
| 10 de noviembre | Cierra el 12 de noviembre | 2 de diciembre |
| 13 de noviembre | Cierra el 12 de diciembre | 2 de enero |

Estas fechas son **ejemplos**, no una regla universal: la fecha límite exacta debe configurarse o confirmarse por ciclo.

### 5.4 Pago programado vs. pago real

Cada ciclo debe poder representar:

- **Saldo facturado**.
- **Monto programado a pagar** y **fecha programada**.
- **Pagos realizados**, que reducen el saldo pendiente de la obligación.

El formulario de corte no pide PPNGI ni pago mínimo. Si ya existen en datos guardados, se conservan al editar el ciclo.

La gráfica utiliza el importe pendiente del ciclo en su fecha límite estimada o confirmada cuando está activa la proyección automática. Un pago manual puede sustituirla o desactivarla para ese ciclo. Cuando hay pago real, este afecta el saldo disponible y reduce/reemplaza la obligación pendiente para impedir doble descuento.

No modelar automáticamente intereses, comisiones o cargos por mora en el MVP: introducirlos solo como movimientos registrados cuando sean conocidos.

### 5.5 Deuda existente al incorporar la tarjeta

Para inicializar una tarjeta ya utilizada, pedir al menos:

1. Deuda pendiente actual.
2. Importe facturado pendiente (del corte previo).
3. Fecha límite correspondiente.
4. Importe no facturado incluido en la deuda actual, si existe.

Comprobar que los importes sean coherentes y **no duplicar** saldos históricos con compras nuevas. Si faltan datos, permitir introducir una obligación inicial editable sin inventar una distribución por ciclos.

### 5.6 Estrategia de pago predeterminada

Las tarjetas con calendario automático proyectan el saldo pendiente del último estado de cuenta en la próxima fecha límite exacta. Las compras registradas se proyectan en el ciclo asignado; en MSI se proyecta solo la cuota de cada ciclo. La deuda inicial que exceda el saldo facturado queda sin fecha de pago hasta confirmar un corte posterior. En cada ciclo se puede corregir la fecha, confirmar deuda anterior adicional o elegir un importe y fecha manuales, incluido cero para desactivar la proyección. Los pagos reales reducen el importe todavía proyectado. Los ciclos antiguos conservan su programación manual.

### 5.7 MSI — parte del MVP

Una compra de $6,000 a 6 MSI debe registrar deuda de $6,000, pero distribuir en los ciclos correspondientes seis mensualidades de $1,000 (salvo diferencias por redondeo o condiciones de la institución). La liquidez disminuye únicamente en las fechas de pago programadas de los estados de cuenta. No asumir de manera universal cuándo comienza a facturarse la primera mensualidad.

Al registrar una compra MSI, pedir **número de mensualidades** y **primer ciclo de facturación**. En tarjetas con calendario automático, distribuir en los ciclos generados; el primer ciclo puede corregirse manualmente según el banco. En tarjetas sin calendario, se requieren ciclos configurados. La suma exacta de las mensualidades debe coincidir con el precio total, incluyendo el ajuste de centavos por redondeo.

El plan de MSI se vincula a la compra original y a cada ciclo. Una mensualidad incrementa el importe del ciclo correspondiente; **no** vuelve a aumentar la deuda total de la tarjeta. Los pagos programados o realizados de esos ciclos siguen las reglas de la sección 5.4. Permitir corregir el primer ciclo o el número de meses antes de registrar pagos vinculados.

## 6. Registro rápido de movimientos

### Flujo sugerido

1. Tocar botón `+`.
2. Elegir **Gasto** o **Ingreso**.
3. Indicar importe.
4. Elegir cuenta/medio de pago.
5. Fecha por defecto: hoy.
6. Concepto opcional.
7. Guardar.

Si se usa tarjeta de crédito, mostrar la tarjeta y el ciclo/pago estimado. El usuario no tiene que ingresar por separado el futuro pago de cada compra; se agrupa por ciclo.

Al crear un movimiento para el futuro, ofrecer **único o recurrente**. Mantener la cantidad de campos obligatorios al mínimo.

### 6.1 Simulación de compra hipotética

- Capturar importe, fecha y medio de pago (efectivo/débito o tarjeta); si es tarjeta, permitir simular pago de contado o MSI.
- Mostrar **dos curvas comparables**: liquidez actual y liquidez con la compra hipotética, además de la diferencia en la fecha seleccionada.
- Para efectivo/débito, descontar el importe en la fecha simulada. Para tarjeta, mostrar el aumento de deuda y descontar liquidez únicamente en pagos hipotéticos con fechas e importes explícitos.
- Si se simulan MSI, usar ciclos y fechas confirmados; no inventar vencimientos ni asumir cuándo empieza la primera mensualidad.
- Mantener el escenario solo en memoria. Cerrar o descartar la simulación debe restaurar exactamente la proyección base; no crear transacciones, cuotas ni obligaciones reales.

### 6.2 Estadísticas sencillas

- Mostrar, por mes, **ingresos realizados**, **gastos realizados** y **diferencia neta**. Permitir cambiar de mes.
- Calcular desde movimientos completados y persistidos. Excluir programados, simulaciones, compras de crédito y transferencias internas de los totales de ingresos/gastos líquidos.
- Mostrar pagos de tarjeta realizados por separado para dar contexto, sin sumar compras y pagos como el mismo gasto dos veces.
- Usar resúmenes y una visualización simple; no agregar recomendaciones, predicciones ni análisis con IA.

## 7. Modelo conceptual de datos

Una estructura inicial posible (nombres orientativos):

### `Account`

- `id`
- `name`
- `type`: `cash | bank | credit_card`
- `currentBalance` (para cuentas líquidas)
- `currency`

### `CreditCardDetails`

- `accountId`
- `creditLimit` (opcional)
- `cutoffDay`
- `paymentRule` (regla de fecha límite o fechas confirmadas por ciclo)
- `defaultPaymentAccountId`
- `outstandingDebt`

### `Transaction`

- `id`
- `amount`
- `type`: `income | expense | transfer | credit_purchase | card_payment`
- `accountId`
- `counterpartyAccountId` (si aplica)
- `occurredAt` / `effectiveDate`
- `status`: `scheduled | completed | cancelled`
- `description`
- `billingCycleId` (si aplica)
- `recurrenceId` (si aplica)

### `Recurrence`

- `id`
- `frequency` (semanal, quincenal, mensual, etc.)
- `startDate`
- `endDate` (opcional)
- `template` (datos del movimiento que se genera)

### `BillingCycle`

- `id`
- `creditCardAccountId`
- `periodStart`
- `cutoffDate`
- `dueDate`
- `statementAmount`
- `paymentToAvoidInterest` (opcional)
- `minimumPayment` (opcional)

### `ScheduledCardPayment`

- `id`
- `billingCycleId`
- `sourceAccountId`
- `scheduledDate`
- `scheduledAmount`
- `status`
- `paidAmount`

### `InstallmentPlan` / `Installment`

- `purchaseTransactionId`, `creditCardAccountId`, `totalAmount`, `installmentCount`, `firstBillingCycleId`.
- Cada cuota: `billingCycleId`, `amount` y `installmentNumber`; la suma de cuotas equivale exactamente al importe de la compra.
- Los ciclos contienen la obligación facturada; las cuotas no crean nuevas compras ni vuelven a aumentar la deuda de la tarjeta.

### `SimulationScenario` (solo en memoria)

- Importe, fecha, medio de pago, tarjeta/ciclos si aplica y modalidad de contado o MSI.
- No persistirlo en tablas ni mezclarlo con movimientos o pagos reales.

Las estadísticas se **derivan** de movimientos realizados; no necesitan otra fuente editable de saldos o totales.

**Requisito técnico importante:** evitar mantener múltiples fuentes editables de verdad para el mismo saldo. Definir explícitamente si cada balance se obtiene de movimientos + saldo inicial o si se maneja como saldo actual con reconciliaciones. Guardar los vínculos entre pagos y ciclos, y contemplar pagos parciales/adelantados para evitar duplicaciones.

## 8. Pantallas iniciales

**Inicio**
- Liquidez hoy.
- Gráfica diaria interactiva.
- Fecha seleccionada y saldo correspondiente.
- Próximos movimientos y pagos de tarjeta.
- Acción rápida de registro.

**Movimientos**
- Historial de movimientos.
- Crear, editar y eliminar/cancelar.
- Programación de movimientos recurrentes.

**Configuración de cuentas/tarjetas** (pantallas secundarias)
- «Agregar» muestra las opciones para crear una cuenta o tarjeta de crédito; «Cuentas y tarjetas» es el único listado de instrumentos existentes, con miniatura, nombre, banco y saldo actual o deuda actual, sin número de tarjeta ni vencimiento. Un botón inferior abre «Agregar».
- Al seleccionar un instrumento se abre una pantalla completa de detalle con su imagen, saldo o deuda, acciones y movimientos recientes. Desde el listado, la miniatura crece hasta ocupar la tarjeta del detalle mientras la superficie y el contenido del detalle suben; al cerrar, la tarjeta regresa a su miniatura y la superficie baja. Solo las imágenes de las tarjetas reciben el gesto horizontal, en el orden del listado e incluso entre cuentas y tarjetas; se muestra un borde de la tarjeta anterior o siguiente cuando existe. El saldo, las acciones y la actividad permanecen en su posición: el contenido anterior y el siguiente se superponen y se mezclan simultáneamente según el progreso del gesto, sin mover ni comprimir el bloque y sin dejar un intervalo vacío. El botón de cerrar permanece fijo y el contenido conserva su scroll vertical. La edición y el registro de compras y pagos conservan sus formularios en bottom sheets; ya no hay pantallas separadas con listados de cuentas o tarjetas.
- Crear y ajustar cuentas, saldo inicial y tarjetas.
- Editar corte, vencimientos y pagos previstos.
- Registrar una compra MSI y revisar sus cuotas por ciclo.

**Simulador**
- Capturar compra hipotética y comparar liquidez base frente a escenario.
- Descartar el escenario sin modificar datos reales.

**Estadísticas**
- Resumen mensual simple de ingresos, gastos, diferencia neta y pagos de tarjeta realizados.

## 9. Criterios de aceptación

- [ ] Si no hay movimientos programados ni obligaciones conocidas de tarjetas, la proyección futura permanece constante.
- [ ] Un ingreso futuro aparece en la gráfica desde la fecha programada, no antes.
- [ ] Un gasto futuro de débito aparece desde su fecha programada, no antes.
- [ ] Una compra de crédito no disminuye la liquidez bancaria el día de la compra.
- [ ] Una compra de crédito se asocia al ciclo correspondiente y ajusta su obligación de pago.
- [ ] Compras antes/después del corte pueden asociarse a diferentes ciclos.
- [ ] Un pago de tarjeta proyectado disminuye la liquidez solo en su fecha programada.
- [ ] Marcar un pago como completado no genera un segundo descuento.
- [ ] Los pagos parciales reducen el pendiente sin borrar la deuda remanente.
- [ ] Registrar una cuenta/tarjeta con saldo previo no duplica movimientos históricos.
- [ ] El usuario puede corregir fechas de pago y asignación de ciclos.
- [ ] Las recurrencias solo producen movimientos definidos explícitamente.
- [ ] No existen estimaciones automáticas de gastos diarios ni movimientos inventados.
- [ ] La gráfica permite seleccionar días y consultar el saldo exacto proyectado.
- [ ] Una compra MSI aumenta la deuda total una sola vez y distribuye el importe exacto entre los ciclos confirmados.
- [ ] Las cuotas MSI no disminuyen liquidez antes de sus pagos programados o realizados.
- [ ] Corregir o eliminar una compra MSI ajusta sus cuotas sin dejar obligaciones duplicadas.
- [ ] Simular una compra muestra la diferencia frente a la proyección base sin escribir movimientos ni cambiar saldos.
- [ ] Descartar una simulación recupera la curva base sin cambios.
- [ ] Las estadísticas mensuales usan solo registros realizados y no duplican compras de crédito con sus pagos.
- [ ] No se muestran pronósticos de hábitos ni análisis con IA.

## 10. Orientación de implementación

Se había planteado un stack local-first de **React Native + Expo + TypeScript + SQLite**, pero no es un requisito cerrado ni debe imponerse si el proyecto ya cuenta con una arquitectura. Reutilizar la tecnología existente.

Separar al menos:

1. Persistencia de cuentas/movimientos/ciclos.
2. Cálculo de recurrencias y calendario de pagos.
3. Motor puro de proyección por días.
4. Distribución determinista de MSI por ciclos confirmados.
5. Simulación efímera calculada sobre una copia del estado, sin persistencia.
6. Agregaciones mensuales simples desde movimientos realizados.
7. Interfaz de captura, gráfica, simulador y estadísticas.

Los formularios y paneles deslizables desde la parte inferior deben usar **`@gorhom/bottom-sheet`**, reutilizando el proveedor ya instalado en la app. Los diálogos breves de confirmación pueden seguir usando alertas nativas.
Los bottom sheets se ajustan al contenido de cada estado, con un máximo de pantalla y desplazamiento cuando el formulario lo requiere; no reservan alturas porcentuales fijas para estados cortos.
Las fechas almacenadas como `AAAA-MM-DD` se muestran en listas y resúmenes como `5 NOV 2026`; el formato de almacenamiento no se expone al usuario.

Preferir operaciones reproducibles; la interfaz no debe recalcular por su cuenta reglas monetarias. **No añadir ni ejecutar tests en esta etapa**, según la preferencia actual del usuario.

## 11. Instrucciones para Codex

1. Primero inspecciona la estructura del repositorio y sus convenciones.
2. Usa este documento como **especificación funcional**, no como autorización para rehacer arquitectura existente.
3. Aplica la política de pagos automáticos y corrección por ciclo de la sección 5.6; **MSI, simulador y estadísticas sencillas sí forman parte del MVP**.
4. Implementa por partes: datos y reglas → proyección → tarjetas y MSI → simulador → estadísticas → UI.
5. No agregues pronósticos de hábitos, análisis con IA ni sincronización bancaria.
