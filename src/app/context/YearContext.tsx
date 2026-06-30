import { createContext, useContext, useState, ReactNode } from 'react'
import { AVAILABLE_YEARS } from '../data/financials'

interface YearContextValue {
  selectedYear: string
  setSelectedYear: (year: string) => void
}

const YearContext = createContext<YearContextValue>({
  selectedYear: AVAILABLE_YEARS[0],
  setSelectedYear: () => {},
})

export function YearProvider({ children }: { children: ReactNode }) {
  const [selectedYear, setSelectedYear] = useState(AVAILABLE_YEARS[0])
  return (
    <YearContext.Provider value={{ selectedYear, setSelectedYear }}>
      {children}
    </YearContext.Provider>
  )
}

export function useYear() {
  return useContext(YearContext)
}
