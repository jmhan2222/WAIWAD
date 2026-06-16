import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export function Layout({ children }: Props) {
  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <header className="bg-white/80 backdrop-blur-md border-b border-[#E5E5EA] sticky top-0 z-50">
        <div className="max-w-[680px] mx-auto px-4 h-14 flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#E8361E] flex-shrink-0">
            <span className="text-white font-bold text-xs leading-none">7C</span>
          </div>
          <span className="font-semibold text-[#1D1D1F] text-base">기내방송 트레이너</span>
          <span className="ml-auto text-[10px] font-medium text-[#6E6E73] bg-[#F5F5F7] px-2 py-0.5 rounded-full">
            Rev.23
          </span>
        </div>
      </header>
      <main className="max-w-[680px] mx-auto px-4 py-5">{children}</main>
    </div>
  )
}
