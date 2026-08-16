'use client'
import React, { useState, useRef } from 'react'
import DefaultLayout from '@/components/Layouts/DefaultLayout'
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb'
import Menu from '@/components/Menu'
import apiaddress from '@/apirequests/apiaddress'
import { useGlobalState } from '@/js/globaluser'
import Image from 'next/image'
import Link from 'next/link'

export default function AdjustStockPage() {
    const { user } = useGlobalState()
    const [itemCode, setItemCode] = useState('')
    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(false)
    const [notFound, setNotFound] = useState(false)
    const [adjustQty, setAdjustQty] = useState('')
    const [reason, setReason] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [toast, setToast] = useState(null)
    const qtyRef = useRef(null)

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3000)
    }

    const searchProduct = async () => {
        const code = itemCode.trim()
        if (!code) return
        setLoading(true)
        setNotFound(false)
        setProduct(null)
        setAdjustQty('')
        setReason('')
        try {
            const res = await fetch(`${apiaddress}/management/products/getproductbyitemcode`, {
                headers: { itemcode: code }
            })
            const data = await res.json()
            if (data && data._id) {
                setProduct(data)
                setTimeout(() => qtyRef.current && qtyRef.current.focus(), 100)
            } else {
                setNotFound(true)
            }
        } catch {
            setNotFound(true)
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') searchProduct()
    }

    const handleAdjust = async (type) => {
        const qty = Number(adjustQty)
        if (!qty || qty <= 0) {
            showToast('Enter a valid quantity greater than 0', 'error')
            return
        }
        setSubmitting(true)
        try {
            const res = await fetch(`${apiaddress}/management/products/createadjustrequest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: product._id,
                    adjustType: type,
                    qty,
                    reason: reason.trim(),
                    requestedBy: user._id,
                })
            })
            const data = await res.json()
            if (res.ok && data.success) {
                showToast(`Request to ${type} ${qty} of "${product.name}" submitted for approval`)
                setAdjustQty('')
                setReason('')
                setProduct(null)
                setItemCode('')
            } else {
                showToast(data.error || 'Failed to submit request', 'error')
            }
        } catch {
            showToast('Network error', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    if (!user) return null

    return (
        <Menu>
            <DefaultLayout>
                <div className="mx-auto max-w-270">
                    <Breadcrumb pageName="Adjust Stock" />
                </div>

                {/* Toast */}
                {toast && (
                    <div className={`fixed top-5 right-5 z-[99999] px-5 py-3 rounded-lg shadow-xl text-white font-semibold text-sm transition-all ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
                        {toast.msg}
                    </div>
                )}

                <div className="min-h-screen bg-boxdark text-white">
                    {/* Top bar */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-600">
                        <div className="flex items-center gap-3 flex-1">
                            <input
                                type="text"
                                placeholder="Enter product code and press Enter..."
                                value={itemCode}
                                onChange={e => { setItemCode(e.target.value); setNotFound(false) }}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                className="w-full max-w-md rounded border border-slate-500 bg-boxdark-2 px-4 py-2 text-white placeholder-slate-400 outline-none focus:border-blue-500"
                            />
                            <button
                                onClick={searchProduct}
                                disabled={loading}
                                className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm border border-blue-400 transition-colors whitespace-nowrap"
                            >
                                {loading ? 'Searching...' : 'Search'}
                            </button>
                        </div>
                        <Link href="/management/adjuststock/requests">
                            <button className="ml-4 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm border border-blue-400 transition-colors whitespace-nowrap">
                                View Requests
                            </button>
                        </Link>
                    </div>

                    {/* Not found message */}
                    {notFound && (
                        <div className="text-center py-10 text-red-400 text-lg">
                            No product found with item code <span className="font-bold">{itemCode}</span>
                        </div>
                    )}

                    {/* Empty state */}
                    {!product && !notFound && !loading && (
                        <div className="text-center py-20 text-slate-500 text-lg">
                            Enter a product code above to get started
                        </div>
                    )}

                    {/* Product card */}
                    {product && (
                        <div className="max-w-xl mx-auto mt-10 rounded-xl border border-slate-600 bg-boxdark-2 p-6 shadow-lg">
                            <div className="flex items-center gap-5 mb-6">
                                <Image
                                    src={`${apiaddress}${product.picture?.[0] || '/images/products/default.png'}`}
                                    alt={product.name}
                                    width={70}
                                    height={70}
                                    className="rounded-lg object-cover border border-slate-600"
                                />
                                <div>
                                    <p className="text-xl font-bold text-white">{product.name}</p>
                                    <p className="text-slate-400 text-sm mt-1">Item Code: <span className="text-blue-400 font-semibold">#{product.itemCode}</span></p>
                                    <p className="text-slate-400 text-sm">On Hand: <span className="text-yellow-400 font-bold text-base">{product.onHand}</span></p>
                                    <p className="text-slate-400 text-sm">Sale Price: <span className="text-green-400 font-semibold">{product.sale?.toFixed(2)}</span></p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-sm text-slate-300 mb-1">Quantity</label>
                                    <input
                                        ref={qtyRef}
                                        type="number"
                                        min="1"
                                        value={adjustQty}
                                        onChange={e => setAdjustQty(e.target.value)}
                                        placeholder="Enter quantity"
                                        className="w-full rounded border border-slate-500 bg-boxdark px-4 py-2 text-white outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-300 mb-1">Reason (optional)</label>
                                    <input
                                        type="text"
                                        value={reason}
                                        onChange={e => setReason(e.target.value)}
                                        placeholder="Enter reason for adjustment"
                                        className="w-full rounded border border-slate-500 bg-boxdark px-4 py-2 text-white outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div className="flex gap-3 mt-2">
                                    <button
                                        disabled={submitting}
                                        onClick={() => handleAdjust('increase')}
                                        className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-bold text-sm transition-colors"
                                    >
                                        + Add Stock
                                    </button>
                                    <button
                                        disabled={submitting}
                                        onClick={() => handleAdjust('decrease')}
                                        className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold text-sm transition-colors"
                                    >
                                        − Subtract Stock
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </DefaultLayout>
        </Menu>
    )
}
