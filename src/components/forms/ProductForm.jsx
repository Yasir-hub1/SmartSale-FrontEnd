import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaUpload } from 'react-icons/fa';
import { productsService } from '../../services/api';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import './ProductForm.css';

const ProductForm = ({ product, onClose, onSave }) => {
  const { handleApiError, handleSuccess } = useErrorHandler();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    price: '',
    cost: '',
    stock: '',
    min_stock: '',
    max_stock: '',
    category: '',
    is_digital: false,
    weight: '',
    dimensions: '',
    barcode: '',
    tags: ''
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadCategories();
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        sku: product.sku || '',
        price: product.price || '',
        cost: product.cost || '',
        stock: product.stock || '',
        min_stock: product.min_stock || '',
        max_stock: product.max_stock || '',
        category: product.category?.id || '',
        is_digital: product.is_digital || false,
        weight: product.weight || '',
        dimensions: product.dimensions || '',
        barcode: product.barcode || '',
        tags: product.tags || ''
      });
    }
  }, [product]);

  const loadCategories = async () => {
    try {
      const response = await productsService.getCategories();
      setCategories(response.results || response);
    } catch (error) {
      console.error('Error cargando categorías:', error);
      handleApiError(error, 'Cargar categorías');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
    if (!formData.sku.trim()) newErrors.sku = 'El SKU es requerido';
    if (!formData.price || formData.price <= 0) newErrors.price = 'El precio debe ser mayor a 0';
    if (!formData.category) newErrors.category = 'La categoría es requerida';
    
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
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        cost: parseFloat(formData.cost) || 0,
        stock: parseInt(formData.stock) || 0,
        min_stock: parseInt(formData.min_stock) || 0,
        max_stock: parseInt(formData.max_stock) || 1000,
        weight: formData.weight ? parseFloat(formData.weight) : null
      };

      if (product) {
        await productsService.updateProduct(product.id, productData);
        handleSuccess('Producto actualizado exitosamente');
      } else {
        await productsService.createProduct(productData);
        handleSuccess('Producto creado exitosamente');
      }
      
      onSave?.();
      onClose();
    } catch (error) {
      console.error('Error guardando producto:', error);
      handleApiError(error, 'Guardar producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-form-overlay">
      <div className="product-form">
        <div className="form-header">
          <h2>{product ? 'Editar Producto' : 'Nuevo Producto'}</h2>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-content">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Nombre del Producto *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'error' : ''}
                placeholder="Ingresa el nombre del producto"
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="sku">SKU *</label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className={errors.sku ? 'error' : ''}
                placeholder="Código único del producto"
              />
              {errors.sku && <span className="error-text">{errors.sku}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Descripción detallada del producto"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Precio *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                min="0"
                className={errors.price ? 'error' : ''}
                placeholder="0.00"
              />
              {errors.price && <span className="error-text">{errors.price}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="cost">Costo</label>
              <input
                type="number"
                id="cost"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="stock">Stock Inicial</label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Categoría *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={errors.category ? 'error' : ''}
              >
                <option value="">Selecciona una categoría</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category && <span className="error-text">{errors.category}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="min_stock">Stock Mínimo</label>
              <input
                type="number"
                id="min_stock"
                name="min_stock"
                value={formData.min_stock}
                onChange={handleChange}
                min="0"
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="max_stock">Stock Máximo</label>
              <input
                type="number"
                id="max_stock"
                name="max_stock"
                value={formData.max_stock}
                onChange={handleChange}
                min="0"
                placeholder="1000"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="barcode">Código de Barras</label>
              <input
                type="text"
                id="barcode"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
                placeholder="Código de barras"
              />
            </div>

            <div className="form-group">
              <label htmlFor="weight">Peso (kg)</label>
              <input
                type="number"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="dimensions">Dimensiones</label>
            <input
              type="text"
              id="dimensions"
              name="dimensions"
              value={formData.dimensions}
              onChange={handleChange}
              placeholder="Largo x Ancho x Alto"
            />
          </div>

          <div className="form-group">
            <label htmlFor="tags">Etiquetas</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="etiqueta1, etiqueta2, etiqueta3"
            />
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_digital"
                checked={formData.is_digital}
                onChange={handleChange}
              />
              <span className="checkmark"></span>
              Producto digital
            </label>
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
              {loading ? 'Guardando...' : (product ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
