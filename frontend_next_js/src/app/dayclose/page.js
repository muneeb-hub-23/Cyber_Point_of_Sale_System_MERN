"use client";
import apiaddress from "@/apirequests/apiaddress";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { useState, useRef } from "react";
import Menu from "@/components/Menu";
import { useGlobalState } from "@/js/globaluser";
import LoginPage from "@/app/authentication/login/page";

const fmtTime = (s) => {
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

const ProgressPopup = ({ progress, onClose }) => (
  <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70">
    <div className="bg-boxdark border border-blue-600 rounded-2xl shadow-2xl p-8 w-full max-w-lg mx-4 flex flex-col gap-5">
      <h2 className="text-white text-xl font-bold text-center">
        {progress.title}
      </h2>

      {/* Progress bar */}
      <div className="w-full bg-slate-700 rounded-full h-5 overflow-hidden">
        <div
          className="h-5 rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
          style={{ width: `${progress.percent}%` }}
        />
      </div>

      <div className="flex justify-between text-sm font-semibold text-slate-300">
        <span>{progress.percent}%</span>
        <span>Step {progress.step} / {progress.total}</span>
      </div>

      {/* Current step */}
      <p className="text-blue-300 text-sm text-center truncate">{progress.label}</p>

      {/* Time stats */}
      <div className="flex justify-around text-sm text-slate-400">
        <div className="flex flex-col items-center gap-1">
          <span className="text-white font-bold text-lg">{fmtTime(progress.elapsed)}</span>
          <span>Elapsed</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-yellow-400 font-bold text-lg">
            {progress.done ? '0s' : fmtTime(progress.remaining)}
          </span>
          <span>Remaining</span>
        </div>
      </div>

      {progress.done && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-green-400 font-bold text-center">{progress.label}</p>
          {progress.fileName && (
            <p className="text-slate-400 text-xs text-center">Saved as: {progress.fileName}</p>
          )}
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold transition-colors"
          >
            Close
          </button>
        </div>
      )}

      {progress.error && (
        <p className="text-red-400 font-semibold text-center">{progress.errorMsg}</p>
      )}
    </div>
  </div>
)

const Page = () => {
  const { user } = useGlobalState()
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : ''
  const [file, setFile] = useState(null)
  const [progress, setProgress] = useState(null)
  const fileInputRef = useRef(null)

  const resetProgress = () => setProgress(null)

  const startBackup = () => {
    setProgress({ title: 'Backing Up Database', step: 0, total: 16, percent: 0, label: 'Starting...', elapsed: 0, remaining: 0, done: false })

    const es = new EventSource(`${apiaddress}/database/backupdatabase?token=${token}`)
    es.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.error) {
        setProgress(p => ({ ...p, error: true, errorMsg: data.message }))
        es.close(); return
      }
      setProgress(p => ({ ...p, ...data, title: 'Backing Up Database' }))
      if (data.done) es.close()
    }
    es.onerror = () => {
      setProgress(p => ({ ...p, error: true, errorMsg: 'Connection lost' }))
      es.close()
    }
  }

  const startRestore = async () => {
    if (!file) { alert('Please select a backup file first.'); return }
    setProgress({ title: 'Restoring Database', step: 0, total: 32, percent: 0, label: 'Uploading file...', elapsed: 0, remaining: 0, done: false })

    const formData = new FormData()
    formData.append('backupFile', file)

    try {
      const res = await fetch(`${apiaddress}/email/restoredata`, {
        method: 'POST',
        headers: { token },
        body: formData,
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n\n')
        buf = lines.pop()
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))
            if (data.error) {
              setProgress(p => ({ ...p, error: true, errorMsg: data.message }))
              return
            }
            setProgress(p => ({ ...p, ...data, title: 'Restoring Database' }))
          }
        }
      }
    } catch (err) {
      setProgress(p => ({ ...p, error: true, errorMsg: err.message || 'Restore failed' }))
    }
  }

  if (user && user.permissions.includes("dayclose")) {
    return (
      <Menu>
        <DefaultLayout>
          <div className="mx-auto max-w-270">
            <Breadcrumb pageName="Backup / Restore" />
          </div>

          {progress && <ProgressPopup progress={progress} onClose={resetProgress} />}

          <div className="flex items-center justify-center py-20 bg-boxdark min-h-screen">
            <div className="bg-black p-10 rounded-2xl shadow-2xl flex flex-col gap-8 w-full max-w-md">
              <h1 className="text-white text-2xl font-bold text-center">Backup / Restore</h1>

              {/* Backup */}
              <div className="flex flex-col gap-3">
                <p className="text-slate-400 text-sm text-center">Export all data to a backup file saved on the server.</p>
                <button
                  onClick={startBackup}
                  className="w-full rounded-xl p-4 text-white font-bold text-lg bg-gradient-to-r from-green-600 to-green-800 border-2 border-green-500 hover:scale-105 transition-transform duration-200"
                >
                  Backup Database
                </button>
              </div>

              {/* Restore */}
              {user.permissions.includes("loaddatafromfile") && (
                <div className="flex flex-col gap-3 border-t border-slate-700 pt-6">
                  <p className="text-slate-400 text-sm text-center">Select a backup file to restore the database.</p>
                  <label className="w-full cursor-pointer rounded-xl p-4 text-white font-bold text-lg bg-gradient-to-r from-slate-700 to-slate-900 border-2 border-slate-500 hover:border-blue-400 transition-colors text-center">
                    {file ? file.name : 'Choose Backup File (.txt)'}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt"
                      className="hidden"
                      onChange={e => setFile(e.target.files[0])}
                    />
                  </label>
                  <button
                    onClick={startRestore}
                    disabled={!file}
                    className={`w-full rounded-xl p-4 text-white font-bold text-lg border-2 transition-transform duration-200 ${file ? 'bg-gradient-to-r from-rose-600 to-rose-800 border-rose-500 hover:scale-105' : 'bg-slate-700 border-slate-600 opacity-50 cursor-not-allowed'}`}
                  >
                    Restore Database
                  </button>
                </div>
              )}
            </div>
          </div>
        </DefaultLayout>
      </Menu>
    )
  } else {
    return <LoginPage />
  }
}

export default Page;
