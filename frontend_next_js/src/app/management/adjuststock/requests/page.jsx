'use client'
import React, { useEffect, useState } from 'react'
import DefaultLayout from '@/components/Layouts/DefaultLayout'
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb'
import Menu from '@/components/Menu'
import apiaddress from '@/apirequests/apiaddress'
import { useGlobalState } from '@/js/globaluser'
import Image from 'next/image'

const STORAGE_KEY = 'adjust_requests_pw'
const DEFAULT_PASSWORD = '12345678'

function getStoredPassword() {
    if (typeof window === 'undefined') return DEFAULT_PASSWORD
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_PASSWORD
}

export default function AdjustRequestsPage() {
    const { user } = useGlobalState()

    // Auth state
    const [unlocked, setUnlocked] = useState(false)
    const [pwInput, setPwInput] = useState('')
    const [pwError, setPwError] = useState('')

    // Change password state
    const [showChangePw, setShowChangePw] = useState(false)
    const [newPw, setNewPw] = useState('')
    const [confirmPw, setConfirmPw] = useState('')
    const [pwChangeMsg, setPwChangeMsg] = useState('')

    // Requests state
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(false)
    const [filter, setFilter] = useState('pending')
    const [toast, setToast] = useState(null)
    const [reviewNotes, setReviewNotes] = useState({})

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3000)
    }

    const handleUnlock = () => {
        if (pwInput === getStoredPassword()) {
            setUnlocked(true)
            setPwError('')
            loadRequests()
        } else {
            setPwError('Incorrect password')
        }
    }

    const loadRequests = () => {
        setLoading(true)
        fetch(`${apiaddress}/management/products/getadjustrequests`)
            .then(r => r.json())
            .then(data => { setRequests(data); setLoading(false) })
            .catch(() => setLoading(false))
    }

    const handleApprove = async (requestId) => {
        try {
            const res = await fetch(`${apiaddress}/management/products/approveadjustrequest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, reviewedBy: user?._id, reviewNote: reviewNotes[requestId] || '' })
            })
            const data = await res.json()
            if (data.success) {
                showToast('Request approved — stock updated')
                loadRequests()
            } else {
                showToast(data.error || 'Failed', 'error')
            }
        } catch { showToast('Network error', 'error') }
    }

    const handleReject = async (requestId) => {
        try {
            const res = await fetch(`${apiaddress}/management/products/rejectadjustrequest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, reviewedBy: user?._id, reviewNote: reviewNotes[requestId] || '' })
            })
            const data = await res.json()
            if (data.success) {
                showToast('Request rejected', 'error')
                loadRequests()
            } else {
                showToast(data.error || 'Failed', 'error')
            }
        } catch { showToast('Network error', 'error') }
    }

    const handleChangePassword = () => {
        if (!newPw) { setPwChangeMsg('Password cannot be empty'); return }
        if (newPw !== confirmPw) { setPwChangeMsg('Passwords do not match'); return }
        localStorage.setItem(STORAGE_KEY, newPw)
        setPwChangeMsg('Password updated successfully!')
        setNewPw(''); setConfirmPw('')
        setTimeout(() => { setShowChangePw(false); setPwChangeMsg('') }, 1500)
    }

    const filteredRequests = requests.filter(r => filter === 'all' ? true : r.status === filter)

    const statusColor = (s) => {
        if (s === 'approved') return 'text-green-400'
        if (s === 'rejected') return 'text-red-400'
        return 'text-yellow-400'
    }

    if (!user) return null

    // Lock screen
    if (!unlocked) {
        return (
            <Menu>
                <DefaultLayout>
                    <div className="flex items-center justify-center min-h-screen bg-boxdark">
                        <div className="bg-boxdark-2 border border-blue-600 rounded-xl p-10 w-full max-w-sm flex flex-col items-center space-y-5 shadow-2xl">
                            <div className="text-4xl mb-2">🔒</div>
                            <h2 className="text-white text-xl font-bold">Requests Portal</h2>
                            <p className="text-slate-400 text-sm text-center">Enter the supervisor password to access this page</p>
                            <input
                                type="password"
                                value={pwInput}
                                onChange={e => setPwInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                                placeholder="Password"
                                className="w-full rounded border border-slate-500 bg-boxdark px-4 py-2 text-white text-center outline-none focus:border-blue-500 tracking-widest"
                            />
                            {pwError && <p className="text-red-400 text-sm">{pwError}</p>}
                            <button
                                onClick={handleUnlock}
                                className="w-full py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
                            >
                                Unlock
                            </button>
                        </div>
                    </div>
                </DefaultLayout>
            </Menu>
        )
    }

    return (
        <Menu>
            <DefaultLayout>
                <div className="mx-auto max-w-270">
                    <Breadcrumb pageName="Stock Adjust Requests" />
                </div>

                {/* Toast */}
                {toast && (
                    <div className={`fixed top-5 right-5 z-[99999] px-5 py-3 rounded-lg shadow-xl text-white font-semibold text-sm ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
                        {toast.msg}
                    </div>
                )}

                <div className="min-h-screen bg-boxdark text-white">
                    {/* Top controls */}
                    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-600">
                        <div className="flex gap-2">
                            {['pending', 'approved', 'rejected', 'all'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1 rounded text-sm font-semibold capitalize transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-boxdark-2 text-slate-300 hover:bg-slate-600'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowChangePw(v => !v)}
                                className="px-4 py-2 rounded-md bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm transition-colors"
                            >
                                Change Password
                            </button>
                            <button
                                onClick={() => setUnlocked(false)}
                                className="px-4 py-2 rounded-md bg-slate-600 hover:bg-slate-500 text-white font-semibold text-sm transition-colors"
                            >
                                Lock
                            </button>
                        </div>
                    </div>

                    {/* Change password panel */}
                    {showChangePw && (
                        <div className="mx-4 mt-4 p-5 bg-boxdark-2 border border-orange-500 rounded-xl flex flex-wrap gap-3 items-end">
                            <div className="flex flex-col gap-1">
                                <label className="text-slate-400 text-xs">New Password</label>
                                <input
                                    type="password"
                                    value={newPw}
                                    onChange={e => setNewPw(e.target.value)}
                                    className="rounded border border-slate-500 bg-boxdark px-3 py-2 text-white outline-none focus:border-orange-400"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-slate-400 text-xs">Confirm Password</label>
                                <input
                                    type="password"
                                    value={confirmPw}
                                    onChange={e => setConfirmPw(e.target.value)}
                                    className="rounded border border-slate-500 bg-boxdark px-3 py-2 text-white outline-none focus:border-orange-400"
                                />
                            </div>
                            <button
                                onClick={handleChangePassword}
                                className="px-4 py-2 rounded-md bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm transition-colors"
                            >
                                Save Password
                            </button>
                            {pwChangeMsg && <span className={`text-sm font-semibold ${pwChangeMsg.includes('success') ? 'text-green-400' : 'text-red-400'}`}>{pwChangeMsg}</span>}
                        </div>
                    )}

                    {/* Table header */}
                    <div className="flex items-center bg-blue-600 text-white text-sm font-semibold px-3 py-2 mt-3">
                        <div className="w-12">Img</div>
                        <div className="flex-1 pl-2">Product</div>
                        <div className="w-20 text-center">Type</div>
                        <div className="w-20 text-center">Qty</div>
                        <div className="w-24 text-center">Before</div>
                        <div className="w-24 text-center">After</div>
                        <div className="w-28 text-center">Requested By</div>
                        <div className="w-24 text-center">Status</div>
                        <div className="w-48 text-center">Note / Actions</div>
                    </div>

                    {loading ? (
                        <div className="text-center py-20 text-slate-400">Loading...</div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="text-center py-20 text-slate-400">No {filter} requests</div>
                    ) : (
                        filteredRequests.map((req, idx) => (
                            <div key={req._id} className={`flex items-center px-3 py-2 text-sm ${idx % 2 === 0 ? 'bg-boxdark' : 'bg-boxdark-2'}`}>
                                {/* Image */}
                                <div className="w-12">
                                    {req.product?.picture?.[0] ? (
                                        <Image
                                            src={`${apiaddress}${req.product.picture[0]}`}
                                            alt={req.productName}
                                            width={36}
                                            height={36}
                                            className="rounded object-cover"
                                        />
                                    ) : <div className="w-9 h-9 bg-slate-600 rounded" />}
                                </div>

                                {/* Product name */}
                                <div className="flex-1 pl-2">
                                    <p className="font-semibold">{req.productName}</p>
                                    <p className="text-slate-400 text-xs">{new Date(req.createdAt).toLocaleString()}</p>
                                </div>

                                {/* Type */}
                                <div className={`w-20 text-center font-semibold ${req.adjustType === 'increase' ? 'text-green-400' : 'text-red-400'}`}>
                                    {req.adjustType === 'increase' ? '▲ Add' : '▼ Sub'}
                                </div>

                                {/* Qty */}
                                <div className="w-20 text-center font-bold">{req.qty}</div>

                                {/* Before */}
                                <div className="w-24 text-center">{req.onHandBefore}</div>

                                {/* After */}
                                <div className="w-24 text-center">{req.onHandAfter}</div>

                                {/* Requested by */}
                                <div className="w-28 text-center text-slate-300 text-xs">
                                    {req.requestedBy?.username || '—'}
                                </div>

                                {/* Status */}
                                <div className={`w-24 text-center font-semibold capitalize ${statusColor(req.status)}`}>
                                    {req.status}
                                </div>

                                {/* Note + actions */}
                                <div className="w-48 flex flex-col gap-1 items-center">
                                    {req.status === 'pending' ? (
                                        <>
                                            <input
                                                type="text"
                                                placeholder="Note (optional)"
                                                value={reviewNotes[req._id] || ''}
                                                onChange={e => setReviewNotes(n => ({ ...n, [req._id]: e.target.value }))}
                                                className="w-full rounded border border-slate-500 bg-boxdark px-2 py-1 text-white text-xs outline-none focus:border-blue-400"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleApprove(req._id)}
                                                    className="px-3 py-1 rounded bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition-colors"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(req._id)}
                                                    className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <span className="text-slate-400 text-xs text-center">
                                            {req.reviewNote || '—'}
                                            {req.reviewedBy?.username && <span className="block text-slate-500">by {req.reviewedBy.username}</span>}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </DefaultLayout>
        </Menu>
    )
}
