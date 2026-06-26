import { Github } from 'lucide-react'

export function LoginPage() {
  const handleLogin = () => {
    window.location.href = '/api/auth/github'
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm p-8 rounded-2xl" style={{ background: '#0d1117', border: '1px solid #21262d' }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}>
            <span className="text-white font-bold text-sm">DA</span>
          </div>
          <span className="text-lg font-bold text-white">DevAtlas</span>
        </div>

        <h1 className="text-xl font-semibold text-white mb-2">시작하기</h1>
        <p className="text-sm text-gray-500 mb-6">GitHub 계정으로 로그인해 아키텍처 맵과 Git 이력을 관리하세요</p>

        <button
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: '#21262d', border: '1px solid #30363d' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#30363d' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#21262d' }}
        >
          <Github size={18} />
          GitHub으로 로그인
        </button>
      </div>
    </div>
  )
}
