import { apiClient } from './client'
import { CreateExpenseDTO, ExpenseDTO } from '@flotaos/shared'

export const expensesApi = {
  list: async (month?: string) => {
    const res = await apiClient.get('/api/expenses', { params: { month } })
    return res.data.data as ExpenseDTO[]
  },

  create: async (dto: CreateExpenseDTO) => {
    const res = await apiClient.post('/api/expenses', dto)
    return res.data.data as ExpenseDTO
  },
}
