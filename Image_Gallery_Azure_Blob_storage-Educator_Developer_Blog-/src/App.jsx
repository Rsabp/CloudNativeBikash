import { useEffect, useState } from 'react';
import './App.css';
import { AiFillDelete } from 'react-icons/ai';
import { FaImage, FaVideo, FaMusic, FaFacebook, FaInstagram, FaTwitter } from 'react-icons/fa';
import Placeholder from './assets/placeholder.jpeg';
import Loading from './components/Loading';
import { BlobServiceClient } from '@azure/storage-blob';

const App = () => {
  const [files, setFiles] = useState({ image: null, video: null, audio: null });
  const [mediaUrls, setMediaUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  const account = import.meta.env.VITE_STORAGE_ACCOUNT;
  const sasToken = import.meta.env.VITE_STORAGE_SAS;
  const containerName = import.meta.env.VITE_STORAGE_CONTAINER;
  const blobServiceClient = new BlobServiceClient(`https://${account}.blob.core.windows.net/?${sasToken}`);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  const getFileType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (['mp4', 'webm', 'ogg'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg'].includes(ext)) return 'audio';
    return 'other';
  };

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const urls = [];
      const blobItems = containerClient.listBlobsFlat();
      for await (const blob of blobItems) {
        const type = getFileType(blob.name);
        const blobClient = containerClient.getBlockBlobClient(blob.name);
        urls.push({ name: blob.name, url: blobClient.url, type });
      }
      setMediaUrls(urls.reverse());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (type) => {
    const file = files[type];
    if (!file) return alert(`No ${type} file selected.`);
    try {
      setLoading(true);
      const blobName = `${Date.now()}-${file.name}`;
      const blobClient = containerClient.getBlockBlobClient(blobName);
      await blobClient.uploadData(file, {
        blobHTTPHeaders: { blobContentType: file.type }
      });
      setFiles({ ...files, [type]: null });
      fetchMedia();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (blobName) => {
    try {
      setLoading(true);
      const blobClient = containerClient.getBlockBlobClient(blobName);
      await blobClient.delete();
      fetchMedia();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getNameWithoutExtension = (filename) => {
    const dot = filename.lastIndexOf('.');
    return dot !== -1 ? filename.slice(0, dot) : filename;
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const filtered = filter === 'all' ? mediaUrls : mediaUrls.filter(m => m.type === filter);

  const renderPreview = (file, type) => {
    if (!file) return <img src={Placeholder} alt="placeholder" className="preview-img" />;
    const url = URL.createObjectURL(file);
    if (type === 'image') return <img src={url} className="preview-img" />;
    if (type === 'video') return <video src={url} className="preview-media" controls />;
    if (type === 'audio') return <audio src={url} className="preview-media" controls />;
    return <p>No preview</p>;
  };

  return (
    <div className="container">
      <nav className="navbar">
        <div className="logo">📦 Media Blob</div>
        <div className="nav-buttons">
          <button className="btn">Login</button>
          <button className="btn primary">Sign Up</button>
        </div>
      </nav>

      {loading && <Loading />}
      <h1>🎥 Media Gallery (Azure Blob) 🎵</h1>
      <hr />

      <div className="filter-bar">
        <label>Filter:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="audio">Audios</option>
        </select>
      </div>

      <div className="upload-sections">
        {['image', 'video', 'audio'].map(type => (
          <div key={type} className="upload-box">
            <div className="upload-header">
              {type === 'image' && <FaImage />}
              {type === 'video' && <FaVideo />}
              {type === 'audio' && <FaMusic />}
              <h3>{type.toUpperCase()}</h3>
            </div>
            {renderPreview(files[type], type)}
            <input type="file" accept={`${type}/*`} onChange={(e) => setFiles({ ...files, [type]: e.target.files[0] })} />
            <button onClick={() => handleUpload(type)}>Upload</button>
          </div>
        ))}
      </div>

      <div className="gallery">
        {filtered.length === 0 ? <h3>No Media Found</h3> : (
          filtered.map((item, idx) => (
            <div className="card" key={idx}>
              {item.type === 'image' && <img src={item.url} alt={item.name} />}
              {item.type === 'video' && <video src={item.url} controls />}
              {item.type === 'audio' && <audio src={item.url} controls />}
              <h4>{getNameWithoutExtension(item.name)}</h4>
              <button className="del" onClick={() => handleDelete(item.name)}><AiFillDelete /></button>
            </div>
          ))
        )}
      </div>

      <section className="contact-section">
        <h2>Contact Us</h2>
        <div className="contact-card">
          <img src="https://i.pravatar.cc/150?img=65" alt="Bikash Gupta" className="contact-avatar" />
          <h3>Bikash Gupta</h3>
          <p>📧 bikash.gupta@example.com</p>
          <p>📱 +91-9876543210</p>
          <p>📍 Etawah, Uttar Pradesh, India</p>
          <button className="contact-button">Send Message</button>
        </div>
      </section>

      <footer className="footer">
        <p>© 2025 Media Blob. All rights reserved.</p>
        <div className="socials">
          <FaFacebook />
          <FaTwitter />
          <FaInstagram />
        </div>
      </footer>
    </div>
  );
};

export default App;
