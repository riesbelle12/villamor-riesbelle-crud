import { useRef, useState } from 'react'
import LoginForm from './components/LoginForm.jsx'

const emptyForm = { product_name: '', description: '', price: '', quantity: '' }
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

async function api(path, options = {}, currentTokens = null, onTokens = () => {}) {
  const { headers: requestHeaders = {}, ...requestOptions } = options
  const send = (accessToken) => fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers: {
      ...(requestOptions.body ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...requestHeaders,
    },
  })
  const readBody = async (response) => {
    const text = await response.text()
    if (!text.trim()) return null

    try {
      return JSON.parse(text)
    } catch {
      return null
    }
  }

  let response = await send(currentTokens?.access_token)
  let body = await readBody(response)

  if (response.status === 401 && currentTokens?.refresh_token && path !== '/api/refresh') {
    const refreshResponse = await fetch(`${API_BASE_URL}/api/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: currentTokens.refresh_token }),
    })
    const refreshBody = await readBody(refreshResponse)

    if (!refreshResponse.ok || !refreshBody?.tokens?.access_token) {
      onTokens(null)
      throw new Error(refreshBody?.error || `Session refresh failed (HTTP ${refreshResponse.status}).`)
    }

    currentTokens = refreshBody.tokens
    onTokens(currentTokens)
    response = await send(currentTokens.access_token)
    body = await readBody(response)
  }

  if (!response.ok) {
    if (response.status === 401 && currentTokens) onTokens(null)
    throw new Error(body?.error || body?.message || `Request failed (HTTP ${response.status}).`)
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error(`The API returned an invalid response (HTTP ${response.status}). Check the backend service logs.`)
  }

  return body
}

export default function App() {
  const [user, setUser] = useState(null)
  const [tokens, setTokens] = useState(null)
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [login, setLogin] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const productSubmitting = useRef(false)
  const [productLoading, setProductLoading] = useState(false)

  const updateTokens = (nextTokens) => {
    setTokens(nextTokens)
    if (!nextTokens) {
      setUser(null)
      setProducts([])
    }
  }

  const loadProducts = async (sessionTokens = tokens) => {
    const data = await api('/api/products', {}, sessionTokens, updateTokens)
    setProducts(data.products ?? data.data ?? [])
  }

  const submitLogin = async (event) => {
    event.preventDefault()
    setError('')
    setLoginLoading(true)
    try {
      const data = await api('/api/login', { method: 'POST', body: JSON.stringify(login) })
      const nextTokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      }
      updateTokens(nextTokens)
      setUser(data.user)
      await loadProducts(nextTokens)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoginLoading(false)
    }
  }

  const submitProduct = async (event) => {
    event.preventDefault()
    if (productSubmitting.current) return

    productSubmitting.current = true
    setProductLoading(true)
    setError('')
    try {
      const path = editingId ? `/api/products/${editingId}` : '/api/products'
      const data = await api(path, {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify({ ...form, price: Number(form.price), quantity: Number(form.quantity) }),
      }, tokens, updateTokens)
      if (data.products || data.data) setProducts(data.products ?? data.data)
      else await loadProducts()
      setForm(emptyForm)
      setEditingId(null)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      productSubmitting.current = false
      setProductLoading(false)
    }
  }

  const editProduct = (product) => {
    setEditingId(product.id)
    setForm({ product_name: product.product_name, description: product.description || '', price: product.price, quantity: product.quantity })
  }

  const deleteProduct = async (product) => {
    if (!window.confirm(`Delete "${product.product_name}"? This cannot be undone.`)) return
    try {
      const data = await api(`/api/products/${product.id}`, { method: 'DELETE' }, tokens, updateTokens)
      if (data.products || data.data) setProducts(data.products ?? data.data)
      else await loadProducts()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const logout = async () => {
    if (!window.confirm('Sign out of your account?')) return

    setError('')
    try {
      await api('/api/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: tokens?.refresh_token || '' }),
      }, tokens, updateTokens)
      updateTokens(null)
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  if (!user) return <LoginForm login={login} setLogin={setLogin} onSubmit={submitLogin} error={error} isSubmitting={loginLoading} />

  return (
    <main className="shell">
      <header className="topbar">
        <div><p className="eyebrow">Dahlia collection</p><h1>Products</h1><p className="muted">A bright little inventory garden, ready to grow.</p></div>
        <div className="account"><span>{user.username}</span><button className="text-button" onClick={logout}>Sign out</button></div>
      </header>
      {error && <p className="alert">{error}</p>}
      <section className="workspace">
        <form className="panel form-panel" onSubmit={submitProduct}>
          <p className="eyebrow">{editingId ? 'EDIT ITEM' : 'NEW ITEM'}</p>
          <h2>{editingId ? 'Update product' : 'Add a product'}</h2>
          <label>Name<input required minLength="2" maxLength="100" disabled={productLoading} value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} /></label>
          <label>Description<textarea disabled={productLoading} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <div className="two-up"><label>Price<input required type="number" min="0" step="0.01" disabled={productLoading} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label><label>Quantity<input required type="number" min="0" disabled={productLoading} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></label></div>
          <button className="primary" type="submit" disabled={productLoading}>{productLoading ? (editingId ? 'Saving...' : 'Adding...') : (editingId ? 'Save changes' : 'Add product')}</button>
          {editingId && <button className="text-button" type="button" disabled={productLoading} onClick={() => { setEditingId(null); setForm(emptyForm) }}>Cancel edit</button>}
        </form>
        <section className="panel inventory"><div className="section-heading"><div><p className="eyebrow">LIVE CATALOG</p><h2>{products.length} products</h2></div><span className="status">Connected</span></div><div className="table-wrap"><table><thead><tr><th>Product</th><th>Price</th><th>Qty</th><th></th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td><strong>{product.product_name}</strong><small>{product.description}</small></td><td>${Number(product.price).toFixed(2)}</td><td>{product.quantity}</td><td className="actions"><button onClick={() => editProduct(product)}>Edit</button><button className="danger" onClick={() => deleteProduct(product)}>Delete</button></td></tr>)}{products.length === 0 && <tr><td colSpan="4" className="empty">No products yet.</td></tr>}</tbody></table></div></section>
      </section>
    </main>
  )
}
