import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export function Layout({ children }: Props) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[680px] mx-auto px-4 h-14 flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#E8361E]">
            <span className="text-white font-bold text-sm leading-none">7C</span>
          </div>
          <span className="font-semibold text-gray-900 text-base">기내방송 트레이너</span>
          <span className="ml-auto text-[11px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            Rev.23
          </span>
        </div>
      </header>
      <main className="max-w-[680px] mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
