import React, { useState } from 'react';
import { FaSave, FaTimes } from 'react-icons/fa';
import { clientsService } from '../../services/api';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import './ClientForm.css';

const ClientForm = ({ client, onClose, onSave }) => {
  const { handleApiError, handleSuccess } = useErrorHandler();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'México',
    postal_code: '',
    client_type: 'individual',
    segment: 'regular',
    birth_date: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        country: client.country || 'México',
        postal_code: client.postal_code || '',
        client_type: client.client_type || 'individual',
        segment: client.segment || 'regular',
        birth_date: client.birth_date || '',
        notes: client.notes || ''
      });
    }
  }, [client]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.email.trim()) newErrors.email = 'El email es requerido';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email inválido';
    if (!formData.phone.trim()) newErrors.phone = 'El teléfono es requerido';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      handleApiError({ response: { status: 400, data: { detail: 'Por favor corrige los errores del formulario' } } }, 'Validación');
      return;
    }

    setLoading(true);
    
    try {
      if (client) {
        await clientsService.updateClient(client.id, formData);
        handleSuccess('Cliente actualizado exitosamente');
      } else {
        await clientsService.createClient(formData);
        handleSuccess('Cliente creado exitosamente');
      }
      
      onSave?.();
      onClose();
    } catch (error) {
      console.error('Error guardando cliente:', error);
      handleApiError(error, 'Guardar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="client-form-overlay">
      <div className="client-form">
        <div className="form-header">
          <h2>{client ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-content">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Nombre Completo *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'error' : ''}
                placeholder="Nombre completo del cliente"
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
                placeholder="cliente@ejemplo.com"
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Teléfono *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={errors.phone ? 'error' : ''}
                placeholder="+52 55 1234 5678"
              />
              {errors.phone && <span className="error-text">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="client_type">Tipo de Cliente</label>
              <select
                id="client_type"
                name="client_type"
                value={formData.client_type}
                onChange={handleChange}
              >
                <option value="individual">Individual</option>
                <option value="business">Empresa</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">Dirección</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Calle, número, colonia"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">Ciudad</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Ciudad"
              />
            </div>

            <div className="form-group">
              <label htmlFor="state">Estado</label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="Estado"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="country">País</label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="País"
              />
            </div>

            <div className="form-group">
              <label htmlFor="postal_code">Código Postal</label>
              <input
                type="text"
                id="postal_code"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                placeholder="12345"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="segment">Segmento</label>
              <select
                id="segment"
                name="segment"
                value={formData.segment}
                onChange={handleChange}
              >
                <option value="regular">Regular</option>
                <option value="vip">VIP</option>
                <option value="premium">Premium</option>
                <option value="new">Nuevo</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="birth_date">Fecha de Nacimiento</label>
              <input
                type="date"
                id="birth_date"
                name="birth_date"
                value={formData.birth_date}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notas</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Notas adicionales sobre el cliente"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              <FaTimes />
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              <FaSave />
              {loading ? 'Guardando...' : (client ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientForm;
