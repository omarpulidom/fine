# 🔄 Flujos de Usuario - Fine App

> Diagramas de flujo para las acciones principales del usuario

---

## 1. Crear Transacción

```
┌─────────────────────────────────────────────────────────────┐
│                    CREAR TRANSACCIÓN                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Usuario abre modal     │
              │  "Nueva transacción"    │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Selecciona tipo:       │
              │  • Ingreso              │
              │  • Gasto                │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Ingresa monto          │
              │  (teclado numérico)     │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Selecciona categoría   │
              │  (filtrada por tipo)    │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Ingresa descripción    │
              │  (requerido)            │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Fecha (default: hoy)   │
              │  Notas (opcional)       │
              │  Tags (opcional)        │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Toca "Guardar"         │
              └─────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │            SISTEMA                    │
        │  1. Valida campos requeridos          │
        │  2. Crea Transaction                  │
        │  3. Actualiza store                   │
        │  4. Persiste en MMKV                  │
        │  5. Recalcula balance                 │
        └───────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  ✅ Feedback visual     │
              │  "Transacción guardada" │
              │  Cierra modal           │
              └─────────────────────────┘
```

---

## 2. Pagar Deuda

```
┌─────────────────────────────────────────────────────────────┐
│                      PAGAR DEUDA                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Usuario ve lista de    │
              │  deudas activas         │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Toca una deuda         │
              │  (ve detalle)           │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Toca "Registrar Pago"  │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Ingresa monto          │
              │  (sugerido: pago mín)   │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Fecha (default: hoy)   │
              │  Notas (opcional)       │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Toca "Confirmar Pago"  │
              └─────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │            SISTEMA                    │
        │  1. Crea DebtPayment                  │
        │  2. Actualiza Debt.currentBalance     │
        │  3. Crea Transaction vinculada        │
        │  4. Si balance = 0:                   │
        │     - Debt.isActive = false           │
        │     - Debt.paidAt = now               │
        │  5. Persiste cambios                  │
        └───────────────────────────────────────┘
                            │
                    ┌───────┴───────┐
                    │               │
                    ▼               ▼
        ┌───────────────┐   ┌───────────────────┐
        │ Balance > 0   │   │ Balance = 0       │
        │ "Pago         │   │ "¡Felicidades!    │
        │ registrado"   │   │ Deuda liquidada"  │
        │               │   │ 🎉 Confetti       │
        └───────────────┘   └───────────────────┘
```

---

## 3. Contribuir a Meta de Ahorro

```
┌─────────────────────────────────────────────────────────────┐
│                  CONTRIBUIR A AHORRO                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Usuario ve lista de    │
              │  metas de ahorro        │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Toca una meta          │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Ve progreso y detalles │
              │  Toca "Agregar Fondos"  │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Ingresa monto          │
              │  (muestra cuánto falta) │
              └─────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │            SISTEMA                    │
        │  1. Crea SavingsContribution          │
        │  2. Suma a Goal.currentAmount         │
        │  3. Crea Transaction (expense)        │
        │  4. Si currentAmount >= target:       │
        │     - Goal.isCompleted = true         │
        │     - Goal.completedAt = now          │
        │  5. Persiste cambios                  │
        └───────────────────────────────────────┘
                            │
                    ┌───────┴───────┐
                    │               │
                    ▼               ▼
        ┌───────────────┐   ┌───────────────────┐
        │ No completa   │   │ Meta alcanzada    │
        │ "Ahorro       │   │ "¡Meta cumplida!" │
        │ agregado"     │   │ 🎉 Celebración    │
        │ Muestra %     │   │ "¿Retirar o       │
        │               │   │ seguir ahorrando?"|
        └───────────────┘   └───────────────────┘
```

---

## 4. Completar Pago Programado (Recordatorio)

```
┌─────────────────────────────────────────────────────────────┐
│               COMPLETAR PAGO PROGRAMADO                     │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌───────────────────┐               ┌───────────────────┐
│ DESDE CALENDARIO  │               │ DESDE ALERTA      │
│ Usuario ve día    │               │ Usuario ve        │
│ con pagos         │               │ notificación      │
│ marcados          │               │ de recordatorio   │
└───────────────────┘               └───────────────────┘
        │                                       │
        └───────────────────┬───────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Ve detalle del pago    │
              │  • Nombre               │
              │  • Monto sugerido       │
              │  • Fecha de vencimiento │
              │  • Tipo (pago/cobro)    │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Opciones:              │
              │  • "Marcar como         │
              │    pagado/cobrado"      │
              │  • "Editar monto"       │
              │  • "Posponer"           │
              │  • "Saltar"             │
              └─────────────────────────┘
                            │
                ┌───────────┼───────────┐
                │           │           │
                ▼           ▼           ▼
        ┌───────────┐ ┌───────────┐ ┌───────────┐
        │ MARCAR    │ │ EDITAR    │ │ POSPONER  │
        │ PAGADO    │ │ MONTO     │ │           │
        └───────────┘ └───────────┘ └───────────┘
                │           │           │
                │           │           │
                ▼           │           ▼
        ┌───────────────────────┐   ┌───────────────┐
        │ Ingresa monto real    │   │ Selecciona    │
        │ (puede diferir del    │   │ nueva fecha   │
        │ programado)           │   │               │
        └───────────────────────┘   └───────────────┘
                │                           │
                ▼                           ▼
        ┌───────────────────────────────────────┐
        │            SISTEMA                    │
        │  Si "Marcar pagado":                  │
        │  1. Crea Transaction                  │
        │  2. Si recurrente:                    │
        │     - Calcula nextDueDate             │
        │     - Actualiza ScheduledPayment      │
        │  3. Si único:                         │
        │     - isActive = false                │
        │  4. lastCompletedDate = now           │
        │                                       │
        │  Si "Posponer":                       │
        │  1. Actualiza nextDueDate             │
        │  2. No crea Transaction               │
        └───────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  ✅ Actualiza calendario│
              │  Muestra siguiente pago │
              │  (si es recurrente)     │
              └─────────────────────────┘
```

---

## 5. Crear Presupuesto

```
┌─────────────────────────────────────────────────────────────┐
│                    CREAR PRESUPUESTO                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Usuario abre sección   │
              │  de presupuestos        │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Toca "Nuevo            │
              │  presupuesto"           │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Selecciona categoría   │
              │  (solo tipo "expense")  │
              │  O crea una nueva       │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Ingresa nombre         │
              │  "Comida de enero"      │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Ingresa límite         │
              │  $5,000                 │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Selecciona período:    │
              │  • Semanal              │
              │  • Quincenal            │
              │  • Mensual              │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Configura alerta:      │
              │  "Avisar al 80%"        │
              │  (slider 50%-100%)      │
              └─────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │            SISTEMA                    │
        │  1. Valida que no exista presupuesto  │
        │     activo para esa categoría         │
        │  2. Crea Budget                       │
        │  3. startDate = inicio del período    │
        │  4. Persiste en MMKV                  │
        └───────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  ✅ Presupuesto creado  │
              │  Muestra gasto actual   │
              │  de esa categoría       │
              └─────────────────────────┘
```

---

## 6. Crear Préstamo (Lo que te deben)

```
┌─────────────────────────────────────────────────────────────┐
│                    REGISTRAR PRÉSTAMO                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Sección Deudas/        │
              │  Préstamos              │
              │  Tab: "Préstamos"       │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Toca "Registrar        │
              │  préstamo"              │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Selecciona tipo:       │
              │  • Personal             │
              │  • Negocio              │
              │  • Familiar/Amigo       │
              │  • Otro                 │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Ingresa nombre de      │
              │  quién te debe          │
              │  "Juan Pérez"           │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Monto total prestado   │
              │  $5,000                 │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Opcionales:            │
              │  • Día de cobro (1-31)  │
              │  • Tasa de interés %    │
              │  • Pago esperado        │
              │  • Fecha esperada fin   │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  ¿Crear recordatorio    │
              │  de cobro?              │
              │  [Sí] [No]              │
              └─────────────────────────┘
                    │           │
                    ▼           │
            ┌───────────────┐   │
            │ Crea          │   │
            │ ScheduledPay  │   │
            │ (incoming)    │   │
            │ vinculado     │   │
            └───────────────┘   │
                    │           │
                    └─────┬─────┘
                          │
                          ▼
              ┌─────────────────────────┐
              │  ¿Registrar como        │
              │  transacción?           │
              │  [Sí] [No]              │
              └─────────────────────────┘
                    │           │
                    ▼           ▼
            ┌───────────┐ ┌───────────────┐
            │ Sí: Crea  │ │ No: Solo      │
            │ Transaction│ │ registra Loan │
            │ (expense) │ │ sin afectar   │
            │ + Loan    │ │ balance       │
            └───────────┘ └───────────────┘
                    │           │
                    └─────┬─────┘
                          │
                          ▼
        ┌───────────────────────────────────────┐
        │            SISTEMA                    │
        │  1. Crea Loan                         │
        │  2. Si recordatorio:                  │
        │     - Crea ScheduledPayment           │
        │     - paymentType = "incoming"        │
        │     - Vincula con loanId              │
        │  3. Si transacción:                   │
        │     - Crea Transaction (expense)      │
        │  4. Persiste en MMKV                  │
        └───────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  ✅ Préstamo registrado │
              │  Aparece en lista       │
              │  "Te deben: $X"         │
              │  Calendario si tiene    │
              │  recordatorio           │
              └─────────────────────────┘
```

---

**Nota:** Los préstamos ahora funcionan igual que las deudas pero en dirección inversa. Se pueden recibir pagos en cualquier momento sin necesidad de recordatorio.

---

## 7. Flujo de Onboarding (Primera Vez)

```
┌─────────────────────────────────────────────────────────────┐
│                      ONBOARDING                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Pantalla de bienvenida │
              │  "Bienvenido a Fine"    │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  PASO 1: Moneda         │
              │  "¿Cuál es tu moneda?"  │
              │  [MXN] [USD]            │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  PASO 2: Balance        │
              │  "¿Con cuánto inicias?" │
              │  (opcional, default: 0) │
              └─────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │            SISTEMA                    │
        │  1. Crea Wallet con moneda            │
        │  2. Carga categorías default          │
        │  3. Si balance > 0:                   │
        │     - Crea Transaction inicial        │
        │       tipo "income"                   │
        │       categoría "Saldo inicial"       │
        │  4. Persiste estado                   │
        │  5. Marca onboarding completo         │
        └───────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  ✅ "¡Listo!"           │
              │  "Empieza a registrar   │
              │  tus finanzas"          │
              │  [Ir al inicio]         │
              └─────────────────────────┘
```

---

## 8. Crear Deuda

```
┌─────────────────────────────────────────────────────────────┐
│                    REGISTRAR DEUDA                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Sección Deudas/        │
              │  Préstamos              │
              │  Tab: "Deudas"          │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Toca "Nueva deuda"     │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Selecciona tipo:       │
              │  • Tarjeta de crédito   │
              │  • Préstamo personal    │
              │  • Hipoteca             │
              │  • Crédito auto         │
              │  • Familiar/Amigo       │
              │  • Otro                 │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Ingresa acreedor       │
              │  "BBVA", "Mamá"         │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Monto total adeudado   │
              │  $15,000                │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Opcionales:            │
              │  • Día de pago (1-31)   │
              │  • Tasa de interés %    │
              │  • Pago mínimo          │
              │  • Fecha esperada fin   │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  ¿Crear recordatorio    │
              │  de pago?               │
              │  [Sí] [No]              │
              └─────────────────────────┘
                    │           │
                    ▼           │
            ┌───────────────┐   │
            │ Crea          │   │
            │ ScheduledPay  │   │
            │ vinculado     │   │
            └───────────────┘   │
                    │           │
                    └─────┬─────┘
                          │
                          ▼
        ┌───────────────────────────────────────┐
        │            SISTEMA                    │
        │  1. Crea Debt                         │
        │  2. Si recordatorio:                  │
        │     - Crea ScheduledPayment           │
        │     - Vincula con debtId              │
        │  3. Persiste en MMKV                  │
        └───────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  ✅ Deuda registrada    │
              │  Muestra en calendario  │
              │  próximo pago           │
              └─────────────────────────┘
```

---

## 9. Editar/Eliminar Transacción

```
┌─────────────────────────────────────────────────────────────┐
│               EDITAR/ELIMINAR TRANSACCIÓN                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Usuario toca           │
              │  transacción en lista   │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Ve detalle completo    │
              │  con opciones:          │
              │  [Editar] [Eliminar]    │
              └─────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
        ┌───────────────┐       ┌───────────────┐
        │    EDITAR     │       │   ELIMINAR    │
        └───────────────┘       └───────────────┘
                │                       │
                ▼                       ▼
        ┌───────────────┐       ┌───────────────────┐
        │ Abre modal    │       │ Confirmación:     │
        │ con datos     │       │ "¿Eliminar esta   │
        │ precargados   │       │ transacción?"     │
        │               │       │ [Cancelar][Sí]    │
        └───────────────┘       └───────────────────┘
                │                       │
                ▼                       ▼
        ┌───────────────┐       ┌───────────────────┐
        │ Usuario       │       │ Si vinculada:     │
        │ modifica      │       │ "También afectará │
        │ y guarda      │       │ [deuda/ahorro]"   │
        └───────────────┘       └───────────────────┘
                │                       │
                ▼                       ▼
        ┌───────────────────────────────────────┐
        │            SISTEMA                    │
        │  EDITAR:                              │
        │  1. Valida cambios                    │
        │  2. Actualiza Transaction             │
        │  3. Recalcula balance                 │
        │                                       │
        │  ELIMINAR:                            │
        │  1. Elimina Transaction               │
        │  2. Si vinculada a pago:              │
        │     - Revierte cambios en entidad     │
        │  3. Recalcula balance                 │
        └───────────────────────────────────────┘
```

---

## Resumen de Entidades Creadas por Flujo

| Flujo                     | Entidades Modificadas                         |
| ------------------------- | --------------------------------------------- |
| Crear Transacción         | Transaction                                   |
| Pagar Deuda               | DebtPayment, Debt, Transaction                |
| Contribuir Ahorro         | SavingsContribution, SavingsGoal, Transaction |
| Completar Pago Programado | ScheduledPayment, Transaction                 |
| Crear Presupuesto         | Budget                                        |
| Registrar Préstamo        | Loan, (Transaction opcional)                  |
| Registrar Deuda           | Debt, (ScheduledPayment opcional)             |
| Onboarding                | Wallet, Categories[], (Transaction opcional)  |
| Editar Transacción        | Transaction                                   |
| Eliminar Transacción      | Transaction, (entidades vinculadas)           |

---

## Matriz de Permisos por Entidad

| Entidad          | Crear       | Editar           | Eliminar     | Notas                     |
| ---------------- | ----------- | ---------------- | ------------ | ------------------------- |
| Wallet           | ✅ (solo 1) | ✅ nombre/moneda | ❌           | Solo en onboarding        |
| Transaction      | ✅          | ✅               | ✅           | Puede revertir efectos    |
| Category         | ✅ custom   | ✅               | ⚠️ soft      | isActive=false            |
| Budget           | ✅          | ✅               | ✅           | Historial se pierde       |
| SavingsGoal      | ✅          | ✅               | ⚠️ confirmar | Retirar fondos primero    |
| Debt             | ✅          | ✅               | ⚠️ confirmar | Marcar como pagada mejor  |
| Loan             | ✅          | ✅               | ⚠️ confirmar | Marcar como cobrado mejor |
| ScheduledPayment | ✅          | ✅               | ✅           | Puede desactivar          |
