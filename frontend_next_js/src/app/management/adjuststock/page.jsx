'use client'
import React, { useState } from 'react'
import DefaultLayout from '@/components/Layouts/DefaultLayout'
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb'
import Menu from '@/components/Menu'
import apiaddress from '@/apirequests/apiaddress'
import { useGlobalState } from '@/js/globaluser'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AdjustStockPage() {
    const { user } = useGlobalState()
    const router = useRouter()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(false)
    const [searched, setSearched] = useState(false)
    const [search, setSearch] = useState('')
    const [adjustValues, setAdjustValues] = useState({})
    const [submitting, setSubmitting] = useState({})
    const [toast, setToast] = useState(null)

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3000)
    }

    const searchProducts = async () => {
        const query = search.trim()
        if (!query) {
            setProducts([])
            setSearched(false)
            return
        }
        setLoading(true)
        try {
            const res = await fetch(`${apiaddress}/management/products/searchproducts?query=${encodeURIComponent(query)}`)
            const data = await res.json()
            setProducts(Array.isArray(data) ? data : [])
        } catch {
            setProducts([])
            showToast('Network error', 'error')
        } finally {
            setSearched(true)
            setLoading(false)
        }
    }

    const handleAdjust = async (product, type) => {
        const qty = Number(adjustValues[product._id] || 0)
        if (!qty || qty <= 0) {
            showToast('Enter a valid quantity greater than 0', 'error')
            return
        }
        setSubmitting(s => ({ ...s, [product._id]: true }))
        try {
            const res = await fetch(`${apiaddress}/management/products/createadjustrequest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: product._id,
                    adjustType: type,
                    qty,
                    reason: '',
                    requestedBy: user._id,
                })
            })
            const data = await res.json()
            if (res.ok && data.success) {
                showToast(`Request to ${type} ${qty} of "${product.name}" submitted for approval`)
                setAdjustValues(v => ({ ...v, [product._id]: '' }))
            } else {
                showToast(data.error || 'Failed to submit request', 'error')
            }
        } catch (err) {
            showToast('Network error', 'error')
        } finally {
            setSubmitting(s => ({ ...s, [product._id]: false }))
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
                        <input
                            type="text"
                            placeholder="Type item code or name and press Enter..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && searchProducts()}
                            className="w-full max-w-md rounded border border-slate-500 bg-boxdark-2 px-4 py-2 text-white placeholder-slate-400 outline-none focus:border-blue-500"
                        />
                        <Link href="/management/adjuststock/requests">
                            <button className="ml-4 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm border border-blue-400 transition-colors whitespace-nowrap">
                                View Requests
                            </button>
                        </Link>
                    </div>

                    {/* Header row */}
                    <div className="flex items-center bg-blue-600 text-white text-sm font-semibold px-3 py-2 mt-2">
                        <div className="w-12">Image</div>
                        <div className="flex-1 pl-3">Product Name</div>
                        <div className="w-24 text-center">Sale Price</div>
                        <div className="w-24 text-center">On Hand</div>
                        <div className="w-52 text-center">Adjust Qty</div>
                        <div className="w-40 text-center">Actions</div>
                    </div>

                    {loading ? (
                        <div className="text-center py-20 text-slate-400">Loading products...</div>
                    ) : !searched ? (
                        <div className="text-center py-20 text-slate-400">Type an item code or name and press Enter to load a product</div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-20 text-slate-400">No products found for &quot;{search}&quot;</div>
                    ) : (
                        products.map((product, idx) => (
                            <div
                                key={product._id}
                                className={`flex items-center px-3 py-2 text-sm ${idx % 2 === 0 ? 'bg-boxdark' : 'bg-boxdark-2'}`}
                            >
                                {/* Image */}
                                <div className="w-12">
                                    <Image
                                        src={`${apiaddress}${product.picture?.[0] || '/images/products/default.png'}`}
                                        alt={product.name}
                                        width={40}
                                        height={40}
                                        className="rounded object-cover"
                                    />
                                </div>

                                {/* Name */}
                                <div className="flex-1 pl-3">
                                    <p className="font-semibold">{product.name}</p>
                                    <p className="text-slate-400 text-xs">#{product.itemCode}</p>
                                </div>

                                {/* Sale price */}
                                <div className="w-24 text-center text-green-400 font-semibold">
                                    {product.sale?.toFixed(2)}
                                </div>

                                {/* On hand */}
                                <div className="w-24 text-center font-bold">
                                    {product.onHand}
                                </div>

                                {/* Qty input */}
                                <div className="w-52 flex justify-center">
                                    <input
                                        type="number"
                                        min="1"
                                        value={adjustValues[product._id] || ''}
                                        onChange={e => setAdjustValues(v => ({ ...v, [product._id]: e.target.value }))}
                                        placeholder="Qty"
                                        className="w-24 rounded border border-slate-500 bg-boxdark-2 px-2 py-1 text-white text-center outline-none focus:border-blue-500"
                                    />
                                </div>

                                {/* Buttons */}
                                <div className="w-40 flex gap-2 justify-center">
                                    <button
                                        disabled={submitting[product._id]}
                                        onClick={() => handleAdjust(product, 'increase')}
                                        className="px-3 py-1 rounded bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-bold text-sm transition-colors"
                                    >
                                        + Add
                                    </button>
                                    <button
                                        disabled={submitting[product._id]}
                                        onClick={() => handleAdjust(product, 'decrease')}
                                        className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold text-sm transition-colors"
                                    >
                                        − Sub
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </DefaultLayout>
        </Menu>
    )
}
