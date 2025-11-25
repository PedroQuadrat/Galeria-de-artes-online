import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [obras, setObras] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Estados do Formulário
  const [novoNome, setNovoNome] = useState('')
  const [novoArtista, setNovoArtista] = useState('')
  const [novaDescricao, setNovaDescricao] = useState('')
  const [arquivoImagem, setArquivoImagem] = useState(null)
  const [uploading, setUploading] = useState(false)

  const API_BASE = 'https://deploy-automatico-pq-d3hxfvdbeea5b0b9.canadacentral-01.azurewebsites.net/api';

  const carregarObras = () => {
    fetch(`${API_BASE}/getObras`)
      .then(res => res.json())
      .then(data => {
        setObras(data)
        setLoading(false)
      })
      .catch(err => console.error(err))
  }

  useEffect(() => {
    carregarObras()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!arquivoImagem) return alert("Selecione uma imagem!");

    setUploading(true);
    
    const formData = new FormData();
    formData.append('nome', novoNome);
    formData.append('artista', novoArtista);
    formData.append('descricao', novaDescricao);
    formData.append('imagem', arquivoImagem);

    try {
      const response = await fetch(`${API_BASE}/postObra`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        alert("Obra cadastrada com sucesso!");
        setNovoNome(''); setNovoArtista(''); setNovaDescricao(''); setArquivoImagem(null);
        carregarObras();
      } else {
        alert("Erro ao enviar.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro na conexão.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="container">
      <header>
        <h1>🎨 Galeria de Artes Azure</h1>
      </header>

      {/* --- ÁREA DE UPLOAD --- */}
      <section className="upload-section">
        <h3>Adicionar Nova Obra</h3>
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Nome da Obra" value={novoNome} onChange={e => setNovoNome(e.target.value)} required />
          <input type="text" placeholder="Artista" value={novoArtista} onChange={e => setNovoArtista(e.target.value)} required />
          <textarea placeholder="Descrição" value={novaDescricao} onChange={e => setNovaDescricao(e.target.value)} />
          <input type="file" accept="image/*" onChange={e => setArquivoImagem(e.target.files[0])} required />
          <button type="submit" disabled={uploading}>
            {uploading ? 'Enviando...' : 'Enviar Obra'}
          </button>
        </form>
      </section>
      {/* ---------------------- */}

      <hr />

      {loading ? <p>Carregando...</p> : (
        <div className="gallery-grid">
          {obras.map(obra => (
            <div key={obra.id} className="card">
              <div className="image-container">
                 <img src={obra.url_imagem} alt={obra.nome} />
              </div>
              <div className="info">
                <h2>{obra.nome}</h2>
                <h3>{obra.artista}</h3>
                <p>{obra.descricao}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App