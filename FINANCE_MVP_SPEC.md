# Especificación funcional — MVP de finanzas personales

> Documento para implementar con Codex. Estado: propuesta de MVP; las decisiones indicadas como **pendientes** no deben tratarse como requisitos confirmados.

## 1. Objetivo del producto

Construir una aplicación móvil para visualizar **la liquidez futura por día**, a partir de los **saldos actuales** y de **movimientos existentes o explícitamente programados**. La pregunta principal que debe responder es: **«¿Cuánto dinero tendré disponible en una fecha específica?»**.

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
5. **Gráfica interactiva de liquidez**: navegar por días y consultar el saldo proyectado de cada fecha; horizontes sugeridos de 7, 30, 60 y 90 días.
6. **Historial de movimientos** con capacidad de editar o corregir registros.
7. **Simulación de compra hipotética**: comparar la liquidez base con un escenario temporal sin guardar la compra como movimiento real.
8. **Compras a meses sin intereses (MSI)**: distribuir una compra de crédito entre ciclos confirmados sin duplicar la deuda ni los pagos.
9. **Estadísticas sencillas**: ingresos, gastos y diferencia neta de movimientos realizados, por mes y con totales claros.

### Posibles funciones posteriores, no bloqueantes para el MVP

- Presupuestos, metas de ahorro, préstamos y estadísticas avanzadas por categorías.
- Backend, sincronización bancaria, OCR y autenticación.

**Fuera de alcance:** pronósticos de hábitos y cualquier análisis con IA.

## 3. Pantalla principal

La gráfica de liquidez es el componente central:

- Mostrar saldo disponible de hoy.
- Curva de saldo proyectado por día.
- En la proyección, tres trazos desde el saldo de hoy: saldo total en negro, saldo más ingresos acumulados en gris claro y saldo menos gastos acumulados en gris más oscuro. Los gastos incluyen pagos de tarjeta programados explícitamente. Mostrar los importes acumulados al elegir una fecha.
- Permitir tocar/arrastrar sobre la curva para consultar **fecha + saldo**.
- Mostrar cambios únicamente en días con movimientos previstos; una línea horizontal en periodos sin eventos.
- Distinguir tramo histórico/actual y tramo proyectado.
- Mostrar próximos ingresos, gastos y pagos programados.
- Acceso inmediato a **Añadir movimiento**.
- Debajo de la gráfica, un módulo de dos columnas de igual ancho con separación: a la izquierda cuatro accesos circulares pequeños sin texto visible (simular compra, estadísticas, historial y registrar movimiento); a la derecha una tarjeta principal negra con la liquidez total y una lengüeta sobre las tarjetas decorativas. Los accesos deben tener etiquetas de accesibilidad.
- Al tocar la tarjeta principal, desplegar hacia arriba y en una sola columna las cuentas de efectivo/banco y tarjetas de crédito, con iconos genéricos. Cada elemento abre su pantalla de gestión enfocada; las tarjetas de crédito muestran su deuda por separado y no se suman a la liquidez.

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

Campos sugeridos:

- Nombre identificador.
- Institución/emisor (opcional).
- Límite de crédito (opcional para calcular liquidez).
- Día habitual de corte.
- Fecha límite de pago / regla de calendario (con posibilidad de **corrección manual** por ciclo).
- Cuenta bancaria desde la que se prevé pagar.
- Saldo total de deuda actual.
- **Saldo facturado pendiente** del último estado de cuenta y su fecha límite.
- Compras posteriores al último corte aún no facturadas, cuando proceda.

**Importante:** no asumir que «deuda actual», «saldo al corte», «pago mínimo» y «pago para no generar intereses» son equivalentes.

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
- **Pago para no generar intereses (PPNGI)**, si se conoce.
- **Pago mínimo**, si se conoce (informativo).
- **Monto programado a pagar** y **fecha programada**.
- **Pagos realizados**, que reducen el saldo pendiente de la obligación.

La gráfica utiliza el **monto y la fecha del pago programado**. Cuando hay pago real, este afecta el saldo disponible y reduce/reemplaza la obligación pendiente para impedir doble descuento.

No modelar automáticamente intereses, comisiones o cargos por mora en el MVP: introducirlos solo como movimientos registrados cuando sean conocidos.

### 5.5 Deuda existente al incorporar la tarjeta

Para inicializar una tarjeta ya utilizada, pedir al menos:

1. Deuda pendiente actual.
2. Importe facturado pendiente (del corte previo).
3. Fecha límite correspondiente.
4. Importe no facturado incluido en la deuda actual, si existe.

Comprobar que los importes sean coherentes y **no duplicar** saldos históricos con compras nuevas. Si faltan datos, permitir introducir una obligación inicial editable sin inventar una distribución por ciclos.

### 5.6 Estrategia de pago predeterminada — decisión pendiente

Se discutieron dos alternativas:

- **A. Automática (propuesta)**: sugerir pagar el saldo facturado completo en la fecha límite de cada ciclo; permitir modificar monto y fecha por ciclo.
- **B. Manual**: proyectar pagos únicamente cuando el usuario los programe expresamente.

**No dar por decidida A o B todavía.** Diseñar el motor para aceptar pagos programados explícitos; implementar la política predeterminada una vez confirmada. Si se usa A, no confundir saldo facturado con PPNGI en presencia de MSI u otros productos.

### 5.7 MSI — parte del MVP

Una compra de $6,000 a 6 MSI debe registrar deuda de $6,000, pero distribuir en los ciclos correspondientes seis mensualidades de $1,000 (salvo diferencias por redondeo o condiciones de la institución). La liquidez disminuye únicamente en las fechas de pago programadas de los estados de cuenta. No asumir de manera universal cuándo comienza a facturarse la primera mensualidad.

Al registrar una compra MSI, pedir **número de mensualidades** y **primer ciclo de facturación**. Generar las mensualidades solo en ciclos que el usuario haya configurado o confirmado; si falta un ciclo, solicitar sus fechas antes de proyectar el pago. La suma exacta de las mensualidades debe coincidir con el precio total, incluyendo el ajuste de centavos por redondeo.

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
- Crear y ajustar cuentas, saldo inicial y tarjetas.
- Editar corte, vencimientos y pagos previstos.
- Registrar una compra MSI y revisar sus cuotas por ciclo.

**Simulador**
- Capturar compra hipotética y comparar liquidez base frente a escenario.
- Descartar el escenario sin modificar datos reales.

**Estadísticas**
- Resumen mensual simple de ingresos, gastos, diferencia neta y pagos de tarjeta realizados.

## 9. Criterios de aceptación

- [ ] Si no hay movimientos programados, la proyección futura permanece constante.
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

Preferir operaciones reproducibles; la interfaz no debe recalcular por su cuenta reglas monetarias. **No añadir ni ejecutar tests en esta etapa**, según la preferencia actual del usuario.

## 11. Instrucciones para Codex

1. Primero inspecciona la estructura del repositorio y sus convenciones.
2. Usa este documento como **especificación funcional**, no como autorización para rehacer arquitectura existente.
3. Mantén pendiente la política automática/manual de pagos; **MSI, simulador y estadísticas sencillas sí forman parte del MVP**.
4. Implementa por partes: datos y reglas → proyección → tarjetas y MSI → simulador → estadísticas → UI.
5. No agregues pronósticos de hábitos, análisis con IA ni sincronización bancaria.
