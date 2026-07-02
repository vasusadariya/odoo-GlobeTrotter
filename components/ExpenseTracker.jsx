"use client"

import { useState, useEffect, useCallback } from "react"
import toast from "react-hot-toast"
import Button from "./ui/Button_1"
import Input from "./ui/Input_1"

const CATEGORIES = ["transport", "accommodation", "activities", "food", "other"]

export default function ExpenseTracker({ tripId, currency = "USD" }) {
  const [expenses, setExpenses] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({ description: "", amount: "", category: "other" })

  const fetchData = useCallback(async () => {
    try {
      const [expensesRes, summaryRes] = await Promise.all([
        fetch(`/api/trips/${tripId}/expenses`),
        fetch(`/api/trips/${tripId}/expenses/summary`),
      ])

      if (expensesRes.ok) {
        const data = await expensesRes.json()
        setExpenses(data.expenses || [])
      }
      if (summaryRes.ok) {
        const data = await summaryRes.json()
        setSummary(data)
      }
    } catch (error) {
      console.error("Error loading expenses:", error)
    } finally {
      setLoading(false)
    }
  }, [tripId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddExpense = async (e) => {
    e.preventDefault()
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error("Enter a valid amount")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/trips/${tripId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount), currency }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to add expense")

      toast.success("Expense added")
      setForm({ description: "", amount: "", category: "other" })
      setShowForm(false)
      fetchData()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (expenseId) => {
    try {
      const response = await fetch(`/api/trips/${tripId}/expenses/${expenseId}`, { method: "DELETE" })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete expense")
      }
      toast.success("Expense removed")
      fetchData()
    } catch (error) {
      toast.error(error.message)
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-400 py-4">Loading expenses...</div>
  }

  return (
    <div className="mt-6 pt-6 border-t border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Actual Spending</h3>
        <Button variant="outline" size="sm" onClick={() => setShowForm((prev) => !prev)}>
          {showForm ? "Cancel" : "Log Expense"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6 bg-gray-50 p-4 rounded-xl">
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />
          <Input
            label="Amount"
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit" loading={isSubmitting} disabled={isSubmitting} className="w-full">
              Add
            </Button>
          </div>
        </form>
      )}

      {summary && summary.perTraveler.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Balances</h4>
          <div className="space-y-1">
            {summary.perTraveler.map((entry) => (
              <div key={entry.user.id} className="flex items-center justify-between text-sm bg-white border border-gray-100 rounded-lg px-3 py-2">
                <span className="text-gray-800">{entry.user.name || "Unknown"}</span>
                <span className={entry.net >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                  {entry.net >= 0 ? "+" : ""}
                  {currency} {entry.net.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {expenses.length === 0 ? (
          <p className="text-sm text-gray-400">No expenses logged yet.</p>
        ) : (
          expenses.map((expense) => (
            <div key={expense._id} className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
              <div>
                <span className="font-medium text-gray-900">{expense.description || expense.category}</span>
                <span className="text-gray-400 ml-2 capitalize">{expense.category}</span>
                <span className="text-gray-400 ml-2">paid by {expense.paidBy?.name || "someone"}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900">
                  {expense.currency} {expense.amount.toFixed(2)}
                </span>
                {/* Server enforces payer-or-owner only; a non-owner attempting
                    to delete someone else's expense gets a toast error. */}
                <button
                  onClick={() => handleDelete(expense._id)}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
