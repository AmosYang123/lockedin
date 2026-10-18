import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { Download, Upload } from 'lucide-react'
import { MAX_BACKUP_BYTES, backupFilename, countCheckIns, parseBackup, serializeBackup, type Backup } from '../lib/backup'

interface Props extends Backup {
  today: string
  onImport: (backup: Backup) => void
}

type Panel = { kind: 'confirm'; backup: Backup; checkIns: number } | { kind: 'error'; message: string } | null

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

function HeaderButton({ onClick, disabled, title, children }: { onClick: () => void; disabled?: boolean; title?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex h-8 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-[12px] font-medium text-soft transition-colors hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  )
}

export function DataMenu({ habits, log, today, onImport }: Props) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [panel, setPanel] = useState<Panel>(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!notice) return
    const id = setTimeout(() => setNotice(''), 3000)
    return () => clearTimeout(id)
  }, [notice])

  useEffect(() => {
    if (!panel) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPanel(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [panel])

  const exportData = () => {
    const url = URL.createObjectURL(new Blob([serializeBackup({ habits, log }, new Date())], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = backupFilename(today)
    link.click()
    URL.revokeObjectURL(url)
    setNotice('Backup downloaded')
  }

  const readFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // let the same file be picked again
    if (!file) return
    if (file.size > MAX_BACKUP_BYTES) {
      setPanel({ kind: 'error', message: "That file is too large to be a LockedIn backup." })
      return
    }
    const parsed = parseBackup(await file.text())
    setPanel(parsed.ok ? { kind: 'confirm', backup: parsed.backup, checkIns: parsed.checkIns } : { kind: 'error', message: parsed.error })
  }

  const replace = (backup: Backup) => {
    onImport(backup)
    setPanel(null)
    setNotice(`Imported ${plural(backup.habits.length, 'habit')}`)
  }

  return (
    <div className="relative flex items-center gap-2">
      <span className="mr-1 text-[12px] text-muted" aria-live="polite">
        {notice}
      </span>
      <HeaderButton onClick={exportData} disabled={habits.length === 0} title={habits.length === 0 ? 'Nothing to export yet' : undefined}>
        <Download size={13} strokeWidth={2} />
        Export
      </HeaderButton>
      <HeaderButton onClick={() => fileInput.current?.click()}>
        <Upload size={13} strokeWidth={2} />
        Import
      </HeaderButton>
      <input ref={fileInput} type="file" accept="application/json,.json" className="hidden" onChange={readFile} />

      {panel && (
        <div
          role={panel.kind === 'error' ? 'alert' : 'dialog'}
          aria-label={panel.kind === 'error' ? undefined : 'Confirm import'}
          className="absolute top-full right-0 z-20 mt-2 w-[340px] rounded-[12px] border border-white/10 bg-[#161616] p-4 shadow-[0_12px_32px_rgb(0_0_0/0.5)]"
        >
          {panel.kind === 'error' ? (
            <>
              <p className="text-[13px] font-semibold">Couldn't import</p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">{panel.message}</p>
              <div className="mt-3 flex justify-end">
                <button type="button" autoFocus onClick={() => setPanel(null)} className="h-8 rounded-[7px] px-3 text-[12px] font-medium text-soft hover:bg-white/[0.05] hover:text-white">
                  Close
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-[13px] font-semibold">Replace your data with this backup?</p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">
                The backup has {plural(panel.backup.habits.length, 'habit')} and {plural(panel.checkIns, 'check-in')}. It
                replaces your current {plural(habits.length, 'habit')} and {plural(countCheckIns(log), 'check-in')}
                {habits.length > 0 ? '. Export first if you want to keep them.' : '.'}
              </p>
              <div className="mt-3 flex justify-end gap-2">
                <button type="button" autoFocus onClick={() => setPanel(null)} className="h-8 rounded-[7px] px-3 text-[12px] font-medium text-soft hover:bg-white/[0.05] hover:text-white">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => replace(panel.backup)}
                  className="h-8 rounded-[7px] bg-danger/15 px-3 text-[12px] font-semibold text-danger transition-colors hover:bg-danger/25"
                >
                  Replace data
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
