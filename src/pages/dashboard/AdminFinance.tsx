import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, TrendingUp, TrendingDown, Wallet, DollarSign, Receipt, Download } from 'lucide-react';
import { toast } from 'sonner';
import { formatKwacha, todayRange, weekRange, monthRange, formatDate, formatDateTime } from '@/lib/admin-helpers';
import { toCSV, downloadCSV } from '@/lib/csv-export';

const EXPENSE_CATEGORIES = ['fabric', 'supplies', 'rent', 'utilities', 'transport', 'salaries', 'other'];
const PAYMENT_TYPES = ['deposit', 'balance', 'full', 'refund'];

const AdminFinance = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [pForm, setPForm] = useState<any>({ garment_request_id: '', amount: '', payment_type: 'deposit', payment_method: 'cash', notes: '' });
  const [eForm, setEForm] = useState<any>({ category: 'fabric', description: '', amount: '', expense_date: new Date().toISOString().slice(0, 10), notes: '' });

  const load = async () => {
    const [p, e, o] = await Promise.all([
      supabase.from('payments').select('*').order('paid_at', { ascending: false }),
      supabase.from('expenses').select('*').order('expense_date', { ascending: false }),
      supabase.from('garment_requests').select('id,description,category,customer_name,total_price').order('created_at', { ascending: false }).limit(100),
    ]);
    setPayments(p.data || []);
    setExpenses(e.data || []);
    setOrders(o.data || []);
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const inRange = (d: Date | string, r: { start: Date; end: Date }) => {
      const dt = new Date(d);
      return dt >= r.start && dt < r.end;
    };
    const t = todayRange(), w = weekRange(), m = monthRange();
    const sumP = (r: any) => payments.filter(p => inRange(p.paid_at, r)).reduce((s, p) => s + Number(p.amount), 0);
    const sumE = (r: any) => expenses.filter(e => inRange(e.expense_date, r)).reduce((s, x) => s + Number(x.amount), 0);

    return {
      todayIncome: sumP(t), weekIncome: sumP(w), monthIncome: sumP(m),
      todayExpense: sumE(t), weekExpense: sumE(w), monthExpense: sumE(m),
      totalIncome: payments.reduce((s, p) => s + Number(p.amount), 0),
      totalExpense: expenses.reduce((s, e) => s + Number(e.amount), 0),
    };
  }, [payments, expenses]);

  const savePayment = async () => {
    if (!pForm.amount || Number(pForm.amount) <= 0) return toast.error('Enter amount');
    const { error } = await supabase.from('payments').insert({
      garment_request_id: pForm.garment_request_id || null,
      amount: Number(pForm.amount),
      payment_type: pForm.payment_type,
      payment_method: pForm.payment_method,
      notes: pForm.notes || null,
    });
    if (error) return toast.error(error.message);
    // Update order payment_status if linked
    if (pForm.garment_request_id) {
      const newStatus = pForm.payment_type === 'full' ? 'fully_paid' : pForm.payment_type === 'balance' ? 'fully_paid' : 'deposit_paid';
      await supabase.from('garment_requests').update({ payment_status: newStatus as any }).eq('id', pForm.garment_request_id);
    }
    toast.success('Payment recorded');
    setPaymentOpen(false);
    setPForm({ garment_request_id: '', amount: '', payment_type: 'deposit', payment_method: 'cash', notes: '' });
    load();
  };

  const saveExpense = async () => {
    if (!eForm.description.trim() || !eForm.amount || Number(eForm.amount) <= 0) return toast.error('Description and amount required');
    const { error } = await supabase.from('expenses').insert({
      category: eForm.category,
      description: eForm.description.trim(),
      amount: Number(eForm.amount),
      expense_date: eForm.expense_date,
      notes: eForm.notes || null,
    });
    if (error) return toast.error(error.message);
    toast.success('Expense recorded');
    setExpenseOpen(false);
    setEForm({ category: 'fabric', description: '', amount: '', expense_date: new Date().toISOString().slice(0, 10), notes: '' });
    load();
  };

  const profit = stats.totalIncome - stats.totalExpense;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h1 className="font-serif text-2xl font-bold text-foreground">Finance</h1>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setPaymentOpen(true)} className="gap-1">
              <Plus className="h-4 w-4" /> Payment
            </Button>
            <Button size="sm" variant="outline" onClick={() => setExpenseOpen(true)} className="gap-1">
              <Plus className="h-4 w-4" /> Expense
            </Button>
          </div>
        </div>

        {/* Period summaries */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Today', income: stats.todayIncome, expense: stats.todayExpense },
            { label: 'This Week', income: stats.weekIncome, expense: stats.weekExpense },
            { label: 'This Month', income: stats.monthIncome, expense: stats.monthExpense },
          ].map(s => (
            <Card key={s.label} className="p-3">
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              <p className="text-lg font-bold text-accent mt-1">{formatKwacha(s.income)}</p>
              <p className="text-[11px] text-destructive">−{formatKwacha(s.expense)}</p>
              <p className="text-[11px] font-semibold text-foreground mt-1">
                = {formatKwacha(s.income - s.expense)}
              </p>
            </Card>
          ))}
        </div>

        {/* Total profit card */}
        <Card className="p-4 bg-gradient-to-br from-accent/10 to-primary/5 border-accent/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">All-time profit</p>
              <p className={`text-2xl font-bold mt-1 ${profit >= 0 ? 'text-accent' : 'text-destructive'}`}>
                {formatKwacha(profit)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatKwacha(stats.totalIncome)} income · {formatKwacha(stats.totalExpense)} expenses
              </p>
            </div>
            <Wallet className="h-8 w-8 text-accent" />
          </div>
        </Card>

        <Tabs defaultValue="payments">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="payments" className="gap-1"><DollarSign className="h-3 w-3" /> Payments</TabsTrigger>
            <TabsTrigger value="expenses" className="gap-1"><Receipt className="h-3 w-3" /> Expenses</TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-2 mt-3">
            {payments.length === 0 && <Card className="p-6 text-center text-sm text-muted-foreground">No payments yet</Card>}
            {payments.map(p => {
              const order = orders.find(o => o.id === p.garment_request_id);
              return (
                <Card key={p.id} className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-4 w-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-semibold text-foreground">{formatKwacha(p.amount)}</p>
                      <p className="text-[11px] text-muted-foreground">{new Date(p.paid_at).toLocaleDateString()}</p>
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">
                      {p.payment_type} · {p.payment_method || 'cash'}
                      {order && ` · ${order.customer_name || order.description?.slice(0, 30)}`}
                    </p>
                    {p.notes && <p className="text-xs text-muted-foreground/80 truncate">{p.notes}</p>}
                  </div>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="expenses" className="space-y-2 mt-3">
            {expenses.length === 0 && <Card className="p-6 text-center text-sm text-muted-foreground">No expenses yet</Card>}
            {expenses.map(e => (
              <Card key={e.id} className="p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-semibold text-foreground">{formatKwacha(e.amount)}</p>
                    <p className="text-[11px] text-muted-foreground">{new Date(e.expense_date).toLocaleDateString()}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <span className="capitalize">{e.category}</span> · {e.description}
                  </p>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Record Payment Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Record Payment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Order (optional)</Label>
              <Select value={pForm.garment_request_id || 'none'} onValueChange={v => setPForm({ ...pForm, garment_request_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Not linked to order —</SelectItem>
                  {orders.map(o => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.customer_name || o.description?.slice(0, 40) || o.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Amount (K) *</Label>
                <Input type="number" step="0.01" value={pForm.amount} onChange={e => setPForm({ ...pForm, amount: e.target.value })} />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={pForm.payment_type} onValueChange={v => setPForm({ ...pForm, payment_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Method</Label>
              <Select value={pForm.payment_method} onValueChange={v => setPForm({ ...pForm, payment_method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={pForm.notes} onChange={e => setPForm({ ...pForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOpen(false)}>Cancel</Button>
            <Button onClick={savePayment}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Expense Dialog */}
      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-serif">Record Expense</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Category</Label>
                <Select value={eForm.category} onValueChange={v => setEForm({ ...eForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount (K) *</Label>
                <Input type="number" step="0.01" value={eForm.amount} onChange={e => setEForm({ ...eForm, amount: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Description *</Label>
              <Input value={eForm.description} onChange={e => setEForm({ ...eForm, description: e.target.value })} placeholder="e.g. Chitenge fabric 5 metres" />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={eForm.expense_date} onChange={e => setEForm({ ...eForm, expense_date: e.target.value })} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={eForm.notes} onChange={e => setEForm({ ...eForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseOpen(false)}>Cancel</Button>
            <Button onClick={saveExpense}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminFinance;
