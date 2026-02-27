import React, { useState } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { useStore } from '../context/StoreContext';

const EMOJI_OPTIONS = ['🛒','🧹','🔧','💡','📦','🥤','🧴','✏️','🍞','🧀','🥩','🧃','🔌','🪣','🪥','🛁','🧰','🪚','🔨','🏠','🌿','🎁','💊','🐾','🚗'];

export default function AdminCategories() {
  const { categories, products, addCategory, deleteCategory } = useStore();
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('📦');
  const [newDesc, setNewDesc] = useState('');
  const [error, setError] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) { setError('Category name is required'); return; }
    if (categories.some(c => c.name.toLowerCase() === newName.trim().toLowerCase())) {
      setError('A category with this name already exists');
      return;
    }
    addCategory({ name: newName.trim(), icon: newIcon, description: newDesc.trim() });
    setNewName(''); setNewDesc(''); setNewIcon('📦'); setError('');
  };

  return (
    <AdminLayout>
      <div style={{ padding: 32, maxWidth: 900 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 36, color: '#1e293b', margin: 0 }}>Categories</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Organise your products into categories</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
          {/* Categories list */}
          <div>
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: 15, color: '#1e293b' }}>Active Categories ({categories.length})</h3>
              </div>
              <div>
                {categories.map(cat => {
                  const count = products.filter(p => p.category === cat.id).length;
                  return (
                    <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: 32, flexShrink: 0 }}>{cat.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{cat.name}</div>
                        {cat.description && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{cat.description}</div>}
                      </div>
                      <span style={{ background: '#f1f5f9', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: '#64748b' }}>
                        {count} product{count !== 1 ? 's' : ''}
                      </span>
                      <button
                        onClick={() => {
                          if (count > 0) { alert(`Cannot delete: ${count} product(s) are in this category. Reassign them first.`); return; }
                          if (window.confirm(`Delete "${cat.name}"?`)) deleteCategory(cat.id);
                        }}
                        style={{ background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', display: 'flex' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Add category form */}
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', padding: 24, height: 'fit-content' }}>
            <h3 style={{ margin: '0 0 20px', fontWeight: 800, fontSize: 16, color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>Add New Category</h3>

            <form onSubmit={handleAdd}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Choose Icon</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 8 }}>
                  {EMOJI_OPTIONS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewIcon(emoji)}
                      style={{
                        fontSize: 22, padding: 8, borderRadius: 8, border: `2px solid ${newIcon === emoji ? '#f97316' : '#e2e8f0'}`,
                        background: newIcon === emoji ? '#fff7ed' : 'white', cursor: 'pointer',
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div style={{ textAlign: 'center', fontSize: 12, color: '#64748b' }}>Selected: {newIcon}</div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Category Name *</label>
                <input
                  value={newName}
                  onChange={e => { setNewName(e.target.value); setError(''); }}
                  placeholder="e.g. Frozen Foods"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: `2px solid ${error ? '#ef4444' : '#e2e8f0'}`, fontSize: 14, fontFamily: 'Barlow, sans-serif', boxSizing: 'border-box', outline: 'none' }}
                />
                {error && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{error}</p>}
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>Description (optional)</label>
                <input
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Brief description of this category"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '2px solid #e2e8f0', fontSize: 14, fontFamily: 'Barlow, sans-serif', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>

              <button type="submit" style={{
                width: '100%', background: '#f97316', color: 'white', border: 'none', borderRadius: 10,
                padding: '13px 0', fontWeight: 800, fontSize: 16, cursor: 'pointer',
                fontFamily: 'Barlow Condensed, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <PlusCircle size={18} /> Add Category
              </button>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
