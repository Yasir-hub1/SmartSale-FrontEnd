// Página de clientes
import React, { useState, useEffect } from 'react';
import { FaUsers, FaPlus, FaSearch, FaFilter, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { clientsService } from '../services/api';
import ClientForm from '../components/forms/ClientForm';
import { useErrorHandler } from '../hooks/useErrorHandler';
import './ClientsPage.css';

const ClientsPage = () => {
  const { handleApiError, handleSuccess } = useErrorHandler();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showClientForm, setShowClientForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  // Cargar clientes
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await clientsService.getClients();
      setClients(response.results || response);
    } catch (error) {
      console.error('[ClientsPage] Error cargando clientes:', error);
      handleApiError(error, 'Cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = () => {
    setSelectedClient(null);
    setShowClientForm(true);
  };

  const handleEditClient = (client) => {
    setSelectedClient(client);
    setShowClientForm(true);
  };

  const handleDeleteClient = async (clientId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      try {
        await clientsService.deleteClient(clientId);
        handleSuccess('Cliente eliminado exitosamente');
        loadClients();
      } catch (error) {
        console.error('Error eliminando cliente:', error);
        handleApiError(error, 'Eliminar cliente');
      }
    }
  };

  const handleFormClose = () => {
    setShowClientForm(false);
    setSelectedClient(null);
  };

  const handleFormSave = () => {
    loadClients();
  };

  // Filtrar clientes
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  return (
    <div className="clients-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Clientes</h1>
          <p>{filteredClients.length} clientes encontrados</p>
        </div>
        <div className="header-right">
          <button className="btn-primary" onClick={handleCreateClient}>
            <FaPlus />
            Nuevo Cliente
          </button>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar clientes..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="filter-btn">
          <FaFilter />
          Filtros
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Cargando clientes...</p>
        </div>
      ) : filteredClients.length > 0 ? (
        <div className="clients-grid">
          {filteredClients.map((client) => (
            <div key={client.id} className="client-card">
              <div className="client-avatar">
                {client.avatar ? (
                  <img src={client.avatar} alt={client.name} />
                ) : (
                  <div className="avatar-placeholder">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <div className="client-info">
                <h3 className="client-name">{client.name}</h3>
                <p className="client-email">{client.email}</p>
                <p className="client-phone">{client.phone}</p>
                <div className="client-segment">
                  <span className={`segment-badge ${client.segment}`}>
                    {client.segment}
                  </span>
                </div>
              </div>
              
              <div className="client-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => handleEditClient(client)}
                  title="Editar cliente"
                >
                  <FaEdit />
                </button>
                <button 
                  className="btn-danger"
                  onClick={() => handleDeleteClient(client.id)}
                  title="Eliminar cliente"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <FaUsers />
          </div>
          <h3>No hay clientes registrados</h3>
          <p>Comienza agregando tu primer cliente</p>
          <button className="btn-primary" onClick={handleCreateClient}>
            <FaPlus />
            Agregar Primer Cliente
          </button>
        </div>
      )}

      {/* Formulario de cliente */}
      {showClientForm && (
        <ClientForm
          client={selectedClient}
          onClose={handleFormClose}
          onSave={handleFormSave}
        />
      )}
    </div>
  );
};

export default ClientsPage;
