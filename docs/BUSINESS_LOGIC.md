# 🧮 Lógica de Negocio - Fine App

> Reglas de cálculo, validaciones y comportamientos del sistema

---

## 1. Balance de Billetera

### Cálculo

```typescript
function calculateBalance(transactions: Transaction[]): number {
  return transactions.reduce((acc, tx) => {
    return tx.type === "income" ? acc + tx.amount : acc - tx.amount;
  }, 0);
}
```

### Reglas

- El balance puede ser negativo (deudas > ingresos)
- Se recalcula en cada vista, no se almacena
- Filtrable por rango de fechas

---

## 2. Transacciones

### Crear Transacción

```typescript
function createTransaction(data: CreateTransactionInput): Transaction {
  // Validaciones
  if (data.amount <= 0) throw new Error("Monto debe ser positivo");
  if (!data.categoryId) throw new Error("Categoría requerida");
  if (!data.description.trim()) throw new Error("Descripción requerida");

  // Validar que categoría coincida con tipo
  const category = getCategory(data.categoryId);
  if (category.type !== data.type) {
    throw new Error("Tipo de transacción no coincide con categoría");
  }

  return {
    id: generateUUID(),
    walletId: getCurrentWalletId(),
    ...data,
    createdAt: new Date().toISOString(),
  };
}
```

### Filtros de Transacciones

```typescript
// Por período
function filterByPeriod(
  transactions: Transaction[],
  period: Period,
): Transaction[] {
  const { start, end } = getPeriodDates(period); // "today", "week", "month", "year"
  return transactions.filter((tx) => tx.date >= start && tx.date <= end);
}

// Por categoría
function filterByCategory(
  transactions: Transaction[],
  categoryId: string,
): Transaction[] {
  return transactions.filter((tx) => tx.categoryId === categoryId);
}

// Por tipo
function filterByType(
  transactions: Transaction[],
  type: TransactionType,
): Transaction[] {
  return transactions.filter((tx) => tx.type === type);
}
```

### Agrupación por Fecha

```typescript
function groupByDate(transactions: Transaction[]): TransactionGroup[] {
  const grouped = transactions.reduce(
    (acc, tx) => {
      const dateKey = tx.date.split("T")[0]; // "2026-01-25"
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(tx);
      return acc;
    },
    {} as Record<string, Transaction[]>,
  );

  return Object.entries(grouped)
    .map(([date, txs]) => ({
      label: formatDateLabel(date), // "HOY", "AYER", "25 ENE"
      date,
      transactions: txs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}
```

---

## 3. Presupuestos (Budgets)

### Cálculo de Gasto en Período

```typescript
function calculateBudgetSpent(
  budget: Budget,
  transactions: Transaction[],
): number {
  const periodDates = getCurrentPeriodDates(budget.period, budget.startDate);

  return transactions
    .filter(
      (tx) =>
        tx.categoryId === budget.categoryId &&
        tx.type === "expense" &&
        tx.date >= periodDates.start &&
        tx.date <= periodDates.end,
    )
    .reduce((sum, tx) => sum + tx.amount, 0);
}
```

### Estado del Presupuesto

```typescript
interface BudgetStatus {
  spent: number;
  remaining: number;
  percentage: number;
  status: "ok" | "warning" | "exceeded";
  daysRemaining: number;
  dailyAllowance: number; // Cuánto puedes gastar por día restante
}

function getBudgetStatus(
  budget: Budget,
  transactions: Transaction[],
): BudgetStatus {
  const spent = calculateBudgetSpent(budget, transactions);
  const remaining = Math.max(0, budget.limitAmount - spent);
  const percentage = (spent / budget.limitAmount) * 100;
  const daysRemaining = getDaysRemainingInPeriod(
    budget.period,
    budget.startDate,
  );

  let status: "ok" | "warning" | "exceeded";
  if (percentage >= 100) status = "exceeded";
  else if (percentage >= budget.alertThreshold * 100) status = "warning";
  else status = "ok";

  return {
    spent,
    remaining,
    percentage: Math.min(percentage, 100),
    status,
    daysRemaining,
    dailyAllowance: daysRemaining > 0 ? remaining / daysRemaining : 0,
  };
}
```

### Renovación de Período

```typescript
// Llamar al inicio de cada sesión
function checkBudgetPeriodRenewal(budget: Budget): Budget {
  const periodEnd = getPeriodEndDate(budget.period, budget.startDate);
  const today = new Date().toISOString().split("T")[0];

  if (today > periodEnd) {
    // Calcular nuevo startDate
    const newStartDate = getNextPeriodStart(budget.period, budget.startDate);
    return {
      ...budget,
      startDate: newStartDate,
      updatedAt: new Date().toISOString(),
    };
  }

  return budget;
}
```

---

## 4. Metas de Ahorro (Savings Goals)

### Crear Contribución

```typescript
function createSavingsContribution(
  goalId: string,
  amount: number,
  goals: SavingsGoal[],
  notes?: string,
): {
  contribution: SavingsContribution;
  updatedGoal: SavingsGoal;
  transaction: Transaction;
} {
  const goal = goals.find((g) => g.id === goalId);
  if (!goal) throw new Error("Meta no encontrada");
  if (!goal.isActive) throw new Error("Meta ya completada o inactiva");
  if (amount <= 0) throw new Error("Monto debe ser positivo");

  // Crear contribución
  const contribution: SavingsContribution = {
    id: generateUUID(),
    savingsGoalId: goalId,
    amount,
    date: new Date().toISOString(),
    notes,
    createdAt: new Date().toISOString(),
  };

  // Actualizar meta
  const newCurrentAmount = goal.currentAmount + amount;
  const isCompleted = newCurrentAmount >= goal.targetAmount;

  const updatedGoal: SavingsGoal = {
    ...goal,
    currentAmount: newCurrentAmount,
    isCompleted,
    completedAt: isCompleted ? new Date().toISOString() : undefined,
    updatedAt: new Date().toISOString(),
  };

  // Crear transacción vinculada (el dinero "sale" hacia el ahorro)
  const transaction: Transaction = {
    id: generateUUID(),
    walletId: goal.walletId,
    categoryId: "default_savings", // Categoría especial de ahorro
    type: "expense",
    amount,
    description: `Ahorro: ${goal.name}`,
    date: new Date().toISOString(),
    savingsContributionId: contribution.id,
    createdAt: new Date().toISOString(),
  };

  return { contribution, updatedGoal, transaction };
}
```

### Retirar de Ahorro

```typescript
function withdrawFromSavings(
  goalId: string,
  amount: number,
  goals: SavingsGoal[],
  reason?: string,
): { updatedGoal: SavingsGoal; transaction: Transaction } {
  const goal = goals.find((g) => g.id === goalId);
  if (!goal) throw new Error("Meta no encontrada");
  if (amount > goal.currentAmount)
    throw new Error("Fondos insuficientes en esta meta");

  const updatedGoal: SavingsGoal = {
    ...goal,
    currentAmount: goal.currentAmount - amount,
    isCompleted: false, // Ya no está completa si retiras
    completedAt: undefined,
    updatedAt: new Date().toISOString(),
  };

  // Crear transacción de ingreso (el dinero "regresa" a la billetera)
  const transaction: Transaction = {
    id: generateUUID(),
    walletId: goal.walletId,
    categoryId: "default_savings",
    type: "income",
    amount,
    description: `Retiro de ahorro: ${goal.name}${reason ? ` - ${reason}` : ""}`,
    date: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  return { updatedGoal, transaction };
}
```

### Proyección de Ahorro

```typescript
function getSavingsProjection(goal: SavingsGoal): {
  monthsToComplete: number | null;
  requiredMonthly: number | null;
  onTrack: boolean;
} {
  if (goal.isCompleted)
    return { monthsToComplete: 0, requiredMonthly: 0, onTrack: true };
  if (!goal.targetDate)
    return { monthsToComplete: null, requiredMonthly: null, onTrack: true };

  const remaining = goal.targetAmount - goal.currentAmount;
  const monthsRemaining = getMonthsBetween(
    new Date(),
    new Date(goal.targetDate),
  );

  if (monthsRemaining <= 0) {
    return {
      monthsToComplete: null,
      requiredMonthly: remaining,
      onTrack: false,
    };
  }

  const requiredMonthly = remaining / monthsRemaining;

  // Calcular si va on track basado en contribuciones recientes
  // (simplificado: asumimos que está on track si tiene tiempo)
  const onTrack = monthsRemaining > 0;

  return { monthsToComplete: monthsRemaining, requiredMonthly, onTrack };
}
```

---

## 5. Deudas

**Nota:** Se puede registrar pagos en cualquier fecha sin necesidad de un pago programado. El campo `dueDay` es opcional.

### Registrar Pago de Deuda

```typescript
function createDebtPayment(
  debtId: string,
  amount: number,
  debts: Debt[],
  notes?: string,
): { payment: DebtPayment; updatedDebt: Debt; transaction: Transaction } {
  const debt = debts.find((d) => d.id === debtId);
  if (!debt) throw new Error("Deuda no encontrada");
  if (!debt.isActive) throw new Error("Deuda ya liquidada");
  if (amount <= 0) throw new Error("Monto debe ser positivo");

  // Crear pago
  const payment: DebtPayment = {
    id: generateUUID(),
    debtId,
    amount,
    date: new Date().toISOString(),
    notes,
    createdAt: new Date().toISOString(),
  };

  // Actualizar deuda
  const newBalance = Math.max(0, debt.currentBalance - amount);
  const isPaidOff = newBalance === 0;

  const updatedDebt: Debt = {
    ...debt,
    currentBalance: newBalance,
    isActive: !isPaidOff,
    paidAt: isPaidOff ? new Date().toISOString() : undefined,
    updatedAt: new Date().toISOString(),
  };

  // Crear transacción
  const transaction: Transaction = {
    id: generateUUID(),
    walletId: debt.walletId,
    categoryId: "default_debt_payment",
    type: "expense",
    amount,
    description: `Pago: ${debt.creditorName}`,
    date: new Date().toISOString(),
    debtPaymentId: payment.id,
    createdAt: new Date().toISOString(),
  };

  return { payment, updatedDebt, transaction };
}
```

### Cálculo de Intereses (Informativo)

```typescript
function calculateDebtInterest(debt: Debt): {
  monthlyInterest: number;
  totalWithInterest: number;
  monthsToPayOff: number | null;
} {
  if (!debt.interestRate || debt.interestRate === 0) {
    return {
      monthlyInterest: 0,
      totalWithInterest: debt.currentBalance,
      monthsToPayOff: debt.minimumPayment
        ? Math.ceil(debt.currentBalance / debt.minimumPayment)
        : null,
    };
  }

  const monthlyInterest = debt.currentBalance * debt.interestRate;

  // Cálculo simplificado sin capitalización
  if (!debt.minimumPayment || debt.minimumPayment <= monthlyInterest) {
    return {
      monthlyInterest,
      totalWithInterest: Infinity,
      monthsToPayOff: null,
    };
  }

  // Meses para pagar con pago mínimo (fórmula de amortización simplificada)
  const monthsToPayOff = Math.ceil(
    Math.log(debt.minimumPayment / (debt.minimumPayment - monthlyInterest)) /
      Math.log(1 + debt.interestRate),
  );

  const totalWithInterest = debt.minimumPayment * monthsToPayOff;

  return { monthlyInterest, totalWithInterest, monthsToPayOff };
}
```

### Estado de Deudas

```typescript
function getDebtStatus(debt: Debt): {
  percentage: number;
  isOverdue: boolean;
  nextDueDate?: string;
  daysUntilDue?: number;
  status: "paid" | "current" | "due_soon" | "overdue";
} {
  const percentage =
    ((debt.originalAmount - debt.currentBalance) / debt.originalAmount) * 100;
  
  // Si no hay dueDay, no hay fecha de vencimiento
  if (!debt.dueDay) {
    return {
      percentage,
      isOverdue: false,
      status: debt.isActive ? "current" : "paid",
    };
  }
  
  const nextDueDate = getNextDueDate(debt.dueDay);
  const daysUntilDue = getDaysBetweenDates(new Date(), new Date(nextDueDate));
  const isOverdue = daysUntilDue < 0 && debt.currentBalance > 0;

  let status: "paid" | "current" | "due_soon" | "overdue";
  if (!debt.isActive) status = "paid";
  else if (isOverdue) status = "overdue";
  else if (daysUntilDue <= 5) status = "due_soon";
  else status = "current";

  return { percentage, isOverdue, nextDueDate, daysUntilDue, status };
}
```

---

## 6. Préstamos (Lo que te deben)

**Nota:** Los préstamos funcionan igual que las deudas pero en dirección inversa. Se puede recibir pagos en cualquier fecha sin restricciones. El campo `dueDay` es opcional.

### Registrar Cobro

```typescript
function createLoanPayment(
  loanId: string,
  amount: number,
  loans: Loan[],
  notes?: string,
): { payment: LoanPayment; updatedLoan: Loan; transaction: Transaction } {
  const loan = loans.find((l) => l.id === loanId);
  if (!loan) throw new Error("Préstamo no encontrado");
  if (!loan.isActive) throw new Error("Préstamo ya liquidado");
  if (amount <= 0) throw new Error("Monto debe ser positivo");

  // Crear pago recibido
  const payment: LoanPayment = {
    id: generateUUID(),
    loanId,
    amount,
    date: new Date().toISOString(),
    notes,
    createdAt: new Date().toISOString(),
  };

  // Actualizar préstamo
  const newBalance = Math.max(0, loan.currentBalance - amount);
  const isComplete = newBalance === 0;

  const updatedLoan: Loan = {
    ...loan,
    currentBalance: newBalance,
    isActive: !isComplete,
    completedAt: isComplete ? new Date().toISOString() : undefined,
    updatedAt: new Date().toISOString(),
  };

  // Crear transacción
  const transaction: Transaction = {
    id: generateUUID(),
    walletId: loan.walletId,
    categoryId: "default_loan_collection",
    type: "income",
    amount,
    description: `Cobro préstamo: ${loan.borrowerName}`,
    date: new Date().toISOString(),
    loanPaymentId: payment.id,
    createdAt: new Date().toISOString(),
  };

  return { payment, updatedLoan, transaction };
}
```

### Estado de Préstamos

```typescript
function getLoanStatus(loan: Loan): {
  percentage: number;
  isOverdue: boolean;
  nextDueDate?: string;
  daysUntilDue?: number;
  status: "completed" | "current" | "due_soon" | "overdue";
} {
  const percentage =
    ((loan.originalAmount - loan.currentBalance) / loan.originalAmount) * 100;

  // Si no hay dueDay, no hay fecha de vencimiento
  if (!loan.dueDay) {
    return {
      percentage,
      isOverdue: false,
      status: loan.isActive ? "current" : "completed",
    };
  }

  const nextDueDate = getNextDueDate(loan.dueDay);
  const daysUntilDue = getDaysBetweenDates(new Date(), new Date(nextDueDate));
  const isOverdue = daysUntilDue < 0 && loan.currentBalance > 0;

  let status: "completed" | "current" | "due_soon" | "overdue";
  if (!loan.isActive) status = "completed";
  else if (isOverdue) status = "overdue";
  else if (daysUntilDue <= 5) status = "due_soon";
  else status = "current";

  return { percentage, isOverdue, nextDueDate, daysUntilDue, status };
}
```

---

## 7. Pagos Programados (Recordatorios)

### Verificar Recordatorios Pendientes

```typescript
function getPendingReminders(
  scheduledPayments: ScheduledPayment[],
): ScheduledPayment[] {
  const today = new Date();

  return scheduledPayments
    .filter((sp) => {
      if (!sp.isActive) return false;

      const dueDate = new Date(sp.nextDueDate);
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - sp.reminderDaysBefore);

      return today >= reminderDate && today <= dueDate;
    })
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate));
}
```

### Marcar como Pagado (Acción del Usuario)

```typescript
function completeScheduledPayment(
  paymentId: string,
  scheduledPayments: ScheduledPayment[],
  actualAmount?: number, // Si el monto real fue diferente
): {
  updatedPayment: ScheduledPayment;
  transaction: Transaction;
  nextReminder?: ScheduledPayment; // Si es recurrente
} {
  const payment = scheduledPayments.find((sp) => sp.id === paymentId);
  if (!payment) throw new Error("Pago programado no encontrado");

  const amount = actualAmount ?? payment.amount;

  // Crear transacción
  const transaction: Transaction = {
    id: generateUUID(),
    walletId: payment.walletId,
    categoryId: payment.categoryId ?? "default_bills",
    type: "expense",
    amount,
    description: payment.name,
    date: new Date().toISOString(),
    scheduledPaymentId: payment.id,
    createdAt: new Date().toISOString(),
  };

  // Actualizar o crear siguiente recordatorio
  if (payment.frequency === "once") {
    // Pago único: desactivar
    const updatedPayment: ScheduledPayment = {
      ...payment,
      isActive: false,
      lastCompletedDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { updatedPayment, transaction, debtOrLoanUpdate };
  }

  // Recurrente: calcular siguiente fecha
  const nextDueDate = calculateNextDueDate(
    payment.nextDueDate,
    payment.frequency,
  );

  const updatedPayment: ScheduledPayment = {
    ...payment,
    nextDueDate,
    lastCompletedDate: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return { updatedPayment, transaction, debtOrLoanUpdate };
}

function calculateNextDueDate(
  currentDate: string,
  frequency: RecurrenceFrequency,
): string {
  const date = new Date(currentDate);

  switch (frequency) {
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "biweekly":
      date.setDate(date.getDate() + 14);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    case "yearly":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date.toISOString();
}
```

### Datos para Calendario

```typescript
interface CalendarDay {
  date: string;
  dayNumber: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  payments: ScheduledPayment[];
  hasPayments: boolean;
  totalAmount: number;
}

function getCalendarData(
  year: number,
  month: number,
  scheduledPayments: ScheduledPayment[],
): CalendarDay[] {
  const days = getDaysInMonth(year, month);
  const today = new Date().toISOString().split("T")[0];

  return days.map((date) => {
    const dayPayments = scheduledPayments.filter((sp) => {
      const dueDate = sp.nextDueDate.split("T")[0];
      return dueDate === date && sp.isActive;
    });

    return {
      date,
      dayNumber: new Date(date).getDate(),
      isToday: date === today,
      isCurrentMonth: true,
      payments: dayPayments,
      hasPayments: dayPayments.length > 0,
      totalAmount: dayPayments.reduce((sum, p) => sum + p.amount, 0),
    };
  });
}
```

---

## 8. Categorías Default

### Categorías de Gasto Precargadas

```typescript
const DEFAULT_EXPENSE_CATEGORIES: Omit<Category, "id" | "createdAt">[] = [
  {
    name: "Comida",
    type: "expense",
    icon: "ForkKnife",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Transporte",
    type: "expense",
    icon: "Car",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Entretenimiento",
    type: "expense",
    icon: "GameController",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Compras",
    type: "expense",
    icon: "ShoppingCart",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Servicios",
    type: "expense",
    icon: "Lightning",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Salud",
    type: "expense",
    icon: "Heart",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Educación",
    type: "expense",
    icon: "GraduationCap",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Hogar",
    type: "expense",
    icon: "House",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Ropa",
    type: "expense",
    icon: "TShirt",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Regalos",
    type: "expense",
    icon: "Gift",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Suscripciones",
    type: "expense",
    icon: "Repeat",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Mascotas",
    type: "expense",
    icon: "PawPrint",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Pago de Deuda",
    type: "expense",
    icon: "CreditCard",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Ahorro",
    type: "expense",
    icon: "PiggyBank",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Otros",
    type: "expense",
    icon: "DotsThree",
    isDefault: true,
    isActive: true,
  },
];

const DEFAULT_INCOME_CATEGORIES: Omit<Category, "id" | "createdAt">[] = [
  {
    name: "Salario",
    type: "income",
    icon: "Money",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Freelance",
    type: "income",
    icon: "Laptop",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Inversiones",
    type: "income",
    icon: "ChartLineUp",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Ventas",
    type: "income",
    icon: "Tag",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Reembolso",
    type: "income",
    icon: "ArrowCounterClockwise",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Regalo",
    type: "income",
    icon: "Gift",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Cobro Préstamo",
    type: "income",
    icon: "Handshake",
    isDefault: true,
    isActive: true,
  },
  {
    name: "Otros",
    type: "income",
    icon: "DotsThree",
    isDefault: true,
    isActive: true,
  },
];
```

---

## 9. Estadísticas y Reportes

### Resumen del Período

```typescript
interface PeriodSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  transactionCount: number;
  averageTransaction: number;
  topCategories: { category: Category; amount: number; percentage: number }[];
  dailyAverage: number;
}

function getPeriodSummary(
  transactions: Transaction[],
  categories: Category[],
  startDate: string,
  endDate: string,
): PeriodSummary {
  const filtered = transactions.filter(
    (tx) => tx.date >= startDate && tx.date <= endDate,
  );

  const totalIncome = filtered
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpenses = filtered
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Agrupar por categoría (solo gastos)
  const byCategory = filtered
    .filter((tx) => tx.type === "expense")
    .reduce(
      (acc, tx) => {
        acc[tx.categoryId] = (acc[tx.categoryId] || 0) + tx.amount;
        return acc;
      },
      {} as Record<string, number>,
    );

  const topCategories = Object.entries(byCategory)
    .map(([categoryId, amount]) => ({
      category: categories.find((c) => c.id === categoryId)!,
      amount,
      percentage: (amount / totalExpenses) * 100,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const days = getDaysBetweenDates(new Date(startDate), new Date(endDate)) + 1;

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    transactionCount: filtered.length,
    averageTransaction:
      filtered.length > 0
        ? filtered.reduce((sum, tx) => sum + tx.amount, 0) / filtered.length
        : 0,
    topCategories,
    dailyAverage: totalExpenses / days,
  };
}
```

### Comparativa con Período Anterior

```typescript
interface PeriodComparison {
  current: PeriodSummary;
  previous: PeriodSummary;
  incomeChange: number; // Porcentaje
  expenseChange: number; // Porcentaje
  trend: "up" | "down" | "stable";
}
```

---

## 10. Alertas y Notificaciones (Lógica)

### Tipos de Alerta

```typescript
type AlertType =
  | "budget_warning" // Presupuesto cerca del límite
  | "budget_exceeded" // Presupuesto excedido
  | "payment_reminder" // Recordatorio de pago
  | "payment_overdue" // Pago vencido
  | "debt_due_soon" // Deuda próxima a vencer
  | "savings_goal_reached" // Meta de ahorro alcanzada
  | "loan_overdue"; // Préstamo no cobrado

interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  relatedEntityId: string;
  createdAt: string;
  isRead: boolean;
}
```

### Generar Alertas (Ejecutar al abrir app)

```typescript
function generateAlerts(state: FinanceSlice): Alert[] {
  const alerts: Alert[] = [];
  const today = new Date();

  // Presupuestos
  state.budgets.forEach((budget) => {
    const status = getBudgetStatus(budget, state.transactions);
    if (status.status === "warning") {
      alerts.push({
        id: generateUUID(),
        type: "budget_warning",
        title: `Presupuesto: ${budget.name}`,
        message: `Has usado ${status.percentage.toFixed(0)}% de tu presupuesto`,
        relatedEntityId: budget.id,
        createdAt: today.toISOString(),
        isRead: false,
      });
    }
    if (status.status === "exceeded") {
      alerts.push({
        id: generateUUID(),
        type: "budget_exceeded",
        title: `¡Presupuesto excedido!`,
        message: `${budget.name}: Te pasaste $${(status.spent - budget.limitAmount).toFixed(2)}`,
        relatedEntityId: budget.id,
        createdAt: today.toISOString(),
        isRead: false,
      });
    }
  });

  // Pagos programados
  const pendingReminders = getPendingReminders(state.scheduledPayments);
  pendingReminders.forEach((payment) => {
    alerts.push({
      id: generateUUID(),
      type: "payment_reminder",
      title: `Pago próximo: ${payment.name}`,
      message: `$${payment.amount} - Vence: ${formatDate(payment.nextDueDate)}`,
      relatedEntityId: payment.id,
      createdAt: today.toISOString(),
      isRead: false,
    });
  });

  // Deudas próximas a vencer
  state.debts
    .filter((d) => d.isActive)
    .forEach((debt) => {
      const status = getDebtStatus(debt);
      if (status.status === "due_soon") {
        alerts.push({
          id: generateUUID(),
          type: "debt_due_soon",
          title: `Deuda próxima: ${debt.creditorName}`,
          message: `Pago mínimo: $${debt.minimumPayment} en ${status.daysUntilDue} días`,
          relatedEntityId: debt.id,
          createdAt: today.toISOString(),
          isRead: false,
        });
      }
    });

  return alerts;
}
```

// Nota: Los colores se asignan dinámicamente en el frontend según el icono/categoría
