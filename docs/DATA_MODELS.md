# 📊 Modelos de Datos - Fine App

> App de finanzas personales con almacenamiento 100% local (MMKV + Zustand)

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                      WALLET (única)                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ balance: number (calculado de transacciones)        │   │
│  │ currency: "MXN"                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│    ┌──────────────────────┼──────────────────────┐         │
│    ▼                      ▼                      ▼         │
│ TRANSACTIONS          BUDGETS              SAVINGS_GOALS   │
│    │                      │                      │         │
│    │                      │                      │         │
│    ▼                      ▼                      ▼         │
│ CATEGORIES         BUDGET_HISTORY      SAVINGS_CONTRIBUTIONS│
│                                                             │
│    ┌──────────────────────┬──────────────────────┐         │
│    ▼                      ▼                      ▼         │
│  DEBTS                 LOANS            SCHEDULED_PAYMENTS  │
│    │                      │                (recordatorios)  │
│    ▼                      ▼                                 │
│ DEBT_PAYMENTS       LOAN_PAYMENTS                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏦 Wallet (Billetera Única)

La app usa una billetera simplificada. El balance se calcula dinámicamente.

```typescript
interface Wallet {
  id: string; // UUID único
  userId: string; // Referencia al usuario local
  name: string; // "Mi Billetera" (default)
  currency: Currency; // "MXN" por defecto
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

type Currency = "MXN" | "USD"; // Extensible en el futuro
```

**Notas:**

- El `balance` NO se almacena, se calcula: `Σ ingresos - Σ gastos`
- Solo existe UNA wallet por usuario

---

## 💸 Transaction (Transacción)

Registro de cada movimiento de dinero.

```typescript
interface Transaction {
  id: string; // UUID
  walletId: string; // Referencia a Wallet
  categoryId: string; // Referencia a Category
  type: TransactionType;
  amount: number; // Siempre positivo
  description: string; // "Despensa Walmart"
  date: string; // ISO 8601 - Fecha de la transacción
  createdAt: string; // ISO 8601 - Fecha de creación del registro
  notes?: string; // Notas opcionales
  tags?: string[]; // Tags para filtrado

  // Vinculación opcional
  scheduledPaymentId?: string; // Si vino de un recordatorio
  debtPaymentId?: string; // Si es pago de deuda
  loanPaymentId?: string; // Si es cobro de préstamo
  savingsContributionId?: string; // Si es contribución a ahorro
}

type TransactionType = "income" | "expense";
```

**Campos calculados (no almacenados):**

- `signedAmount`: `type === "income" ? amount : -amount`

---

## 🏷️ Category (Categoría)

Clasificación de transacciones con iconos y colores.

```typescript
interface Category {
  id: string; // UUID o "default_food", etc.
  name: string; // "Comida"
  type: TransactionType; // "income" | "expense"
  icon: string; // Nombre del icono Phosphor: "ForkKnife"
  color: string; // Hex: "#ef4444"
  isDefault: boolean; // true = categoría del sistema
  isActive: boolean; // false = oculta pero preserva histórico
  createdAt: string;
}

// Categorías default precargadas (ver BUSINESS_LOGIC.md)
```

---

## 📅 Budget (Presupuesto)

Límite de gasto por categoría en un período.

```typescript
interface Budget {
  id: string;
  walletId: string;
  categoryId: string; // Vinculado a categoría de tipo "expense"
  name: string; // "Comida del mes"
  limitAmount: number; // Límite máximo
  period: BudgetPeriod;
  startDate: string; // Inicio del período actual
  alertThreshold: number; // 0.8 = alertar al 80%
  color: string; // Para UI
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type BudgetPeriod = "weekly" | "biweekly" | "monthly";
```

**Campos calculados:**

- `spent`: Suma de transacciones de la categoría en el período
- `remaining`: `limitAmount - spent`
- `percentage`: `(spent / limitAmount) * 100`
- `isOverBudget`: `spent > limitAmount`
- `isNearLimit`: `percentage >= alertThreshold * 100`

---

## 🎯 SavingsGoal (Meta de Ahorro)

Objetivo de ahorro con fecha límite opcional.

```typescript
interface SavingsGoal {
  id: string;
  walletId: string;
  name: string; // "Viaje a Europa"
  targetAmount: number; // Meta: $50,000
  currentAmount: number; // Acumulado actual (actualizado con contribuciones)
  targetDate?: string; // Fecha objetivo (opcional)
  icon: string; // "Airplane"
  color: string; // "#a855f7"
  priority: number; // 1 = más alta
  isCompleted: boolean; // true cuando currentAmount >= targetAmount
  completedAt?: string; // Fecha de completado
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

**Campos calculados:**

- `percentage`: `(currentAmount / targetAmount) * 100`
- `remaining`: `targetAmount - currentAmount`
- `daysRemaining`: Días hasta `targetDate` (si existe)
- `requiredMonthly`: `remaining / monthsRemaining` (si hay fecha)

---

## 💰 SavingsContribution (Contribución a Ahorro)

Cada depósito a una meta de ahorro.

```typescript
interface SavingsContribution {
  id: string;
  savingsGoalId: string;
  amount: number; // Monto de la contribución
  date: string; // Fecha de la contribución
  notes?: string;
  createdAt: string;
}
```

**Efecto:** Al crear una contribución:

1. Se suma al `currentAmount` del `SavingsGoal`
2. Se crea una `Transaction` de tipo "expense" vinculada (el dinero "sale" de la billetera hacia el ahorro)

---

## 💳 Debt (Deuda)

Lo que el usuario debe a terceros.

```typescript
interface Debt {
  id: string;
  walletId: string;
  creditorName: string; // "BBVA", "Mamá", "Liverpool"
  type: DebtType;
  originalAmount: number; // Monto original de la deuda
  currentBalance: number; // Lo que falta por pagar (actualizado con pagos)
  interestRate?: number; // Tasa de interés mensual (0.05 = 5%)
  minimumPayment?: number; // Pago mínimo requerido
  dueDay: number; // Día del mes (1-31)
  startDate: string; // Fecha de inicio de la deuda
  expectedEndDate?: string; // Fecha esperada de liquidación
  color: string;
  notes?: string;
  isActive: boolean; // false cuando está liquidada
  paidAt?: string; // Fecha de liquidación
  createdAt: string;
  updatedAt: string;
}

type DebtType =
  | "credit_card" // Tarjeta de crédito
  | "personal_loan" // Préstamo personal
  | "mortgage" // Hipoteca
  | "car_loan" // Crédito automotriz
  | "family_friend" // Préstamo familiar/amigos
  | "other";
```

**Campos calculados:**

- `paidAmount`: `originalAmount - currentBalance`
- `percentage`: `(paidAmount / originalAmount) * 100`
- `nextDueDate`: Próxima fecha de pago basada en `dueDay`
- `isOverdue`: `today > nextDueDate && currentBalance > 0`

---

## 💵 DebtPayment (Pago de Deuda)

Registro de cada pago realizado a una deuda.

```typescript
interface DebtPayment {
  id: string;
  debtId: string;
  amount: number; // Monto pagado
  date: string; // Fecha del pago
  notes?: string;
  createdAt: string;
}
```

**Efecto:** Al crear un pago:

1. Se resta del `currentBalance` de la `Debt`
2. Se crea una `Transaction` de tipo "expense" vinculada
3. Si `currentBalance <= 0`, se marca `isActive = false` y `paidAt = now`

---

## 🤝 Loan (Préstamo Otorgado)

Dinero que el usuario prestó a otros.

```typescript
interface Loan {
  id: string;
  walletId: string;
  borrowerName: string; // "Juan Pérez"
  amount: number; // Monto prestado
  amountPaid: number; // Monto que te han devuelto
  interestRate?: number; // Interés acordado (opcional)
  dueDate?: string; // Fecha acordada de devolución
  notes?: string;
  color: string;
  isActive: boolean; // false cuando está completamente pagado
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

**Campos calculados:**

- `remaining`: `amount - amountPaid`
- `percentage`: `(amountPaid / amount) * 100`
- `isOverdue`: `dueDate && today > dueDate && remaining > 0`

---

## 💵 LoanPayment (Cobro de Préstamo)

Registro de cada pago recibido de un préstamo.

```typescript
interface LoanPayment {
  id: string;
  loanId: string;
  amount: number;
  date: string;
  notes?: string;
  createdAt: string;
}
```

**Efecto:** Al registrar un cobro:

1. Se suma al `amountPaid` del `Loan`
2. Se crea una `Transaction` de tipo "income" vinculada
3. Si `amountPaid >= amount`, se marca `isActive = false`

---

## ⏰ ScheduledPayment (Pago Programado - Recordatorio)

Recordatorio de pago futuro. **NO se auto-ejecuta.**

```typescript
interface ScheduledPayment {
  id: string;
  walletId: string;
  name: string; // "Netflix", "Renta", "Pago tarjeta"
  amount: number;
  categoryId?: string;
  frequency: RecurrenceFrequency;
  nextDueDate: string; // Próxima fecha de vencimiento
  reminderDaysBefore: number; // 3 = recordar 3 días antes

  // Vinculación opcional
  debtId?: string; // Si está vinculado a una deuda

  // Estado
  isActive: boolean;
  lastCompletedDate?: string; // Última vez que se marcó como pagado
  createdAt: string;
  updatedAt: string;
}

type RecurrenceFrequency =
  | "once" // Una sola vez
  | "weekly" // Cada semana
  | "biweekly" // Cada 2 semanas
  | "monthly" // Cada mes
  | "yearly"; // Cada año
```

**Comportamiento:**

1. Aparece en el calendario de pagos
2. Genera notificación/alerta `reminderDaysBefore` días antes
3. Usuario marca manualmente como "Pagado"
4. Al marcar como pagado:
   - Se crea `Transaction` con los datos del recordatorio
   - Se calcula `nextDueDate` según `frequency`
   - Se actualiza `lastCompletedDate`

---

## 🔗 Relaciones entre Entidades

```
Wallet (1) ──────┬────── (N) Transaction
                 │
                 ├────── (N) Budget ────── (1) Category
                 │
                 ├────── (N) SavingsGoal ──── (N) SavingsContribution
                 │
                 ├────── (N) Debt ──────────── (N) DebtPayment
                 │
                 ├────── (N) Loan ──────────── (N) LoanPayment
                 │
                 └────── (N) ScheduledPayment ─┬─ (0..1) Debt
                                               ├─ (0..1) Loan
                                               └─ (0..1) Category

Transaction (N) ────── (1) Category
```

---

## 📦 Estructura de Store Zustand

```typescript
interface FinanceSlice {
  // Datos
  wallet: Wallet | null;
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  savingsContributions: SavingsContribution[];
  debts: Debt[];
  debtPayments: DebtPayment[];
  loans: Loan[];
  loanPayments: LoanPayment[];
  scheduledPayments: ScheduledPayment[];

  // Acciones (ver BUSINESS_LOGIC.md)
  // ...
}
```
